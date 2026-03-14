import { Redirect, Stack } from "expo-router";
import React from "react";

import { useAuth } from "@/context/AuthContext";

export default function AdminLayout() {
  const { isAdmin, isAuthLoading } = useAuth();

  if (!isAuthLoading && !isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-location"
        options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}
