import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/client";
import { upvotes, posts, comments, users } from "@slackernews/core/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getAuthFromRequest } from "./auth";

const UpvoteSchema = z.object({
  postId: z.number().optional(),
  commentId: z.number().optional(),
});

export const toggleUpvote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UpvoteSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getAuthFromRequest();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const userId = user.id;

    if (!data.postId && !data.commentId) {
      throw new Error("Must provide postId or commentId");
    }

    let whereClause;
    if (data.postId) {
        whereClause = and(
            eq(upvotes.authorId, userId),
            eq(upvotes.postId, data.postId),
            isNull(upvotes.commentId)
        );
    } else {
        whereClause = and(
            eq(upvotes.authorId, userId),
            eq(upvotes.commentId, data.commentId),
            isNull(upvotes.postId)
        );
    }

    const [existing] = await db.select().from(upvotes).where(whereClause);

    if (existing) {
      await db.delete(upvotes).where(eq(upvotes.id, existing.id));
      
      if (data.postId) {
        const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, data.postId));
        if (post && post.authorId && post.authorId !== userId) {
            await db.update(users)
                .set({ karma: sql`${users.karma} - 1` })
                .where(eq(users.id, post.authorId));
        }
      } else if (data.commentId) {
        const [comment] = await db.select({ authorId: comments.authorId }).from(comments).where(eq(comments.id, data.commentId));
        if (comment && comment.authorId && comment.authorId !== userId) {
             await db.update(users)
                .set({ karma: sql`${users.karma} - 1` })
                .where(eq(users.id, comment.authorId));
        }
      }

      return { added: false };
    } else {
      await db.insert(upvotes).values({
        authorId: userId,
        postId: data.postId,
        commentId: data.commentId,
        signature: "skipped",
      });

      if (data.postId) {
        const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, data.postId));
        if (post && post.authorId && post.authorId !== userId) {
            await db.update(users)
                .set({ karma: sql`${users.karma} + 1` })
                .where(eq(users.id, post.authorId));
        }
      } else if (data.commentId) {
        const [comment] = await db.select({ authorId: comments.authorId }).from(comments).where(eq(comments.id, data.commentId));
        if (comment && comment.authorId && comment.authorId !== userId) {
             await db.update(users)
                .set({ karma: sql`${users.karma} + 1` })
                .where(eq(users.id, comment.authorId));
        }
      }

      return { added: true };
    }
  });
