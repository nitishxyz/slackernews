const SUB = $app.stage === "prod" ? "" : `${$app.stage}.`;

const HOST = "slackernews.dev";

export const domains = {
  api: `${SUB}api.${HOST}`,
  apiService: `${SUB}service.api.${HOST}`,
  web: `${SUB}pay.${HOST}`,
};
