import { domains } from "./domains";
import { databaseUrl } from "./secrets";

const redirects = [`www.${domains.web}`];

export const web = new sst.aws.TanStackStart("SlackerNewsWeb", {
  path: "apps/frontend",
  link: [databaseUrl],
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
