import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { StatusBar } from "expo-status-bar";

export default function RemarksScreen() {
  const [remarks, setRemarks] = useState("");

  const proceed = (skip = false) => {
    router.push({
      pathname: "/scan_qr",
      params: { remarks: skip ? "" : remarks.trim() },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>CHECK-IN</Text>
            </View>

            <Text style={styles.title}>Add a Remark</Text>
            <Text style={styles.subtitle}>
              Running late or have something to note? Add an optional remark before scanning.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Remark (optional)</Text>
              <TextInput
                style={styles.textarea}
                placeholder="e.g. Traffic delay, Doctor's appointment…"
                placeholderTextColor="#94A3B8"
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => proceed(false)}
            >
              <Text style={styles.buttonText}>
                {remarks.trim() ? "Proceed to Scan" : "Proceed to Scan"}
              </Text>
            </Pressable>

            <Pressable onPress={() => proceed(true)}>
              <Text style={styles.skip}>Skip — no remark</Text>
            </Pressable>

            <Pressable onPress={() => router.back()}>
              <Text style={styles.back}>← Back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: SPACING.lg, justifyContent: "center" },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: ROUNDNESS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  badge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: ROUNDNESS.full,
  },
  badgeText: { color: "#059669", fontWeight: "700", fontSize: 12, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.onSurface, textAlign: "center" },
  subtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, textAlign: "center" },
  inputGroup: { width: "100%", gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.onSurface },
  textarea: {
    backgroundColor: COLORS.background,
    borderRadius: ROUNDNESS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.onSurface,
    borderWidth: 1.5,
    borderColor: COLORS.outline,
    minHeight: 100,
    width: "100%",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    width: "100%",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  skip: { color: COLORS.onSurfaceVariant, fontSize: 14, fontWeight: "600" },
  back: { color: COLORS.onSurfaceVariant, fontSize: 14, fontWeight: "500" },
});
