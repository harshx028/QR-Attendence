import { CameraView, useCameraPermissions } from "expo-camera";

import React, { useRef, useState } from "react";
import { Text, View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS, SPACING, ROUNDNESS } from "@/constants/Theme";

const ScanQr = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    router.replace({ pathname: "/attendence/mark_attendence", params: { token: data } });
  };

  if (!permission) {
    return (
      <SafeAreaView style={styleSheet.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styleSheet.container}>
        <Text style={styleSheet.permissionText}>
          Camera access is needed to scan the attendance QR code.
        </Text>
        <Pressable style={styleSheet.permissionButton} onPress={requestPermission}>
          <Text style={styleSheet.permissionButtonText}>Grant Camera Access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styleSheet.container}>
      <CameraView
        facing="back"
        style={styleSheet.camStyle}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <Text style={styleSheet.hint}>Position the QR code within the frame</Text>
    </SafeAreaView>
  );
};

const styleSheet = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    rowGap: 20,
    padding: SPACING.lg,
  },
  camStyle: {
    width: 300,
    height: 300,
    borderRadius: ROUNDNESS.lg,
    overflow: "hidden",
  },
  hint: {
    position: "absolute",
    bottom: 60,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: ROUNDNESS.full,
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
export default ScanQr;
