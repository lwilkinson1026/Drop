import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
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
import { useApp } from "@/context/AppContext";

const C = Colors.light;

const INITIAL_REGION = {
  latitude: 46.6021,
  longitude: -120.5059,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function freshLabel(ts: number | undefined): string {
  if (!ts) return "";
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 60) return mins <= 5 ? "Just dropped!" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { dropLocations, listings } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const boxGroups = useMemo(() => {
    return dropLocations.map((loc) => {
      const items = listings.filter((l) => l.available && l.boxLocation.id === loc.id);
      const newestTs = items.reduce<number | undefined>(
        (acc, l) => (!acc || (l.dropOffTimestamp ?? 0) > acc ? l.dropOffTimestamp : acc),
        undefined
      );
      return { loc, items, newestTs };
    });
  }, [dropLocations, listings]);

  const totalAvailable = boxGroups.reduce((sum, g) => sum + g.items.length, 0);
  const selected = boxGroups.find((g) => g.loc.id === selectedId) ?? null;

  const handleSelectBox = (locId: string) => {
    Haptics.selectionAsync();
    setSelectedId(locId === selectedId ? null : locId);
    const loc = dropLocations.find((l) => l.id === locId);
    if (loc) {
      mapRef.current?.animateToRegion(
        { latitude: loc.lat, longitude: loc.lng, latitudeDelta: 0.018, longitudeDelta: 0.018 },
        400
      );
    }
  };

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { paddingTop: topPad + 12, paddingBottom: bottomPad }]}>
        <View style={styles.webHeader}>
          <Ionicons name="map-outline" size={28} color={C.tint} />
          <View>
            <Text style={styles.webTitle}>Swap Box Map</Text>
            <Text style={styles.webSubtitle}>{totalAvailable} item{totalAvailable !== 1 ? "s" : ""} across {boxGroups.length} box{boxGroups.length !== 1 ? "es" : ""}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.webList} showsVerticalScrollIndicator={false}>
          {boxGroups.map(({ loc, items, newestTs }) => (
            <Pressable
              key={loc.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/box/[id]", params: { id: loc.id } });
              }}
              style={({ pressed }) => [styles.webBoxCard, { opacity: pressed ? 0.9 : 1 }]}
            >
              <View style={[styles.webBoxIconWrap, { backgroundColor: items.length > 0 ? C.tint + "18" : C.creamDark }]}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={22}
                  color={items.length > 0 ? C.tint : C.barkLight}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.webBoxName}>{loc.name}</Text>
                <Text style={styles.webBoxAddr}>{loc.address}, {loc.city}</Text>
                {newestTs && items.length > 0 && (
                  <Text style={styles.webBoxFresh}>Latest: {freshLabel(newestTs)}</Text>
                )}
              </View>
              <View style={styles.webBoxRight}>
                {items.length > 0 ? (
                  <View style={styles.webItemCount}>
                    <Text style={styles.webItemCountNum}>{items.length}</Text>
                    <Text style={styles.webItemCountLabel}>item{items.length !== 1 ? "s" : ""}</Text>
                  </View>
                ) : (
                  <Text style={styles.webEmptyLabel}>Empty</Text>
                )}
                <Feather name="chevron-right" size={16} color={C.textMuted} />
              </View>
            </Pressable>
          ))}
          {boxGroups.length === 0 && (
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
        {boxGroups.map(({ loc, items }) => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            onPress={() => handleSelectBox(loc.id)}
            tracksViewChanges={false}
          >
            <View style={[styles.markerOuter, selectedId === loc.id && styles.markerOuterSelected]}>
              <View style={[styles.markerInner, { backgroundColor: items.length > 0 ? C.tint : C.sand }]}>
                <MaterialCommunityIcons name="package-variant-closed" size={13} color="#fff" />
              </View>
              {items.length > 0 && (
                <View style={styles.markerBadge}>
                  <Text style={styles.markerBadgeText}>{items.length}</Text>
                </View>
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.mapHeader, { paddingTop: insets.top + 8 }]}>
        <View style={styles.mapTitle}>
          <Ionicons name="location" size={14} color={C.tint} />
          <Text style={styles.mapTitleText}>
            {totalAvailable} item{totalAvailable !== 1 ? "s" : ""} in {boxGroups.length} box{boxGroups.length !== 1 ? "es" : ""}
          </Text>
        </View>
      </View>

      {selected && (
        <View style={[styles.selectedCard, { bottom: 100 }]}>
          <View style={styles.selectedContent}>
            <View style={styles.selectedTopRow}>
              <View style={styles.selectedBoxIcon}>
                <MaterialCommunityIcons name="package-variant-closed" size={18} color={C.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedTitle} numberOfLines={1}>{selected.loc.name}</Text>
                <Text style={styles.selectedAddr} numberOfLines={1}>
                  {selected.loc.address}, {selected.loc.city}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedId(null)} style={styles.closeBtn}>
                <Feather name="x" size={16} color={C.textSecondary} />
              </Pressable>
            </View>

            {selected.items.length > 0 ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.itemsPreviewRow}
                >
                  {selected.items.slice(0, 4).map((item) => (
                    <View key={item.id} style={styles.itemPreviewChip}>
                      <Text style={styles.itemPreviewText} numberOfLines={1}>{item.title}</Text>
                      {item.dropOffTimestamp && (
                        <Text style={styles.itemPreviewFresh}>{freshLabel(item.dropOffTimestamp)}</Text>
                      )}
                    </View>
                  ))}
                  {selected.items.length > 4 && (
                    <View style={styles.itemPreviewMore}>
                      <Text style={styles.itemPreviewMoreText}>+{selected.items.length - 4} more</Text>
                    </View>
                  )}
                </ScrollView>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({ pathname: "/box/[id]", params: { id: selected.loc.id } });
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient
                    colors={[C.tintLight, C.tint]}
                    style={styles.viewBoxBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name="package-variant-closed" size={15} color="#fff" />
                    <Text style={styles.viewBoxBtnText}>See box contents ({selected.items.length})</Text>
                    <Feather name="arrow-right" size={14} color="#fff" />
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <View style={styles.emptyBoxMsg}>
                <Text style={styles.emptyBoxText}>Nothing in this box right now</Text>
              </View>
            )}
          </View>
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
  webBoxCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  webBoxIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  webBoxName: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.text },
  webBoxAddr: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, marginTop: 2 },
  webBoxFresh: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.tint, marginTop: 2 },
  webBoxRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  webItemCount: { alignItems: "center", backgroundColor: C.tint, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  webItemCountNum: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  webItemCountLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.85)" },
  webEmptyLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text },
  mapHeader: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 16, alignItems: "center",
  },
  mapTitle: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  mapTitleText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  markerOuter: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  markerOuterSelected: { width: 48, height: 48, borderRadius: 24, borderWidth: 2.5, borderColor: C.tint },
  markerInner: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  markerBadge: {
    position: "absolute", top: -2, right: -2,
    backgroundColor: C.accent, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: "#fff",
  },
  markerBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#fff" },
  selectedCard: {
    position: "absolute", left: 16, right: 16,
    backgroundColor: "#fff", borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 8,
  },
  selectedContent: { padding: 16, gap: 12 },
  selectedTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  selectedBoxIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.tint + "18",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  selectedTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text },
  selectedAddr: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.creamDark,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  itemsPreviewRow: { gap: 8, paddingVertical: 2 },
  itemPreviewChip: {
    backgroundColor: C.creamDark, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, gap: 2,
  },
  itemPreviewText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.text, maxWidth: 130 },
  itemPreviewFresh: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.tint },
  itemPreviewMore: {
    backgroundColor: C.tint + "18", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    alignItems: "center", justifyContent: "center",
  },
  itemPreviewMoreText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.tint },
  viewBoxBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 14,
  },
  viewBoxBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  emptyBoxMsg: {
    backgroundColor: C.creamDark, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16, alignItems: "center",
  },
  emptyBoxText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary },
});
