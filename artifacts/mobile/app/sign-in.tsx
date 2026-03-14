import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { isFirebaseConfigured } from "@/services/firebase";
import { signInWithGoogle, signInWithTwitter } from "@/services/authService";

const C = Colors.light;

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingTwitter, setLoadingTwitter] = useState(false);
  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const bottomPad = Platform.OS === "web" ? 32 : insets.bottom;

  const handleGoogle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingGoogle(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        router.replace("/onboarding");
      }
    } catch (e: any) {
      Alert.alert("Sign-in failed", e?.message ?? "Could not sign in with Google. Please try again.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleTwitter = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingTwitter(false);
    setLoadingTwitter(true);
    try {
      const user = await signInWithTwitter();
      if (user) {
        router.replace("/onboarding");
      }
    } catch (e: any) {
      Alert.alert("Sign-in failed", e?.message ?? "Could not sign in with X. Please try again.");
    } finally {
      setLoadingTwitter(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <LinearGradient colors={[C.accent, C.accentMid, "#1A3518"]} style={styles.container}>
        <View style={[styles.inner, { paddingTop: topPad + 60, paddingBottom: bottomPad + 40 }]}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={52} color={C.tint} />
          </View>
          <Text style={styles.appName}>HarvestSwap</Text>
          <Text style={styles.tagline}>Authentication is being configured.</Text>
          <View style={styles.warningBox}>
            <Feather name="alert-triangle" size={16} color={C.tint} />
            <Text style={styles.warningText}>
              Firebase credentials are not yet set up. Contact your administrator to complete the setup.
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[C.accent, C.accentMid, "#1A3518"]} style={styles.container}>
      <View style={[styles.inner, { paddingTop: topPad + 60, paddingBottom: bottomPad + 40 }]}>
        <View style={styles.logoCircle}>
          <Ionicons name="leaf" size={52} color={C.tint} />
        </View>
        <Text style={styles.appName}>HarvestSwap</Text>
        <Text style={styles.tagline}>
          Fresh food from your neighbors, straight to your hands.
        </Text>

        <View style={styles.authCards}>
          <View style={styles.authCard}>
            <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.5)" />
            <Text style={styles.authCardText}>
              Sign in to discover swap boxes, post surplus harvest, and connect with your local food community.
            </Text>
          </View>
        </View>

        <View style={styles.btnStack}>
          <Pressable
            onPress={handleGoogle}
            disabled={loadingGoogle || loadingTwitter}
            style={({ pressed }) => [styles.socialBtn, { opacity: pressed ? 0.88 : 1 }]}
          >
            <View style={styles.socialBtnContent}>
              {loadingGoogle ? (
                <ActivityIndicator color="#1A3518" size="small" />
              ) : (
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
              )}
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleTwitter}
            disabled={loadingGoogle || loadingTwitter}
            style={({ pressed }) => [styles.socialBtnDark, { opacity: pressed ? 0.88 : 1 }]}
          >
            <View style={styles.socialBtnContent}>
              {loadingTwitter ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.xIcon}>
                  <Text style={styles.xIconText}>𝕏</Text>
                </View>
              )}
              <Text style={styles.socialBtnTextDark}>Continue with X</Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.legalText}>
          By continuing, you agree to our Terms of Service and Privacy Policy. Your data stays local and is never sold.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.68)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  authCards: { width: "100%", marginBottom: 32 },
  authCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  authCardText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.62)",
    lineHeight: 21,
  },
  btnStack: { width: "100%", gap: 12, marginBottom: 28 },
  socialBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 24,
  },
  socialBtnDark: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  socialBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#fff",
  },
  xIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  xIconText: {
    fontSize: 17,
    color: "#fff",
    lineHeight: 20,
  },
  socialBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#1A1208",
  },
  socialBtnTextDark: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  legalText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  warningBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(212,130,42,0.15)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(212,130,42,0.3)",
    marginTop: 24,
    alignItems: "flex-start",
  },
  warningText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 21,
  },
});
