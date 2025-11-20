import { createServerFn } from "@tanstack/react-start";
import { Resource } from "sst";

const MAINNET_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export const getUsdcBalance = createServerFn({ method: "GET" })
  .inputValidator((data: { address: string }) => data)
  .handler(async ({ data }) => {
    const { address } = data;
    if (!address) return { balance: 0 };

    const rpcUrl = Resource.HeliusRpcUrl.value;
    const isDevnet = rpcUrl.includes("devnet");
    const mint = isDevnet ? DEVNET_USDC_MINT : MAINNET_USDC_MINT;

    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "my-id",
          method: "getTokenAccountsByOwner",
          params: [
            address,
            { mint },
            { encoding: "jsonParsed" },
          ],
        }),
      });

      const json = await response.json();
      
      if (json.error) {
        console.error("Helius RPC error:", json.error);
        return { balance: 0 };
      }

      const accounts = json.result?.value;
      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        return { balance: 0 };
      }

      // Sum up balances if multiple accounts
      let totalBalance = 0;
      for (const acc of accounts) {
        const info = acc.account?.data?.parsed?.info;
        if (info?.tokenAmount?.uiAmount) {
          totalBalance += info.tokenAmount.uiAmount;
        }
      }

      return { balance: totalBalance };
    } catch (error) {
      console.error("Failed to fetch USDC balance:", error);
      return { balance: 0 };
    }
  });
