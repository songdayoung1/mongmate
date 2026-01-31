import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import TopHeader from "../../components/TopHeader";
import { login } from "../../api/auth";
import { useAuthStore } from "../../store/auth";

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
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8, color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  primary: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#0ACF83",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondary: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  secondaryText: {
    color: "#4B5563",
    fontSize: 14,
    textDecorationLine: "underline",
  },

  dev: {
    marginTop: 18,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  devText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
