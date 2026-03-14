import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import { DROP_LOCATIONS, getLocationsForCity } from "@/constants/dropLocations";
import { ListingItem, useApp } from "@/context/AppContext";

const C = Colors.light;

const CATEGORIES: ListingItem["category"][] = ["vegetables", "fruits", "herbs", "eggs", "dairy", "other"];

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const { user, addListing } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("lbs");
  const [creditCost, setCreditCost] = useState("3");
  const [category, setCategory] = useState<ListingItem["category"]>("vegetables");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const availableLocations = user?.city ? getLocationsForCity(user.city) : DROP_LOCATIONS;
  const defaultLoc = user?.defaultDropLocationId
    ? availableLocations.find((l) => l.id === user.defaultDropLocationId) ?? availableLocations[0]
    : availableLocations[0];
  const [selectedLocation, setSelectedLocation] = useState(defaultLoc);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handlePickPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to attach a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing info", "Please fill in title and description.");
      return;
    }
    if (!user) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await addListing({
      makerId: user.id,
      makerName: user.name,
      title: title.trim(),
      description: description.trim(),
      photoUri,
      boxLocation: {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: `${selectedLocation.address}, ${selectedLocation.city} ${selectedLocation.state}`,
        dropLocationId: selectedLocation.id,
      },
      quantity: parseInt(quantity) || 1,
      unit: unit.trim() || "lbs",
      creditCost: parseInt(creditCost) || 3,
      category,
      available: true,
    });
    setIsSubmitting(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Listing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={handlePickPhoto} style={styles.photoArea}>
          {photoUri ? (
            <>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
              <View style={styles.photoOverlay}>
                <Feather name="camera" size={20} color="#fff" />
                <Text style={styles.photoOverlayText}>Change photo</Text>
              </View>
            </>
          ) : (
            <LinearGradient colors={[C.creamDark, C.sandLight]} style={styles.photoPlaceholder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.cameraCircle}>
                <Feather name="camera" size={28} color={C.textSecondary} />
              </View>
              <Text style={styles.photoText}>Add a photo</Text>
              <Text style={styles.photoSubtext}>Listings with photos get 3x more claims</Text>
            </LinearGradient>
          )}
        </Pressable>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Fresh Heirloom Tomatoes"
              placeholderTextColor={C.textMuted}
              maxLength={60}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the produce — variety, taste, how to use..."
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={3}
              maxLength={300}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => { Haptics.selectionAsync(); setCategory(cat); }}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                >
                  <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={C.textMuted}
                maxLength={4}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="lbs, bunches..."
                placeholderTextColor={C.textMuted}
                maxLength={20}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Credits</Text>
              <TextInput
                style={styles.input}
                value={creditCost}
                onChangeText={setCreditCost}
                keyboardType="numeric"
                placeholder="3"
                placeholderTextColor={C.textMuted}
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Box Location</Text>
            {availableLocations.map((loc) => (
              <Pressable
                key={loc.id}
                onPress={() => { Haptics.selectionAsync(); setSelectedLocation(loc); }}
                style={[styles.locationOption, selectedLocation?.id === loc.id && styles.locationOptionActive]}
              >
                <Feather
                  name="map-pin"
                  size={14}
                  color={selectedLocation?.id === loc.id ? C.tint : C.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locationText, selectedLocation?.id === loc.id && styles.locationTextActive]}>
                    {loc.name}
                  </Text>
                  <Text style={styles.locationSubtext}>{loc.address}, {loc.city} {loc.state}</Text>
                </View>
                {selectedLocation?.id === loc.id && (
                  <Feather name="check" size={14} color={C.tint} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.submitSection, { paddingBottom: bottomPad + 20 }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.submitBtn,
            { opacity: pressed || isSubmitting ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <LinearGradient colors={[C.tintLight, C.tint]} style={styles.submitBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {isSubmitting ? (
              <Text style={styles.submitBtnText}>Posting...</Text>
            ) : (
              <>
                <Ionicons name="leaf" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Post Listing</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  closeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.creamDark, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.text },
  scrollContent: { paddingHorizontal: 20 },
  photoArea: { marginVertical: 20, borderRadius: 20, overflow: "hidden", height: 200 },
  photoPreview: { width: "100%", height: "100%" },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoOverlayText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  photoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  cameraCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: C.text },
  photoSubtext: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  form: { gap: 20 },
  field: { gap: 8 },
  row: { flexDirection: "row", gap: 12 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.text },
  input: {
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.text,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  multilineInput: { height: 90, textAlignVertical: "top", paddingTop: 13 },
  catRow: { gap: 8, paddingVertical: 2 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  catChipActive: { backgroundColor: C.text, borderColor: C.text },
  catChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary },
  catChipTextActive: { color: C.surface },
  locationOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.surface,
    marginBottom: 8,
  },
  locationOptionActive: { borderColor: C.tint, backgroundColor: C.tint + "0C" },
  locationText: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.textSecondary },
  locationTextActive: { color: C.text },
  locationSubtext: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, marginTop: 1 },
  submitSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
  },
  submitBtn: {},
  submitBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
});
