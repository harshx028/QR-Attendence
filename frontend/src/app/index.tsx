import { useRouter } from "expo-router";
import { Text, View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import useAuth from "@/hooks/useAuth";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { getTodayStatus, getMyAttendance, Attendance } from "@/api/attendance.api";

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isMarkedToday, setIsMarkedToday] = useState(false);
  const [markedAt, setMarkedAt] = useState<string | null>(null);
  const [monthlyAttendances, setMonthlyAttendances] = useState<Attendance[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated]);

  const loadAttendanceData = useCallback(async () => {
    setIsLoadingStatus(true);
    const [statusRes, historyRes] = await Promise.all([getTodayStatus(), getMyAttendance()]);

    if (statusRes?.success) {
      setIsMarkedToday(Boolean(statusRes.marked));
      setMarkedAt(statusRes.attendance?.markedAt ?? null);
    }
    if (historyRes?.success) {
      setMonthlyAttendances(historyRes.attendances || []);
    }
    setIsLoadingStatus(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAttendanceData();
    }, [loadAttendanceData])
  );

  const now = new Date();
  const presentDatesThisMonth = new Set(
    monthlyAttendances
      .filter((a) => {
        const d = new Date(a.markedAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .map((a) => new Date(a.markedAt).toDateString())
  );
  const presentCount = presentDatesThisMonth.size;
  const daysElapsed = now.getDate();
  const absentCount = Math.max(daysElapsed - presentCount, 0);
  const performancePct = daysElapsed > 0 ? Math.round((presentCount / daysElapsed) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.userName}>{user?.fullName || "there"}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.slice(0, 2)?.toUpperCase() || "?"}
            </Text>
          </View>
        </View>

        {/* Date Display */}
        <Text style={styles.dateText}>
          {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {/* Action Card */}
        <View style={styles.actionCard}>
          {isLoadingStatus ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : isMarkedToday ? (
            <View style={styles.completedCard}>
              <View style={styles.successBadge}>
                 <Text style={styles.successText}>✓ Marked</Text>
              </View>
              <Text style={styles.cardStatusTitle}>Attendance Completed</Text>
              {markedAt && (
                <Text style={styles.completedSub}>
                  Marked at {new Date(markedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          ) : (
            <>
              <Text style={styles.cardStatusTitle}>Not checked in today</Text>
              <Text style={styles.completedSub}>Scan the office QR code to mark your attendance.</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.mainButton,
                  styles.checkInButton,
                  pressed && styles.buttonPressed,
                  { marginTop: SPACING.lg },
                ]}
                onPress={() => router.push("/scan_qr")}
              >
                <Text style={styles.mainButtonText}>Scan Company QR</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Stats Title */}
        <Text style={styles.sectionTitle}>Monthly Overview</Text>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#E0F2FE' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#7DD3FC' }]}>
               <Text style={{ fontSize: 18 }}>📅</Text>
            </View>
            <Text style={styles.statValue}>{String(presentCount).padStart(2, "0")}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFE4E6' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FDA4AF' }]}>
               <Text style={{ fontSize: 18 }}>✘</Text>
            </View>
            <Text style={styles.statValue}>{String(absentCount).padStart(2, "0")}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>

        {/* Performance Card */}
        <View style={styles.performanceCard}>
          <View style={styles.perfHeader}>
             <Text style={styles.perfTitle}>Performance Ring</Text>
             <Text style={styles.perfValue}>{performancePct}%</Text>
          </View>
          <View style={styles.progressBarBg}>
             <View style={[styles.progressBarFill, { width: `${performancePct}%` }]} />
          </View>
          <Text style={styles.perfDesc}>Based on {presentCount} of {daysElapsed} days this month.</Text>
        </View>

        {/* Admin Entry Point */}
        {user?.role === "ADMIN" && (
          <Pressable
            style={({ pressed }) => [styles.qrButton, pressed && styles.buttonPressed, { marginTop: SPACING.sm }]}
            onPress={() => router.push("/attendence/check_attendece")}
          >
            <Text style={styles.qrButtonText}>View Team Attendance</Text>
          </Pressable>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.onSurface,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: ROUNDNESS.full,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  actionCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: ROUNDNESS.xl * 1.5,
    padding: SPACING.xl,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    alignItems: "center",
  },
  cardStatusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
  },
  mainButton: {
    padding: SPACING.md,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    width: "100%",
  },
  checkInButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
  },
  mainButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  completedCard: {
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  successBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: ROUNDNESS.full,
    marginBottom: SPACING.md,
  },
  successText: {
    color: '#059669',
    fontWeight: "700",
    fontSize: 12,
  },
  completedSub: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: ROUNDNESS.lg,
    alignItems: "center",
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.onSurface,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: "500",
  },
  performanceCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: ROUNDNESS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  perfHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  perfTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.onSurface,
  },
  perfValue: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  perfDesc: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  qrButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: ROUNDNESS.full,
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  qrButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "800",
  },
});
