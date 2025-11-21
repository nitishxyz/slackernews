import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/client";
import { upvotes } from "@slackernews/core/db/schema";
import { PrivyClient } from "@privy-io/server-auth";
import { Resource } from "sst";
import { and, eq, isNull } from "drizzle-orm";

const privy = new PrivyClient(
  Resource.PrivyAppId.value,
  Resource.PrivyAppSecret.value,
);

const UpvoteSchema = z.object({
  postId: z.number().optional(),
  commentId: z.number().optional(),
  authToken: z.string()
});

const MyUpvotesSchema = z.object({
    authToken: z.string()
});

export const toggleUpvote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UpvoteSchema.parse(data))
  .handler(async ({ data }) => {
    const claims = await privy.verifyAuthToken(data.authToken);
    const userId = claims.userId;

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
      // Remove
      await db.delete(upvotes).where(eq(upvotes.id, existing.id));
      return { added: false };
    } else {
      // Add
      await db.insert(upvotes).values({
        authorId: userId,
        postId: data.postId,
        commentId: data.commentId,
        signature: "skipped",
      });
      return { added: true };
    }
  });

export const fetchMyUpvotes = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => MyUpvotesSchema.parse(data))
    .handler(async ({ data }) => {
        const claims = await privy.verifyAuthToken(data.authToken);
        const userId = claims.userId;

        const myUpvotes = await db.select({
            postId: upvotes.postId,
            commentId: upvotes.commentId
        }).from(upvotes).where(eq(upvotes.authorId, userId));

        return myUpvotes;
    });
