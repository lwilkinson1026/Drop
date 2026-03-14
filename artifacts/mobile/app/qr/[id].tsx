import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const C = Colors.light;
const { width } = Dimensions.get("window");
const QR_SIZE = width * 0.62;

export default function QRScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { listings } = useApp();
  const [unlocked, setUnlocked] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const unlockAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const listing = listings.find((l) => l.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleSimulateUnlock = () => {
    if (unlocked) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log("door open");
    setUnlocked(true);
    Animated.spring(unlockAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 7,
    }).start();
  };

  const qrValue = JSON.stringify({
    app: "HarvestSwap",
    listingId: id,
    listingTitle: listing?.title,
    location: listing?.boxLocation?.address,
    timestamp: Date.now(),
    action: "unlock_box",
  });

  return (
    <LinearGradient colors={[C.accent, "#162A14", "#0E1A0C"]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={() => router.replace("/(tabs)")} style={styles.closeBtn}>
            <Feather name="x" size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        <View style={styles.topSection}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={20} color={C.tint} />
            <Text style={styles.successText}>
              {unlocked ? "Box Unlocked!" : "Claimed successfully"}
            </Text>
          </View>
          <Text style={styles.title}>{listing?.title ?? "Your item"}</Text>
          <Text style={styles.subtitle}>{listing?.boxLocation?.address ?? "See the box location"}</Text>
        </View>

        <View style={styles.qrSection}>
          {unlocked ? (
            <Animated.View
              style={[
                styles.unlockContainer,
                {
                  transform: [
                    { scale: unlockAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                  ],
                  opacity: unlockAnim,
                },
              ]}
            >
              <LinearGradient
                colors={[C.tintLight + "33", C.tint + "18"]}
                style={styles.unlockCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="lock-open" size={72} color={C.tintLight} />
              </LinearGradient>
              <Text style={styles.unlockTitle}>Door is open</Text>
              <Text style={styles.unlockSubtitle}>Collect your items and close the box when done.</Text>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.qrWrapper, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.qrCard}>
                <QRCode
                  value={qrValue}
                  size={QR_SIZE}
                  color={C.text}
                  backgroundColor={C.surface}
                  enableLinearGradient={false}
                />
                <View style={styles.qrCornerTL} />
                <View style={styles.qrCornerTR} />
                <View style={styles.qrCornerBL} />
                <View style={styles.qrCornerBR} />
              </View>
              <Text style={styles.qrInstructions}>Scan this QR at the swap box to unlock</Text>
            </Animated.View>
          )}
        </View>

        <View style={[styles.bottomSection, { paddingBottom: bottomPad + 24 }]}>
          {!unlocked && (
            <Pressable
              onPress={handleSimulateUnlock}
              style={({ pressed }) => [styles.simulateBtn, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <LinearGradient
                colors={[C.tintLight, C.tint]}
                style={styles.simulateBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="lock-open-outline" size={18} color="#fff" />
                <Text style={styles.simulateBtnText}>Simulate Box Unlock</Text>
              </LinearGradient>
            </Pressable>
          )}

          {unlocked && (
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace("/(tabs)"); }}
              style={({ pressed }) => [styles.doneBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          )}

          <View style={styles.creditInfo}>
            <Ionicons name="leaf" size={14} color="rgba(255,255,255,0.5)" />
            <Text style={styles.creditInfoText}>
              {listing?.creditCost} credits deducted from your balance
            </Text>
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  topSection: { paddingHorizontal: 32, paddingBottom: 32, gap: 8 },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(212,130,42,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  successText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.tintLight },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#fff", letterSpacing: -0.4, lineHeight: 30 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.6)" },
  qrSection: { flex: 1, alignItems: "center", justifyContent: "center" },
  qrWrapper: { alignItems: "center", gap: 20 },
  qrCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    position: "relative",
  },
  qrCornerTL: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: C.tint,
    borderTopLeftRadius: 4,
  },
  qrCornerTR: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: C.tint,
    borderTopRightRadius: 4,
  },
  qrCornerBL: {
    position: "absolute",
    bottom: 10,
    left: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: C.tint,
    borderBottomLeftRadius: 4,
  },
  qrCornerBR: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: C.tint,
    borderBottomRightRadius: 4,
  },
  qrInstructions: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 21,
  },
  unlockContainer: { alignItems: "center", gap: 20, paddingHorizontal: 32 },
  unlockCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.tint + "44",
  },
  unlockTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#fff", letterSpacing: -0.5 },
  unlockSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 22,
  },
  bottomSection: { paddingHorizontal: 24, paddingTop: 16, gap: 16 },
  simulateBtn: {},
  simulateBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  simulateBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  doneBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  creditInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  creditInfoText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.45)" },
});
