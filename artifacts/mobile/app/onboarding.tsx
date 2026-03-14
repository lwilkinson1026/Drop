import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { User, useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");
const C = Colors.light;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setUser } = useApp();
  const [step, setStep] = useState<"welcome" | "name" | "role">("welcome");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"maker" | "buyer" | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (next: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      next();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleContinue = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === "welcome") {
      animateTransition(() => setStep("name"));
    } else if (step === "name" && name.trim()) {
      animateTransition(() => setStep("role"));
    } else if (step === "role" && role) {
      const newUser: User = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        role,
        creditBalance: 20,
      };
      await setUser(newUser);
      router.replace("/(tabs)");
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <LinearGradient
      colors={[C.accent, C.accentMid, "#1A3518"]}
      style={styles.container}
    >
      <View style={[styles.inner, { paddingTop: topPad + 20, paddingBottom: insets.bottom + 40 }]}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
          {step === "welcome" && <WelcomeStep />}
          {step === "name" && <NameStep name={name} onChangeName={setName} />}
          {step === "role" && <RoleStep role={role} onSelectRole={setRole} />}
        </Animated.View>

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueBtn,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            (step === "name" && !name.trim()) || (step === "role" && !role)
              ? styles.continueBtnDisabled
              : {},
          ]}
          disabled={(step === "name" && !name.trim()) || (step === "role" && !role)}
        >
          <LinearGradient
            colors={[C.tintLight, C.tint]}
            style={styles.continueBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.continueBtnText}>
              {step === "role" ? "Enter the swap" : "Continue"}
            </Text>
            <Feather name="arrow-right" size={18} color={C.white} />
          </LinearGradient>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function WelcomeStep() {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.logoCircle}>
        <Ionicons name="leaf" size={52} color={Colors.light.tint} />
      </View>
      <Text style={styles.appName}>HarvestSwap</Text>
      <Text style={styles.tagline}>A rural food-swap network. Fresh from the farm, straight to your hands.</Text>
      <View style={styles.featureList}>
        {[
          { icon: "camera" as const, text: "Post surplus produce with photos" },
          { icon: "map-pin" as const, text: "Find local swap boxes on the map" },
          { icon: "zap" as const, text: "Unlock boxes with a QR scan" },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name={f.icon} size={16} color={Colors.light.tint} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function NameStep({ name, onChangeName }: { name: string; onChangeName: (v: string) => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your name?</Text>
      <Text style={styles.stepSubtitle}>Your neighbors will know you by this.</Text>
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={onChangeName}
        placeholder="e.g. Rose Valley Farm"
        placeholderTextColor="rgba(255,255,255,0.35)"
        autoFocus
        returnKeyType="done"
        maxLength={40}
      />
    </View>
  );
}

function RoleStep({
  role,
  onSelectRole,
}: {
  role: "maker" | "buyer" | null;
  onSelectRole: (r: "maker" | "buyer") => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How will you join?</Text>
      <Text style={styles.stepSubtitle}>You can always switch later in your profile.</Text>
      <View style={styles.roleOptions}>
        {(["maker", "buyer"] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => { Haptics.selectionAsync(); onSelectRole(r); }}
            style={({ pressed }) => [
              styles.roleCard,
              role === r && styles.roleCardSelected,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.roleIconWrap}>
              <Ionicons
                name={r === "maker" ? "basket" : "search"}
                size={32}
                color={role === r ? Colors.light.tint : "rgba(255,255,255,0.7)"}
              />
            </View>
            <Text style={[styles.roleTitle, role === r && styles.roleTitleSelected]}>
              {r === "maker" ? "Maker" : "Buyer"}
            </Text>
            <Text style={styles.roleDesc}>
              {r === "maker"
                ? "Post surplus food, set locations & earn credits"
                : "Discover local produce, claim boxes & swap credits"}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  stepContainer: { flex: 1, justifyContent: "center" },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    alignSelf: "center",
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 14,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  featureList: { gap: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "rgba(255,255,255,0.82)",
    flex: 1,
  },
  stepTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  stepSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 36,
  },
  nameInput: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roleOptions: { gap: 14 },
  roleCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  roleCardSelected: {
    backgroundColor: "rgba(212,130,42,0.18)",
    borderColor: Colors.light.tint,
  },
  roleIconWrap: { marginBottom: 14 },
  roleTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 6,
  },
  roleTitleSelected: { color: Colors.light.tintLight },
  roleDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 20,
  },
  continueBtn: { marginTop: 24 },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  continueBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
