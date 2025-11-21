import { createServerFn } from "@tanstack/react-start";
import { db } from "../db/client";
import { users } from "@slackernews/core/db/schema";
import { eq } from "drizzle-orm";
import { getAuthFromRequest, ensureUserExists } from "./auth";

export const getUserByUsername = createServerFn({ method: "GET" })
  .inputValidator((data: { username: string }) => data)
  .handler(async ({ data }) => {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .limit(1);
    
    return result[0] || null;
  });

export const syncUserAccount = createServerFn({ method: "POST" }).handler(
  async () => {
    const user = await getAuthFromRequest();
    if (!user) {
      throw new Error("Unauthorized");
    }

    await ensureUserExists(user);
    return { ok: true, userId: user.id };
  },
);
