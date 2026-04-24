import { useRouter } from "expo-router";
import { Text, View, StyleSheet, Pressable, ScrollView, Animated } from "react-native";
import { useCameraPermissions } from "expo-camera";
import { useEffect, useState, useRef } from "react";
import useAuth from "@/hooks/useAuth";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  // Local state for demonstration - in real app, fetch from backend via useAttendance()
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [duration, setDuration] = useState("0h 0m");
  const [startTime, setStartTime] = useState<Date | null>(null);

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated]);

  // Simple timer logic for 'Checked In' state
  useEffect(() => {
    let interval: any;
    if (isCheckedIn && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setDuration(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, startTime]);

  const handleAttendanceAction = () => {
    if (!isCheckedIn) {
      // Start Check In
      setIsCheckedIn(true);
      setStartTime(new Date());
    } else {
      // End Check Out
      setIsCheckedIn(false);
      setAttendanceMarked(true);
    }
  };

  const isPermissionGranted = Boolean(permission?.granted);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.userName}>{user?.fullName || "Harsh"}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>HM</Text>
          </View>
        </View>

        {/* Date Display */}
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {/* Action Card */}
        <View style={styles.actionCard}>
          {!attendanceMarked ? (
            <>
              <Text style={styles.cardStatusTitle}>
                {isCheckedIn ? "You are currently working" : "Not checked in today"}
              </Text>
              
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>{isCheckedIn ? duration : "--h --m"}</Text>
                <Text style={styles.timerSub}>Daily Working Hours</Text>
              </View>

              <Pressable 
                style={({ pressed }) => [
                  styles.mainButton, 
                  isCheckedIn ? styles.checkOutButton : styles.checkInButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={handleAttendanceAction}
              >
                <Text style={styles.mainButtonText}>
                  {isCheckedIn ? "Check Out" : "Check In"}
                </Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.completedCard}>
              <View style={styles.successBadge}>
                 <Text style={styles.successText}>✓ Marked</Text>
              </View>
              <Text style={styles.cardStatusTitle}>Attendance Completed</Text>
              <Text style={styles.completedDuration}>Total Duration: {duration}</Text>
              <Text style={styles.completedSub}>Great job today! Rest well.</Text>
            </View>
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
            <Text style={styles.statValue}>22</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFE4E6' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FDA4AF' }]}>
               <Text style={{ fontSize: 18 }}>✘</Text>
            </View>
            <Text style={styles.statValue}>02</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>

        {/* Performance Card */}
        <View style={styles.performanceCard}>
          <View style={styles.perfHeader}>
             <Text style={styles.perfTitle}>Performance Ring</Text>
             <Text style={styles.perfValue}>92%</Text>
          </View>
          <View style={styles.progressBarBg}>
             <View style={[styles.progressBarFill, { width: '92%' }]} />
          </View>
          <Text style={styles.perfDesc}>Your attendance is above the average team score of 85%.</Text>
        </View>

        {/* QR Action */}
        <Pressable 
          style={({ pressed }) => [styles.qrButton, pressed && styles.buttonPressed]}
          onPress={() => router.push("/scan_qr")}
        >
          <Text style={styles.qrButtonText}>Scan Company QR</Text>
        </Pressable>

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
  },
  cardStatusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
  },
  timerContainer: {
    alignItems: "center",
    marginVertical: SPACING.lg,
  },
  timerText: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.onSurface,
    letterSpacing: -1,
  },
  timerSub: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  mainButton: {
    padding: SPACING.md,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  checkInButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
  },
  checkOutButton: {
    backgroundColor: COLORS.onSurface,
    shadowColor: COLORS.onSurface,
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
  completedDuration: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.onSurface,
    marginTop: SPACING.sm,
  },
  completedSub: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.sm,
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

