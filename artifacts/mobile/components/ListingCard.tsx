import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { ListingItem } from "@/context/AppContext";

const C = Colors.light;

const CATEGORY_ICONS: Record<ListingItem["category"], string> = {
  vegetables: "leaf",
  fruits: "nutrition",
  herbs: "flower",
  eggs: "egg",
  dairy: "water",
  other: "grid",
};

const CATEGORY_COLORS: Record<ListingItem["category"], string> = {
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
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function ListingCard({ item }: { item: ListingItem }) {
  const catColor = CATEGORY_COLORS[item.category];
  const catIcon = CATEGORY_ICONS[item.category];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/listing/[id]", params: { id: item.id } });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.93 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <View style={styles.imageContainer}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={styles.image} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[catColor + "44", catColor + "22"]}
            style={styles.imagePlaceholder}
          >
            <Ionicons name={catIcon as any} size={40} color={catColor} />
          </LinearGradient>
        )}
        <View style={[styles.categoryBadge, { backgroundColor: catColor }]}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        {!item.available && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Claimed</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

        <View style={styles.meta}>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={C.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>{item.boxLocation.address}</Text>
          </View>
          <Text style={styles.timeText}>{timeAgo(item.timestamp)}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.makerRow}>
            <View style={styles.makerDot} />
            <Text style={styles.makerText} numberOfLines={1}>{item.makerName}</Text>
          </View>
          <View style={styles.creditBadge}>
            <Ionicons name="leaf" size={12} color={C.tint} />
            <Text style={styles.creditText}>{item.creditCost}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: C.bark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  imageContainer: { height: 160, position: "relative" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#fff",
    textTransform: "capitalize",
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  unavailableText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#fff",
    letterSpacing: 1,
  },
  content: { padding: 14 },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  locationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textSecondary,
    flex: 1,
  },
  timeText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  makerRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  makerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accentMid,
  },
  makerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.textSecondary,
    flex: 1,
  },
  creditBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.tint + "18",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  creditText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: C.tint,
  },
});
