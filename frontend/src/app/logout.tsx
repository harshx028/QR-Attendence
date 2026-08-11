import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import useAuth from "@/hooks/useAuth";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { StatusBar } from "expo-status-bar";

export default function LogoutPage() {
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.replace("/auth/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>⏻</Text>
        </View>
        <Text style={styles.title}>Log Out</Text>
        <Text style={styles.subtitle}>
          {user?.fullName || "You"} will be signed out of your account. Are you sure?
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            (isLoggingOut || pressed) && styles.buttonPressed,
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.logoutButtonText}>Log Out</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
          onPress={() => router.back()}
          disabled={isLoggingOut}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: ROUNDNESS.full,
    backgroundColor: COLORS.tertiaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  icon: {
    fontSize: 40,
    color: COLORS.error,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.onSurface,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: ROUNDNESS.md,
    alignItems: "center",
    width: "100%",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    padding: SPACING.md,
    borderRadius: ROUNDNESS.md,
    alignItems: "center",
    width: "100%",
    marginTop: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.outline,
  },
  cancelButtonText: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
