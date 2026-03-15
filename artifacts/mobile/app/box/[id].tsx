import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import StarRating from "@/components/StarRating";
import Colors from "@/constants/colors";
import { ListingItem, useApp } from "@/context/AppContext";

const C = Colors.light;
const { width } = Dimensions.get("window");

const CATEGORY_COLORS: Record<ListingItem["category"], string> = {
  vegetables: C.accentMid,
  fruits: C.tint,
  herbs: C.accentLight,
  eggs: "#C8892A",
  dairy: C.sage,
  other: C.barkLight,
};

const CATEGORY_ICONS: Record<ListingItem["category"], string> = {
  vegetables: "🥦",
  fruits: "🍎",
  herbs: "🌿",
  eggs: "🥚",
  dairy: "🧈",
  other: "📦",
};

function freshness(ts: number | undefined): { label: string; color: string; icon: string } {
  if (!ts) return { label: "Recently posted", color: C.textSecondary, icon: "clock" };
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 60)
    return { label: mins <= 5 ? "Just dropped!" : `${mins}m ago`, color: "#2D8B4E", icon: "zap" };
  const hrs = Math.floor(mins / 60);
  if (hrs < 5)
    return { label: `${hrs}h ago`, color: C.tint, icon: "sun" };
  if (hrs < 24)
    return { label: "Today", color: C.accent, icon: "clock" };
  const days = Math.floor(hrs / 24);
  return { label: `${days}d ago`, color: C.barkLight, icon: "clock" };
}

