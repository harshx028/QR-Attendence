import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { router } from "expo-router";
import useAuth from "@/hooks/useAuth";
import { useState } from "react";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";
import { StatusBar } from "expo-status-bar";

const SignupPage = () => {
  //keeping state and onSubmit logic
  type SignupCreds = {
    fullName: string;
    email: string;
    password: string;
  };
  const { control, handleSubmit } = useForm<SignupCreds>();
  const { signup } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: SignupCreds) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await signup(data);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    } catch (error) {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Text style={styles.appName}>Attendance</Text>
            <Text style={styles.tagline}>Join the modern workforce</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Get started with your company account.</Text>

            <View style={styles.form}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full name</Text>
                <Controller
                  control={control}
                  name="fullName"
                  rules={{ required: "Full Name is required" }}
                  render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        style={[styles.input, error && styles.inputError]}
                        placeholder="e.g. Harsh Mishra"
                        placeholderTextColor="#94A3B8"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        editable={!isSubmitting}
                      />
                      {error && <Text style={styles.errorText}>{error.message}</Text>}
                    </>
                  )}
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>
                <Controller
                  control={control}
                  name="email"
                  rules={{ 
                    required: "Email is required",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Invalid email format"
                    }
                  }}
                  render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        style={[styles.input, error && styles.inputError]}
                        placeholder="yourname@company.com"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        editable={!isSubmitting}
                      />
                      {error && <Text style={styles.errorText}>{error.message}</Text>}
                    </>
                  )}
                />
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <Controller
                  control={control}
                  name="password"
                  rules={{ 
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters"
                    }
                  }}
                  render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                    <>
                      <TextInput
                        style={[styles.input, error && styles.inputError]}
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        editable={!isSubmitting}
                      />
                      {error && <Text style={styles.errorText}>{error.message}</Text>}
                    </>
                  )}
                />
              </View>

              {errorMsg && <Text style={styles.serverErrorText}>{errorMsg}</Text>}

              <Pressable 
                style={({ pressed }) => [
                  styles.button, 
                  (isSubmitting || pressed) && styles.buttonPressed
                ]} 
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create account</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Pressable onPress={() => router.push("/auth/login")}>
                <Text style={styles.link}> Sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  appName: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
    fontWeight: "500",
  },
  formContainer: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.onSurface,
    textAlign: "left",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    textAlign: "left",
    marginBottom: SPACING.xl,
    marginTop: 4,
  },
  form: {
    gap: SPACING.md,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginLeft: 2,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: ROUNDNESS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.onSurface,
    borderWidth: 1.5,
    borderColor: COLORS.outline,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 2,
    marginLeft: 2,
  },
  serverErrorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
    marginTop: 4,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: ROUNDNESS.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.xl,
    gap: 4,
  },
  footerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
  },
  link: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
});

