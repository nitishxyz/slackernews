import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { syncUser } from "../server/auth";

export function AuthSync() {
	const { ready, authenticated, getAccessToken } = usePrivy();

	useEffect(() => {
		if (ready && authenticated) {
			const sync = async () => {
				const token = await getAccessToken();
				if (token) {
					await syncUser({ data: { token } });
				}
			};
			sync();
		}
	}, [ready, authenticated, getAccessToken]);

	return null;
}
