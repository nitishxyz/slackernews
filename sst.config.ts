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
    const { vpc } = await import("./infra/vpc");
    const { databaseUrl } = await import("./infra/secrets");
    await import("./infra/web");
    await import("./infra/orm");
    return {
      vpcId: vpc.id,
      databaseUrl: databaseUrl,
    };
  },
});
