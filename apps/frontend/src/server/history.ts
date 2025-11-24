import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/client";
import { show, posts, users } from "@slackernews/core/db/schema";
import { desc, eq } from "drizzle-orm";

export const fetchHistoryItems = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({
    limit: z.number().default(30).optional(),
    page: z.number().default(1).optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const { limit = 30, page = 1 } = data;
    const offset = (page - 1) * limit;
    const fetchLimit = limit + 1;

    const results = await db.select({
      id: show.id,
      userName: show.userName,
      activity: show.activity,
      postId: show.postId,
      postTitle: posts.title,
      content: show.content,
      createdAt: show.createdAt,
    })
    .from(show)
    .leftJoin(posts, eq(show.postId, posts.id))
    .orderBy(desc(show.createdAt))
    .limit(fetchLimit)
    .offset(offset);

    const hasMore = results.length > limit;
    const slicedResults = hasMore ? results.slice(0, limit) : results;

    return {
      items: slicedResults.map(item => ({
        id: item.id,
        username: item.userName,
        postId: item.postId,
        postTitle: item.postTitle,
        content: item.content,
        activity: item.activity,
        createdAt: item.createdAt,
      })),
      hasMore
    };
  });

const InsertHistorySchema = z.object({
  userId: z.string().min(1),
  activity: z.enum(["posted", "commented", "upvoted"]),
  postId: z.number().optional().nullable(),
  content: z.string().optional().nullable(),
});

/**
 * Helper function to insert a history record (can be called from server functions)
 */
export async function insertHistoryRecord(
  userId: string,
  activity: "posted" | "commented" | "upvoted",
  postId: number | null,
  content: string | null
) {
  // Fetch username from users table
  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.username) {
    throw new Error(`User not found or username missing for userId: ${userId}`);
  }

  // Insert history record
  const [historyRecord] = await db
    .insert(show)
    .values({
      userId,
      userName: user.username,
      activity,
      postId: postId ?? null,
      content: content ?? null,
    })
    .returning();

  return { success: true, history: historyRecord };
}

export const insertHistory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InsertHistorySchema.parse(data))
  .handler(async ({ data }) => {
    return await insertHistoryRecord(
      data.userId,
      data.activity,
      data.postId ?? null,
      data.content ?? null
    );
  });

