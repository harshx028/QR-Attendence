import { useRouter } from "expo-router";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";

export default function Index() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login"); 
    }
  }, [isAuthenticated]);
  const isPermissionGranted = Boolean(permission?.granted);
  if (!isPermissionGranted) {
    requestPermission();
    return null;
  }
  return (
    <View style={styles.container}>
      <Text>Hello Sir Scan the Qr for the Attendence</Text>
      {permission?.granted ? (
        <Pressable onPress={() => router.push("/scan_qr")}>
          <Text>Scan QR</Text>
        </Pressable>
      ) : (
        <Text>Camera Permission not granted</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
