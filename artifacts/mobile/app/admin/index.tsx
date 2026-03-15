import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import StarRating from "@/components/StarRating";

const C = Colors.light;

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { dropLocations, removeDropLocation, listings, reviews, getUserRating, suspendedUserIds, toggleSuspendUser } = useApp();
  const { authUser } = useAuth();

  const [boxQrLocation, setBoxQrLocation] = useState<{ id: string; name: string; address: string } | null>(null);

  const flaggedUsers = (() => {
    const userIds = [...new Set(reviews.map((r) => r.revieweeId))];
    return userIds
      .map((uid) => {
        const rating = getUserRating(uid);
        const nameFromReview = reviews.find((r) => r.revieweeId === uid)?.revieweeName ?? uid;
        return { uid, name: nameFromReview, ...rating };
      })
      .filter((u) => u.count >= 2 && u.average < 3.5)
      .sort((a, b) => a.average - b.average);
  })();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRemove = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Remove location?",
      `Are you sure you want to remove "${name}"? Listings pointing to this box will still appear but the location won't be selectable for new posts.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeDropLocation(id) },
      ]
    );
  };

  const listingCountForLocation = (locationId: string) =>
    listings.filter((l) => l.boxLocation.dropLocationId === locationId && l.available).length;

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <LinearGradient
        colors={[C.accent, C.accentMid]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.8)" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>{authUser?.email}</Text>
        </View>
        <View style={styles.adminBadge}>
          <Feather name="shield" size={12} color={C.tint} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Drop Box Locations</Text>
            <Text style={styles.sectionCount}>{dropLocations.length} location{dropLocations.length !== 1 ? "s" : ""}</Text>
          </View>

          {dropLocations.map((loc) => {
            const count = listingCountForLocation(loc.id);
            const isBuiltIn = loc.builtIn ?? false;
            return (
              <View key={loc.id} style={styles.locCard}>
                <View style={styles.locCardHeader}>
                  <View style={styles.locIconWrap}>
                    <MaterialCommunityIcons name="package-variant" size={20} color={C.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.locNameRow}>
                      <Text style={styles.locName}>{loc.name}</Text>
                      {isBuiltIn && (
                        <View style={styles.builtInBadge}>
                          <Text style={styles.builtInText}>Built-in</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.locAddr}>{loc.address}, {loc.city} {loc.state}</Text>
                  </View>
                  {!isBuiltIn && (
                    <Pressable
                      onPress={() => handleRemove(loc.id, loc.name)}
                      style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Feather name="trash-2" size={16} color={C.error} />
                    </Pressable>
                  )}
                </View>
                <View style={styles.locMeta}>
                  <View style={styles.locStat}>
                    <Ionicons name="cube-outline" size={13} color={C.textSecondary} />
                    <Text style={styles.locStatText}>{count} active listing{count !== 1 ? "s" : ""}</Text>
                  </View>
                  <View style={styles.locStat}>
                    <Feather name="map-pin" size={13} color={C.textSecondary} />
                    <Text style={styles.locStatText}>{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</Text>
                  </View>
                </View>
                {loc.description ? (
                  <Text style={styles.locDesc}>{loc.description}</Text>
                ) : null}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setBoxQrLocation({ id: loc.id, name: loc.name, address: loc.address });
                  }}
                  style={({ pressed }) => [styles.boxQrBtn, { opacity: pressed ? 0.75 : 1 }]}
                >
                  <Feather name="grid" size={14} color={C.tint} />
                  <Text style={styles.boxQrBtnText}>Show Box QR</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsRow}>
            {[
              { label: "Total Listings", value: listings.length.toString(), icon: "layers" as const },
              { label: "Active", value: listings.filter((l) => l.available).length.toString(), icon: "check-circle" as const },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Feather name={s.icon} size={20} color={C.tint} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {flaggedUsers.length > 0 && (
          <View style={styles.flaggedSection}>
            <View style={styles.flaggedHeader}>
              <Ionicons name="warning" size={18} color={C.error ?? "#C0392B"} />
              <Text style={styles.sectionTitle}>Flagged Members</Text>
              <View style={styles.flagCount}><Text style={styles.flagCountText}>{flaggedUsers.length}</Text></View>
            </View>
            <Text style={styles.flaggedSubtitle}>Users with rating below 3.5 and 2+ reviews. Consider suspending access.</Text>
            <View style={{ gap: 10 }}>
              {flaggedUsers.map((u) => {
                const isSuspended = suspendedUserIds.includes(u.uid);
                return (
                  <View key={u.uid} style={[styles.flaggedCard, isSuspended && styles.flaggedCardSuspended]}>
                    <View style={styles.flaggedAvatar}>
                      <Text style={styles.flaggedAvatarText}>{u.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.flaggedName}>{u.name}</Text>
                      <View style={styles.flaggedRatingRow}>
                        <StarRating rating={u.average} size={12} />
                        <Text style={styles.flaggedRatingText}>{u.average.toFixed(1)} · {u.count} reviews</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        toggleSuspendUser(u.uid);
                      }}
                      style={[styles.suspendBtn, isSuspended && styles.unsuspendBtn]}
                    >
                      <Text style={[styles.suspendBtnText, isSuspended && styles.unsuspendBtnText]}>
                        {isSuspended ? "Unsuspend" : "Suspend"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={boxQrLocation !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setBoxQrLocation(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setBoxQrLocation(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="package-variant" size={20} color={C.tint} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{boxQrLocation?.name}</Text>
                <Text style={styles.modalAddr}>{boxQrLocation?.address}</Text>
              </View>
              <Pressable onPress={() => setBoxQrLocation(null)} style={styles.modalClose}>
                <Feather name="x" size={18} color={C.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.modalQrWrap}>
              {boxQrLocation && (
                <QRCode
                  value={JSON.stringify({ app: "Drop", boxId: boxQrLocation.id, boxName: boxQrLocation.name })}
                  size={220}
                  color="#1A1208"
                  backgroundColor="#F7F2EA"
                />
              )}
            </View>
            <Text style={styles.modalHint}>
              Print this QR and stick it on the box.{"\n"}Members scan it to unlock the door.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={[styles.fab]}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/admin/add-location"); }}
          style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
        >
          <LinearGradient
            colors={[C.tintLight, C.tint]}
            style={styles.fabBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="plus" size={22} color="#fff" />
            <Text style={styles.fabText}>Add Drop Location</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#fff" },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(212,130,42,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,130,42,0.35)",
  },
  adminBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.tint },
  content: { padding: 20, gap: 24 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: C.text },
  sectionCount: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  locCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  locCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  locIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.tint + "14",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  locNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  locName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.text },
  locAddr: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  builtInBadge: {
    backgroundColor: C.accentMid + "18",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  builtInText: { fontFamily: "Inter_500Medium", fontSize: 10, color: C.accentMid },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.error + "10",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  locMeta: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  locStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  locStatText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary },
  locDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  statsSection: { gap: 12 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
  },
  fabBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    borderRadius: 16,
    shadowColor: C.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  flaggedSection: { marginTop: 24, paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  flaggedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  flagCount: { backgroundColor: "#C0392B22", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  flagCountText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#C0392B" },
  flaggedSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, lineHeight: 18 },
  flaggedCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#C0392B22" },
  flaggedCardSuspended: { opacity: 0.55 },
  flaggedAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#C0392B22", alignItems: "center", justifyContent: "center" },
  flaggedAvatarText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#C0392B" },
  flaggedName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  flaggedRatingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  flaggedRatingText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary },
  suspendBtn: { backgroundColor: "#C0392B", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  suspendBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" },
  unsuspendBtn: { backgroundColor: C.creamDark ?? "#EDE8E0", borderWidth: 1, borderColor: C.cardBorder },
  unsuspendBtnText: { color: C.text },
  boxQrBtn: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", backgroundColor: C.tint + "14", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, marginTop: 10 },
  boxQrBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.tint },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: C.surface, borderRadius: 24, padding: 24, width: "100%", maxWidth: 360, gap: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text },
  modalAddr: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  modalClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.creamDark, alignItems: "center", justifyContent: "center" },
  modalQrWrap: { alignItems: "center", backgroundColor: "#F7F2EA", borderRadius: 16, padding: 20 },
  modalHint: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, textAlign: "center", lineHeight: 20 },
});
