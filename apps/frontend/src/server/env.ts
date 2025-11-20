import { createServerFn } from "@tanstack/react-start";
import { Resource } from "sst";

export const getPrivyAppId = createServerFn({ method: "GET" }).handler(
	async () => {
		return Resource.PrivyAppId.value;
	},
);
