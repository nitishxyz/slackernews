import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/client";
import { comments, upvotes } from "@slackernews/core/db/schema";
import { getAuthFromRequest } from "./auth";

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
