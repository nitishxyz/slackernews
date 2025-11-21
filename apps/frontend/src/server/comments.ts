import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/client";
import { comments } from "@slackernews/core/db/schema";
import { PrivyClient } from "@privy-io/server-auth";
import { Resource } from "sst";

const privy = new PrivyClient(
  Resource.PrivyAppId.value,
  Resource.PrivyAppSecret.value,
);

const CommentSchema = z.object({
  postId: z.number(),
  parentId: z.number().optional(),
  content: z.string().min(1),
  authToken: z.string()
});

export const submitComment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CommentSchema.parse(data))
  .handler(async ({ data }) => {
    const claims = await privy.verifyAuthToken(data.authToken);
    const userId = claims.userId;

    try {
      const [comment] = await db.insert(comments).values({
        content: data.content,
        postId: data.postId,
        parentId: data.parentId,
        authorId: userId,
        signature: "skipped", 
      }).returning();
      
      return { success: true, comment };
    } catch (e) {
      console.error("Comment creation failed:", e);
      throw new Error("Comment creation failed.");
    }
  });
