import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { markAttendance, getTodayStatus } from "@/api/attendance.api";

type Status = "checking" | "confirm" | "success" | "already_marked" | "error";

export default function MarkAttendence() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const res = await getTodayStatus();
      if (res?.success && res.marked) {
        setStatus("already_marked");
        setMessage("You've already marked your attendance for today.");
      } else {
        setStatus("confirm");
      }
    };
    checkStatus();
  }, []);

  const handleMark = async () => {
    if (!token) {
      setStatus("error");
      setMessage("No QR code detected. Please scan again.");
      return;
    }
    setIsSubmitting(true);
    const res = await markAttendance(token);
    setIsSubmitting(false);

    if (res?.success) {
      setStatus("success");
      setMessage("Your attendance has been marked successfully.");
    } else if (res?.message === "Attendance already marked for today") {
      setStatus("already_marked");
      setMessage(res.message);
    } else {
      setStatus("error");
      setMessage(res?.message || "Failed to mark attendance.");
    }
  };

  const goHome = () => router.replace("/");
  const scanAgain = () => router.replace("/scan_qr");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {status === "checking" && <ActivityIndicator size="large" color={COLORS.primary} />}

        {status === "confirm" && (
          <>
            <Text style={styles.title}>Mark Your Attendance</Text>
            <Text style={styles.subtitle}>Confirm to check in for today.</Text>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={handleMark}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Mark Attendance</Text>
              )}
            </Pressable>
            <Pressable onPress={scanAgain} disabled={isSubmitting}>
              <Text style={styles.link}>Scan a different code</Text>
            </Pressable>
          </>
        )}

        {status === "success" && (
          <>
            <View style={styles.successBadge}>
              <Text style={styles.successText}>✓</Text>
            </View>
            <Text style={styles.title}>Attendance Marked</Text>
            <Text style={styles.subtitle}>{message}</Text>
            <Pressable style={styles.button} onPress={goHome}>
              <Text style={styles.buttonText}>Go to Dashboard</Text>
            </Pressable>
          </>
        )}

        {status === "already_marked" && (
          <>
            <Text style={styles.title}>Already Marked</Text>
            <Text style={styles.subtitle}>{message}</Text>
            <Pressable style={styles.button} onPress={goHome}>
              <Text style={styles.buttonText}>Go to Dashboard</Text>
            </Pressable>
          </>
        )}

        {status === "error" && (
          <>
            <Text style={[styles.title, { color: COLORS.error }]}>Something went wrong</Text>
            <Text style={styles.subtitle}>{message}</Text>
            <Pressable style={styles.button} onPress={scanAgain}>
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
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    width: "100%",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  link: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  successBadge: {
    width: 56,
    height: 56,
    borderRadius: ROUNDNESS.full,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    color: "#059669",
    fontWeight: "900",
    fontSize: 28,
  },
});
