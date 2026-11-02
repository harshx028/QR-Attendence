import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as Location from "expo-location";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { markAttendance, getTodayStatus } from "@/api/attendance.api";

type Status = "checking" | "confirm_checkin" | "confirm_checkout" | "success" | "done" | "error";

export default function MarkAttendence() {
  const { token, remarks } = useLocalSearchParams<{ token?: string; remarks?: string }>();
  const [status, setStatus] = useState<Status>("checking");
  const [eventType, setEventType] = useState<"CHECK-IN" | "CHECK-OUT">("CHECK-IN");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const res = await getTodayStatus();
      if (!res?.success) {
        setStatus("confirm_checkin");
        return;
      }
      if (res.checkedIn && res.checkedOut) {
        setStatus("done");
        setMessage("You have already checked in and checked out for today.");
      } else if (res.checkedIn) {
        setStatus("confirm_checkout");
      } else {
        setStatus("confirm_checkin");
      }
    };
    checkStatus();
  }, []);

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
    setIsSubmitting(true);
    const { lat, lng } = await getLocation();
    const res = await markAttendance(token, lat, lng, remarks || null);
    setIsSubmitting(false);

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

  const goHome = () => router.replace("/");
  const scanAgain = () => router.replace("/scan_qr");

  const isCheckout = status === "confirm_checkout";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>

        {status === "checking" && (
          <ActivityIndicator size="large" color={COLORS.primary} />
        )}

        {(status === "confirm_checkin" || status === "confirm_checkout") && (
          <>
            <View style={[styles.eventBadge, isCheckout ? styles.badgeOut : styles.badgeIn]}>
              <Text style={[styles.eventBadgeText, isCheckout ? styles.badgeOutText : styles.badgeInText]}>
                {isCheckout ? "CHECK-OUT" : "CHECK-IN"}
              </Text>
            </View>
            <Text style={styles.title}>
              {isCheckout ? "Confirm Check-Out" : "Confirm Check-In"}
            </Text>
            <Text style={styles.subtitle}>
              {isCheckout
                ? "Tap below to record your check-out time and location."
                : "Tap below to record your check-in time and location."}
            </Text>
            {!isCheckout && remarks ? (
              <View style={styles.remarksBadge}>
                <Text style={styles.remarksLabel}>Remark</Text>
                <Text style={styles.remarksText}>{remarks}</Text>
              </View>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                isCheckout ? styles.buttonOut : styles.buttonIn,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleMark}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isCheckout ? "Check Out" : "Check In"}
                </Text>
              )}
            </Pressable>
            <Pressable onPress={scanAgain} disabled={isSubmitting}>
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
            <Pressable style={[styles.button, styles.buttonIn]} onPress={goHome}>
              <Text style={styles.buttonText}>Go to Dashboard</Text>
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
            <Pressable style={[styles.button, styles.buttonIn]} onPress={goHome}>
              <Text style={styles.buttonText}>Go to Dashboard</Text>
            </Pressable>
          </>
        )}

        {status === "error" && (
          <>
            <Text style={[styles.title, { color: COLORS.error }]}>Something went wrong</Text>
            <Text style={styles.subtitle}>{message}</Text>
            <Pressable style={[styles.button, styles.buttonIn]} onPress={scanAgain}>
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
            <Pressable onPress={goHome}>
              <Text style={styles.link}>Go to Dashboard</Text>
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
  eventBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: ROUNDNESS.full,
    marginBottom: 4,
  },
  badgeIn: { backgroundColor: "#D1FAE5" },
  badgeOut: { backgroundColor: "#FEE2E2" },
  eventBadgeText: { fontWeight: "700", fontSize: 12, letterSpacing: 1 },
  badgeInText: { color: "#059669" },
  badgeOutText: { color: "#DC2626" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.onSurface,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    width: "100%",
  },
  buttonIn: { backgroundColor: COLORS.primary },
  buttonOut: { backgroundColor: "#DC2626" },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  link: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  successBadgeIn: {
    width: 56,
    height: 56,
    borderRadius: ROUNDNESS.full,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  successBadgeOut: {
    width: 56,
    height: 56,
    borderRadius: ROUNDNESS.full,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  successIconIn: { color: "#059669", fontWeight: "900", fontSize: 20 },
  successIconOut: { color: "#DC2626", fontWeight: "900", fontSize: 20 },
  remarksBadge: {
    backgroundColor: "#FEF9C3",
    borderRadius: ROUNDNESS.md,
    padding: SPACING.sm,
    width: "100%",
  },
  remarksLabel: { fontSize: 11, fontWeight: "700", color: "#92400E", marginBottom: 2 },
  remarksText: { fontSize: 13, color: "#78350F" },
});
