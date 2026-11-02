import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef } from "react";
import { Text, View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";

export default function GuestScan() {
  const { guestName, guestPhone } = useLocalSearchParams<{ guestName: string; guestPhone: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    router.replace({
      pathname: "/guest/confirm",
      params: { token: data, guestName, guestPhone },
    });
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>
          Camera access is needed to scan the attendance QR code.
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.name}>{guestName}</Text>
      <CameraView
        facing="back"
        style={styles.camStyle}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <Text style={styles.hint}>Position the QR code within the frame</Text>
      <Pressable onPress={() => router.replace("/guest")}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    rowGap: 20,
    padding: SPACING.lg,
  },
  name: { color: "#fff", fontSize: 16, fontWeight: "700" },
  camStyle: { width: 300, height: 300, borderRadius: ROUNDNESS.lg, overflow: "hidden" },
  hint: { position: "absolute", bottom: 80, color: "#fff", fontSize: 14, fontWeight: "600" },
  back: { position: "absolute", bottom: 40, color: "#94A3B8", fontSize: 14, fontWeight: "600" },
  permissionText: { color: "#fff", fontSize: 16, textAlign: "center" },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: ROUNDNESS.full,
  },
  permissionButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
