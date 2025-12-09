import {
  CommonActions,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  showBack?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onChangeSearch?: (text: string) => void;
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  onBack?: () => void;
};

export default function TopHeader({
  title,
  subtitle,
  showSearch,
  showBack = false,
  searchPlaceholder,
  searchValue,
  onChangeSearch,
  backgroundColor = "#FFFFFF",
  titleColor = "#111827",
  subtitleColor = "#6B7280",
  style,
  titleStyle,
  onBack,
}: Props) {
  const navigation = useNavigation<any>();

  const handleBack = () => {
    // 현재 네비게이터의 스택 상태를 직접 확인
    const state = navigation.getState() as {
      index: number;
      routes: { name: string; params?: object }[];
    };

    // console.log("state index:", state.index);
    // console.log(
    //   "routes:",
    //   state.routes.map((r) => r.name)
    // );

    // 1) 스택에 이전 화면이 있으면 → 그 라우트로 강제 이동
    if (state.index > 0) {
      const prevRoute = state.routes[state.index - 1];
      console.log("🔙 go to prev route:", prevRoute.name);

      navigation.navigate(
        prevRoute.name as never,
        (prevRoute.params || {}) as never
      );

      return;
    }

    // 2) 이전 라우트가 아예 없으면(= 루트 화면이면) → 안전하게 Main 으로
    navigation.navigate("Main" as never);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]}>
      <View style={[styles.wrap, style]}>
        {showBack && (
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text className="text-black" style={styles.backIcon}>
              ‹
            </Text>
          </Pressable>
        )}
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

  backButton: {
    position: "absolute",
    left: 10,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  backIcon: {
    fontSize: 20,
    color: "#111",
    fontWeight: "900",
  },

  textWrap: {
    marginBottom: 6,
    alignItems: "center",
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
