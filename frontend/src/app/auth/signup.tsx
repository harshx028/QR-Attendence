import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { router } from "expo-router";
import { useState } from "react";
import { signup } from "@/api/auth.api";

const SignupPage = () => {
  const { control, handleSubmit } = useForm();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sucessMsg, setSucessMsg] = useState<string | null>(null);
  type SignupCreds = {
    full_name: string;
    email: string;
    password: string;
  };
  const onSubmit = async (data: SignupCreds) => {
    const res = await signup(data);
    if (res) {
      setSucessMsg(res?.msg || "Signed Up Sucessfully");
      return router.push("/");
    } else {
      return setErrorMsg(res?.msg || "Signuped Up Failed");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.label}>Full Name</Text>
        <Controller
          control={control}
          name="full_name"
          rules={{ required: "Full name is required" }}
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <Controller
          control={control}
          name="email"
          rules={{ required: "Email is required" }}
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <Controller
          control={control}
          name="password"
          rules={{ required: "Password is required" }}
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Pressable style={styles.button} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.buttonText}>Signup</Text>
        </Pressable>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => router.push("/auth/signup")}>
            <Text style={styles.link}> Login</Text>
          </Pressable>
        </View>
        {sucessMsg && <Text style={{ color: "green" }}>{sucessMsg}</Text>}
        {errorMsg && <Text style={{ color: "red" }}>{errorMsg}</Text>}
      </View>
    </SafeAreaView>
  );
};

export default SignupPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    color: "#555",
  },
  link: {
    color: "#4f46e5",
    fontWeight: "600",
  },
});
