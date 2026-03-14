import {
  GoogleAuthProvider,
  OAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential,
  signInWithCustomToken,
  signOut as firebaseSignOut,
} from "firebase/auth";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import { auth, isFirebaseConfigured } from "./firebase";

WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: "google" | "twitter" | "anonymous";
}

export function mapFirebaseUser(u: User): AuthUser {
  const provider = u.providerData[0]?.providerId?.includes("google")
    ? "google"
    : u.providerData[0]?.providerId?.includes("twitter")
    ? "twitter"
    : "anonymous";
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    provider,
  };
}

export function subscribeToAuthState(
  cb: (user: AuthUser | null) => void
): () => void {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (u) => cb(u ? mapFirebaseUser(u) : null));
}

export async function signInWithGoogle(): Promise<AuthUser | null> {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase not configured");
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) throw new Error("Google Web Client ID not configured");

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
  };

  const request = new AuthSession.AuthRequest({
    clientId: webClientId,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    responseType: AuthSession.ResponseType.Token,
    usePKCE: false,
  });

  const result = await request.promptAsync(discovery, { useProxy: true });

  if (result.type !== "success") return null;

  const { access_token } = result.params;
  const credential = GoogleAuthProvider.credential(null, access_token);
  const userCred = await signInWithCredential(auth, credential);
  return mapFirebaseUser(userCred.user);
}

const TWITTER_DISCOVERY = {
  authorizationEndpoint: "https://twitter.com/i/oauth2/authorize",
  tokenEndpoint: `${process.env.EXPO_PUBLIC_API_URL ?? ""}/auth/twitter/token`,
  revocationEndpoint: "https://api.twitter.com/2/oauth2/revoke",
};

export async function signInWithTwitter(): Promise<AuthUser | null> {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase not configured");
  const clientId = process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID;
  if (!clientId) throw new Error("Twitter Client ID not configured");

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ["tweet.read", "users.read", "offline.access"],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(TWITTER_DISCOVERY, { useProxy: true });
  if (result.type !== "success") return null;

  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
  const tokenRes = await fetch(`${apiUrl}/auth/twitter/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: result.params.code,
      code_verifier: request.codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) throw new Error("Twitter token exchange failed");
  const { firebaseToken } = await tokenRes.json();

  const userCred = await signInWithCustomToken(auth, firebaseToken);
  return mapFirebaseUser(userCred.user);
}

export async function signOut(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}
