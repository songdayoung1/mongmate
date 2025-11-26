import React from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BackHeader from "../../components/BackHeader";
import LabeledField from "../../components/LabeledField";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useAuthStore } from "../../store/auth";
import { useSendOtp, useVerifyOtp } from "../../hooks/auth";

export default function PhoneNumberScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = React.useState("");
  const [showOtp, setShowOtp] = React.useState(false);
  const [code, setCode] = React.useState("");

  const otpRef = React.useRef<TextInput | null>(null);

  const login = useAuthStore((s) => s.login);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 01로 시작 + 10~11자리
  const canSubmitPhone = /^01\d{8,9}$/.test(phone);
  const canSubmitCode = code.length === 6;

  // TODO 생년월일, 이름 추가 + 실패에 대한 알람

  const handlePrimary = async () => {
    if (!showOtp) {
      // 1단계: 휴대폰 번호 체크 → OTP 입력칸 열기
      if (!canSubmitPhone) return;
      setShowOtp(true);
      setTimeout(() => otpRef.current?.focus(), 50);
      await fetch("http://localhost:8080/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      // console.log("????????");

      return;
    }

    // 2단계: 코드 입력 완료 → 로그인/회원가입 처리
    if (!canSubmitCode) return;

    try {
      const mode = await login(phone); // "signup" | "login"

      if (mode === "signup") {
        Alert.alert(
          "환영합니다!",
          "처음 오셨군요! 계정을 만들고 로그인했어요."
        );
      } else {
        Alert.alert("로그인 완료", "다시 오셨네요. 로그인되었습니다.");
      }

      navigation.goBack(); // 마이페이지로 복귀
    } catch (e) {
      Alert.alert("에러", "로그인 처리 중 문제가 발생했습니다.");
    }
  };

  const primaryDisabled = showOtp ? !canSubmitCode : !canSubmitPhone;
  const primaryLabel = showOtp ? "확인" : "인증하기";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0ACF83" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 0}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 60,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ... 기존 아이콘 / 타이틀 UI 그대로 ... */}

        <View
          style={{
            width: 112,
            height: 112,
            borderRadius: 24,
            backgroundColor: "rgba(255,255,255,0.95)",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 4,
          }}
        ></View>

        {/* 타이틀/카피 */}
        <View style={{ alignItems: "center", gap: 6, marginTop: 20 }}>
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900" }}>
            멍멍메이트
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.95)", fontSize: 16 }}>
            함께 걷는 즐거움
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 14,
              textAlign: "center",
              marginTop: 8,
              lineHeight: 20,
            }}
          >
            우리 동네 강아지 친구들과{"\n"}행복한 산책을 시작해보세요
          </Text>
        </View>

        {/* 휴대폰 번호 입력 */}
        <View style={{ width: "100%", marginTop: 24 }}>
          <LabeledField
            label="휴대폰 번호"
            placeholder="01012345678"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/\D/g, ""))}
            maxLength={11}
          />
        </View>

        {/* 인증번호 입력칸 */}
        {showOtp && (
          <View style={{ width: "100%", marginTop: 20, gap: 10 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              인증번호
            </Text>
            <TextInput
              ref={otpRef}
              keyboardType="number-pad"
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              placeholder="6자리 코드 (임시 아무 숫자나)"
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={{
                width: "100%",
                textAlign: "center",
                fontSize: 22,
                color: "#fff",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
                backgroundColor: "rgba(255,255,255,0.12)",
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                letterSpacing: 6,
              }}
            />
          </View>
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      <View
        style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 18 }}
      >
        <Pressable
          onPress={handlePrimary}
          disabled={primaryDisabled}
          style={({ pressed }) => ({
            opacity: primaryDisabled ? 0.4 : pressed ? 0.9 : 1,
            backgroundColor: "#ffffff",
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ color: "#0ACF83", fontSize: 16, fontWeight: "800" }}>
            {primaryLabel}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
