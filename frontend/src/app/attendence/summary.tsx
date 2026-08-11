import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useRouter } from "expo-router";
import useAuth from "@/hooks/useAuth";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { getAdminSummary } from "@/api/attendance.api";

type AttendanceRecord = { id: string; markedAt: string };

type UserSummary = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  present: number;
  absent: number;
  elapsed: number;
  attendance: AttendanceRecord[];
};

export default function AdminSummary() {
  const { user, isLoading: authLoading } = useAuth();
  const [summary, setSummary] = useState<UserSummary[]>([]);
  const [monthInfo, setMonthInfo] = useState<{ month: number; year: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    const res = await getAdminSummary();
    if (res?.success) {
      setSummary(res.summary || []);
      setMonthInfo({ month: res.month, year: res.year });
      setError(null);
    } else {
      setError(res?.message || "Failed to load summary");
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
      await fetchSummary();
      setIsLoading(false);
    })();
  }, [authLoading, user]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSummary();
    setIsRefreshing(false);
  };

  if (authLoading || user?.role !== "ADMIN") {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const monthName = monthInfo
    ? new Date(monthInfo.year, monthInfo.month - 1, 1).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : "";

  const renderRecords = (attendance: AttendanceRecord[]) => {
    if (attendance.length === 0) {
      return <Text style={styles.noRecords}>No attendance marked this month.</Text>;
    }
    return (
      <View style={styles.recordsList}>
        {attendance.map((a) => (
          <View key={a.id} style={styles.recordRow}>
            <Text style={styles.recordDate}>
              {new Date(a.markedAt).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </Text>
            <Text style={styles.recordTime}>
              {new Date(a.markedAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderItem = ({ item }: { item: UserSummary }) => {
    const expanded = expandedId === item.id;
    return (
      <View style={styles.card}>
        <Pressable style={styles.cardHeader} onPress={() => setExpandedId(expanded ? null : item.id)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.fullName?.slice(0, 2)?.toUpperCase() || "?"}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.recordCount}>
              {item.attendance.length} record{item.attendance.length === 1 ? "" : "s"}
            </Text>
          </View>
          <Text style={styles.expandIcon}>{expanded ? "−" : "+"}</Text>
        </Pressable>

        {expanded && (
          <View style={styles.cardBody}>
            {renderRecords(item.attendance)}
            <View style={styles.summaryRow}>
              <View style={[styles.badge, { backgroundColor: "#D1FAE5" }]}>
                <Text style={[styles.badgeValue, { color: "#059669" }]}>{item.present}</Text>
                <Text style={[styles.badgeLabel, { color: "#059669" }]}>Present</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: "#FFE4E6" }]}>
                <Text style={[styles.badgeValue, { color: "#E11D48" }]}>{item.absent}</Text>
                <Text style={[styles.badgeLabel, { color: "#E11D48" }]}>Absent</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: "#E0F2FE" }]}>
                <Text style={[styles.badgeValue, { color: "#0284C7" }]}>{item.elapsed}</Text>
                <Text style={[styles.badgeLabel, { color: "#0284C7" }]}>Elapsed</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const totalPresent = summary.reduce((sum, u) => sum + u.present, 0);
  const totalAbsent = summary.reduce((sum, u) => sum + u.absent, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>
      <Text style={styles.header}>Team Summary</Text>
      <Text style={styles.subtitle}>{monthName}</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={summary}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
          renderItem={renderItem}
          ListFooterComponent={
            <View style={styles.footerCard}>
              <Text style={styles.footerTitle}>Month Summary</Text>
              <View style={styles.footerStats}>
                <View style={styles.footerStat}>
                  <Text style={[styles.footerValue, { color: "#059669" }]}>{totalPresent}</Text>
                  <Text style={styles.footerLabel}>Total Present</Text>
                </View>
                <View style={styles.footerStat}>
                  <Text style={[styles.footerValue, { color: "#E11D48" }]}>{totalAbsent}</Text>
                  <Text style={styles.footerLabel}>Total Absent</Text>
                </View>
                <View style={styles.footerStat}>
                  <Text style={[styles.footerValue, { color: COLORS.primary }]}>{summary.length}</Text>
                  <Text style={styles.footerLabel}>Employees</Text>
                </View>
              </View>
            </View>
          }
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
  topBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.onSurface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: ROUNDNESS.lg,
    marginBottom: SPACING.md,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: ROUNDNESS.full,
    backgroundColor: COLORS.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.onSurface,
  },
  email: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  recordCount: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
  },
  expandIcon: {
    fontSize: 22,
    color: COLORS.onSurfaceVariant,
    fontWeight: "700",
  },
  cardBody: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  recordsList: {
    gap: 6,
  },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: ROUNDNESS.sm,
    paddingHorizontal: SPACING.md,
  },
  recordDate: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurface,
  },
  recordTime: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  noRecords: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontStyle: "italic",
  },
  summaryRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  badge: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderRadius: ROUNDNESS.md,
  },
  badgeValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  footerCard: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: ROUNDNESS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  footerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerStat: {
    alignItems: "center",
    flex: 1,
  },
  footerValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  footerLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
    textAlign: "center",
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
