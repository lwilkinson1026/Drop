import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const C = Colors.light;

export default function PostTabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const handlePost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/post");
  };

  if (!user || user.role !== "maker") {
    return (
      <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad + 80 }]}>
        <View style={styles.center}>
          <View style={styles.iconCircle}>
            <Feather name="lock" size={36} color={C.sageMist} />
          </View>
          <Text style={styles.lockedTitle}>Makers Only</Text>
          <Text style={styles.lockedText}>
            Switch your role to Maker in your profile to post listings.
          </Text>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/profile"); }}
            style={({ pressed }) => [styles.profileBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.profileBtnText}>Go to Profile</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad + 80 }]}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Share your harvest</Text>
        <Text style={styles.subtitle}>Post surplus produce for your community to claim</Text>
      </View>

      <Pressable
        onPress={handlePost}
        style={({ pressed }) => [styles.postCard, { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
      >
        <LinearGradient
          colors={[C.tintLight + "28", C.tint + "14"]}
          style={styles.postCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.postCardIcon}>
            <LinearGradient colors={[C.tintLight, C.tint]} style={styles.postIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Feather name="plus" size={28} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.postCardTitle}>New Listing</Text>
          <Text style={styles.postCardDesc}>
            Add a photo, set your box location, and earn credits when buyers claim your produce.
          </Text>
          <View style={styles.postCardArrow}>
            <Feather name="arrow-right" size={20} color={C.tint} />
          </View>
        </LinearGradient>
      </Pressable>

      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Tips for great listings</Text>
        {[
          { icon: "camera" as const, tip: "Clear photos get 3x more claims" },
          { icon: "map-pin" as const, tip: "Be specific about your box location" },
          { icon: "clock" as const, tip: "Post in the morning for best visibility" },
          { icon: "star" as const, tip: "Describe taste, variety & freshness" },
        ].map((t) => (
          <View key={t.tip} style={styles.tipRow}>
            <View style={styles.tipIcon}>
              <Feather name={t.icon} size={14} color={C.tint} />
            </View>
            <Text style={styles.tipText}>{t.tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.creamDark,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text },
  lockedText: { fontFamily: "Inter_400Regular", fontSize: 15, color: C.textSecondary, textAlign: "center", lineHeight: 22 },
  profileBtn: {
    backgroundColor: C.text,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 8,
  },
  profileBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.surface },
  headerSection: { paddingTop: 20, paddingBottom: 28 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: C.textSecondary, lineHeight: 22 },
  postCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: C.tint + "38",
    marginBottom: 28,
    shadowColor: C.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  postCardGradient: { padding: 24 },
  postCardIcon: { marginBottom: 16 },
  postIconGradient: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  postCardTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, marginBottom: 8, letterSpacing: -0.3 },
  postCardDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, lineHeight: 21, marginBottom: 16 },
  postCardArrow: { alignSelf: "flex-end" },
  tipsSection: { gap: 14 },
  tipsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.text, marginBottom: 4 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.tint + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, flex: 1 },
});
