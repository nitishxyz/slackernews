import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { 
  createPostTransaction, 
  createInteractionTransaction,
  submitSignedTransaction
} from "@slackernews/core/solana";

export const getPostTransaction = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ userAddress: z.string() }).parse(data))
  .handler(async ({ data }) => {
    return await createPostTransaction(data.userAddress);
  });

export const getCommentTransaction = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ userAddress: z.string(), authorAddress: z.string() }).parse(data))
  .handler(async ({ data }) => {
    return await createInteractionTransaction(data.userAddress, data.authorAddress, "COMMENT");
  });

export const getUpvoteTransaction = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ userAddress: z.string(), authorAddress: z.string() }).parse(data))
  .handler(async ({ data }) => {
    return await createInteractionTransaction(data.userAddress, data.authorAddress, "UPVOTE");
  });
