import { useRouter } from "expo-router";
import { Text, View, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import useServerConfig from "@/context/ServerConfigContext";

export default function ServerConfig() {
  const router = useRouter();
  const { setServerUrl, serverUrl } = useServerConfig();
  const [url, setUrl] = useState(serverUrl || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a valid server URL");
      return;
    }

    // Basic validation
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      Alert.alert("Error", "URL must start with http:// or https://");
      return;
    }

    setIsLoading(true);
    try {
      await setServerUrl(url);
      Alert.alert("Success", "Server URL configured successfully", [
        {
          text: "Continue",
          onPress: () => router.replace("/auth/login"),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save server URL");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Configure Server</Text>
          <Text style={styles.subtitle}>Enter the backend server URL to connect</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Server URL</Text>
          <TextInput
            style={styles.input}
            placeholder="http://192.168.1.100:5000"
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Example: http://192.168.1.100:5000 or https://your-server.com
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save and Continue</Text>
          )}
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
    padding: SPACING.xl,
    justifyContent: "center",
  },
  header: {
    marginBottom: SPACING.xxl,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
  },
  form: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: ROUNDNESS.lg,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.onSurface,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  hint: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.xs,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
