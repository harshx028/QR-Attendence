import { AuthProvider } from "@/context/AuthContext";
import { ServerConfigProvider } from "@/context/ServerConfigContext";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import useAuth from "@/hooks/useAuth";
import useServerConfig from "@/context/ServerConfigContext";
import { View, ActivityIndicator } from "react-native";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isConfigured, isLoading: configLoading } = useServerConfig();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || configLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const inServerConfig = segments[0] === "server-config";

    if (!isConfigured && !inServerConfig) {
      router.replace("/server-config");
      return;
    }

    if (isConfigured && !isAuthenticated && !inAuthGroup && !inServerConfig) {
      // Redirect to the login page if not authenticated and not in the auth group
      router.replace("/auth/login");
    } else if (isConfigured && isAuthenticated && (inAuthGroup || inServerConfig)) {
      // Redirect to the home page if authenticated
      router.replace("/");
    }
  }, [isAuthenticated, segments, authLoading, isConfigured, configLoading]);

  if (authLoading || configLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ServerConfigProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <RouteGuard>
            <Stack screenOptions={{ headerShown: false }} />
          </RouteGuard>
        </SafeAreaProvider>
      </AuthProvider>
    </ServerConfigProvider>
  );
}

