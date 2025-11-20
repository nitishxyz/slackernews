/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "slackernews",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile: "slashforge",
          region: "us-east-1",
        },
      },
    };
  },
  async run() {
    await import("./infra/secrets");
    const { web } = await import("./infra/web");
    await import("./infra/orm");
    return {
      website: web.url,
    };
  },
});
