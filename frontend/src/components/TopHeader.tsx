import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onChangeSearch?: (text: string) => void;
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
};

export default function AppHeader({
  title,
  subtitle,
  showSearch,
  searchPlaceholder,
  searchValue,
  onChangeSearch,
  backgroundColor = "#FFFFFF",
  titleColor = "#111827",
  subtitleColor = "#6B7280",
  style,
  titleStyle,
}: Props) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]}>
      <View style={[styles.wrap, style]}>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: titleColor }, titleStyle]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {showSearch && (
          <View style={styles.searchWrap}>
            <TextInput
              value={searchValue}
              onChangeText={onChangeSearch}
              placeholder={searchPlaceholder}
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#FFFFFF",
  },
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  textWrap: {
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  searchWrap: {
    marginTop: 4,
  },
  searchInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
  },
});
