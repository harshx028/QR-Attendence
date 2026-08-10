import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import useAuth from "@/hooks/useAuth";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { getAllAttendance } from "@/api/attendance.api";

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
      <Text style={styles.header}>Attendance Records</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={attendances}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No attendance records yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.user?.fullName?.slice(0, 2)?.toUpperCase() || "?"}
                </Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.name}>{item.user?.fullName || "Unknown"}</Text>
                <Text style={styles.email}>{item.user?.email}</Text>
              </View>
              <View style={styles.timeInfo}>
                <Text style={styles.date}>
                  {new Date(item.markedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
                <Text style={styles.time}>
                  {new Date(item.markedAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.onSurface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  rowInfo: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.onSurface,
  },
  email: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  timeInfo: {
    alignItems: "flex-end",
  },
  date: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurface,
  },
  time: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
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
