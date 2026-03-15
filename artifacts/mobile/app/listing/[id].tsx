import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import StarRating from "@/components/StarRating";

const C = Colors.light;
const { width } = Dimensions.get("window");

const CATEGORY_COLORS: Record<string, string> = {
  vegetables: C.accentMid,
  fruits: C.tint,
  herbs: C.accentLight,
  eggs: "#C8892A",
  dairy: C.sage,
  other: C.barkLight,
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  return `${Math.floor(diff / 86400000)} days ago`;
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { listings, user, claimListing, removeListing } = useApp();
  const [claiming, setClaiming] = useState(false);

  const listing = listings.find((l) => l.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!listing) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Feather name="alert-circle" size={40} color={C.sageMist} />
        <Text style={styles.notFound}>Listing not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isOwner = user?.id === listing.makerId;
  const canClaim = !isOwner && listing.available && user && user.creditBalance >= listing.creditCost;
  const { getUserRating, getReviewsForUser } = useApp();
  const makerRating = getUserRating(listing.makerId);
  const makerReviews = getReviewsForUser(listing.makerId);
  const catColor = CATEGORY_COLORS[listing.category] || C.tint;

  const handleClaim = async () => {
    if (!user) return;
    if (user.creditBalance < listing.creditCost) {
      Alert.alert("Not enough credits", `You need ${listing.creditCost} credits but only have ${user.creditBalance}.`);
      return;
    }
    setClaiming(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const success = await claimListing(listing);
    setClaiming(false);
    if (success) {
      router.push({ pathname: "/qr/[id]", params: { id: listing.id } });
    } else {
      Alert.alert("Claim failed", "Something went wrong. Please try again.");
    }
  };

  const handleDelete = () => {
    if (Platform.OS === "web") {
      removeListing(listing.id);
      router.back();
    } else {
      Alert.alert("Remove listing?", "This will remove your listing permanently.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => { await removeListing(listing.id); router.back(); },
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          {listing.photoUri ? (
            <Image source={{ uri: listing.photoUri }} style={styles.image} contentFit="cover" />
          ) : (
            <LinearGradient colors={[catColor + "44", catColor + "22"]} style={styles.imagePlaceholder}>
              <Ionicons name="leaf" size={64} color={catColor} />
            </LinearGradient>
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.5)", "transparent"]}
            style={[styles.imageOverlay, { paddingTop: topPad }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Pressable onPress={() => router.back()} style={styles.backCircle}>
              <Feather name="arrow-left" size={20} color="#fff" />
            </Pressable>
            {isOwner && (
              <Pressable onPress={handleDelete} style={[styles.backCircle, { backgroundColor: "rgba(229,57,53,0.7)" }]}>
                <Feather name="trash-2" size={18} color="#fff" />
              </Pressable>
            )}
          </LinearGradient>
          {!listing.available && (
            <View style={styles.claimedBanner}>
              <Text style={styles.claimedBannerText}>Claimed</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.topRow}>
                <View style={[styles.categoryBadge, { backgroundColor: catColor }]}>
                  <Text style={styles.categoryText}>{listing.category}</Text>
                </View>
                <Text style={styles.timeText}>{timeAgo(listing.timestamp)}</Text>
              </View>
              <Text style={styles.title}>{listing.title}</Text>
            </View>
          </View>

          <Text style={styles.description}>{listing.description}</Text>

          <View style={styles.detailGrid}>
            <View style={styles.detailCard}>
              <Feather name="package" size={16} color={C.accent} />
              <Text style={styles.detailValue}>{listing.quantity} {listing.unit}</Text>
              <Text style={styles.detailLabel}>Available</Text>
            </View>
            <View style={styles.detailCard}>
              <Ionicons name="leaf" size={16} color={C.tint} />
              <Text style={styles.detailValue}>{listing.creditCost}</Text>
              <Text style={styles.detailLabel}>Credits</Text>
            </View>
            <View style={styles.detailCard}>
              <Feather name="user" size={16} color={C.barkLight} />
              <Text style={styles.detailValue} numberOfLines={1}>{listing.makerName.split(" ")[0]}</Text>
              <Text style={styles.detailLabel}>Maker</Text>
            </View>
          </View>

          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Box Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationPinRow}>
                <View style={styles.locationPin}>
                  <Feather name="map-pin" size={18} color={C.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationAddress}>{listing.boxLocation.address}</Text>
                  <Text style={styles.locationCoords}>
                    {listing.boxLocation.lat.toFixed(4)}°N, {Math.abs(listing.boxLocation.lng).toFixed(4)}°W
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.makerSection}>
            <Text style={styles.sectionTitle}>About the Maker</Text>
            <View style={styles.makerCard}>
              <View style={styles.makerAvatar}>
                <Text style={styles.makerAvatarText}>{listing.makerName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.makerName}>{listing.makerName}</Text>
                {makerRating.count > 0 ? (
                  <View style={styles.ratingRow}>
                    <StarRating rating={makerRating.average} size={13} />
                    <Text style={styles.ratingText}>
                      {makerRating.average.toFixed(1)} ({makerRating.count} review{makerRating.count !== 1 ? "s" : ""})
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.makerRole}>No reviews yet</Text>
                )}
              </View>
              <View style={styles.makerVerified}>
                <Feather name="check" size={12} color={C.success} />
                <Text style={styles.makerVerifiedText}>Active</Text>
              </View>
            </View>
            {makerReviews.length > 0 && (
              <View style={styles.reviewsPreview}>
                {makerReviews.slice(0, 2).map((r) => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{r.reviewerName}</Text>
                      <StarRating rating={r.rating} size={12} />
                    </View>
                    {r.comment ? <Text style={styles.reviewComment} numberOfLines={2}>{r.comment}</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.timestampSection}>
            <Text style={styles.sectionTitle}>Drop & Pickup Log</Text>
            <View style={styles.timestampCard}>
              <View style={styles.timestampRow}>
                <View style={[styles.tsIcon, { backgroundColor: C.tint + "14" }]}>
                  <Feather name="package" size={15} color={C.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tsLabel}>Dropped off</Text>
                  <Text style={styles.tsValue}>
                    {listing.dropOffTimestamp
                      ? new Date(listing.dropOffTimestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "Recently posted"}
                  </Text>
                </View>
                {listing.dropOffTimestamp && (
                  <View style={styles.tsBadge}>
                    <Feather name="camera" size={11} color={C.textSecondary} />
                    <Text style={styles.tsBadgeText}>Verified</Text>
                  </View>
                )}
              </View>

              {!listing.available && listing.pickupTimestamp && (
                <>
                  <View style={styles.tsLine} />
                  <View style={styles.timestampRow}>
                    <View style={[styles.tsIcon, { backgroundColor: C.success + "14" }]}>
                      <Feather name="check-circle" size={15} color={C.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tsLabel}>Picked up</Text>
                      <Text style={styles.tsValue}>
                        {new Date(listing.pickupTimestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                    {listing.pickupBuyerName && (
                      <Text style={styles.tsBuyerName} numberOfLines={1}>{listing.pickupBuyerName}</Text>
                    )}
                  </View>
                </>
              )}
            </View>

            {listing.dropOffPhotoUri && (
              <Pressable style={styles.dropoffPhotoContainer} onPress={() => {}}>
                <Image source={{ uri: listing.dropOffPhotoUri }} style={styles.dropoffPhoto} contentFit="cover" />
                <View style={styles.dropoffPhotoBadge}>
                  <Feather name="camera" size={11} color="#fff" />
                  <Text style={styles.dropoffPhotoBadgeText}>Drop-off photo</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomPad + 16 }]}>
        {isOwner ? (
          <View style={styles.ownerActions}>
            <View style={styles.ownerBadge}>
              <Feather name="check-circle" size={16} color={C.accent} />
              <Text style={styles.ownerBadgeText}>Your listing</Text>
            </View>
            <Pressable onPress={handleDelete} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleClaim}
            disabled={!canClaim || claiming}
            style={({ pressed }) => [
              styles.claimBtn,
              { opacity: (!canClaim || claiming) ? 0.5 : pressed ? 0.87 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={canClaim ? [C.tintLight, C.tint] : [C.sand, C.sand]}
              style={styles.claimBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="leaf" size={18} color="#fff" />
              <Text style={styles.claimBtnText}>
                {claiming ? "Claiming..." : !listing.available ? "Already Claimed" : !user ? "Sign in to Claim" : user.creditBalance < listing.creditCost ? `Need ${listing.creditCost} credits` : `Claim for ${listing.creditCost} credits`}
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  imageContainer: { height: 300, position: "relative" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: "center",
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  claimedBanner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    paddingVertical: 14,
  },
  claimedBannerText: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#fff", letterSpacing: 2 },
  content: { padding: 24 },
  titleRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoryText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#fff", textTransform: "capitalize" },
  timeText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, color: C.text, letterSpacing: -0.5, lineHeight: 32 },
  description: { fontFamily: "Inter_400Regular", fontSize: 15, color: C.textSecondary, lineHeight: 23, marginBottom: 24 },
  detailGrid: { flexDirection: "row", gap: 12, marginBottom: 28 },
  detailCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  detailValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text, letterSpacing: -0.3 },
  detailLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecondary },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.text, marginBottom: 10 },
  locationSection: { marginBottom: 24 },
  locationCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  locationPinRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  locationPin: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.tint + "18", alignItems: "center", justifyContent: "center" },
  locationAddress: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  locationCoords: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, marginTop: 2 },
  makerSection: { marginBottom: 12 },
  makerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  makerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent + "28",
    alignItems: "center",
    justifyContent: "center",
  },
  makerAvatarText: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.accent },
  makerName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.text },
  makerRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary },
  makerVerified: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.success + "18", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  makerVerifiedText: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.success },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  ratingText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary },
  reviewsPreview: { marginTop: 10, gap: 8 },
  reviewCard: { backgroundColor: C.creamDark, borderRadius: 12, padding: 12, gap: 5 },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewerName: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.text },
  reviewComment: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, lineHeight: 18 },
  timestampSection: { marginBottom: 24 },
  timestampCard: { backgroundColor: C.surface, borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: C.cardBorder },
  timestampRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  tsIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  tsLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary },
  tsValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.text, marginTop: 1 },
  tsBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.creamDark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  tsBadgeText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecondary },
  tsBuyerName: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, maxWidth: 80 },
  tsLine: { height: 1, backgroundColor: C.cardBorder, marginLeft: 46 },
  dropoffPhotoContainer: { marginTop: 10, borderRadius: 14, overflow: "hidden", height: 160 },
  dropoffPhoto: { width: "100%", height: "100%" },
  dropoffPhotoBadge: { position: "absolute", bottom: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dropoffPhotoBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12, color: "#fff" },
  notFound: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: C.text, marginTop: 12 },
  backBtn: { marginTop: 16, backgroundColor: C.text, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.surface },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
  },
  claimBtn: {},
  claimBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  claimBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
  ownerActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.accent + "18",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  ownerBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.accent },
  deleteBtn: {
    backgroundColor: C.error + "18",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  deleteBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.error },
});
