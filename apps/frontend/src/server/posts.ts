import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/client";
import { posts, users, upvotes, comments } from "@slackernews/core/db/schema";
import { desc, eq, sql, and, isNull, or } from "drizzle-orm";
import { getAuthFromRequest } from "./auth";

const PostSchema = z.object({
  title: z.string().min(1),
  url: z.string().optional(),
  content: z.string().optional(),
});

export const submitPost = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => PostSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getAuthFromRequest();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const userId = user.id;

    try {
      const [post] = await db.insert(posts).values({
        title: data.title,
        url: data.url || null,
        content: data.content || null,
        authorId: userId,
        signature: "skipped",
      }).returning();
      
      await db.insert(upvotes).values({
        authorId: userId,
        postId: post.id,
        signature: "skipped",
      });

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
    const fetchLimit = limit + 1;

    const user = await getAuthFromRequest();
    const userId = user?.id ?? null;

    const userUpvotes = userId ? db.$with("user_upvotes").as(
      db.select({
        postId: upvotes.postId,
      }).from(upvotes).where(
        and(eq(upvotes.authorId, userId), isNull(upvotes.commentId))
      )
    ) : null;

    const scopedDb = userUpvotes ? db.with(userUpvotes) : db;

    let query = scopedDb.select({
      id: posts.id,
      title: posts.title,
      url: posts.url,
      createdAt: posts.createdAt,
      authorUsername: users.username,
      authorId: users.id,
      score: sql<number>`count(distinct ${upvotes.id})`.mapWith(Number),
      commentCount: sql<number>`count(distinct ${comments.id})`.mapWith(Number),
      userUpvoted: userUpvotes ? sql<boolean>`${userUpvotes.postId} is not null` : sql<boolean>`false`,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(upvotes, eq(upvotes.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id));

    if (userUpvotes) {
      query = query.leftJoin(userUpvotes, eq(userUpvotes.postId, posts.id));
    }

    query = query.groupBy(
      posts.id,
      users.id,
      users.username,
      ...(userUpvotes ? [userUpvotes.postId] : []),
    )
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
    const user = await getAuthFromRequest();
    const userId = user?.id ?? null;

    const userUpvotes = userId ? db.$with("user_upvotes").as(
      db.select({
        postId: upvotes.postId,
      }).from(upvotes).where(
        and(eq(upvotes.authorId, userId), isNull(upvotes.commentId))
      )
    ) : null;

    const scopedDb = userUpvotes ? db.with(userUpvotes) : db;

    let postQuery = scopedDb.select({
      id: posts.id,
      title: posts.title,
      url: posts.url,
      content: posts.content,
      createdAt: posts.createdAt,
      authorUsername: users.username,
      authorId: users.id,
      score: sql<number>`count(distinct ${upvotes.id})`.mapWith(Number),
      commentCount: sql<number>`count(distinct ${comments.id})`.mapWith(Number),
      userUpvoted: userUpvotes ? sql<boolean>`${userUpvotes.postId} is not null` : sql<boolean>`false`,
    })
    .from(posts)
    .where(eq(posts.id, data.postId))
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(upvotes, eq(upvotes.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id));

    if (userUpvotes) {
      postQuery = postQuery.leftJoin(userUpvotes, eq(userUpvotes.postId, posts.id));
    }

    postQuery = postQuery.groupBy(
      posts.id,
      users.id,
      users.username,
      ...(userUpvotes ? [userUpvotes.postId] : []),
    );

    const [post] = await postQuery;

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

export const searchPosts = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({
    query: z.string().min(1),
    limit: z.number().default(30).optional(),
    page: z.number().default(1).optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { query: searchQuery, limit = 30, page = 1 } = data;
    const offset = (page - 1) * limit;
    const fetchLimit = limit + 1;
    const searchLower = searchQuery.toLowerCase();
    const searchPattern = `%${searchLower}%`;

    const user = await getAuthFromRequest();
    const userId = user?.id ?? null;

    const userUpvotes = userId ? db.$with("user_upvotes").as(
      db.select({
        postId: upvotes.postId,
      }).from(upvotes).where(
        and(eq(upvotes.authorId, userId), isNull(upvotes.commentId))
      )
    ) : null;

    const scopedDb = userUpvotes ? db.with(userUpvotes) : db;

    let searchQuery_builder = scopedDb.select({
      id: posts.id,
      title: posts.title,
      url: posts.url,
      createdAt: posts.createdAt,
      authorUsername: users.username,
      authorId: users.id,
      score: sql<number>`count(distinct ${upvotes.id})`.mapWith(Number),
      commentCount: sql<number>`count(distinct ${comments.id})`.mapWith(Number),
      userUpvoted: userUpvotes ? sql<boolean>`${userUpvotes.postId} is not null` : sql<boolean>`false`,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(upvotes, eq(upvotes.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .where(
      or(
        sql`lower(${posts.title}) LIKE ${searchPattern}`,
        sql`lower(COALESCE(${posts.url}, '')) LIKE ${searchPattern}`
      )
    );

    if (userUpvotes) {
      searchQuery_builder = searchQuery_builder.leftJoin(userUpvotes, eq(userUpvotes.postId, posts.id));
    }

    searchQuery_builder = searchQuery_builder.groupBy(
      posts.id,
      users.id,
      users.username,
      ...(userUpvotes ? [userUpvotes.postId] : []),
    )
    .orderBy(desc(posts.createdAt))
    .limit(fetchLimit)
    .offset(offset);

    const results = await searchQuery_builder;
    
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
