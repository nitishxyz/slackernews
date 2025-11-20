import { createServerFn } from "@tanstack/react-start";
import { PrivyClient } from "@privy-io/server-auth";
import { Resource } from "sst";
import { db } from "../db/client";
import { users } from "@slackernews/core/db/schema";

const privy = new PrivyClient(
	Resource.PrivyAppId.value,
	Resource.PrivyAppSecret.value,
);

export const syncUser = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
		const { token } = data;

		try {
			// Verify the token
			const verifiedClaims = await privy.verifyAuthToken(token);
			const userId = verifiedClaims.userId;

			// Get user details from Privy to ensure we have email etc
			const user = await privy.getUser(userId);

			const email = user.email?.address;
			// Fallback username generation
			const username =
				user.github?.username ||
				user.google?.name ||
				user.twitter?.username ||
				user.discord?.username ||
				email?.split("@")[0] ||
				`user_${userId.slice(0, 8)}`;

			if (!email) {
				// For now, log error. In production, we might handle wallet-only users differently
				// or schema should be updated.
				console.error("No email found for user", userId);
				// We can't insert without email per schema.
				return { success: false, error: "Email required" };
			}

			// Upsert user
			// Check if user exists first to avoid overwriting fields if we want to preserve them
			// But upsert is safer for concurrency
			await db
				.insert(users)
				.values({
					id: userId,
					email: email,
					username: username,
					stage: "user",
				})
				.onConflictDoUpdate({
					target: users.id,
					set: {
						updatedAt: new Date(),
						// We don't overwrite email/username on every sync to allow user changes if we support that
					},
				});

			return { success: true, userId };
		} catch (error) {
			console.error("Auth sync error:", error);
			throw error;
		}
	});
