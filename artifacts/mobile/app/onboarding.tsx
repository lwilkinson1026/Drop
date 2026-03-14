import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
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
import { DropLocation } from "@/constants/dropLocations";
import { User, useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");
const C = Colors.light;

type Step =
  | "welcome"
  | "name"
  | "role"
  | "how-it-works"
  | "location"
  | "maker-profile"
  | "maker-photo"
  | "maker-drop-location"
  | "all-done";

const MAKER_SLIDES = [
  {
    icon: "camera-outline" as const,
    iconLib: "Ionicons",
    color: "#C8892A",
    title: "Snap & Post",
    body: "Got extra tomatoes? Surplus eggs? Take a photo, write a quick note, and post your item. It takes under a minute.",
  },
  {
    icon: "map-marker-check-outline" as const,
    iconLib: "MaterialCommunityIcons",
    color: C.tint,
    title: "Drop it at a Swap Box",
    body: "Choose a community swap box near you. Drop off your produce and others in the neighborhood can claim it using credits.",
  },
  {
    icon: "leaf-outline" as const,
    iconLib: "Ionicons",
    color: "#6B9E55",
    title: "Earn & Swap",
    body: "Every item you drop earns you credits. Spend them on fresh food from your neighbors. It's a living, breathing local economy.",
  },
];

const BUYER_SLIDES = [
  {
    icon: "map-outline" as const,
    iconLib: "Ionicons",
    color: C.tint,
    title: "Find What's Fresh",
    body: "Browse the map or list view to see what local makers have posted. New items show up throughout the day — check back often.",
  },
  {
    icon: "storefront-outline" as const,
    iconLib: "Ionicons",
    color: "#C8892A",
    title: "Claim with Credits",
    body: "Spot something you want? Claim it with your credits. You start with 20 free credits, and earn more by trading with the community.",
  },
  {
    icon: "qr-code-outline" as const,
    iconLib: "Ionicons",
    color: "#6B9E55",
    title: "Scan & Pick Up",
    body: "Head to the swap box, tap Unlock, and scan your QR code to open the box. Fresh local food — no checkout, no packaging.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setUser, dropLocations } = useApp();

  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"maker" | "buyer" | null>(null);
  const [howItWorksSlide, setHowItWorksSlide] = useState(0);
  const [makerBio, setMakerBio] = useState("");
  const [makerPhotoUri, setMakerPhotoUri] = useState<string | null>(null);
  const [selectedDropLocation, setSelectedDropLocation] = useState<DropLocation | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const transition = (next: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -24, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      next();
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const slides = role === "maker" ? MAKER_SLIDES : BUYER_SLIDES;
  const isLastSlide = howItWorksSlide === slides.length - 1;

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step === "welcome") {
      transition(() => setStep("name"));
    } else if (step === "name" && name.trim()) {
      transition(() => setStep("role"));
    } else if (step === "role" && role) {
      transition(() => { setHowItWorksSlide(0); setStep("how-it-works"); });
    } else if (step === "how-it-works") {
      if (!isLastSlide) {
        transition(() => setHowItWorksSlide((s) => s + 1));
      } else {
        transition(() => setStep("location"));
      }
    } else if (step === "location") {
      if (role === "maker") {
        transition(() => setStep("maker-profile"));
      } else {
        transition(() => setStep("all-done"));
      }
    } else if (step === "maker-profile") {
      transition(() => setStep("maker-photo"));
    } else if (step === "maker-photo") {
      transition(() => setStep("maker-drop-location"));
    } else if (step === "maker-drop-location" && selectedDropLocation) {
      transition(() => setStep("all-done"));
    } else if (step === "all-done") {
      const newUser: User = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        role: role!,
        creditBalance: 20,
        city: "Yakima",
        state: "WA",
        makerBio: makerBio.trim() || undefined,
        makerPhotoUri: makerPhotoUri || undefined,
        defaultDropLocationId: selectedDropLocation?.id,
      };
      await setUser(newUser);
      router.replace("/(tabs)");
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "name") transition(() => setStep("welcome"));
    else if (step === "role") transition(() => setStep("name"));
    else if (step === "how-it-works") {
      if (howItWorksSlide > 0) transition(() => setHowItWorksSlide((s) => s - 1));
      else transition(() => setStep("role"));
    }
    else if (step === "location") transition(() => { setHowItWorksSlide(slides.length - 1); setStep("how-it-works"); });
    else if (step === "maker-profile") transition(() => setStep("location"));
    else if (step === "maker-photo") transition(() => setStep("maker-profile"));
    else if (step === "maker-drop-location") transition(() => setStep("maker-photo"));
    else if (step === "all-done") {
      if (role === "maker") transition(() => setStep("maker-drop-location"));
      else transition(() => setStep("location"));
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setMakerPhotoUri(result.assets[0].uri);
    }
  };

  const canContinue = () => {
    if (step === "name") return name.trim().length > 0;
    if (step === "role") return role !== null;
    if (step === "maker-drop-location") return selectedDropLocation !== null;
    return true;
  };

  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const showBack = step !== "welcome" && step !== "all-done";

  return (
    <LinearGradient colors={[C.accent, C.accentMid, "#1A3518"]} style={styles.container}>
      {showBack && (
        <Pressable
          onPress={handleBack}
          style={[styles.backBtn, { top: topPad + 8 }]}
          hitSlop={12}
        >
          <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.75)" />
        </Pressable>
      )}

      <View style={[styles.inner, { paddingTop: topPad + 52, paddingBottom: insets.bottom + 32 }]}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
          {step === "welcome" && <WelcomeStep />}
          {step === "name" && <NameStep name={name} onChange={setName} />}
          {step === "role" && <RoleStep role={role} onSelect={setRole} />}
          {step === "how-it-works" && (
            <HowItWorksStep
              slides={slides}
              currentSlide={howItWorksSlide}
              role={role!}
            />
          )}
          {step === "location" && <LocationStep />}
          {step === "maker-profile" && <MakerProfileStep bio={makerBio} onChangeBio={setMakerBio} name={name} />}
          {step === "maker-photo" && (
            <MakerPhotoStep photoUri={makerPhotoUri} onPick={pickPhoto} onSkip={() => transition(() => setStep("maker-drop-location"))} />
          )}
          {step === "maker-drop-location" && (
            <MakerDropLocationStep
              selected={selectedDropLocation}
              onSelect={setSelectedDropLocation}
              locations={dropLocations}
            />
          )}
          {step === "all-done" && <AllDoneStep role={role!} name={name} />}
        </Animated.View>

        {step !== "maker-photo" && (
          <Pressable
            onPress={handleContinue}
            disabled={!canContinue()}
            style={({ pressed }) => [
              styles.btn,
              { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
              !canContinue() && styles.btnDisabled,
            ]}
          >
            <LinearGradient
              colors={[C.tintLight, C.tint]}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.btnText}>
                {step === "welcome" ? "Get started" :
                 step === "how-it-works" ? (isLastSlide ? "Let's go" : "Next") :
                 step === "all-done" ? "Enter HarvestSwap" :
                 step === "maker-drop-location" ? "Confirm my location" :
                 "Continue"}
              </Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </LinearGradient>
          </Pressable>
        )}

        {step === "how-it-works" && (
          <View style={styles.dotsRow}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === howItWorksSlide && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

function WelcomeStep() {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.logoCircle}>
        <Ionicons name="leaf" size={52} color={C.tint} />
      </View>
      <Text style={styles.appName}>HarvestSwap</Text>
      <Text style={styles.tagline}>A rural food-swap network. Fresh from the farm, straight to your hands.</Text>
      <View style={styles.featureList}>
        {[
          { icon: "camera" as const, text: "Post surplus produce with photos" },
          { icon: "map-pin" as const, text: "Find community swap boxes nearby" },
          { icon: "zap" as const, text: "Unlock boxes with a QR scan" },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name={f.icon} size={16} color={C.tint} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function NameStep({ name, onChange }: { name: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepIconCircle}>
        <Ionicons name="person-outline" size={30} color="rgba(255,255,255,0.8)" />
      </View>
      <Text style={styles.stepTitle}>What's your name?</Text>
      <Text style={styles.stepSubtitle}>Your neighbors will know you by this in the marketplace.</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={onChange}
        placeholder="e.g. Rose Valley Farm"
        placeholderTextColor="rgba(255,255,255,0.35)"
        autoFocus
        returnKeyType="done"
        maxLength={40}
      />
    </View>
  );
}

function RoleStep({ role, onSelect }: { role: "maker" | "buyer" | null; onSelect: (r: "maker" | "buyer") => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How will you join?</Text>
      <Text style={styles.stepSubtitle}>You can always switch later in your profile.</Text>
      <View style={styles.roleRow}>
        {(["maker", "buyer"] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => { Haptics.selectionAsync(); onSelect(r); }}
            style={({ pressed }) => [
              styles.roleCard,
              role === r && styles.roleCardSelected,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.roleIconWrap}>
              <Ionicons
                name={r === "maker" ? "basket-outline" : "search-outline"}
                size={34}
                color={role === r ? C.tint : "rgba(255,255,255,0.65)"}
              />
            </View>
            <Text style={[styles.roleTitle, role === r && styles.roleTitleSelected]}>
              {r === "maker" ? "Maker" : "Buyer"}
            </Text>
            <Text style={styles.roleDesc}>
              {r === "maker"
                ? "Post surplus food, set box locations & earn credits"
                : "Discover local produce, claim boxes & spend credits"}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function HowItWorksStep({ slides, currentSlide, role }: {
  slides: typeof MAKER_SLIDES;
  currentSlide: number;
  role: "maker" | "buyer";
}) {
  const slide = slides[currentSlide];
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.howLabel}>
        {role === "maker" ? "How Makers work" : "How Buyers work"}
      </Text>
      <View style={styles.howIconCircle}>
        {slide.iconLib === "Ionicons" ? (
          <Ionicons name={slide.icon as any} size={48} color={slide.color} />
        ) : (
          <MaterialCommunityIcons name={slide.icon as any} size={48} color={slide.color} />
        )}
      </View>
      <Text style={styles.howTitle}>{slide.title}</Text>
      <Text style={styles.howBody}>{slide.body}</Text>
    </View>
  );
}

function LocationStep() {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepIconCircle}>
        <Ionicons name="location-outline" size={30} color="rgba(255,255,255,0.8)" />
      </View>
      <Text style={styles.stepTitle}>Your community</Text>
      <Text style={styles.stepSubtitle}>HarvestSwap is live in Yakima, WA. More cities coming soon.</Text>
      <View style={styles.cityCard}>
        <View style={styles.cityCardLeft}>
          <Ionicons name="leaf" size={20} color={C.tint} />
          <View>
            <Text style={styles.cityName}>Yakima, WA</Text>
            <Text style={styles.cityMeta}>Apple Capital of the World · Active community</Text>
          </View>
        </View>
        <View style={styles.citySelected}>
          <Feather name="check" size={16} color="#fff" />
        </View>
      </View>
      <View style={styles.comingSoonBox}>
        <Feather name="map" size={14} color="rgba(255,255,255,0.5)" />
        <Text style={styles.comingSoonText}>More cities launching soon — invite your neighbors to grow HarvestSwap!</Text>
      </View>
    </View>
  );
}

function MakerProfileStep({ bio, onChangeBio, name }: { bio: string; onChangeBio: (v: string) => void; name: string }) {
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={[styles.stepContainer, { paddingBottom: 24 }]}>
        <View style={styles.stepIconCircle}>
          <Ionicons name="storefront-outline" size={30} color="rgba(255,255,255,0.8)" />
        </View>
        <Text style={styles.stepTitle}>Tell your story</Text>
        <Text style={styles.stepSubtitle}>Buyers love knowing who they're swapping with. Add a line or two about your farm or garden.</Text>
        <Text style={styles.inputLabel}>Your maker name</Text>
        <View style={styles.readOnlyInput}>
          <Text style={styles.readOnlyText}>{name}</Text>
        </View>
        <Text style={[styles.inputLabel, { marginTop: 20 }]}>Short bio <Text style={styles.optionalTag}>(optional)</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={onChangeBio}
          placeholder="e.g. Small family farm in the Yakima valley. We grow heirloom tomatoes and raise Khaki Campbell ducks."
          placeholderTextColor="rgba(255,255,255,0.35)"
          multiline
          numberOfLines={4}
          maxLength={200}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{bio.length}/200</Text>
      </View>
    </ScrollView>
  );
}

function MakerPhotoStep({
  photoUri,
  onPick,
  onSkip,
}: {
  photoUri: string | null;
  onPick: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={[styles.stepContainer, { flex: 1 }]}>
      <View style={styles.stepIconCircle}>
        <Ionicons name="camera-outline" size={30} color="rgba(255,255,255,0.8)" />
      </View>
      <Text style={styles.stepTitle}>Add a profile photo</Text>
      <Text style={styles.stepSubtitle}>A face or farm photo helps buyers trust you. Totally optional.</Text>
      <Pressable onPress={onPick} style={({ pressed }) => [styles.photoPickerArea, { opacity: pressed ? 0.88 : 1 }]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={44} color="rgba(255,255,255,0.4)" />
            <Text style={styles.photoPlaceholderText}>Tap to choose a photo</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.photoActions}>
        <Pressable
          onPress={onPick}
          style={({ pressed }) => [styles.photoBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient colors={[C.tintLight, C.tint]} style={styles.photoBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={styles.photoBtnText}>{photoUri ? "Change photo" : "Choose photo"}</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>{photoUri ? "Continue with this photo" : "Skip for now"}</Text>
          <Feather name="arrow-right" size={14} color="rgba(255,255,255,0.55)" />
        </Pressable>
      </View>
    </View>
  );
}

function MakerDropLocationStep({
  selected,
  onSelect,
  locations,
}: {
  selected: DropLocation | null;
  onSelect: (loc: DropLocation) => void;
  locations: DropLocation[];
}) {
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.stepContainer, { paddingBottom: 24 }]}>
        <View style={styles.stepIconCircle}>
          <Ionicons name="cube-outline" size={30} color="rgba(255,255,255,0.8)" />
        </View>
        <Text style={styles.stepTitle}>Choose your drop box</Text>
        <Text style={styles.stepSubtitle}>Select the community swap box where you'll drop off your produce.</Text>
        {locations.map((loc) => (
          <Pressable
            key={loc.id}
            onPress={() => { Haptics.selectionAsync(); onSelect(loc); }}
            style={({ pressed }) => [
              styles.dropLocCard,
              selected?.id === loc.id && styles.dropLocCardSelected,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.dropLocHeader}>
              <View style={styles.dropLocIconWrap}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={22}
                  color={selected?.id === loc.id ? C.tint : "rgba(255,255,255,0.65)"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dropLocName, selected?.id === loc.id && styles.dropLocNameSelected]}>
                  {loc.name}
                </Text>
                <Text style={styles.dropLocAddr}>{loc.address}, {loc.city} {loc.state}</Text>
              </View>
              {selected?.id === loc.id && (
                <View style={styles.dropLocCheck}>
                  <Feather name="check" size={14} color="#fff" />
                </View>
              )}
            </View>
            <Text style={styles.dropLocDesc}>{loc.description}</Text>
          </Pressable>
        ))}
        <View style={styles.moreLocNote}>
          <Feather name="plus-circle" size={13} color="rgba(255,255,255,0.4)" />
          <Text style={styles.moreLocText}>More drop locations will be added as the community grows.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function AllDoneStep({ role, name }: { role: "maker" | "buyer"; name: string }) {
  return (
    <View style={styles.stepContainer}>
      <View style={[styles.logoCircle, { backgroundColor: "rgba(212,130,42,0.2)" }]}>
        <Ionicons name="checkmark-circle" size={56} color={C.tint} />
      </View>
      <Text style={styles.appName}>You're all set!</Text>
      <Text style={styles.tagline}>
        {role === "maker"
          ? `Welcome to HarvestSwap, ${name.split(" ")[0]}! Your swap box is ready. Start posting your first harvest.`
          : `Welcome to HarvestSwap, ${name.split(" ")[0]}! You have 20 credits to start exploring fresh local produce.`}
      </Text>
      <View style={styles.featureList}>
        {(role === "maker"
          ? [
              { icon: "camera" as const, text: "Post your first harvest from the Post tab" },
              { icon: "map-pin" as const, text: "Drop produce at Lynch Lane swap box" },
              { icon: "dollar-sign" as const, text: "Earn credits when buyers claim your items" },
            ]
          : [
              { icon: "map" as const, text: "Explore the map to find nearby boxes" },
              { icon: "package" as const, text: "Claim fresh produce with your 20 credits" },
              { icon: "zap" as const, text: "Unlock boxes with your QR code" },
            ]
        ).map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name={f.icon} size={16} color={C.tint} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  backBtn: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
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
  stepIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    alignSelf: "flex-start",
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 14,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    lineHeight: 25,
    marginBottom: 44,
    paddingHorizontal: 8,
  },
  featureList: { gap: 14 },
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
    fontSize: 28,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  stepSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.62)",
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  textArea: {
    minHeight: 110,
    paddingTop: 14,
  },
  inputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.3,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  optionalTag: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.38)",
    textTransform: "none",
  },
  charCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    textAlign: "right",
    marginTop: 6,
  },
  readOnlyInput: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  readOnlyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    color: "rgba(255,255,255,0.55)",
  },
  roleRow: { gap: 14 },
  roleCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
  },
  roleCardSelected: {
    backgroundColor: "rgba(212,130,42,0.16)",
    borderColor: C.tint,
  },
  roleIconWrap: { marginBottom: 14 },
  roleTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "rgba(255,255,255,0.88)",
    marginBottom: 6,
  },
  roleTitleSelected: { color: C.tintLight },
  roleDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 20,
  },
  howLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 32,
  },
  howIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  howTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 16,
    textAlign: "center",
  },
  howBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.68)",
    lineHeight: 26,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  cityCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.tint,
    marginBottom: 16,
  },
  cityCardLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  cityName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#fff",
    marginBottom: 3,
  },
  cityMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  citySelected: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  comingSoonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    flex: 1,
    lineHeight: 19,
  },
  photoPickerArea: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: 28,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  photoPlaceholderText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
  },
  photoActions: { gap: 14, alignItems: "center" },
  photoBtn: { width: "100%" },
  photoBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  photoBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
  },
  dropLocCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 12,
  },
  dropLocCardSelected: {
    backgroundColor: "rgba(212,130,42,0.15)",
    borderColor: C.tint,
  },
  dropLocHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  dropLocIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dropLocName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "rgba(255,255,255,0.88)",
    marginBottom: 3,
  },
  dropLocNameSelected: { color: C.tintLight },
  dropLocAddr: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  dropLocCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dropLocDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 19,
  },
  moreLocNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  moreLocText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.38)",
    flex: 1,
    lineHeight: 17,
  },
  btn: { marginTop: 16 },
  btnDisabled: { opacity: 0.38 },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  btnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: {
    backgroundColor: C.tint,
    width: 20,
    borderRadius: 4,
  },
});
