import React from "react";
import {
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function KeyboardDismissWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  if (Platform.OS === "web") {
    return <>{children}</>;
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableWithoutFeedback>
  );
}
