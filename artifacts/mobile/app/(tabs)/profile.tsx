import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
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
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/services/authService";
import { isFirebaseConfigured } from "@/services/firebase";

const C = Colors.light;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, setUser, listings } = useApp();
  const { authUser, isAdmin, isFirebaseReady } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const myListings = listings.filter((l) => l.makerId === user?.id);

  const handleRoleSwitch = () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUser({ ...user, role: user.role === "maker" ? "buyer" : "maker" });
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const doSignOut = async () => {
      if (isFirebaseReady) await signOut();
      await setUser(null);
      router.replace(isFirebaseReady ? "/sign-in" : "/onboarding");
    };
    if (Platform.OS === "web") {
      doSignOut();
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: doSignOut },
      ]);
    }
  };

  if (!user) return null;

  const providerIcon = authUser?.provider === "google" ? "G" : authUser?.provider === "twitter" ? "𝕏" : null;
  const providerLabel = authUser?.provider === "google" ? "Google" : authUser?.provider === "twitter" ? "X" : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: 120 + bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[C.accent, C.accentMid]}
        style={styles.profileBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {authUser?.photoURL ? (
          <Image source={{ uri: authUser.photoURL }} style={styles.avatarPhoto} contentFit="cover" />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.profileName}>{user.name}</Text>
        {authUser?.email && (
          <View style={styles.emailRow}>
            {providerLabel && (
              <View style={styles.providerBadge}>
                <Text style={styles.providerIcon}>{providerIcon}</Text>
                <Text style={styles.providerText}>{providerLabel}</Text>
              </View>
            )}
            <Text style={styles.emailText} numberOfLines={1}>{authUser.email}</Text>
          </View>
        )}
        <View style={styles.roleBadgeRow}>
          <View style={styles.roleBadge}>
            <Ionicons name={user.role === "maker" ? "basket" : "search"} size={13} color={C.tintLight} />
            <Text style={styles.roleText}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
          </View>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Feather name="shield" size={12} color={C.tint} />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
        {user.city && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.55)" />
            <Text style={styles.locationText}>{user.city}, {user.state}</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <View style={styles.statIconWrap}>
            <Ionicons name="leaf" size={20} color={C.tint} />
          </View>
          <Text style={styles.statNum}>{user.creditBalance}</Text>
          <Text style={styles.statLbl}>Credits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <View style={styles.statIconWrap}>
            <Feather name="package" size={20} color={C.accent} />
          </View>
          <Text style={styles.statNum}>{myListings.length}</Text>
          <Text style={styles.statLbl}>Listings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <View style={styles.statIconWrap}>
            <Feather name="users" size={20} color={C.barkLight} />
          </View>
          <Text style={styles.statNum}>1</Text>
          <Text style={styles.statLbl}>Community</Text>
        </View>
      </View>

      {user.makerBio ? (
        <View style={styles.bioCard}>
          <Ionicons name="leaf-outline" size={16} color={C.tint} />
          <Text style={styles.bioText}>{user.makerBio}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <Pressable
          onPress={handleRoleSwitch}
          style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.menuIcon, { backgroundColor: C.tint + "18" }]}>
            <Ionicons name={user.role === "maker" ? "search" : "basket"} size={18} color={C.tint} />
          </View>
          <View style={styles.menuLabel}>
            <Text style={styles.menuTitle}>Switch to {user.role === "maker" ? "Buyer" : "Maker"}</Text>
            <Text style={styles.menuSubtitle}>
              {user.role === "maker" ? "Browse and claim listings" : "Post your surplus produce"}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={C.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => { Haptics.selectionAsync(); Alert.alert("Credits", "You start with 20 credits. Earn more by posting and having items claimed."); }}
          style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.menuIcon, { backgroundColor: C.tint + "18" }]}>
            <Ionicons name="leaf" size={18} color={C.tint} />
          </View>
          <View style={styles.menuLabel}>
            <Text style={styles.menuTitle}>Credit Balance</Text>
            <Text style={styles.menuSubtitle}>{user.creditBalance} credits available</Text>
          </View>
          <View style={styles.creditPill}>
            <Text style={styles.creditPillText}>{user.creditBalance}</Text>
          </View>
        </Pressable>
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administration</Text>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/admin"); }}
            style={({ pressed }) => [styles.menuItem, styles.adminMenuItem, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={[styles.menuIcon, { backgroundColor: C.tint + "18" }]}>
              <Feather name="shield" size={18} color={C.tint} />
            </View>
            <View style={styles.menuLabel}>
              <Text style={styles.menuTitle}>Admin Panel</Text>
              <Text style={styles.menuSubtitle}>Manage drop box locations</Text>
            </View>
            <Feather name="chevron-right" size={16} color={C.textMuted} />
          </Pressable>
        </View>
      )}

      {myListings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Listings ({myListings.length})</Text>
          {myListings.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: "/listing/[id]", params: { id: l.id } }); }}
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.menuIcon, { backgroundColor: l.available ? C.success + "18" : C.textMuted + "28" }]}>
                <Feather name="package" size={18} color={l.available ? C.success : C.textMuted} />
              </View>
              <View style={styles.menuLabel}>
                <Text style={styles.menuTitle} numberOfLines={1}>{l.title}</Text>
                <Text style={styles.menuSubtitle}>{l.quantity} {l.unit} · {l.available ? "Available" : "Claimed"}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textMuted} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More</Text>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); Alert.alert("About HarvestSwap", "A rural food-swap network connecting makers and buyers in your community.\n\nVersion 1.0 · Yakima, WA"); }}
          style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.menuIcon, { backgroundColor: C.accent + "18" }]}>
            <Ionicons name="information-circle" size={18} color={C.accent} />
          </View>
          <View style={styles.menuLabel}>
            <Text style={styles.menuTitle}>About HarvestSwap</Text>
            <Text style={styles.menuSubtitle}>Version 1.0 · Yakima, WA</Text>
          </View>
          <Feather name="chevron-right" size={16} color={C.textMuted} />
        </Pressable>

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.menuIcon, { backgroundColor: C.error + "18" }]}>
            <Feather name="log-out" size={18} color={C.error} />
          </View>
          <View style={styles.menuLabel}>
            <Text style={[styles.menuTitle, { color: C.error }]}>Sign Out</Text>
            {isFirebaseReady && authUser && (
              <Text style={styles.menuSubtitle}>Signed in via {providerLabel ?? "auth"}</Text>
            )}
          </View>
          <Feather name="chevron-right" size={16} color={C.textMuted} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20 },
  profileBanner: { borderRadius: 24, padding: 28, alignItems: "center", marginBottom: 16, gap: 8 },
  avatarPhoto: { width: 72, height: 72, borderRadius: 36, marginBottom: 4 },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarInitial: { fontFamily: "Inter_700Bold", fontSize: 30, color: "#fff" },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff", letterSpacing: -0.3 },
  emailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  providerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  providerIcon: { fontSize: 11, color: "#fff", lineHeight: 14 },
  providerText: { fontFamily: "Inter_500Medium", fontSize: 11, color: "rgba(255,255,255,0.9)" },
  emailText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.65)" },
  roleBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleText: { fontFamily: "Inter_500Medium", fontSize: 13, color: "rgba(255,255,255,0.9)" },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(212,130,42,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,130,42,0.4)",
  },
  adminBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.tint },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.55)" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: C.bark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  statBlock: { flex: 1, alignItems: "center", gap: 4 },
  statIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.creamDark, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  statNum: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, letterSpacing: -0.5 },
  statLbl: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary },
  statDivider: { width: 1, backgroundColor: C.cardBorder, marginHorizontal: 8 },
  bioCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  bioText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  adminMenuItem: { borderColor: C.tint + "35" },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1 },
  menuTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.text },
  menuSubtitle: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, marginTop: 2 },
  creditPill: { backgroundColor: C.tint + "18", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  creditPillText: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.tint },
});
