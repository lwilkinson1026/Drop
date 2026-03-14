import { Router } from "express";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { TwitterApi } from "twitter-api-v2";

const router = Router();

function getFirebaseAdmin() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) return null;
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (getApps().length === 0) {
      initializeApp({ credential: cert(serviceAccount) });
    }
    return getAuth();
  } catch {
    return null;
  }
}

router.post("/twitter/token", async (req, res) => {
  try {
    const { code, code_verifier, redirect_uri } = req.body as {
      code: string;
      code_verifier: string;
      redirect_uri: string;
    };

    if (!code || !code_verifier || !redirect_uri) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const clientId = process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID;
    if (!clientId) {
      res.status(500).json({ error: "Twitter Client ID not configured" });
      return;
    }

    const twitterClient = new TwitterApi({
      clientId,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    } as any);

    const { accessToken, expiresIn, refreshToken } = await (twitterClient as any).loginWithOAuth2({
      code,
      codeVerifier: code_verifier,
      redirectUri: redirect_uri,
    });

    const meClient = new TwitterApi(accessToken);
    const me = await meClient.v2.me({
      "user.fields": ["id", "name", "username", "profile_image_url"],
    });

    const twitterUser = me.data;
    const adminAuth = getFirebaseAdmin();

    if (!adminAuth) {
      res.status(500).json({ error: "Firebase Admin not configured" });
      return;
    }

    const uid = `twitter:${twitterUser.id}`;
    const firebaseToken = await adminAuth.createCustomToken(uid, {
      provider: "twitter",
      displayName: twitterUser.name,
      username: twitterUser.username,
      photoURL: twitterUser.profile_image_url,
    });

    res.json({ firebaseToken, user: twitterUser });
  } catch (err: any) {
    console.error("Twitter auth error:", err);
    res.status(500).json({ error: err?.message ?? "Twitter auth failed" });
  }
});

export default router;
