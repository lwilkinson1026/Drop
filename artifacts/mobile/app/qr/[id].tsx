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

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const pickupTs = listing?.pickupTimestamp ?? Date.now();

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
    app: "Drop",
    listingId: id,
    listingTitle: listing?.title,
    location: listing?.boxLocation?.address,
    timestamp: Date.now(),
    action: "unlock_box",
  });

  return (
    <LinearGradient
      colors={[C.accent, "#162A14", "#0E1A0C"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
    >
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
          <Text style={styles.subtitle}>
            {listing?.boxLocation?.address ?? "See the box location"}
          </Text>
        </View>

        <View style={styles.qrSection}>
          {unlocked ? (
            <Animated.View
              style={[
                styles.unlockContainer,
                {
                  transform: [
                    {
                      scale: unlockAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1],
                      }),
                    },
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
              <Text style={styles.unlockSubtitle}>
                Retrieve your items and close the box securely.
              </Text>
              <View style={styles.pickupTimestampBadge}>
                <Feather name="clock" size={13} color={C.tint} />
                <Text style={styles.pickupTimestampText}>
                  Picked up {formatTimestamp(pickupTs)}
                </Text>
              </View>
            </Animated.View>
          ) : (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={qrValue}
                  size={QR_SIZE}
                  color="#1A1208"
                  backgroundColor="#F7F2EA"
                />
              </View>
            </Animated.View>
          )}
        </View>

        <View style={[styles.bottomSection, { paddingBottom: bottomPad + 12 }]}>
          {!unlocked ? (
            <>
              <Pressable
                onPress={handleSimulateUnlock}
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
              >
                <LinearGradient
                  colors={[C.tintLight, C.tint]}
                  style={styles.actionBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="lock-open-outline" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Simulate Box Unlock</Text>
                </LinearGradient>
              </Pressable>
              <View style={styles.creditInfo}>
                <Ionicons name="leaf" size={13} color="rgba(255,255,255,0.45)" />
                <Text style={styles.creditInfoText}>
                  {listing?.creditCost ?? 0} credits used · scan QR at box
                </Text>
              </View>
            </>
          ) : (
            <>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/review/[listingId]",
                    params: { listingId: id, type: "buyer-reviews-maker" },
                  })
                }
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
              >
                <LinearGradient
                  colors={[C.tintLight, C.tint]}
                  style={styles.actionBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="star" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Rate this Drop</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => router.replace("/(tabs)")} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>Back to listings</Text>
              </Pressable>
            </>
          )}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", alignItems: "center" },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  topSection: { paddingHorizontal: 28, paddingBottom: 24, gap: 8, alignItems: "center" },
  successBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  successText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.tintLight },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#fff", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.55)", textAlign: "center", maxWidth: 260, lineHeight: 21 },
  qrSection: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  qrWrapper: { backgroundColor: "#F7F2EA", padding: 20, borderRadius: 24 },
  unlockContainer: { alignItems: "center", gap: 20, paddingHorizontal: 32 },
  unlockCircle: { width: 160, height: 160, borderRadius: 80, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.tint + "44" },
  unlockTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#fff", letterSpacing: -0.5 },
  unlockSubtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 22 },
  pickupTimestampBadge: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(212,130,42,0.15)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(212,130,42,0.25)" },
  pickupTimestampText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.tint },
  bottomSection: { paddingHorizontal: 24, paddingTop: 16, gap: 14 },
  actionBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 16 },
  actionBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  doneBtn: { backgroundColor: "rgba(255,255,255,0.12)", paddingVertical: 17, borderRadius: 16, alignItems: "center" },
  doneBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "rgba(255,255,255,0.8)" },
  creditInfo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  creditInfoText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.45)" },
});
