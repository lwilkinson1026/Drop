import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { useApp } from "@/context/AppContext";

const C = Colors.light;

const CITIES = ["Yakima"];

export default function AddLocationScreen() {
  const insets = useSafeAreaInsets();
  const { addDropLocation } = useApp();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Yakima");
  const [state, setState] = useState("WA");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const validate = () => {
    if (!name.trim()) return "Box name is required.";
    if (!address.trim()) return "Address is required.";
    if (!lat.trim() || isNaN(parseFloat(lat))) return "Valid latitude is required.";
    if (!lng.trim() || isNaN(parseFloat(lng))) return "Valid longitude is required.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { Alert.alert("Missing info", err); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSubmitting(true);
    try {
      await addDropLocation({
        name: name.trim(),
        address: address.trim(),
        city,
        state: state.trim() || "WA",
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        description: description.trim(),
      });
      router.back();
    } finally {
      setIsSubmitting(false);
    }
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
        <Text style={styles.headerTitle}>Add Drop Location</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={C.tint} />
          <Text style={styles.infoText}>
            Add a new community swap box location. Makers in the selected city will be able to choose it when posting listings.
          </Text>
        </View>

        <View style={styles.form}>
          <Field label="Box Name" required>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Downtown Park Box"
              placeholderTextColor={C.textMuted}
              maxLength={60}
            />
          </Field>

          <Field label="Street Address" required>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 791 Lynch Lane"
              placeholderTextColor={C.textMuted}
              maxLength={100}
            />
          </Field>

          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Field label="City" required>
                <View style={styles.cityPicker}>
                  {CITIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => { Haptics.selectionAsync(); setCity(c); }}
                      style={[styles.cityChip, city === c && styles.cityChipActive]}
                    >
                      <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="State">
                <TextInput
                  style={styles.input}
                  value={state}
                  onChangeText={setState}
                  placeholder="WA"
                  placeholderTextColor={C.textMuted}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </Field>
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Latitude" required>
                <TextInput
                  style={styles.input}
                  value={lat}
                  onChangeText={setLat}
                  placeholder="46.6021"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  maxLength={12}
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Longitude" required>
                <TextInput
                  style={styles.input}
                  value={lng}
                  onChangeText={setLng}
                  placeholder="-120.5059"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  maxLength={13}
                />
              </Field>
            </View>
          </View>

          <View style={styles.mapHint}>
            <Feather name="map-pin" size={13} color={C.textSecondary} />
            <Text style={styles.mapHintText}>
              Get coordinates from Google Maps: long-press a location to copy lat/lng.
            </Text>
          </View>

          <Field label="Description" optional>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Green wooden box near the entrance of the park. Look for the Drop sign."
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={4}
              maxLength={300}
              textAlignVertical="top"
            />
          </Field>
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
            <Feather name="map-pin" size={18} color="#fff" />
            <Text style={styles.submitBtnText}>
              {isSubmitting ? "Adding..." : "Add Drop Location"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
  required,
  optional,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
        {optional && <Text style={styles.optional}> (optional)</Text>}
      </Text>
      {children}
    </View>
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
  content: { padding: 20, gap: 20 },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: C.tint + "12",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.tint + "25",
  },
  infoText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, lineHeight: 19 },
  form: { gap: 18 },
  row: { flexDirection: "row", gap: 12 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.text },
  required: { color: C.error },
  optional: { fontFamily: "Inter_400Regular", color: C.textSecondary, fontSize: 12 },
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
  textArea: { height: 100, paddingTop: 13, textAlignVertical: "top" },
  cityPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  cityChipActive: { backgroundColor: C.text, borderColor: C.text },
  cityChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary },
  cityChipTextActive: { color: "#fff" },
  mapHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: C.creamDark,
    borderRadius: 10,
    padding: 10,
  },
  mapHintText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, lineHeight: 17 },
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
