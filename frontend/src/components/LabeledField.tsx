import React from "react";
import { Text, View, TextInput } from "react-native";

export default function LabeledField({
  label,
  placeholder,
  keyboardType,
  value,
  onChangeText,
  maxLength,
}: {
  label: string;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
  value: string;
  onChangeText: (t: string) => void;
  maxLength?: number;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          color: "rgba(255,255,255,0.9)",
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.6)"
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        style={{
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.25)",
          backgroundColor: "rgba(255,255,255,0.12)",
          color: "#fff",
          paddingHorizontal: 14,
          paddingVertical: 14,
          borderRadius: 14,
          fontSize: 16,
        }}
      />
    </View>
  );
}
