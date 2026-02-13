import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import TopHeader from "../../components/TopHeader";
import { login } from "../../api/auth";
import { useAuthStore } from "../../store/auth";
import { COLORS, SHADOWS, SIZES } from "../../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEV_PHONE = "01040014908";

export default function AuthStartScreen() {
  const navigation = useNavigation<Nav>();
  const setSession = useAuthStore((s) => s.setSession);
  const setTokens = useAuthStore((s) => s.setTokens);

  const onDevLogin = async () => {
    try {
      const res = await login(DEV_PHONE);

      await setSession({
        userId: res.userId,
        phoneNumber: DEV_PHONE,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      await setTokens(res.accessToken, res.refreshToken);

      navigation.navigate("Main");
    } catch (e: any) {
      Alert.alert("개발 로그인 실패", e?.message ?? "로그인 실패");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title="멍메이트" showBack={false} />
      <View style={styles.content}>
        <Text style={styles.title}>시작해볼까요?</Text>
        <Text style={styles.subtitle}>
          휴대폰 번호로 간편하게 회원가입 / 로그인 할 수 있어요.
        </Text>

        <TouchableOpacity
          style={styles.primary}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("SignupInfo")}
        >
          <Text style={styles.primaryText}>회원가입</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondary}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("AuthOtp", { mode: "login", phoneNumber: "" })
          }
        >
          <Text style={styles.secondaryText}>이미 계정이 있어요 · 로그인</Text>
        </TouchableOpacity>

        {/* ✅ 개발모드 전용: 문자 없이 바로 토큰 발급 */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.dev}
            activeOpacity={0.9}
            onPress={onDevLogin}
          >
            <Text style={styles.devText}>개발 로그인 · {DEV_PHONE}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
    color: COLORS.textMain,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSub,
    marginBottom: 32,
    lineHeight: 24,
  },
  primary: {
    height: 56,
    borderRadius: SIZES.radius.xl,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },
  primaryText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
  },
  secondary: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  secondaryText: {
    color: COLORS.textSub,
    fontSize: 14,
    textDecorationLine: "underline",
    fontWeight: "500",
  },

  dev: {
    marginTop: 24,
    height: 48,
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.textMain,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },
  devText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
});
