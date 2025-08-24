<script setup lang="ts">
	import { CreatePostSlideover } from '#components';
	import type { RepostType } from '~~/shared/utils/types';

	definePageMeta({
		middleware: 'auth'
	});

	const overlay = useOverlay();
	const createPostSlideover = overlay.create(CreatePostSlideover);
	const selectedTime = ref<Date|undefined>(undefined);
	const startDate = ref(new Date(new Date().setHours(0,0,0,0)));
	const daysDisplayed = ref(7);

	const onSelectedTime = async (time: Date) => {
		selectedTime.value = time;
		const postInstance = createPostSlideover.open({
			side: 'right',
			timestamp: selectedTime.value,
			'onUpdate:timestamp': (newSelectedTime: Date) => selectedTime.value = newSelectedTime
		});

		await postInstance.result;
		selectedTime.value = undefined;
		refreshPosts();
		refreshReposts();
	};

	const DeletePost = async (postID: number) => {
		await $fetch('/api/posts', {
			method: 'DELETE',
			params: { id: postID }
		});
		refreshPosts();
	}

	const DeleteRepost = async (postID: number, repost_type: RepostType, repost_date: Date) => {
		if(repost_type === 'published_post')
		{
			await $fetch('/api/reposts', {
				method: 'DELETE',
				params: { id: postID }
			});
			refreshReposts();
		}
		else if(repost_type === 'scheduled_post')
		{
			const foundPost = posts.value?.find((post) => post.id === postID);
			if(foundPost)
			{
				await $fetch('/api/posts', {
					method: 'PATCH',
					params: { 
						id: postID,
						repost_dates: foundPost.repost_dates?.filter((date) => date.getDate() !== repost_date.getDate()).map((date) => date.toISOString())
					}
				});
				refreshPosts();
			}
		}
	}

	const { data: posts, refresh: refreshPosts, pending: postsPending } = await useFetch('/api/posts', {
		query: { 
			startDay: computed(() => startDate.value.toISOString()),
			dayAmount: daysDisplayed
		},
		transform: (serializedPosts) => {
			const posts = serializedPosts.map((serializedPost) => {
				return {
					...serializedPost,
					scheduled_for: new Date(Date.parse(serializedPost.scheduled_for)),
					repost_dates: serializedPost.repost_dates?.map((repost_date) => new Date(Date.parse(repost_date))),
					repost_type: "none" as RepostType
				}
			});
			
			const reposts = posts.flatMap((post) => {
				return post.repost_dates?.map((repost_date) => {
					return {
						...post,
						scheduled_for: repost_date,
						repost_dates: undefined,
						repost_type: "scheduled_post" as RepostType
					}
				})
			}).filter((repost) => repost !== undefined);
			return posts.concat(reposts);
		}
	});

	const { data: reposts, refresh: refreshReposts, pending: repostsPending } = await useFetch('/api/reposts', {
		query: { 
			startDay: computed(() => startDate.value.toISOString()),
			dayAmount: daysDisplayed
		},
		transform: (serializedPosts) => {
			return serializedPosts?.map((serializedPost) => {
				return {
					...serializedPost,
					scheduled_for: new Date(Date.parse(serializedPost.scheduled_for)),
					repost_dates: undefined
				}
			})
		}
	});

	const posts_and_reposts = computed(() => {
		let result = posts.value ?? [];
		if(reposts.value)
		{
			result = result.concat(reposts.value);
		}
		return result;
	})

	const getPostIcon = (post: {scheduled_for: Date, status: string}) => {
		if(post.status === 'published')
		{
			return 'i-lucide-check';
		}
		if(post.status === 'pending')
		{
			return 'i-lucide-clock';
		}
		if(post.status === 'failed')
		{
			return 'i-lucide-clock-alert';
		}
		return '';
	}

	const getImageGridStyle = (imageCount: number) =>
	{
		if(imageCount <= 1)
		{
			return {
				container: 'grid-cols-none md:grid-cols-none grid-rows-[100%]',
				image: 'aspect-auto'
			};
		}
		else if(imageCount == 2)
		{
			return {
				container: 'grid-cols-2 md:grid-cols-2 grid-rows-[100%]',
				image: 'aspect-square'
			};
		}
		else if(imageCount == 3)
		{
			return {
				container: 'grid-cols-2 md:grid-cols-2 grid-rows-[50%_50%]',
				image: 'aspect-2/1 nth-1:aspect-square nth-1:row-span-2'
			};
		}
		else
		{
			return {
				container: 'grid-cols-2 md:grid-cols-2 grid-rows-[50%_50%]',
				image: 'aspect-3/2'
			};
		}
	}
</script>
<template>
	<div>
		<Navbar></Navbar>
		<Schedule class="mx-5 max-h-[800px] overflow-y-auto" 
			@time-selected="onSelectedTime" 
			:selected-time="selectedTime" :scheduled-data="posts_and_reposts"
			v-model:start-date="startDate" v-model:days-displayed="daysDisplayed"
			:loading="postsPending || repostsPending"
			>
			<template #item="{item, currentTime}">
				<div class="h-full rounded bg-sky-700">
					<div class="flex justify-between gap-2 p-2 text-xs h-full">
						<p class="text-xs line-clamp-4 text-wrap wrap-anywhere">{{ item.content.text }}</p>
						<div v-if="item.content.embed"
							:class="[getImageGridStyle(item.content.embed.length).container]"
							class="grid gap-1 min-w-fit">
							<img v-for="embed in item.content.embed"
								:src="embed.file" :alt="embed.alt"
								:class="[getImageGridStyle(item.content.embed.length).image]"
								class="object-cover max-h-full"/>
						</div>
					</div>
					<div v-if="item.repost_type != 'none'"
						class="absolute bottom-0.5 end-0.5 rounded-full grid z-10">
						<UIcon name="i-lucide-repeat" size="12" class="place-self-center"/>
					</div>
					<div v-if="item.scheduled_for.getTime() <= currentTime.getTime()"
						class="absolute -top-1.5 -end-1.5 rounded-full grid"
						:class="{
							'bg-success': item.status === 'published',
							'bg-warning': item.status === 'pending',
							'bg-error': item.status === 'failed'
						}">
						<UIcon :name="getPostIcon(item)" size="xs" class="place-self-center bg-muted"/>
					</div>
					<div v-else
						class="absolute -top-1.5 -end-1.5 rounded-full grid">
						<UButton @click.stop="item.repost_type != 'none' ? DeleteRepost(item.id, item.repost_type, item.scheduled_for) : DeletePost(item.id)" 
							icon="i-lucide-x" class="rounded-full p-0.5" size="xs" color="neutral" variant="outline"/>
					</div>
				</div>
			</template>
		</Schedule>
	</div>
</template>