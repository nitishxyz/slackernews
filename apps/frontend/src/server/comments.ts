import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/client";
import { comments, upvotes, users, posts } from "@slackernews/core/db/schema";
import { getAuthFromRequest } from "./auth";
import { desc, eq, sql, and, isNull } from "drizzle-orm";

const CommentSchema = z.object({
  postId: z.number(),
  parentId: z.number().optional(),
  content: z.string().min(1),
});

export const submitComment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CommentSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getAuthFromRequest();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const userId = user.id;

    try {
      const [comment] = await db.insert(comments).values({
        content: data.content,
        postId: data.postId,
        parentId: data.parentId,
        authorId: userId,
        signature: "skipped", 
      }).returning();
      
      await db.insert(upvotes).values({
        authorId: userId,
        commentId: comment.id,
        signature: "skipped",
      });

      return { success: true, comment };
    } catch (e) {
      console.error("Comment creation failed:", e);
      throw new Error("Comment creation failed.");
    }
  });

export const fetchComments = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({
    limit: z.number().default(30).optional(),
    page: z.number().default(1).optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { limit = 30, page = 1 } = data;
    const offset = (page - 1) * limit;
    const fetchLimit = limit + 1;

    const user = await getAuthFromRequest();
    const userId = user?.id ?? null;

    const userUpvotes = userId ? db.$with("user_upvotes").as(
      db.select({
        commentId: upvotes.commentId,
      }).from(upvotes).where(
        and(eq(upvotes.authorId, userId), isNull(upvotes.postId))
      )
    ) : null;

    const scopedDb = userUpvotes ? db.with(userUpvotes) : db;

    let baseQuery = scopedDb.select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      postId: comments.postId,
      postTitle: posts.title,
      authorUsername: users.username,
      authorId: users.id,
      score: sql<number>`count(distinct ${upvotes.id})`.mapWith(Number),
      userUpvoted: userUpvotes ? sql<boolean>`${userUpvotes.commentId} is not null` : sql<boolean>`false`,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .leftJoin(posts, eq(comments.postId, posts.id))
    .leftJoin(upvotes, eq(upvotes.commentId, comments.id));

    if (userUpvotes) {
      baseQuery = baseQuery.leftJoin(userUpvotes, eq(userUpvotes.commentId, comments.id));
    }

    const query = baseQuery.groupBy(
      comments.id,
      comments.content,
      comments.createdAt,
      comments.postId,
      posts.title,
      users.id,
      users.username,
      ...(userUpvotes ? [userUpvotes.commentId] : []),
    )
    .orderBy(desc(comments.createdAt))
    .limit(fetchLimit)
    .offset(offset);

    const results = await query;
    
    const hasMore = results.length > limit;
    const slicedResults = hasMore ? results.slice(0, limit) : results;

    return {
        comments: slicedResults.map(comment => ({
            ...comment,
            by: comment.authorUsername || comment.authorId?.slice(0, 8) || "unknown",
            username: comment.authorUsername || null,
        })),
        hasMore
    };
  });

export const fetchUserComments = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({
    username: z.string().min(1),
    limit: z.number().default(30).optional(),
    page: z.number().default(1).optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { username, limit = 30, page = 1 } = data;
    const offset = (page - 1) * limit;
    const fetchLimit = limit + 1;

    // First, get the user by username to get their ID
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!targetUser) {
      return {
        comments: [],
        hasMore: false,
      };
    }

    // Match the exact pattern from fetchUserPosts
    let baseQuery = db.select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      postId: comments.postId,
      postTitle: posts.title,
      authorId: comments.authorId,
      score: sql<number>`count(distinct ${upvotes.id})`.mapWith(Number),
    })
    .from(comments)
    .where(eq(comments.authorId, targetUser.id))
    .leftJoin(posts, eq(comments.postId, posts.id))
    .leftJoin(upvotes, eq(upvotes.commentId, comments.id));

    const query = baseQuery.groupBy(
      comments.id,
      comments.content,
      comments.createdAt,
      comments.postId,
      posts.title,
    )
    .orderBy(desc(comments.createdAt))
    .limit(fetchLimit)
    .offset(offset);

    const results = await query;
    
    const hasMore = results.length > limit;
    const slicedResults = hasMore ? results.slice(0, limit) : results;

    return {
        comments: slicedResults.map(comment => ({
            ...comment,
            by: comment.authorId?.slice(0, 8) || "unknown",
            username: null,
            userUpvoted: false,
        })),
        hasMore
    };
  });
