import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { ListingItem, useApp } from "@/context/AppContext";

const C = Colors.light;

const CATEGORY_COLORS: Record<ListingItem["category"], string> = {
  vegetables: C.accentMid,
  fruits: C.tint,
  herbs: C.accentLight,
  eggs: "#C8892A",
  dairy: C.sage,
  other: C.barkLight,
};

const INITIAL_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { listings } = useApp();
  const [selected, setSelected] = useState<ListingItem | null>(null);
  const mapRef = useRef<MapView>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const available = listings.filter((l) => l.available);

  const handleSelectMarker = (item: ListingItem) => {
    Haptics.selectionAsync();
    setSelected(item);
    mapRef.current?.animateToRegion(
      {
        latitude: item.boxLocation.lat,
        longitude: item.boxLocation.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      400
    );
  };

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { paddingTop: topPad + 12, paddingBottom: bottomPad }]}>
        <View style={styles.webHeader}>
          <Ionicons name="map-outline" size={28} color={C.tint} />
          <View>
            <Text style={styles.webTitle}>Swap Box Map</Text>
            <Text style={styles.webSubtitle}>{available.length} boxes available nearby</Text>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={styles.webList}
          showsVerticalScrollIndicator={false}
        >
          {available.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: "/listing/[id]", params: { id: item.id } }); }}
              style={({ pressed }) => [styles.listFallbackCard, { opacity: pressed ? 0.9 : 1 }]}
            >
              <View style={[styles.listFallbackDot, { backgroundColor: CATEGORY_COLORS[item.category] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.listFallbackTitle}>{item.title}</Text>
                <Text style={styles.listFallbackAddr}>{item.boxLocation.address}</Text>
              </View>
              <View style={styles.creditSmall}>
                <Ionicons name="leaf" size={11} color={C.tint} />
                <Text style={styles.creditSmallText}>{item.creditCost}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textMuted} />
            </Pressable>
          ))}
          {available.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="map-outline" size={48} color={C.sageMist} />
              <Text style={styles.emptyTitle}>No boxes yet</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {available.map((item) => (
          <Marker
            key={item.id}
            coordinate={{ latitude: item.boxLocation.lat, longitude: item.boxLocation.lng }}
            onPress={() => handleSelectMarker(item)}
          >
            <View style={[styles.markerOuter, selected?.id === item.id && styles.markerOuterSelected]}>
              <View style={[styles.markerInner, { backgroundColor: CATEGORY_COLORS[item.category] }]}>
                <Ionicons name="leaf" size={12} color="#fff" />
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.mapHeader, { paddingTop: insets.top + 8 }]}>
        <View style={styles.mapTitle}>
          <Ionicons name="location" size={14} color={C.tint} />
          <Text style={styles.mapTitleText}>{available.length} boxes available</Text>
        </View>
      </View>

      {selected && (
        <View style={[styles.selectedCard, { bottom: 100 }]}>
          <View style={[styles.selectedCatBar, { backgroundColor: CATEGORY_COLORS[selected.category] }]} />
          <View style={styles.selectedContent}>
            <Text style={styles.selectedTitle} numberOfLines={1}>{selected.title}</Text>
            <Text style={styles.selectedMaker} numberOfLines={1}>{selected.makerName}</Text>
            <View style={styles.selectedMeta}>
              <View style={styles.selectedAddr}>
                <Feather name="map-pin" size={12} color={C.textSecondary} />
                <Text style={styles.selectedAddrText} numberOfLines={1}>{selected.boxLocation.address}</Text>
              </View>
              <View style={styles.creditBadge}>
                <Ionicons name="leaf" size={12} color={C.tint} />
                <Text style={styles.creditBadgeText}>{selected.creditCost}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push({ pathname: "/listing/[id]", params: { id: selected.id } }); }}
              style={({ pressed }) => [styles.viewBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient colors={[C.tintLight, C.tint]} style={styles.viewBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.viewBtnText}>View Listing</Text>
                <Feather name="arrow-right" size={14} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
          <Pressable onPress={() => setSelected(null)} style={styles.closeBtn}>
            <Feather name="x" size={18} color={C.textSecondary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  webHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16, paddingHorizontal: 20 },
  webTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text },
  webSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  webList: { gap: 10, paddingHorizontal: 20, paddingBottom: 120 },
  listFallbackCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  listFallbackDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  listFallbackTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  listFallbackAddr: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, marginTop: 2 },
  creditSmall: { flexDirection: "row", alignItems: "center", gap: 3 },
  creditSmallText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.tint },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text },
  mapHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  mapTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mapTitleText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  markerOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerOuterSelected: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: C.tint,
  },
  markerInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCard: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
    flexDirection: "row",
  },
  selectedCatBar: { width: 5 },
  selectedContent: { flex: 1, padding: 16, gap: 4 },
  selectedTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text },
  selectedMaker: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  selectedMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  selectedAddr: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  selectedAddrText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, flex: 1 },
  creditBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.tint + "18",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditBadgeText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.tint },
  viewBtn: { marginTop: 12 },
  viewBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.creamDark,
    alignItems: "center",
    justifyContent: "center",
  },
});
