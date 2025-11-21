import { PrivyClient, type User } from "@privy-io/server-auth";
import { Resource } from "sst";
import { getRequest } from "@tanstack/react-start/server";
import { AUTH_TOKEN_COOKIE, readCookieValue } from "../lib/auth";
import { db } from "../db/client";
import { users } from "@slackernews/core/db/schema";
import { eq } from "drizzle-orm";

export const privy = new PrivyClient(
  Resource.PrivyAppId.value,
  Resource.PrivyAppSecret.value
);

const getTokenFromRequest = (request: Request): string | null => {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      return token;
    }
  }

  const cookieHeader = request.headers.get("cookie");
  const cookieToken = readCookieValue(cookieHeader, AUTH_TOKEN_COOKIE);
  if (cookieToken) {
    return cookieToken;
  }

  return null;
};

export const verifyAuth = async (request: Request): Promise<User | null> => {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  try {
    return await getUserFromIdToken(token);
  } catch (error) {
    return null;
  }
};

export const getUserFromIdToken = async (token: string): Promise<User | null> => {
  try {
    return await privy.getUserFromIdToken(token);
  } catch (error) {
    return null;
  }
};

export const ensureUserExists = async (user: User) => {
  // Basic mapping from Privy user -> local user record
  const anyUser = user as any;

  const email =
    user.email?.address ||
    anyUser.google?.email ||
    anyUser.github?.email ||
    `${user.id}@privy.local`;

  const username =
    anyUser.github?.username ||
    anyUser.google?.name ||
    anyUser.twitter?.username ||
    anyUser.discord?.username ||
    email.split("@")[0] ||
    `user_${user.id.slice(0, 8)}`;

  const walletAddress =
    anyUser.wallet?.address ||
    anyUser.wallet?.address?.toString?.() ||
    anyUser.wallets?.[0]?.address ||
    null;

  // Try to upsert on id; if the record exists, update email/wallet/updatedAt
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, user.id));

  if (existing.length === 0) {
    await db.insert(users).values({
      id: user.id,
      email,
      username,
      walletAddress: walletAddress ?? undefined,
      stage: "active",
    }).onConflictDoNothing({ target: users.id });
  } else {
    await db
      .update(users)
      .set({
        email,
        username,
        walletAddress: walletAddress ?? undefined,
      })
      .where(eq(users.id, user.id));
  }
};

export const getAuthFromRequest = async (): Promise<User | null> => {
  try {
    const request = getRequest();
    const user = await verifyAuth(request);
    if (user) {
      await ensureUserExists(user);
    }
    return user;
  } catch (e) {
    return null;
  }
};
