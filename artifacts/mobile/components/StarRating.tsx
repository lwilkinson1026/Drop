import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";

const C = Colors.light;

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  onRate?: (rating: number) => void;
  color?: string;
  emptyColor?: string;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 24,
  onRate,
  color = C.tint,
  emptyColor = C.cardBorder,
}: StarRatingProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Pressable
            key={i}
            onPress={onRate ? () => { Haptics.selectionAsync(); onRate(i + 1); } : undefined}
            style={{ padding: onRate ? 3 : 0 }}
            disabled={!onRate}
          >
            <Ionicons
              name={filled ? "star" : "star-outline"}
              size={size}
              color={filled ? color : emptyColor}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
});
