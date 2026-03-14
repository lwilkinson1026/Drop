import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ListingCard } from "@/components/ListingCard";
import Colors from "@/constants/colors";
import { ListingItem, useApp } from "@/context/AppContext";

const C = Colors.light;

const CATEGORIES = ["all", "vegetables", "fruits", "herbs", "eggs", "dairy", "other"] as const;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { listings, user, refreshListings } = useApp();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const filtered = listings.filter((l) => {
    const matchSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.makerName.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "all" || l.category === activeCategory;
    return matchSearch && matchCat && l.available;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshListings();
    setRefreshing(false);
  };

  const headerScale = scrollY.interpolate({
    inputRange: [-60, 0],
    outputRange: [1.04, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <Animated.View style={[styles.header, { paddingTop: topPad + 12, transform: [{ scale: headerScale }] }]}>
        <LinearGradient
          colors={[C.cream, C.cream + "00"]}
          style={StyleSheet.absoluteFill}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {user ? `Hey, ${user.name.split(" ")[0]}` : "Discover"}
            </Text>
            <Text style={styles.headerTitle}>Fresh from your neighbors</Text>
          </View>
          <View style={styles.creditChip}>
            <Ionicons name="leaf" size={14} color={C.tint} />
            <Text style={styles.creditCount}>{user?.creditBalance ?? 0}</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={16} color={C.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search produce, farms..."
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Feather name="x-circle" size={16} color={C.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat); }}
            style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
          >
            <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </Pressable>
        ))}
      </Animated.ScrollView>

      <Animated.FlatList
        data={filtered}
        keyExtractor={(item: ListingItem) => item.id}
        renderItem={({ item }: { item: ListingItem }) => (
          <View style={styles.cardWrapper}>
            <ListingCard item={item} />
          </View>
        )}
        numColumns={1}
        contentContainerStyle={[styles.listContent, { paddingBottom: 120 + bottomPad }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.tint}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={52} color={C.sageMist} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>
              {search ? "No listings match your search." : "Be the first to post something!"}
            </Text>
          </View>
        )}
      />

      {user?.role === "maker" && (
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/post"); }}
          style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
        >
          <LinearGradient colors={[C.tintLight, C.tint]} style={styles.fabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Feather name="plus" size={24} color="#fff" />
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingBottom: 12, zIndex: 10 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, marginBottom: 2 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.text, letterSpacing: -0.5 },
  creditChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.tint + "18",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  creditCount: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.tint },
  searchRow: { flexDirection: "row", gap: 10 },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: C.bark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.text,
  },
  categoryScroll: { maxHeight: 50 },
  categoryContent: { paddingHorizontal: 20, gap: 8, alignItems: "center", paddingBottom: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  categoryChipActive: { backgroundColor: C.text, borderColor: C.text },
  categoryChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary },
  categoryChipTextActive: { color: C.surface },
  listContent: { paddingHorizontal: 20, paddingTop: 12 },
  cardWrapper: { marginBottom: 16 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    borderRadius: 30,
    shadowColor: C.tint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
});
