export const AUTH_TOKEN_COOKIE = "sn_id_token";

export function readCookieValue(
	cookieHeader: string | null | undefined,
	name: string,
): string | null {
	if (!cookieHeader) {
		return null;
	}

	const segments = cookieHeader.split(";").map((segment) => segment.trim());
	for (const segment of segments) {
		if (!segment) continue;
		const [key, ...value] = segment.split("=");
		if (key === name) {
			return value.join("=") || "";
		}
	}

	return null;
}
