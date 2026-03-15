import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import StarRating from "@/components/StarRating";

const C = Colors.light;

export default function ReviewScreen() {
  const { listingId, type } = useLocalSearchParams<{
    listingId: string;
    type: "buyer-reviews-maker" | "maker-reviews-buyer";
  }>();
  const insets = useSafeAreaInsets();
  const { listings, user, addReview, hasReviewed } = useApp();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const listing = listings.find((l) => l.id === listingId);
  const reviewType = type ?? "buyer-reviews-maker";

  const isReviewingMaker = reviewType === "buyer-reviews-maker";
  const revieweeName = isReviewingMaker ? (listing?.makerName ?? "the maker") : (listing?.pickupBuyerName ?? "the buyer");
  const revieweeId = isReviewingMaker ? (listing?.makerId ?? "") : (listing?.pickupBuyerId ?? "");

  const alreadyReviewed = listing && user
    ? hasReviewed(listingId, user.id, reviewType)
    : false;

  const PROMPTS = isReviewingMaker
    ? [
        "Item was fresh and as described",
        "Well-packaged for transport",
        "Fair credit value",
        "Would claim again",
      ]
    : [
        "Picked up promptly",
        "Left the box clean",
        "Friendly community member",
        "Would swap with again",
      ];

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Add a rating", "Please select at least one star.");
      return;
    }
    if (!user || !listing) return;
    if (alreadyReviewed) {
      Alert.alert("Already reviewed", "You've already left a review for this listing.");
      return;
    }

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await addReview({
      listingId,
      listingTitle: listing.title,
      reviewerId: user.id,
      reviewerName: user.name,
      revieweeId,
      revieweeName,
      rating,
      comment: comment.trim(),
      type: reviewType,
    });

    setSubmitted(true);
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <LinearGradient colors={[C.accent, C.accentMid, "#1A3518"]} style={styles.successContainer}>
        <View style={[styles.successInner, { paddingTop: topPad + 40, paddingBottom: bottomPad + 40 }]}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={52} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Review submitted!</Text>
          <Text style={styles.successSub}>
            Your {rating}-star review of {revieweeName} helps keep the Drop community safe and high quality.
          </Text>
          {rating < 3 && (
            <View style={styles.flagNote}>
              <Feather name="alert-triangle" size={15} color={C.tint} />
              <Text style={styles.flagNoteText}>
                Low ratings are reviewed by Drop admins to ensure box access remains fair.
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            style={({ pressed }) => [styles.doneBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.doneBtnText}>Back to listings</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={C.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Leave a Review</Text>
          {listing && (
            <Text style={styles.headerSub} numberOfLines={1}>{listing.title}</Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {alreadyReviewed ? (
          <View style={styles.alreadyBox}>
            <Ionicons name="checkmark-circle" size={24} color={C.success} />
            <Text style={styles.alreadyText}>You've already reviewed this {isReviewingMaker ? "maker" : "buyer"}.</Text>
          </View>
        ) : (
          <>
            <View style={styles.whoSection}>
              <View style={styles.revieweeCircle}>
                <Text style={styles.revieweeInitial}>{revieweeName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.reviewingLabel}>
                  {isReviewingMaker ? "Rating the maker" : "Rating the buyer"}
                </Text>
                <Text style={styles.revieweeName}>{revieweeName}</Text>
              </View>
            </View>

            <View style={styles.starsSection}>
              <Text style={styles.starsLabel}>
                {rating === 0 ? "Tap to rate" : rating === 5 ? "Exceptional!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
              </Text>
              <StarRating rating={rating} onRate={setRating} size={44} />
            </View>

            <View style={styles.promptsSection}>
              <Text style={styles.promptsLabel}>Quick tags (tap to add)</Text>
              <View style={styles.promptsGrid}>
                {PROMPTS.map((p) => {
                  const selected = comment.includes(p);
                  return (
                    <Pressable
                      key={p}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setComment((prev) =>
                          selected
                            ? prev.replace(p, "").replace(/\.\s*$/, "").trim()
                            : prev ? `${prev}. ${p}` : p
                        );
                      }}
                      style={[styles.promptChip, selected && styles.promptChipActive]}
                    >
                      {selected && <Feather name="check" size={12} color="#fff" />}
                      <Text style={[styles.promptChipText, selected && styles.promptChipTextActive]}>
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Your review</Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder={`Tell the community about your experience with ${isReviewingMaker ? "this listing" : "this buyer"}...`}
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={5}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{comment.length}/500</Text>
            </View>

            {rating > 0 && rating < 3 && (
              <View style={styles.lowRatingWarning}>
                <Feather name="alert-triangle" size={16} color={C.error} />
                <Text style={styles.lowRatingText}>
                  Ratings below 3 stars are flagged for admin review. Repeated low ratings may result in reduced box access.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!alreadyReviewed && (
        <View style={[styles.submitSection, { paddingBottom: bottomPad + 20 }]}>
          <Pressable
            onPress={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            style={({ pressed }) => [
              { opacity: rating === 0 || isSubmitting ? 0.5 : pressed ? 0.87 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={[C.tintLight, C.tint]}
              style={styles.submitBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="star" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  successContainer: { flex: 1 },
  successInner: { flex: 1, paddingHorizontal: 28, alignItems: "center", justifyContent: "center", gap: 20 },
  successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#fff", letterSpacing: -0.5 },
  successSub: { fontFamily: "Inter_400Regular", fontSize: 16, color: "rgba(255,255,255,0.72)", textAlign: "center", lineHeight: 24 },
  flagNote: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: "rgba(212,130,42,0.15)", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(212,130,42,0.25)" },
  flagNoteText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 19 },
  doneBtn: { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, marginTop: 8 },
  doneBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: C.background, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  closeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.creamDark, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.text },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, marginTop: 1 },
  content: { padding: 24, gap: 28 },
  alreadyBox: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.success + "12", borderRadius: 14, padding: 16 },
  alreadyText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: C.success },
  whoSection: { flexDirection: "row", alignItems: "center", gap: 16 },
  revieweeCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.accent + "28", alignItems: "center", justifyContent: "center" },
  revieweeInitial: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.accent },
  reviewingLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, marginBottom: 2 },
  revieweeName: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.text },
  starsSection: { alignItems: "center", gap: 14 },
  starsLabel: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: C.text },
  promptsSection: { gap: 12 },
  promptsLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary },
  promptsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  promptChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.cardBorder },
  promptChipActive: { backgroundColor: C.text, borderColor: C.text },
  promptChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary },
  promptChipTextActive: { color: "#fff" },
  commentSection: { gap: 8 },
  commentLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.text },
  commentInput: { backgroundColor: C.surface, borderRadius: 14, padding: 14, fontFamily: "Inter_400Regular", fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.cardBorder, height: 130, textAlignVertical: "top" },
  charCount: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, textAlign: "right" },
  lowRatingWarning: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: C.error + "0C", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.error + "25" },
  lowRatingText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, color: C.error, lineHeight: 19 },
  submitSection: { paddingHorizontal: 24, paddingTop: 12, gap: 10, backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.cardBorder },
  submitBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 16 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 17, color: "#fff" },
  skipBtn: { alignItems: "center", paddingVertical: 10 },
  skipText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textMuted },
});
