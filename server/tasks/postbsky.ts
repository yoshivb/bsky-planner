import { $Typed, Agent, AppBskyEmbedImages, AppBskyFeedPost, RichText } from "@atproto/api";
import path from "path";
import sharp from 'sharp';
import fs from 'fs/promises';
import { DBScheduledRepost, DBUser } from "~~/shared/utils/types";

const postToBsky = async(post: DBScheduledPost, bsky: Agent) => {
  const config = useRuntimeConfig();
  
  const richText = new RichText({ text: post.content.text });
  await richText.detectFacets(bsky);

  let filesToRemove : string[] = [];

  let postEmbed : $Typed<AppBskyEmbedImages.Main>|undefined = undefined;
  if(post.content.embed)
  {
    postEmbed = {
      $type: 'app.bsky.embed.images',
      images: []
    };
    for(const scheduledImage of post.content.embed)
    {
      const finalPath = path.join(config.uploadFolder, scheduledImage.file);
      const sharpImage = await sharp(finalPath);
      const imageMetadata = await sharpImage.metadata();
      const aspectRatio = {width: imageMetadata.width, height: imageMetadata.height};

      const uint8Array = new Uint8Array(await sharpImage.toBuffer());
      const bskyImage = await bsky.uploadBlob(uint8Array, {
        encoding: `image/${imageMetadata.format}`,
      });

      postEmbed.images.push({
        $type: 'app.bsky.embed.images#image',
        image: bskyImage.data.blob,
        alt: scheduledImage.alt || "",
        aspectRatio
      });

      filesToRemove.push(finalPath);
    }
  }

  sharp.cache(false);
  
  let bskyPost : Partial<AppBskyFeedPost.Record> = {
    text: post.content.text,
    facets: richText.facets,
    labels: post.content.labels ? {
      $type: "com.atproto.label.defs#selfLabels",
      values: [{ val: post.content.labels}]
    } : undefined,
    embed: postEmbed
  };

  const resultingPost = await bsky.post(bskyPost);

  if(post.repost_dates)
  {
    for(const repost_date of post.repost_dates)
    {
      const postgres = usePostgres();
      await postgres.query<DBScheduledRepost>(
        "INSERT INTO reposts (did, cid, uri, scheduled_for, status) VALUES ($1, $2, $3, $4, $5)",
        [post.did, resultingPost.cid, resultingPost.uri, repost_date, "pending",]
      );
    }
  }

  try
  {
    await Promise.all(filesToRemove.map((filePath) => {
      return fs.unlink(filePath);
    }));
  }
  catch(e)
  {
    console.error(e);
  }

  return resultingPost;
}

export default defineTask({
  meta: {
    name: "postbsky",
    description: "Process any pending bsky tasks.",
  },
  async run({ payload, context }) {
    const postgres = usePostgres();

     //--- Posts ---

	  const posts = await postgres.query<DBScheduledPost>("SELECT * FROM posts WHERE status = $1 AND scheduled_for <= NOW()", ["pending"]);
    let groupedPosts : Map<string, DBScheduledPost[]> = new Map();
    posts.rows.forEach((post) => {
      if(!groupedPosts.has(post.did))
      {
        groupedPosts.set(post.did, [post]);
      }
      else
      {
        groupedPosts.get(post.did)?.push(post);
      }
    });

    for(const [userDID, posts] of groupedPosts)
    {
      try
      {
        const {rows: users} = await postgres.query<DBUser>("SELECT * FROM users WHERE did = $1 LIMIT 1", [userDID]);
        if(users.length === 0)
        {
          continue;
        }
        const bskyAgent = await useBsky(userDID, users[0].app_password);
        for(const post of posts)
        {
          await postToBsky(post, bskyAgent);
          await postgres.query("UPDATE posts SET status = $1 WHERE id = $2", ["published", post.id]);
        }
      }
      catch(e)
      {
        console.error(e);
        continue;
      }
    }

    //--- Reposts ---

    const reposts = await postgres.query<DBScheduledRepost>("SELECT * FROM reposts WHERE status = $1 AND scheduled_for <= NOW()", ["pending"]);
    let groupedreposts : Map<string, DBScheduledRepost[]> = new Map();
    reposts.rows.forEach((repost) => {
      if(!groupedreposts.has(repost.did))
      {
        groupedreposts.set(repost.did, [repost]);
      }
      else
      {
        groupedreposts.get(repost.did)?.push(repost);
      }
    });

    for(const [userDID, reposts] of groupedreposts)
    {
      try
      {
        const {rows: users} = await postgres.query<DBUser>("SELECT * FROM users WHERE did = $1 LIMIT 1", [userDID]);
        if(users.length === 0)
        {
          continue;
        }
        const bskyAgent = await useBsky(userDID, users[0].app_password);
        for(const repost of reposts)
        {
          bskyAgent.repost(repost.uri, repost.cid);
          await postgres.query("UPDATE reposts SET status = $1 WHERE id = $2", ["published", repost.id]);
        }
      }
      catch(e)
      {
        continue;
      }
    }

    return { result: "Success" };
  },
});