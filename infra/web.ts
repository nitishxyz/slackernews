import { domains } from "./domains";
import {
  databaseUrl,
  heliusRpcUrl,
  platformSigner,
  platformWallet,
  privyAppId,
  privyAppSecret,
} from "./secrets";

const redirects = [`www.${domains.web}`];

export const web = new sst.aws.TanStackStart("SlackerNewsWeb", {
  path: "apps/frontend",
  link: [
    databaseUrl,
    heliusRpcUrl,
    privyAppId,
    privyAppSecret,
    platformSigner,
    platformWallet,
  ],
  domain: {
    name: domains.web,
    redirects: redirects,
    dns: sst.cloudflare.dns(),
  },
  environment: {
    VITE_ENV: $app.stage === "production" ? "production" : "development",
    VITE_HELIUS_RPC_URL: heliusRpcUrl.value,
  },
  dev: {
    command: "bun run dev",
    directory: "apps/frontend",
  },
});
