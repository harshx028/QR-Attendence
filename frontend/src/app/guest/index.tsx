import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { StatusBar } from "expo-status-bar";

export default function GuestEntry() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!fullName.trim()) e.fullName = "Name is required";
    if (!phone.trim()) e.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(phone.trim())) e.phone = "Enter a valid 10-digit phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProceed = () => {
    if (!validate()) return;
    router.push({
      pathname: "/guest/scan",
      params: { guestName: fullName.trim(), guestPhone: phone.trim() },
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
          <View style={styles.headerContainer}>
            <Image
              source={require("../../../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>Guest check-in</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Enter your details</Text>
            <Text style={styles.subtitle}>Please provide your name and phone number to proceed.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Your full name"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={handleProceed}
            >
              <Text style={styles.buttonText}>Proceed to Scan QR</Text>
            </Pressable>

            <Pressable onPress={() => router.replace("/auth/login")}>
              <Text style={styles.link}>Back to Login</Text>
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
  headerContainer: { alignItems: "center", marginBottom: SPACING.xxl },
  logo: { width: 80, height: 80, marginBottom: SPACING.sm },
  tagline: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 2, fontWeight: "500" },
  card: { width: "100%", gap: SPACING.md },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.onSurface },
  subtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, marginBottom: SPACING.sm },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.onSurface, marginLeft: 2 },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: ROUNDNESS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.onSurface,
    borderWidth: 1.5,
    borderColor: COLORS.outline,
  },
  inputError: { borderColor: COLORS.error },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 2, marginLeft: 2 },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: ROUNDNESS.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  link: {
    color: COLORS.onSurfaceVariant,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
});
