import { useNavigation } from "@react-navigation/native";
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

type BackTarget =
  | string
  | {
      name: string;
      params?: Record<string, any>;
      /**
       * true면 Common goBack처럼 stack pop 시도 후
       * 안 되면 name으로 이동
       */
      preferGoBack?: boolean;
    };

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

  /**
   * ✅ 추가 기능
   * - 함수: onBack={() => ...}
   * - 문자열: onBack="DogManage"
   * - 객체: onBack={{ name:"Main", params:{ screen:"MyPage" } }}
   */
  onBack?: (() => void) | BackTarget;
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

  const goToTarget = (target: BackTarget) => {
    if (typeof target === "string") {
      navigation.navigate(target as never);
      return;
    }

    const { name, params, preferGoBack } = target;

    if (preferGoBack && navigation.canGoBack?.() && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate(name as never, (params ?? {}) as never);
  };

  const handleBack = () => {
    // 1) onBack이 함수면 그대로 실행
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    // 2) onBack이 문자열/객체면 그곳으로 이동
    if (onBack) {
      goToTarget(onBack);
      return;
    }

    // 3) 기본 동작: 스택 pop 우선
    if (navigation.canGoBack?.() && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    // 4) 스택이 없으면 Main으로
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
            <Text style={styles.backIcon}>‹</Text>
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
