import { useIdentityToken, usePrivy } from "@privy-io/react-auth";
import { useRouter } from "@tanstack/react-router";
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { AUTH_TOKEN_COOKIE } from "../lib/auth";

type AuthContextValue = {
	token: string | null;
	loading: boolean;
	ready: boolean;
	authenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const persistTokenCookie = (token: string | null) => {
	if (typeof document === "undefined") return;

	if (!token) {
		document.cookie = `${AUTH_TOKEN_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
		return;
	}

	document.cookie = `${AUTH_TOKEN_COOKIE}=${token}; path=/; SameSite=Lax`;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { ready, authenticated } = usePrivy();
	const { identityToken } = useIdentityToken();
	const router = useRouter();
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [authResolved, setAuthResolved] = useState(false);
	const [hydrated, setHydrated] = useState(false);
	const lastTokenRef = useRef<string | null>(null);

	useEffect(() => {
		setHydrated(true);
	}, []);

	useEffect(() => {
		let cancelled = false;

		const syncAuth = async () => {
			if (!ready) {
				setLoading(true);
				return;
			}

			if (!authenticated) {
				persistTokenCookie(null);
				if (cancelled) return;
				setToken(null);
				setLoading(false);
				setAuthResolved(true);
				return;
			}

			setLoading(true);
			try {
				const nextToken = identityToken;
				if (cancelled) return;
				persistTokenCookie(nextToken ?? null);
				setToken(nextToken ?? null);
			} catch (error) {
				if (cancelled) return;
				console.error("Failed to retrieve Privy identity token", error);
				persistTokenCookie(null);
				setToken(null);
			} finally {
				if (!cancelled) {
					setLoading(false);
					setAuthResolved(true);
				}
			}
		};

		syncAuth();

		return () => {
			cancelled = true;
		};
	}, [authenticated, identityToken, ready]);

	useEffect(() => {
		if (!authResolved || loading) return;
		if (lastTokenRef.current === token) return;
		lastTokenRef.current = token;
		router.invalidate();
	}, [authResolved, loading, router, token]);

	const value = useMemo<AuthContextValue>(
		() => ({
			token,
			loading: loading || !authResolved || !ready,
			ready,
			authenticated,
		}),
		[authenticated, authResolved, loading, ready, token],
	);

	const shouldGateUi =
		hydrated && (value.loading || (!ready && authenticated));

	return (
		<AuthContext.Provider value={value}>
			{shouldGateUi ? (
				<div className="p-4 text-center text-sm text-[#828282]">
					Preparing authentication...
				</div>
			) : (
				children
			)}
		</AuthContext.Provider>
	);
}

export function useAuthContext() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuthContext must be used within AuthProvider");
	}
	return context;
}