export default function BoxContentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { dropLocations, listings, getUserRating } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const location = dropLocations.find((l) => l.id === id);

  const contents = useMemo(() => {
    return listings
      .filter((l) => l.available && l.boxLocation.id === id)
      .sort((a, b) => (b.dropOffTimestamp ?? 0) - (a.dropOffTimestamp ?? 0));
  }, [listings, id]);

  if (!location) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="cube-outline" size={52} color={C.sageMist} />
        <Text style={styles.notFoundText}>Box not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={[C.accentLight, C.background]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backCircle, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="arrow-left" size={20} color={C.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.boxIconBadge}>
              <MaterialCommunityIcons name="package-variant-closed" size={18} color={C.tint} />
            </View>
            <View>
              <Text style={styles.headerTitle}>{location.name}</Text>
              <Text style={styles.headerAddr}>{location.address}, {location.city} {location.state}</Text>
            </View>
          </View>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountNum}>{contents.length}</Text>
            <Text style={styles.itemCountLabel}>item{contents.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {contents.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant" size={64} color={C.sageMist} />
            <Text style={styles.emptyTitle}>Box is empty</Text>
            <Text style={styles.emptySubtitle}>
              Nothing here right now. Check back soon — neighbors drop off fresh goods regularly.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Inside this box right now</Text>
            {contents.map((item) => {
              const fresh = freshness(item.dropOffTimestamp);
              const makerRating = getUserRating(item.makerId);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/listing/[id]", params: { id: item.id } });
                  }}
                  style={({ pressed }) => [styles.itemCard, { opacity: pressed ? 0.93 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
                >
                  {item.dropOffPhotoUri ? (
                    <View style={styles.photoContainer}>
                      <Image
                        source={{ uri: item.dropOffPhotoUri }}
                        style={styles.photo}
                        contentFit="cover"
                      />
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.5)"]}
                        style={styles.photoGradient}
                      />
                      <View style={styles.photoFreshBadge}>
                        <Feather name={fresh.icon as any} size={11} color="#fff" />
                        <Text style={styles.photoFreshText}>{fresh.label}</Text>
                      </View>
                      <View style={[styles.categoryPill, { backgroundColor: CATEGORY_COLORS[item.category] + "DD" }]}>
                        <Text style={styles.categoryPillText}>
                          {CATEGORY_ICONS[item.category]} {item.category}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.noPhotoHeader, { backgroundColor: CATEGORY_COLORS[item.category] + "22" }]}>
                      <Text style={styles.noPhotoEmoji}>{CATEGORY_ICONS[item.category]}</Text>
                      <View style={styles.freshBadge}>
                        <Feather name={fresh.icon as any} size={11} color={fresh.color} />
                        <Text style={[styles.freshBadgeText, { color: fresh.color }]}>{fresh.label}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.itemBody}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      <View style={styles.badgeRow}>
                        {item.priceCents ? (
                          <View style={styles.priceBadge}>
                            <Ionicons name="card" size={11} color="#1A1A2E" />
                            <Text style={styles.priceText}>${(item.priceCents / 100).toFixed(2)}</Text>
                          </View>
                        ) : null}
                        <View style={styles.creditBadge}>
                          <Ionicons name="leaf" size={12} color={C.tint} />
                          <Text style={styles.creditText}>{item.creditCost}</Text>
                        </View>
                      </View>
                    </View>

                    {item.description ? (
                      <Text style={styles.itemDesc} numberOfLines={3}>{item.description}</Text>
                    ) : null}

                    <View style={styles.itemMeta}>
                      <View style={styles.makerRow}>
                        <View style={styles.makerAvatar}>
                          <Text style={styles.makerAvatarText}>{item.makerName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text style={styles.makerName}>{item.makerName}</Text>
                          {makerRating.count > 0 ? (
                            <View style={styles.ratingRow}>
                              <StarRating rating={makerRating.average} size={11} />
                              <Text style={styles.ratingText}>{makerRating.average.toFixed(1)}</Text>
                            </View>
                          ) : (
                            <Text style={styles.noRatingText}>New maker</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.qtyBadge}>
                        <Feather name="package" size={12} color={C.textSecondary} />
                        <Text style={styles.qtyText}>{item.quantity} {item.unit}</Text>
                      </View>
                    </View>

                    <View style={styles.dropoffMeta}>
                      <Feather name="clock" size={12} color={fresh.color} />
                      <Text style={[styles.dropoffMetaText, { color: fresh.color }]}>
                        {item.dropOffTimestamp
                          ? `Dropped off ${new Date(item.dropOffTimestamp).toLocaleString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit" })}`
                          : "Recently posted"}
                      </Text>
                    </View>

                    <View style={styles.claimRow}>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          router.push({ pathname: "/listing/[id]", params: { id: item.id } });
                        }}
                        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, flex: 1 }]}
                      >
                        <LinearGradient
                          colors={[C.tintLight, C.tint]}
                          style={styles.claimBtn}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.claimBtnText}>View & Claim</Text>
                          <Feather name="arrow-right" size={14} color="#fff" />
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", gap: 16, padding: 36 },
  headerGradient: { paddingBottom: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 12,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  boxIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.tint + "18",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text, letterSpacing: -0.3 },
  headerAddr: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, marginTop: 1 },
  itemCountBadge: {
    alignItems: "center",
    backgroundColor: C.tint,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
  },
  itemCountNum: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff", lineHeight: 18 },
  itemCountLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.8)" },
  scrollContent: { padding: 16, gap: 14 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  itemCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  photoContainer: { height: 180, position: "relative" },
  photo: { width: "100%", height: "100%" },
  photoGradient: { ...StyleSheet.absoluteFillObject },
  photoFreshBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  photoFreshText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" },
  categoryPill: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryPillText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" },
  noPhotoHeader: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  noPhotoEmoji: { fontSize: 32 },
  freshBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  freshBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  itemBody: { padding: 16, gap: 10 },
  itemTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  itemTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: C.text, flex: 1 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  priceBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1A1A2E18", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  priceText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#1A1A2E" },
  creditBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.tint + "18",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  creditText: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.tint },
  itemDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  makerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  makerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.accentLight + "55",
    alignItems: "center",
    justifyContent: "center",
  },
  makerAvatarText: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.accent },
  makerName: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.text },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  ratingText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecondary },
  noRatingText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecondary, marginTop: 1 },
  qtyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.creamDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  qtyText: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textSecondary },
  dropoffMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 2,
  },
  dropoffMetaText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  claimRow: { flexDirection: "row", marginTop: 4 },
  claimBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  claimBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  emptyState: { alignItems: "center", paddingVertical: 72, gap: 14, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  notFoundText: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: C.text },
  backBtn: { backgroundColor: C.tint, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});
