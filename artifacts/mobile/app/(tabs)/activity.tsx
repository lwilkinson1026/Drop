import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { Transaction, useApp } from "@/context/AppContext";

const C = Colors.light;

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, user } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const totalSpent = transactions
    .filter((t) => t.type === "purchase" && t.buyerId === user?.id)
    .reduce((s, t) => s + t.credits, 0);
  const totalSaved = transactions.length * 2;

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Your swap history</Text>

        <View style={styles.statsRow}>
          <LinearGradient colors={[C.tint + "22", C.tint + "08"]} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="leaf" size={18} color={C.tint} />
            <Text style={styles.statValue}>{user?.creditBalance ?? 0}</Text>
            <Text style={styles.statLabel}>Credits left</Text>
          </LinearGradient>
          <LinearGradient colors={[C.accent + "22", C.accent + "08"]} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Feather name="shopping-bag" size={18} color={C.accent} />
            <Text style={[styles.statValue, { color: C.accent }]}>{transactions.length}</Text>
            <Text style={styles.statLabel}>Total swaps</Text>
          </LinearGradient>
          <LinearGradient colors={[C.barkLight + "22", C.barkLight + "08"]} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Feather name="trending-down" size={18} color={C.barkLight} />
            <Text style={[styles.statValue, { color: C.barkLight }]}>{totalSpent}</Text>
            <Text style={styles.statLabel}>Credits spent</Text>
          </LinearGradient>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item: Transaction) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 + bottomPad }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: Transaction }) => (
          <View style={styles.txCard}>
            <View style={[styles.txIcon, { backgroundColor: item.type === "purchase" ? C.tint + "18" : C.accent + "18" }]}>
              <Feather
                name={item.type === "purchase" ? "arrow-up-right" : "arrow-down-left"}
                size={18}
                color={item.type === "purchase" ? C.tint : C.accent}
              />
            </View>
            <View style={styles.txContent}>
              <Text style={styles.txTitle} numberOfLines={1}>{item.listingTitle}</Text>
              <Text style={styles.txMeta}>{timeAgo(item.timestamp)}</Text>
            </View>
            <View style={styles.txAmount}>
              <Text style={[styles.txAmountText, { color: item.type === "purchase" ? C.error : C.success }]}>
                {item.type === "purchase" ? "-" : "+"}{item.credits}
              </Text>
              <Ionicons name="leaf" size={11} color={item.type === "purchase" ? C.error : C.success} />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="activity" size={48} color={C.sageMist} />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>Your swap history will appear here after your first claim.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text, letterSpacing: -0.5 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.tint, letterSpacing: -0.5 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecondary, textAlign: "center" },
  listContent: { paddingHorizontal: 24, paddingTop: 8 },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  txIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  txContent: { flex: 1 },
  txTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  txMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, marginTop: 2 },
  txAmount: { flexDirection: "row", alignItems: "center", gap: 3 },
  txAmountText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, textAlign: "center", lineHeight: 21 },
});
