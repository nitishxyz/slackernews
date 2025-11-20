import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@slackernews/core/db/schema";
import { Resource } from "sst";

const client = postgres(Resource.DatabaseUrl.value);

export const db = drizzle(client, { schema });
