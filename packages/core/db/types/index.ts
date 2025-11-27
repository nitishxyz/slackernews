import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { comments, posts, show, upvotes, users } from "../schema";

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;

export type Comment = InferSelectModel<typeof comments>;
export type NewComment = InferInsertModel<typeof comments>;

export type Upvote = InferSelectModel<typeof upvotes>;
export type NewUpvote = InferInsertModel<typeof upvotes>;

export type Show = InferSelectModel<typeof show>;
export type NewShow = InferInsertModel<typeof show>;
