import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Location from "expo-location";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { markGuestAttendance } from "@/api/attendance.api";

type Status = "confirm" | "submitting" | "success" | "done" | "error";

export default function GuestConfirm() {
  const { token, guestName, guestPhone } = useLocalSearchParams<{
    token: string;
    guestName: string;
    guestPhone: string;
  }>();

  const [status, setStatus] = useState<Status>("confirm");
  const [eventType, setEventType] = useState<"CHECK-IN" | "CHECK-OUT">("CHECK-IN");
  const [message, setMessage] = useState("");

  const getLocation = async (): Promise<{ lat: number | null; lng: number | null }> => {
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== "granted") return { lat: null, lng: null };
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch {
      return { lat: null, lng: null };
    }
  };

  const handleMark = async () => {
    if (!token) {
      setStatus("error");
      setMessage("No QR code detected. Please scan again.");
      return;
    }
    setStatus("submitting");
    const { lat, lng } = await getLocation();
    const res = await markGuestAttendance({
      token,
      fullName: guestName,
      phone: guestPhone,
      lat,
      lng,
    });

    if (res?.success) {
      setEventType(res.eventType);
      setStatus("success");
      setMessage(res.message || "Recorded successfully.");
    } else if (res?.message?.includes("already checked in and checked out")) {
      setStatus("done");
      setMessage(res.message);
    } else {
      setStatus("error");
      setMessage(res?.message || "Failed to record attendance.");
    }
  };

  const scanAgain = () =>
    router.replace({ pathname: "/guest/scan", params: { guestName, guestPhone } });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>

        {(status === "confirm" || status === "submitting") && (
          <>
            <View style={styles.badgeIn}>
              <Text style={styles.badgeInText}>CHECK-IN / CHECK-OUT</Text>
            </View>
            <Text style={styles.title}>Confirm Attendance</Text>
            <Text style={styles.subtitle}>
              Scanning as <Text style={styles.bold}>{guestName}</Text>
              {"\n"}Phone: {guestPhone}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.button, styles.buttonIn, pressed && styles.buttonPressed]}
              onPress={handleMark}
              disabled={status === "submitting"}
            >
              {status === "submitting" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Confirm</Text>
              )}
            </Pressable>
            <Pressable onPress={scanAgain} disabled={status === "submitting"}>
              <Text style={styles.link}>Scan a different code</Text>
            </Pressable>
          </>
        )}

        {status === "success" && (
          <>
            <View style={eventType === "CHECK-IN" ? styles.successBadgeIn : styles.successBadgeOut}>
              <Text style={eventType === "CHECK-IN" ? styles.successIconIn : styles.successIconOut}>
                {eventType === "CHECK-IN" ? "↓ In" : "↑ Out"}
              </Text>
            </View>
            <Text style={styles.title}>
              {eventType === "CHECK-IN" ? "Checked In!" : "Checked Out!"}
            </Text>
            <Text style={styles.subtitle}>{message}</Text>
            <Pressable
              style={({ pressed }) => [styles.button, styles.buttonIn, pressed && styles.buttonPressed]}
              onPress={() => router.replace("/auth/login")}
            >
              <Text style={styles.buttonText}>Done</Text>
            </Pressable>
          </>
        )}

        {status === "done" && (
          <>
            <View style={styles.successBadgeIn}>
              <Text style={styles.successIconIn}>✓</Text>
            </View>
            <Text style={styles.title}>All Done Today</Text>
            <Text style={styles.subtitle}>{message}</Text>
            <Pressable
              style={({ pressed }) => [styles.button, styles.buttonIn, pressed && styles.buttonPressed]}
              onPress={() => router.replace("/auth/login")}
            >
              <Text style={styles.buttonText}>Done</Text>
            </Pressable>
          </>
        )}

        {status === "error" && (
          <>
            <Text style={[styles.title, { color: COLORS.error }]}>Something went wrong</Text>
            <Text style={styles.subtitle}>{message}</Text>
            <Pressable
              style={({ pressed }) => [styles.button, styles.buttonIn, pressed && styles.buttonPressed]}
              onPress={scanAgain}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          </>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: ROUNDNESS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    rowGap: SPACING.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  badgeIn: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: ROUNDNESS.full,
  },
  badgeInText: { color: "#059669", fontWeight: "700", fontSize: 12, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.onSurface, textAlign: "center" },
  subtitle: { fontSize: 14, color: COLORS.onSurfaceVariant, textAlign: "center" },
  bold: { fontWeight: "700", color: COLORS.onSurface },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    width: "100%",
  },
  buttonIn: { backgroundColor: COLORS.primary },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  link: { color: COLORS.primary, fontWeight: "700", fontSize: 14, marginTop: SPACING.xs },
  successBadgeIn: {
    width: 56, height: 56, borderRadius: ROUNDNESS.full,
    backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center",
  },
  successBadgeOut: {
    width: 56, height: 56, borderRadius: ROUNDNESS.full,
    backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center",
  },
  successIconIn: { color: "#059669", fontWeight: "900", fontSize: 20 },
  successIconOut: { color: "#DC2626", fontWeight: "900", fontSize: 20 },
});
