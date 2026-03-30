import React, { useEffect, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import * as SecureStorage from "expo-secure-store";
import { router } from "expo-router";

export default function MarkAttendence() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  const rules = {
    timeAllow: () => {
      const hour = new Date().getHours();
      return hour < 18 && hour > 9;
    },
    checkedIn: (parsed_date: number) => new Date().getDate() === parsed_date,
    checkedOut: (parsed_date: number, checkedOut: boolean) =>
      new Date().getDate() === parsed_date && checkedOut,
  };

  useEffect(() => {
    const loadStatus = async () => {
      const marked_status = await SecureStorage.getItemAsync("marked_status");

      if (marked_status) {
        const parsed_status = JSON.parse(marked_status);
        const stored_date = new Date(parsed_status.date).getDate();

        setIsCheckedIn(rules.checkedIn(stored_date));
        setIsCheckedOut(
          rules.checkedOut(stored_date, parsed_status?.checkedOut || false),
        );
      }
    };

    loadStatus();
  }, []);

  const renderButton = (label: string, type: string, color: string) => (
    <Pressable
      style={[styles.button, { backgroundColor: color }]}
      onPress={() => router.push(`/scan_qr?type='${type}'`)}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mark Your Attendance</Text>

      {!rules.timeAllow() ? (
        <>
          <Text style={styles.info}>Check-in time is over</Text>
          {!isCheckedOut && renderButton("Time Out", "checkOut", "#e74c3c")}
        </>
      ) : isCheckedOut ? (
        <Text style={styles.success}>✅ You are checked out</Text>
      ) : !isCheckedIn ? (
        renderButton("Check In", "checkIn", "#2ecc71")
      ) : (
        renderButton("Check Out", "checkOut", "#f39c12")
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f7fa",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#2c3e50",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  info: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 15,
  },
  success: {
    fontSize: 16,
    color: "#27ae60",
    fontWeight: "600",
  },
});
