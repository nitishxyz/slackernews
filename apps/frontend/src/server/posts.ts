import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/client";
import { posts, users, upvotes, comments } from "@slackernews/core/db/schema";
import { PrivyClient } from "@privy-io/server-auth";
import { Resource } from "sst";
import { count, desc, eq, sql } from "drizzle-orm";
import { getWebRequest } from "@tanstack/react-start/server";

const privy = new PrivyClient(
  Resource.PrivyAppId.value,
  Resource.PrivyAppSecret.value,
);

const PostSchema = z.object({
  title: z.string().min(1),
  url: z.string().optional(),
  content: z.string().optional(),
  authToken: z.string()
});

export const submitPost = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => PostSchema.parse(data))
  .handler(async ({ data }) => {
    // 1. Verify User
    const claims = await privy.verifyAuthToken(data.authToken);
    const userId = claims.userId;

    // 2. Create Post
    try {
      const [post] = await db.insert(posts).values({
        title: data.title,
        url: data.url || null,
        content: data.content || null,
        authorId: userId,
        signature: "skipped",
      }).returning();
      
      return { success: true, post };
    } catch (e) {
      console.error("DB Insert failed:", e);
      throw new Error("Post creation failed.");
    }
  });

export const fetchPosts = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({
    sort: z.enum(["new", "top"]).default("new").optional(),
    limit: z.number().default(30).optional(),
    page: z.number().default(1).optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { sort = "new", limit = 30, page = 1 } = data;
    const offset = (page - 1) * limit;

    // Fetch limit + 1 to check if there are more pages
    const fetchLimit = limit + 1;

    const query = db.select({
      id: posts.id,
      title: posts.title,
      url: posts.url,
      createdAt: posts.createdAt,
      authorUsername: users.username,
      authorId: users.id,
      score: sql<number>`count(distinct ${upvotes.id})`.mapWith(Number),
      commentCount: sql<number>`count(distinct ${comments.id})`.mapWith(Number),
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(upvotes, eq(upvotes.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .groupBy(posts.id, users.id, users.username)
    .limit(fetchLimit)
    .offset(offset);

    if (sort === "new") {
      query.orderBy(desc(posts.createdAt));
    } else if (sort === "top") {
      query.orderBy(desc(sql`count(distinct ${upvotes.id})`));
    }

    const results = await query;
    
    const hasMore = results.length > limit;
    const slicedResults = hasMore ? results.slice(0, limit) : results;

    return {
        posts: slicedResults.map(post => ({
            ...post,
            by: post.authorUsername || post.authorId?.slice(0, 8) || "unknown",
        })),
        hasMore
    };
  });

export const fetchPost = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({
    postId: z.number(),
  }).parse(data))
  .handler(async ({ data }) => {
    const [post] = await db.select({
      id: posts.id,
      title: posts.title,
      url: posts.url,
      content: posts.content,
      createdAt: posts.createdAt,
      authorUsername: users.username,
      authorId: users.id,
      score: sql<number>`count(distinct ${upvotes.id})`.mapWith(Number),
      commentCount: sql<number>`count(distinct ${comments.id})`.mapWith(Number),
    })
    .from(posts)
    .where(eq(posts.id, data.postId))
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(upvotes, eq(upvotes.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .groupBy(posts.id, users.id, users.username);

    if (!post) return null;

    const allComments = await db.select({
      id: comments.id,
      postId: comments.postId,
      content: comments.content,
      parentId: comments.parentId,
      createdAt: comments.createdAt,
      authorUsername: users.username,
      authorId: users.id,
      score: sql<number>`count(distinct ${upvotes.id})`.mapWith(Number),
    })
    .from(comments)
    .where(eq(comments.postId, data.postId))
    .leftJoin(users, eq(comments.authorId, users.id))
    .leftJoin(upvotes, eq(upvotes.commentId, comments.id))
    .groupBy(comments.id, users.id, users.username)
    .orderBy(desc(comments.createdAt));

    return {
      ...post,
      by: post.authorUsername || post.authorId?.slice(0, 8) || "unknown",
      comments: allComments.map(c => ({
        ...c,
        by: c.authorUsername || c.authorId?.slice(0, 8) || "unknown",
      }))
    };
  });
