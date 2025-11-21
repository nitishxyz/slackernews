import { createServerFn } from "@tanstack/react-start";
import { Resource } from "sst";

export const getPrivyAppId = createServerFn({ method: "GET" }).handler(
	async () => {
		return Resource.PrivyAppId.value;
	},
);

export const getHeliusRpcUrl = createServerFn({ method: "GET" }).handler(
	async () => {
		return Resource.HeliusRpcUrl.value;
	},
);

export const getEnv = createServerFn({ method: "GET" }).handler(async () => {
	return process.env.VITE_ENV || "development";
});
