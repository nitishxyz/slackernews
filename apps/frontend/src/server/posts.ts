import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db/client";
import { posts } from "@slackernews/core/db/schema";
import { PrivyClient } from "@privy-io/server-auth";
import { Resource } from "sst";

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
