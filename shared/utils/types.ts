import {z} from 'zod/v4'

export interface ScheduledImageData<T = File|string> {
	file: T;
	alt?: string;
}

export interface ScheduledPostContent<T = File|string> {
	text: string;
	labels?: LabelOptionType;
	embed?: ScheduledImageData<T>[]
}

export interface ScheduledPost<T = File|string> {
	content: ScheduledPostContent<T>;
	scheduled_for: Date;
	repost_dates?: Date[];
}

export type DraftScheduledPost = ScheduledPost<File>;

export type ScheduledStatus = "pending" | "published" | "failed";
export type RepostType = "none" | "scheduled_post" | "published_post";

export interface DBScheduledPost extends ScheduledPost<string> {
	id: number;
	status: ScheduledStatus;
	did: string;
}

export interface DBScheduledRepost {
	id: number;
	status: ScheduledStatus;
	did: string;
	uri: string;
	cid: string;
	scheduled_for: Date;
}

export interface ScheduledRepost extends Omit<DBScheduledPost, "repost_dates"> {
	repost_type: RepostType;
}

export interface DBUser {
	did: string;
	password: string;
	app_password: string;
}

export const LabelOptions = [
	{value: undefined, label: "None", description: undefined},
	{value: "nudity", label: "Nudity", description: "Artistic or non-erotic nudity."},
	{value: "sexual", label: "Sexual", description: "Pictures meant for adults."},
	{value: "porn", label: "Porn", description: "Sexual activity or erotic nudity."},
	{value: "graphic-media", label: "Graphic Media", description: "Media that contains violence / gore"}
];
export const LabelOptionsValues = LabelOptions.map((pair) => pair.value);
export type LabelOptionType = typeof LabelOptionsValues[number];

export const loginSchema = z.object({
	handle: z.string().nonempty("Handle is required"),
	password: z.string().min(15, 'Password must be at least 15 characters long')
});

export const registerSchema = loginSchema.extend({
	app_password: z.string().min(16, 'App Password should be at least 16 chars long.')
})