import { useAuthContext } from "../components/AuthSync";

export function useAuthToken() {
	const { token, loading } = useAuthContext();
	return { token, loading };
}
