import { domains } from "./domains";
import { databaseUrl, heliusRpcUrl, privyAppId, privyAppSecret } from "./secrets";

const redirects = [`www.${domains.web}`];

export const web = new sst.aws.TanStackStart("SlackerNewsWeb", {
  path: "apps/frontend",
  link: [databaseUrl, heliusRpcUrl, privyAppId, privyAppSecret],
  domain: {
    name: domains.web,
    redirects: redirects,
    dns: sst.cloudflare.dns(),
  },
  dev: {
    command: "bun run dev",
    directory: "apps/frontend"
  },
});
