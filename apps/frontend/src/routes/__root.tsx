import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import { PrivyProvider } from "@privy-io/react-auth";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { getPrivyAppId, getHeliusRpcUrl, getEnv } from "../server/env";
import { AuthProvider } from "../components/AuthSync";

import Header from "../components/Header";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import StoreDevtools from "../lib/demo-store-devtools";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  loader: async () => {
    const [privyAppId, heliusRpcUrl, env] = await Promise.all([
      getPrivyAppId(),
      getHeliusRpcUrl(),
      getEnv(),
    ]);
    return { privyAppId, heliusRpcUrl, env };
  },
  notFoundComponent: () => (
    <div className="pt-4 px-4 md:px-8">
      <h1 className="text-xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-[#828282]">
        The page you're looking for doesn't exist.
      </p>
    </div>
  ),
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "SlackerNews",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { privyAppId, heliusRpcUrl, env } = Route.useLoaderData();
  const isProd = env === "production";

  const solanaConfig = isProd
    ? {
        rpcUrl: heliusRpcUrl,
        cluster: { name: "mainnet-beta" as const, rpcUrl: heliusRpcUrl },
        chain: "solana:mainnet" as const,
      }
    : {
        rpcUrl: heliusRpcUrl,
        cluster: { name: "devnet" as const, rpcUrl: heliusRpcUrl },
        chain: "solana:devnet" as const,
      };

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground">
        <PrivyProvider
          appId={privyAppId}
          config={{
            loginMethods: ["email"],
            embeddedWallets: {
              createOnLogin: "users-without-wallets",
            },
            solana: {
              rpcs: {
                [solanaConfig.chain]: {
                  rpc: createSolanaRpc(solanaConfig.rpcUrl),
                  rpcSubscriptions: createSolanaRpcSubscriptions(
                    solanaConfig.rpcUrl.replace("https", "wss"),
                  ),
                },
              },
            },
            solanaClusters: [solanaConfig.cluster],
          }}
        >
          <AuthProvider>
            <div className="md:w-[85%] w-full mx-auto bg-[#f6f6ef]">
              <Header />
              <main className="py-2">{children}</main>
            </div>
            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
                TanStackQueryDevtools,
                StoreDevtools,
              ]}
            />
          </AuthProvider>
        </PrivyProvider>
        <Scripts />
      </body>
    </html>
  );
}
