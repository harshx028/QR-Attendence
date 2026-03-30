import { useRouter } from "expo-router";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { useCameraPermissions } from "expo-camera";
import { useEffect, useRef } from "react";
import useAuth from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// ── Animated scan line ───────────────────────────────────────────────────────
function ScanLine() {
  const pos = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pos, {
          toValue: 80,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pos, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[styles.scanLine, { transform: [{ translateY: pos }] }]}
    />
  );
}

// ── Menu card button ─────────────────────────────────────────────────────────
function MenuCard({
  icon,
  title,
  description,
  accent,
  onPress,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  accent: string;
  onPress: () => void;
  delay: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
      }
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.menuCard,
          { opacity, transform: [{ scale }, { translateY }] },
        ]}
      >
        <View style={[styles.cardStripe, { backgroundColor: accent }]} />
        <View style={styles.cardContent}>
          <View
            style={[styles.cardIconBox, { backgroundColor: accent + "18" }]}
          >
            <Text style={styles.cardIcon}>{icon}</Text>
          </View>
          <View style={styles.cardTextBlock}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDesc}>{description}</Text>
          </View>
          <View style={[styles.cardArrow, { backgroundColor: accent + "18" }]}>
            <Text style={[styles.cardArrowText, { color: accent }]}>›</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function Index() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const { isAuthenticated, user } = useAuth();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(headerY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  const isPermissionGranted = Boolean(permission?.granted);

  if (!isPermissionGranted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAF7" />
        <View style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionBody}>
            QR Attendance needs your camera to scan attendance codes. Please
            grant permission to continue.
          </Text>
          <Pressable
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning 👋"
      : hour < 17
        ? "Good afternoon ☀️"
        : "Good evening 🌙";

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF7" />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerOpacity, transform: [{ translateY: headerY }] },
        ]}
      >
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{user?.name ?? "Team Member"}</Text>
        </View>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{today}</Text>
        </View>
      </Animated.View>

      {/* Section label */}
      <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

      {/* Cards */}
      <View style={styles.cardsArea}>
        <MenuCard
          icon="✅"
          title="Mark My Attendance"
          description="Check in or check out using QR scan"
          accent="#16A34A"
          onPress={() => router.push("/attendence/mark_attendence")}
          delay={100}
        />
        <MenuCard
          icon="📊"
          title="View My Attendance"
          description="See your attendance history & stats"
          accent="#2563EB"
          onPress={() => router.push("/attendence/mark_attendence")}
          delay={220}
        />
      </View>

      {/* Footer */}
      <Text style={styles.footerNote}>Office hours · 9:00 AM – 6:00 PM</Text>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const CARD_RADIUS = 20;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAF7",
    paddingHorizontal: 22,
  },

  // Permission screen
  permissionScreen: {
    flex: 1,
    backgroundColor: "#FAFAF7",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  permissionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  permissionIcon: { fontSize: 48, marginBottom: 16 },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    textAlign: "center",
  },
  permissionBody: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  permissionButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 16,
    marginBottom: 28,
  },
  greeting: {
    fontSize: 13,
    color: "#9CA3AF",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  dateBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  dateBadgeText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  // QR illustration
  illustrationArea: {
    alignItems: "center",
    marginBottom: 36,
  },
  qrWrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  qrRingOuter: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    shadowColor: "#2563EB",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  qrRingInner: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  qrGrid: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "space-around",
    padding: 4,
  },
  qrCorner: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 3,
    borderColor: "#1D4ED8",
  },
  qrTL: { top: 8, left: 8 },
  qrTR: { top: 8, right: 8 },
  qrBL: { bottom: 8, left: 8 },
  qrDotRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  qrDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
  },
  qrDotFilled: { backgroundColor: "#3B82F6" },
  scanLine: {
    position: "absolute",
    left: 18,
    right: 18,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#2563EB",
    opacity: 0.7,
    top: 18,
    shadowColor: "#2563EB",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  illustrationLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    letterSpacing: 0.1,
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    color: "#9CA3AF",
    marginBottom: 14,
    marginLeft: 2,
  },

  // Menu cards
  cardsArea: { gap: 14 },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardStripe: {
    width: 4,
    borderTopLeftRadius: CARD_RADIUS,
    borderBottomLeftRadius: CARD_RADIUS,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 14,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIcon: { fontSize: 22 },
  cardTextBlock: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 17,
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardArrowText: {
    fontSize: 20,
    fontWeight: "300",
    lineHeight: 24,
  },

  footerNote: {
    textAlign: "center",
    fontSize: 12,
    color: "#D1D5DB",
    marginTop: "auto",
    paddingTop: 28,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
});
