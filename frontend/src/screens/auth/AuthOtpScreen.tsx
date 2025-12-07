// screens/auth/AuthOtpScreen.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import TopHeader from "../../components/TopHeader";

type Nav = NativeStackNavigationProp<RootStackParamList, "AuthOtp">;
type AuthOtpRoute = RouteProp<RootStackParamList, "AuthOtp">;

const OTP_DURATION = 3 * 60; // 3분 (초 단위)

export default function AuthOtpScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<AuthOtpRoute>();

  const {
    mode,
    phone: initialPhone,
    carrier,
    name,
    birth,
    idDigit,
  } = route.params;

  // 로그인 모드: 처음엔 번호 수정 가능
  // 회원가입 모드: 이미 이전 단계에서 번호 확정 → 수정 불가
  const [phone, setPhone] = React.useState(initialPhone ?? "");
  const [phoneLocked, setPhoneLocked] = React.useState(mode === "signup");

  const [code, setCode] = React.useState("");
  const [timer, setTimer] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);

  const cleanPhone = phone.replace(/\D/g, "");
  const validPhone = /^01\d{8,9}$/.test(cleanPhone);
  const canRequestOtp = validPhone; // 타이머 상관없이, 일단 번호만 맞으면 요청 가능

  // 타이머 Effect
  React.useEffect(() => {
    if (!isRunning) return;
    if (timer <= 0) {
      setIsRunning(false);
      return;
    }

    const id = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, timer]);

  const formattedTimer = React.useMemo(() => {
    const m = Math.floor(timer / 60)
      .toString()
      .padStart(2, "0");
    const s = (timer % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [timer]);

  const handleRequestOtp = async () => {
    if (!validPhone) {
      Alert.alert("확인", "올바른 휴대폰 번호를 입력해주세요.");
      return;
    }

    try {
      // TODO: 실제 서버 호출은 나중에
      // await fetch("http://localhost:8080/api/auth/otp/request", {...});

      // 임시: 그냥 성공했다고 치고 타이머 시작
      setPhoneLocked(true); // ✅ 번호 확정
      setCode("");
      setTimer(OTP_DURATION); // 3분
      setIsRunning(true);

      Alert.alert("알림", "인증번호를 발송했어요. (임시 성공 처리)");
    } catch (e) {
      Alert.alert("에러", "인증번호 요청 중 문제가 발생했습니다.");
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("확인", "6자리 인증번호를 입력해주세요.");
      return;
    }

    if (!isRunning) {
      Alert.alert("확인", "인증 유효 시간이 지났어요. 다시 요청해주세요.");
      return;
    }

    try {
      // TODO: 실제 서버 verify는 나중에
      // await verifyOtp({ phone: cleanPhone, code });

      // 🔥 임시: 그냥 무조건 성공 처리
      if (mode === "signup") {
        Alert.alert(
          "가입 완료",
          `${name ?? ""}님, 회원가입이 완료되었습니다.`,
          [
            {
              text: "확인",
              onPress: () => {
                // TODO: 여기서 실제로는 useAuthStore에 유저 저장 + 메인으로
                navigation.navigate("Main");
              },
            },
          ]
        );
      } else {
        Alert.alert("로그인 완료", "다시 오셨네요. 로그인되었습니다.", [
          {
            text: "확인",
            onPress: () => {
              navigation.navigate("Main");
            },
          },
        ]);
      }
    } catch (e) {
      Alert.alert("에러", "인증 처리 중 문제가 발생했습니다.");
    }
  };

  const canVerify = code.length === 6 && isRunning;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <TopHeader
        title={mode === "signup" ? "휴대폰 인증" : "로그인"}
        showBack
      />

      <View style={styles.container}>
        {/* ✅ 회원가입 모드: 위쪽에 최종 요약 */}
        {mode === "signup" && (
          <View style={styles.summaryBox}>
            {birth && idDigit && (
              <>
                <Text style={styles.summaryLabel}>생년월일</Text>
                <Text style={styles.summaryValue}>
                  {birth}-{idDigit}******
                </Text>
              </>
            )}

            {name && (
              <>
                <Text style={styles.summaryLabel}>이름</Text>
                <Text style={styles.summaryValue}>{name}</Text>
              </>
            )}

            {carrier && (
              <>
                <Text style={styles.summaryLabel}>통신사</Text>
                <Text style={styles.summaryValue}>{carrier}</Text>
              </>
            )}

            {cleanPhone && (
              <>
                <Text style={styles.summaryLabel}>번호</Text>
                <Text style={styles.summaryValue}>{cleanPhone}</Text>
              </>
            )}
          </View>
        )}

        {/* ✅ 번호 입력 (로그인은 처음엔 수정 가능, 회원가입은 잠김) */}
        <Text style={styles.label}>휴대폰 번호</Text>
        <TextInput
          style={[
            styles.input,
            phoneLocked && { backgroundColor: "#E5E7EB", color: "#6B7280" },
          ]}
          placeholder="01012345678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(t) => !phoneLocked && setPhone(t.replace(/\D/g, ""))}
          maxLength={11}
          editable={!phoneLocked}
        />

        {/* ✅ 인증번호 요청 버튼 */}
        <TouchableOpacity
          style={[
            styles.requestButton,
            !canRequestOtp && styles.requestButtonDisabled,
          ]}
          disabled={!canRequestOtp}
          activeOpacity={0.9}
          onPress={handleRequestOtp}
        >
          <Text style={styles.requestText}>
            {phoneLocked ? "인증번호 다시 받기" : "인증번호 받기"}
          </Text>
        </TouchableOpacity>

        {/* ✅ 타이머 + 인증번호 입력 */}
        <View style={styles.otpHeader}>
          <Text style={styles.label}>인증번호</Text>
          <Text style={styles.timer}>
            {isRunning ? formattedTimer : "03:00"}
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="6자리 코드"
          keyboardType="number-pad"
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
        />

        <TouchableOpacity
          style={[
            styles.verifyButton,
            !canVerify && styles.verifyButtonDisabled,
          ]}
          disabled={!canVerify}
          activeOpacity={0.9}
          onPress={handleVerify}
        >
          <Text style={styles.verifyText}>
            {mode === "signup" ? "가입 완료하기" : "로그인"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  summaryBox: {
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    padding: 12,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  requestButton: {
    marginTop: 16,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#0ACF83",
    alignItems: "center",
    justifyContent: "center",
  },
  requestButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  requestText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  otpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
  },
  timer: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
  verifyButton: {
    marginTop: 20,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#0ACF83",
    alignItems: "center",
    justifyContent: "center",
  },
  verifyButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  verifyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
