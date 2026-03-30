import { CameraView } from "expo-camera";
import React, { Component } from "react";
import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const onQrScan = async (token: string) => {};
const ScanQr = () => {
  return (
    <SafeAreaView style={styleSheet.container}>
      <CameraView
        facing="back"
        style={styleSheet.camStyle}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={({ data }) => {
          const marked_status = console.log(data);
        }}
      />
    </SafeAreaView>
  );
};

const styleSheet = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    rowGap: 20,
  },
  camStyle: {
    position: "absolute",
    width: 300,
    height: 300,
  },
});
export default ScanQr;
