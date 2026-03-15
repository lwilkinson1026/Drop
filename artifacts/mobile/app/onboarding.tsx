import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
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

import { DropLocation } from "@/constants/dropLocations";
import { User, useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

const BG = "#0C1A0B";
const AMBER = "#D4822A";
const AMBER_LIGHT = "#E8A855";
const CREAM = "#F7F2EA";
const WHITE = "#FFFFFF";
const DIM = "rgba(255,255,255,0.42)";
const DIM2 = "rgba(255,255,255,0.22)";
const DIM3 = "rgba(255,255,255,0.08)";
const BORDER = "rgba(255,255,255,0.12)";

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

const STEP_ORDER: Step[] = [
  "welcome",
  "name",
  "role",
  "how-it-works",
  "location",
  "maker-profile",
  "maker-photo",
  "maker-drop-location",
  "all-done",
];

const MAKER_SLIDES = [
  {
    icon: "camera-outline" as const,
    iconLib: "Ionicons",
    num: "01",
    title: "Snap & Post",
    body: "Got extra tomatoes? Surplus eggs? Take a photo, write a quick note, and post your item. It takes under a minute.",
  },
  {
    icon: "map-marker-check-outline" as const,
    iconLib: "MaterialCommunityIcons",
    num: "02",
    title: "Drop at a Swap Box",
    body: "Choose a community swap box near you. Drop off your produce and neighbors can claim it with credits.",
  },
  {
    icon: "leaf-outline" as const,
    iconLib: "Ionicons",
    num: "03",
    title: "Earn & Swap",
    body: "Every item you drop earns you credits. Spend them on fresh food from your neighbors — a living local economy.",
  },
];

const BUYER_SLIDES = [
  {
    icon: "map-outline" as const,
    iconLib: "Ionicons",
    num: "01",
    title: "Find What's Fresh",
    body: "Browse the map or list to see what local makers have posted. New items appear throughout the day.",
  },
  {
    icon: "storefront-outline" as const,
    iconLib: "Ionicons",
    num: "02",
    title: "Claim with Credits",
    body: "Spot something you want? Claim it with credits. You start with 20 free, and earn more by trading with the community.",
  },
  {
    icon: "qr-code-outline" as const,
    iconLib: "Ionicons",
    num: "03",
    title: "Scan & Pick Up",
    body: "Head to the swap box, scan the QR code to unlock it. Fresh local food — no checkout, no packaging.",
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
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      next();
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const slides = role === "maker" ? MAKER_SLIDES : BUYER_SLIDES;
  const isLastSlide = howItWorksSlide === slides.length - 1;

  const stepIndex = STEP_ORDER.indexOf(step);
  const totalSteps = role === "maker" ? STEP_ORDER.length : STEP_ORDER.length - 3;
  const progressPct = Math.max(0, Math.min(1, stepIndex / (STEP_ORDER.length - 1)));

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
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const showBack = step !== "welcome" && step !== "all-done";

  const btnLabel =
    step === "welcome" ? "Get started" :
    step === "how-it-works" ? (isLastSlide ? "Let's go" : "Next") :
    step === "all-done" ? "Enter Drop" :
    step === "maker-drop-location" ? "Confirm location" :
    "Continue";

  return (
    <View style={[styles.container, { backgroundColor: BG }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
        {showBack ? (
          <Pressable onPress={handleBack} hitSlop={16} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={WHITE} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}

        {step !== "welcome" && step !== "all-done" && (
          <Text style={styles.stepCounter}>
            {step === "how-it-works" ? `${howItWorksSlide + 1} / ${slides.length}` : ""}
          </Text>
        )}

        <View style={styles.topBarRight} />
      </View>

      {/* Progress bar */}
      {step !== "welcome" && step !== "all-done" && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
        </View>
      )}

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {step === "welcome" && <WelcomeStep topPad={topPad} />}
        {step === "name" && <NameStep name={name} onChange={setName} />}
        {step === "role" && <RoleStep role={role} onSelect={setRole} />}
        {step === "how-it-works" && (
          <HowItWorksStep slides={slides} currentSlide={howItWorksSlide} role={role!} />
        )}
        {step === "location" && <LocationStep />}
        {step === "maker-profile" && (
          <MakerProfileStep bio={makerBio} onChangeBio={setMakerBio} name={name} />
        )}
        {step === "maker-photo" && (
          <MakerPhotoStep
            photoUri={makerPhotoUri}
            onPick={pickPhoto}
            onSkip={() => transition(() => setStep("maker-drop-location"))}
            onContinue={() => transition(() => setStep("maker-drop-location"))}
          />
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

      {/* CTA */}
      {step !== "maker-photo" && (
        <View style={[styles.footer, { paddingBottom: bottomPad + 24 }]}>
          <Pressable
            onPress={handleContinue}
            disabled={!canContinue()}
            style={({ pressed }) => [
              styles.cta,
              !canContinue() && styles.ctaDisabled,
              { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <Text style={[styles.ctaText, !canContinue() && styles.ctaTextDisabled]}>
              {btnLabel}
            </Text>
            <Feather name="arrow-right" size={18} color={canContinue() ? BG : DIM} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function WelcomeStep({ topPad }: { topPad: number }) {
  return (
    <View style={styles.welcomeWrap}>
      <View style={styles.welcomeTop}>
        <Text style={styles.welcomeEyebrow}>Live Kindred</Text>
        <Text style={styles.welcomeWordmark}>Drop.</Text>
        <Text style={styles.welcomeSub}>
          A rural food-swap network.{"\n"}Fresh from the farm, straight to your hands.
        </Text>
      </View>

      <View style={styles.welcomeFeatures}>
        {[
          { icon: "camera" as const, label: "Post surplus produce with photos" },
          { icon: "map-pin" as const, label: "Find community swap boxes nearby" },
          { icon: "zap" as const, label: "Unlock boxes with a QR scan" },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.welcomeTagline}>
        <View style={styles.amberLine} />
        <Text style={styles.welcomeCity}>Yakima, WA · Est. 2025</Text>
      </View>
    </View>
  );
}

function NameStep({ name, onChange }: { name: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepEyebrow}>Let's get started</Text>
      <Text style={styles.stepHeadline}>What's your{"\n"}name?</Text>
      <Text style={styles.stepBody}>
        Your neighbors will know you by this in the marketplace.
      </Text>
      <View style={styles.underlineField}>
        <TextInput
          style={styles.underlineInput}
          value={name}
          onChangeText={onChange}
          placeholder="e.g. Rose Valley Farm"
          placeholderTextColor={DIM2}
          autoFocus
          returnKeyType="done"
          maxLength={40}
          selectionColor={AMBER}
        />
        <View style={[styles.underlineLine, name.trim().length > 0 && styles.underlineLineActive]} />
      </View>
    </View>
  );
}

function RoleStep({ role, onSelect }: { role: "maker" | "buyer" | null; onSelect: (r: "maker" | "buyer") => void }) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepEyebrow}>Your identity</Text>
      <Text style={styles.stepHeadline}>How will{"\n"}you join?</Text>
      <Text style={styles.stepBody}>You can always update this in your profile.</Text>
      <View style={styles.roleStack}>
        {(["maker", "buyer"] as const).map((r) => {
          const active = role === r;
          return (
            <Pressable
              key={r}
              onPress={() => { Haptics.selectionAsync(); onSelect(r); }}
              style={({ pressed }) => [
                styles.roleCard,
                active && styles.roleCardActive,
                { opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <View style={styles.roleCardInner}>
                <View>
                  <Text style={[styles.roleCardTitle, active && styles.roleCardTitleActive]}>
                    {r === "maker" ? "Maker" : "Buyer"}
                  </Text>
                  <Text style={styles.roleCardDesc}>
                    {r === "maker"
                      ? "Post surplus food, earn credits, serve your community"
                      : "Discover local produce, claim items, build relationships"}
                  </Text>
                </View>
                <View style={[styles.roleRadio, active && styles.roleRadioActive]}>
                  {active && <View style={styles.roleRadioDot} />}
                </View>
              </View>
            </Pressable>
          );
        })}
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
    <View style={styles.stepWrap}>
      <Text style={styles.howNum}>{slide.num}</Text>
      <View style={styles.howIconWrap}>
        {slide.iconLib === "Ionicons" ? (
          <Ionicons name={slide.icon as any} size={44} color={AMBER_LIGHT} />
        ) : (
          <MaterialCommunityIcons name={slide.icon as any} size={44} color={AMBER_LIGHT} />
        )}
      </View>
      <Text style={styles.howEyebrow}>
        {role === "maker" ? "For Makers" : "For Buyers"}
      </Text>
      <Text style={styles.howTitle}>{slide.title}</Text>
      <Text style={styles.howBody}>{slide.body}</Text>
    </View>
  );
}

function LocationStep() {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepEyebrow}>Your community</Text>
      <Text style={styles.stepHeadline}>Where you{"\n"}belong.</Text>
      <View style={styles.cityBlock}>
        <View style={styles.cityBlockLeft}>
          <Text style={styles.cityName}>Yakima, WA</Text>
          <Text style={styles.cityMeta}>Apple Capital of the World · Active community</Text>
        </View>
        <View style={styles.cityCheck}>
          <Feather name="check" size={14} color={BG} />
        </View>
      </View>
      <View style={styles.comingSoonRow}>
        <View style={styles.comingSoonDot} />
        <Text style={styles.comingSoonText}>More cities launching soon</Text>
      </View>
    </View>
  );
}

function MakerProfileStep({ bio, onChangeBio, name }: { bio: string; onChangeBio: (v: string) => void; name: string }) {
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={[styles.stepWrap, { paddingBottom: 32 }]}>
        <Text style={styles.stepEyebrow}>Your maker profile</Text>
        <Text style={styles.stepHeadline}>Tell your{"\n"}story.</Text>
        <Text style={styles.stepBody}>
          Buyers love knowing who they're swapping with. Keep it brief — a sentence or two is perfect.
        </Text>

        <Text style={styles.fieldLabel}>Name</Text>
        <View style={styles.readonlyRow}>
          <Text style={styles.readonlyText}>{name}</Text>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 32 }]}>
          Bio{"  "}<Text style={styles.fieldOptional}>optional</Text>
        </Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={onChangeBio}
          placeholder={"e.g. Small family farm in the Yakima valley. We grow heirloom tomatoes and raise Khaki Campbell ducks."}
          placeholderTextColor={DIM2}
          multiline
          numberOfLines={4}
          maxLength={200}
          textAlignVertical="top"
          selectionColor={AMBER}
        />
        <Text style={styles.charCount}>{bio.length} / 200</Text>
      </View>
    </ScrollView>
  );
}

function MakerPhotoStep({
  photoUri,
  onPick,
  onSkip,
  onContinue,
}: {
  photoUri: string | null;
  onPick: () => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.photoWrap, { paddingBottom: bottomPad + 24 }]}>
      <View style={styles.stepWrap}>
        <Text style={styles.stepEyebrow}>Profile photo</Text>
        <Text style={styles.stepHeadline}>Put a face{"\n"}to your farm.</Text>
        <Text style={styles.stepBody}>
          A photo builds trust with your buyers. Totally optional.
        </Text>
      </View>

      <Pressable onPress={onPick} style={({ pressed }) => [styles.photoCircleBtn, { opacity: pressed ? 0.85 : 1 }]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoCircleImg} contentFit="cover" />
        ) : (
          <View style={styles.photoCirclePlaceholder}>
            <Ionicons name="person-outline" size={52} color={DIM2} />
          </View>
        )}
        <View style={styles.photoCircleOverlay}>
          <Feather name="camera" size={20} color={WHITE} />
        </View>
      </Pressable>

      <View style={styles.photoFooter}>
        <Pressable
          onPress={photoUri ? onContinue : onPick}
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          <Text style={styles.ctaText}>{photoUri ? "Use this photo" : "Choose photo"}</Text>
          <Feather name="arrow-right" size={18} color={BG} />
        </Pressable>
        <Pressable onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>{photoUri ? "Remove & skip" : "Skip for now"}</Text>
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
      <View style={[styles.stepWrap, { paddingBottom: 32 }]}>
        <Text style={styles.stepEyebrow}>Drop location</Text>
        <Text style={styles.stepHeadline}>Where will{"\n"}you drop?</Text>
        <Text style={styles.stepBody}>
          Select the community swap box where you'll leave your produce.
        </Text>
        <View style={styles.locList}>
          {locations.map((loc) => {
            const active = selected?.id === loc.id;
            return (
              <Pressable
                key={loc.id}
                onPress={() => { Haptics.selectionAsync(); onSelect(loc); }}
                style={({ pressed }) => [
                  styles.locCard,
                  active && styles.locCardActive,
                  { opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <View style={styles.locCardInner}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.locName, active && styles.locNameActive]}>
                      {loc.name}
                    </Text>
                    <Text style={styles.locAddr}>
                      {loc.address}, {loc.city} {loc.state}
                    </Text>
                    {loc.description ? (
                      <Text style={styles.locDesc} numberOfLines={2}>{loc.description}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.roleRadio, active && styles.roleRadioActive]}>
                    {active && <View style={styles.roleRadioDot} />}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.comingSoonRow}>
          <View style={styles.comingSoonDot} />
          <Text style={styles.comingSoonText}>More drop locations as the community grows</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function AllDoneStep({ role, name }: { role: "maker" | "buyer"; name: string }) {
  const first = name.split(" ")[0];
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.doneEyebrow}>You're in.</Text>
      <Text style={styles.doneHeadline}>Welcome,{"\n"}{first}.</Text>
      <Text style={styles.stepBody}>
        {role === "maker"
          ? "Your swap box is ready. Start posting your first harvest whenever you're ready."
          : "You have 20 credits to start exploring fresh local produce."}
      </Text>
      <View style={styles.doneList}>
        {(role === "maker"
          ? [
              "Post your first harvest from the Post tab",
              "Drop produce at the Lynch Lane swap box",
              "Earn credits when buyers claim your items",
            ]
          : [
              "Explore the map to find nearby swap boxes",
              "Claim fresh produce with your 20 credits",
              "Unlock boxes instantly with your QR code",
            ]
        ).map((item, i) => (
          <View key={i} style={styles.doneRow}>
            <Text style={styles.doneNum}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={styles.doneItem}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backBtn: { width: 44, height: 44, justifyContent: "center" },
  stepCounter: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: DIM,
    letterSpacing: 0.5,
  },
  topBarRight: { width: 44 },

  progressTrack: {
    height: 1.5,
    backgroundColor: BORDER,
    marginHorizontal: 24,
    borderRadius: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: AMBER,
    borderRadius: 1,
  },

  content: { flex: 1, paddingHorizontal: 28 },

  footer: { paddingHorizontal: 28 },

  cta: {
    backgroundColor: CREAM,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaDisabled: { backgroundColor: "rgba(247,242,234,0.18)" },
  ctaText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: BG,
    letterSpacing: -0.2,
  },
  ctaTextDisabled: { color: DIM },

  stepWrap: { flex: 1, justifyContent: "center", paddingTop: 24 },

  stepEyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: AMBER,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  stepHeadline: {
    fontFamily: "Inter_700Bold",
    fontSize: 42,
    color: WHITE,
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: 18,
  },
  stepBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: DIM,
    lineHeight: 26,
    marginBottom: 40,
  },

  underlineField: { gap: 0 },
  underlineInput: {
    fontFamily: "Inter_500Medium",
    fontSize: 22,
    color: WHITE,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  underlineLine: {
    height: 1.5,
    backgroundColor: BORDER,
    borderRadius: 1,
  },
  underlineLineActive: { backgroundColor: AMBER },

  roleStack: { gap: 12 },
  roleCard: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 22,
    backgroundColor: DIM3,
  },
  roleCardActive: {
    borderColor: AMBER,
    backgroundColor: "rgba(212,130,42,0.08)",
  },
  roleCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  roleCardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  roleCardTitleActive: { color: WHITE },
  roleCardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: DIM2,
    lineHeight: 20,
    maxWidth: "90%",
  },
  roleRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  roleRadioActive: { borderColor: AMBER },
  roleRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AMBER,
  },

  howNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 96,
    color: "rgba(255,255,255,0.05)",
    letterSpacing: -4,
    marginBottom: -20,
    lineHeight: 96,
  },
  howIconWrap: { marginBottom: 28 },
  howEyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: AMBER,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  howTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: WHITE,
    letterSpacing: -1.2,
    marginBottom: 16,
    lineHeight: 42,
  },
  howBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: DIM,
    lineHeight: 26,
  },

  cityBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: DIM3,
    borderWidth: 1.5,
    borderColor: AMBER + "55",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cityBlockLeft: { gap: 4 },
  cityName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: WHITE,
    letterSpacing: -0.4,
  },
  cityMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: DIM,
  },
  cityCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AMBER,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  comingSoonDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BORDER },
  comingSoonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: DIM2,
  },

  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: DIM,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  fieldOptional: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: DIM2,
    textTransform: "none",
    letterSpacing: 0,
  },
  readonlyRow: {
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
    paddingBottom: 12,
  },
  readonlyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: -0.3,
  },
  bioInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 16,
    minHeight: 120,
    backgroundColor: DIM3,
    lineHeight: 24,
  },
  charCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: DIM2,
    textAlign: "right",
    marginTop: 8,
  },

  photoWrap: { flex: 1, paddingHorizontal: 28 },
  photoCircleBtn: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 40,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: BORDER,
    position: "relative",
  },
  photoCircleImg: { width: "100%", height: "100%" },
  photoCirclePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: DIM3,
    alignItems: "center",
    justifyContent: "center",
  },
  photoCircleOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoFooter: { gap: 14 },
  skipBtn: { alignItems: "center", paddingVertical: 10 },
  skipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: DIM,
  },

  locList: { gap: 12, marginBottom: 20 },
  locCard: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 18,
    backgroundColor: DIM3,
  },
  locCardActive: {
    borderColor: AMBER,
    backgroundColor: "rgba(212,130,42,0.08)",
  },
  locCardInner: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  locName: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  locNameActive: { color: WHITE },
  locAddr: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: DIM,
    marginBottom: 6,
  },
  locDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: DIM2,
    lineHeight: 19,
  },

  welcomeWrap: { flex: 1, justifyContent: "space-between", paddingTop: 32, paddingBottom: 24 },
  welcomeTop: { gap: 0 },
  welcomeEyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: AMBER,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  welcomeWordmark: {
    fontFamily: "Inter_700Bold",
    fontSize: 86,
    color: WHITE,
    letterSpacing: -5,
    lineHeight: 86,
    marginBottom: 20,
  },
  welcomeSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: DIM,
    lineHeight: 28,
  },
  welcomeFeatures: { gap: 14 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AMBER,
  },
  featureText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: DIM,
  },
  welcomeTagline: { flexDirection: "row", alignItems: "center", gap: 14 },
  amberLine: { width: 28, height: 1.5, backgroundColor: AMBER },
  welcomeCity: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: DIM2,
    letterSpacing: 0.5,
  },

  doneEyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: AMBER,
    letterSpacing: 0,
    marginBottom: 8,
  },
  doneHeadline: {
    fontFamily: "Inter_700Bold",
    fontSize: 52,
    color: WHITE,
    letterSpacing: -2,
    lineHeight: 56,
    marginBottom: 22,
  },
  doneList: { gap: 20 },
  doneRow: { flexDirection: "row", alignItems: "flex-start", gap: 18 },
  doneNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: AMBER,
    letterSpacing: 0.5,
    marginTop: 2,
    minWidth: 24,
  },
  doneItem: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: DIM,
    lineHeight: 24,
    flex: 1,
  },
});
