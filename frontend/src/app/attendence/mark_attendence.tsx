import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function MarkAttendence() {
  const [isMarked, setisMarked] = useState(false);

  const markAttendence = (data: object) => {};
  return (
    <>
      {isMarked ? (
        <View>
          <Text> Mark My Attendence </Text>
          <Pressable onPress={() => markAttendence}>
            <Text>Mark Attendence</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <View>Attendence Already Marked</View>
        </View>
      )}
    </>
  );
}
