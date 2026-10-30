import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import useAuth from "@/hooks/useAuth";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { getAllAttendance } from "@/api/attendance.api";

const fmtTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export default function CheckAttendance() {
  const { user, isLoading: authLoading } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAttendances = useCallback(async () => {
    const res = await getAllAttendance();
    if (res?.success) {
      setAttendances(res.attendances);
      setError(null);
    } else {
      setError(res?.message || "Failed to load attendance records");
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role !== "ADMIN") {
      router.replace("/");
      return;
    }
    (async () => {
      setIsLoading(true);
      await fetchAttendances();
      setIsLoading(false);
    })();
  }, [authLoading, user]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAttendances();
    setIsRefreshing(false);
  };

  if (authLoading || user?.role !== "ADMIN") {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.header}>Team Attendance</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={attendances}
          keyExtractor={(item) => `${item.userId}-${item.date}`}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No attendance records yet.</Text>}
          renderItem={({ item }) => {
            const checkInTime = fmtTime(item.checkInAt || item.markedAt);
            const checkOutTime = fmtTime(item.checkOutAt);
            const hasCheckOut = Boolean(item.checkOutAt);

            return (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.user?.fullName?.slice(0, 2)?.toUpperCase() || "?"}
                  </Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.name}>{item.user?.fullName || "Unknown"}</Text>
                  <Text style={styles.email}>{item.user?.email}</Text>
                  <View style={styles.timePills}>
                    <View style={styles.pillIn}>
                      <Text style={styles.pillInText}>IN {checkInTime}</Text>
                    </View>
                    {hasCheckOut ? (
                      <View style={styles.pillOut}>
                        <Text style={styles.pillOutText}>OUT {checkOutTime}</Text>
                      </View>
                    ) : (
                      <View style={styles.pillPending}>
                        <Text style={styles.pillPendingText}>Not checked out</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.date}>{fmtDate(item.date)}</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
  },
  backBtn: { padding: 4 },
  backText: { color: COLORS.primary, fontWeight: "700", fontSize: 15 },
  header: { fontSize: 20, fontWeight: "800", color: COLORS.onSurface },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    gap: SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: ROUNDNESS.full,
    backgroundColor: COLORS.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  rowInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.onSurface },
  email: { fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 2 },
  timePills: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  pillIn: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDNESS.full,
  },
  pillInText: { color: "#059669", fontSize: 11, fontWeight: "700" },
  pillOut: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDNESS.full,
  },
  pillOutText: { color: "#DC2626", fontSize: 11, fontWeight: "700" },
  pillPending: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDNESS.full,
  },
  pillPendingText: { color: COLORS.onSurfaceVariant, fontSize: 11, fontWeight: "600" },
  date: { fontSize: 13, fontWeight: "600", color: COLORS.onSurface, marginTop: 2 },
  emptyText: {
    textAlign: "center",
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.xl,
  },
  errorText: {
    textAlign: "center",
    color: COLORS.error,
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
});
