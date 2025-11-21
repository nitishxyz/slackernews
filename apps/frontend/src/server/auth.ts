import { PrivyClient, type User } from "@privy-io/server-auth";
import { Resource } from "sst";
import { getRequest } from "@tanstack/react-start/server";
import { AUTH_TOKEN_COOKIE, readCookieValue } from "../lib/auth";

export const privy = new PrivyClient(
  Resource.PrivyAppId.value,
  Resource.PrivyAppSecret.value
);

const getTokenFromRequest = (request: Request): string | null => {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      return token;
    }
  }

  const cookieHeader = request.headers.get("cookie");
  const cookieToken = readCookieValue(cookieHeader, AUTH_TOKEN_COOKIE);
  if (cookieToken) {
    return cookieToken;
  }

  return null;
};

export const verifyAuth = async (request: Request): Promise<User | null> => {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  try {
    return await getUserFromIdToken(token);
  } catch (error) {
    return null;
  }
};

export const getUserFromIdToken = async (token: string): Promise<User | null> => {
  try {
    return await privy.getUserFromIdToken(token);
  } catch (error) {
    return null;
  }
};

export const getAuthFromRequest = async (): Promise<User | null> => {
  try {
    const request = getRequest();
    return verifyAuth(request);
  } catch (e) {
    return null;
  }
};
