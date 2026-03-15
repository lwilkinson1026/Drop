import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const C = Colors.light;
const { width, height } = Dimensions.get("window");
const SCAN_SIZE = width * 0.7;

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Phase = "scanning" | "wrong-box" | "unlocked";

export default function QRScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { listings } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>("scanning");
  const [scanned, setScanned] = useState(false);
  const [wrongBoxMsg, setWrongBoxMsg] = useState("");

  const unlockAnim = useRef(new Animated.Value(0)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const listing = listings.find((l) => l.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const pickupTs = listing?.pickupTimestamp ?? Date.now();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleScan = ({ data }: { data: string }) => {
    if (scanned || phase !== "scanning") return;
    setScanned(true);

    try {
      const payload = JSON.parse(data);
      const boxId = payload.boxId ?? payload.listingId;
      const expectedBoxId = listing?.boxLocation?.id;

      if (payload.app === "Drop" && boxId === expectedBoxId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log("door open");
        setPhase("unlocked");
        Animated.spring(unlockAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 7,
        }).start();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const scannedName = payload.boxName ?? payload.boxId ?? "Unknown";
        setWrongBoxMsg(
          expectedBoxId
            ? `This is the "${scannedName}" box — you need "${listing?.boxLocation?.address}"`
            : "This QR code doesn't match any known Drop box."
        );
        setPhase("wrong-box");
        Animated.sequence([
          Animated.timing(errorAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.delay(2500),
          Animated.timing(errorAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          setPhase("scanning");
          setScanned(false);
          setWrongBoxMsg("");
        });
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrongBoxMsg("Couldn't read that QR code. Try again.");
      setPhase("wrong-box");
      Animated.sequence([
        Animated.timing(errorAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(errorAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setPhase("scanning");
        setScanned(false);
      });
    }
  };

  const handleSimulateUnlock = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log("door open");
    setPhase("unlocked");
    Animated.spring(unlockAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }).start();
  };

  if (!permission) {
    return (
      <LinearGradient colors={[C.accent, "#162A14", "#0E1A0C"]} style={styles.centered}>
        <Text style={styles.permText}>Checking camera access…</Text>
      </LinearGradient>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={[C.accent, "#162A14", "#0E1A0C"]} style={styles.centered}>
        <Ionicons name="camera-outline" size={52} color="rgba(255,255,255,0.5)" />
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permText}>
          To unlock the drop box, the app needs to scan its QR code using your camera.
        </Text>
        <Pressable onPress={requestPermission} style={styles.permBtn}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.permBack}>
          <Text style={styles.permBackText}>Go back</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {phase !== "unlocked" ? (
        <>
          {Platform.OS !== "web" ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={handleScan}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.webCameraBg]} />
          )}

          <LinearGradient
            colors={["rgba(0,0,0,0.72)", "transparent", "transparent", "rgba(0,0,0,0.72)"]}
            style={StyleSheet.absoluteFill}
            locations={[0, 0.3, 0.7, 1]}
          />

          <View style={[styles.header, { paddingTop: topPad + 8 }]}>
            <Pressable onPress={() => router.replace("/(tabs)")} style={styles.closeBtn}>
              <Feather name="x" size={20} color="rgba(255,255,255,0.9)" />
            </Pressable>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.headerTitle}>Scan Box QR</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {listing?.title ?? "Your pickup"}
              </Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.scannerArea}>
            <Animated.View style={[styles.finder, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </Animated.View>
          </View>

          <Animated.View style={[styles.errorBanner, { opacity: errorAnim }]}>
            <Ionicons name="close-circle" size={18} color="#fff" />
            <Text style={styles.errorText}>{wrongBoxMsg}</Text>
          </Animated.View>

          <View style={[styles.bottom, { paddingBottom: bottomPad + 12 }]}>
            <View style={styles.locationHint}>
              <Feather name="map-pin" size={13} color={C.tint} />
              <Text style={styles.locationHintText} numberOfLines={1}>
                {listing?.boxLocation?.address ?? "Head to the drop box location"}
              </Text>
            </View>
            <Text style={styles.scanInstructions}>
              Point your camera at the QR code on the drop box to unlock it
            </Text>
            {Platform.OS === "web" && (
              <Pressable onPress={handleSimulateUnlock} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
                <LinearGradient
                  colors={[C.tintLight, C.tint]}
                  style={styles.simulateBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="lock-open-outline" size={18} color="#fff" />
                  <Text style={styles.simulateBtnText}>Simulate Unlock (web)</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </>
      ) : (
        <LinearGradient
          colors={[C.accent, "#162A14", "#0E1A0C"]}
          style={styles.unlockScreen}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
        >
          <View style={[styles.header, { paddingTop: topPad + 8 }]}>
            <View style={{ width: 38 }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.headerTitle}>Box Unlocked!</Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.unlockContent}>
            <Animated.View
              style={{
                transform: [
                  {
                    scale: unlockAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                  },
                ],
                opacity: unlockAnim,
                alignItems: "center",
                gap: 20,
              }}
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
          </View>

          <View style={[styles.bottom, { paddingBottom: bottomPad + 12 }]}>
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
                style={styles.simulateBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="star" size={18} color="#fff" />
                <Text style={styles.simulateBtnText}>Rate this Drop</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => router.replace("/(tabs)")} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Back to listings</Text>
            </Pressable>
          </View>
        </LinearGradient>
      )}
    </Animated.View>
  );
}

const CORNER = 26;
const BORDER = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 36 },
  webCameraBg: { backgroundColor: "#0D1A0B" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff", letterSpacing: -0.3 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2, maxWidth: 220 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  scannerArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  finder: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    position: "relative",
  },
  corner: { position: "absolute", width: CORNER, height: CORNER },
  tl: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderColor: C.tintLight, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER, borderColor: C.tintLight, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderColor: C.tintLight, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderColor: C.tintLight, borderBottomRightRadius: 6 },
  errorBanner: {
    position: "absolute",
    bottom: 200,
    left: 32,
    right: 32,
    backgroundColor: "#C0392B",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 20,
  },
  errorText: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#fff", flex: 1, lineHeight: 20 },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
    zIndex: 10,
  },
  locationHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  locationHintText: { fontFamily: "Inter_500Medium", fontSize: 13, color: "rgba(255,255,255,0.75)", maxWidth: 260 },
  scanInstructions: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 20 },
  simulateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 16 },
  simulateBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  doneBtn: { backgroundColor: "rgba(255,255,255,0.12)", paddingVertical: 17, borderRadius: 16, alignItems: "center" },
  doneBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "rgba(255,255,255,0.8)" },
  unlockScreen: { flex: 1 },
  unlockContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36 },
  unlockCircle: { width: 160, height: 160, borderRadius: 80, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.tint + "44" },
  unlockTitle: { fontFamily: "Inter_700Bold", fontSize: 30, color: "#fff", letterSpacing: -0.5 },
  unlockSubtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 22 },
  pickupTimestampBadge: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(212,130,42,0.15)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(212,130,42,0.25)" },
  pickupTimestampText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.tint },
  permTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff", textAlign: "center" },
  permText: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 22 },
  permBtn: { backgroundColor: C.tint, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, marginTop: 8 },
  permBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  permBack: { paddingVertical: 12 },
  permBackText: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(255,255,255,0.45)" },
});
