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
import { sendSmsCode, verifySmsCode, signup, login } from "../../api/auth";
import { deriveDobAndGender } from "../../utils/koreanId";
import { useAuthStore } from "../../store/auth";
import type { AuthState } from "../../store/auth";

type Nav = NativeStackNavigationProp<RootStackParamList, "AuthOtp">;
type AuthOtpRoute = RouteProp<RootStackParamList, "AuthOtp">;

const OTP_DURATION = 3 * 60;

export default function AuthOtpScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<AuthOtpRoute>();

  const {
    mode,
    phoneNumber: initialPhoneNumber,
    carrier,
    name,
    birth,
    idDigit,
  } = route.params;

  const setSession = useAuthStore((s: AuthState) => s.setSession);

  const [phone, setPhone] = React.useState(initialPhoneNumber ?? "");
  const [phoneLocked, setPhoneLocked] = React.useState(mode === "signup");

  const [code, setCode] = React.useState("");
  const [timer, setTimer] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);

  const cleanPhone = phone.replace(/\D/g, "");
  const validPhone = /^01\d{8,9}$/.test(cleanPhone);
  const canRequestOtp = validPhone;

  React.useEffect(() => {
    // 회원가입에서 넘어온 경우: 첫 진입부터 3분 타이머 시작
    if (mode === "signup") {
      setTimer(OTP_DURATION);
      setIsRunning(true);
      setPhoneLocked(true);
    }
  }, [mode]);

  // 타이머
  React.useEffect(() => {
    if (!isRunning) return;
    if (timer <= 0) {
      setIsRunning(false);
      return;
    }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
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
      await sendSmsCode(cleanPhone);
      setPhoneLocked(true);
      setCode("");
      setTimer(OTP_DURATION);
      setIsRunning(true);
      Alert.alert("알림", "인증번호를 발송했어요.");
    } catch (e: any) {
      Alert.alert(
        "에러",
        e?.message ?? "인증번호 요청 중 문제가 발생했습니다."
      );
    }
  };

  const handleVerify = async () => {
    navigation.navigate("Main");

    if (code.length !== 6) {
      Alert.alert("확인", "6자리 인증번호를 입력해주세요.");
      return;
    }
    if (!isRunning) {
      Alert.alert("확인", "인증 유효 시간이 지났어요. 다시 요청해주세요.");
      return;
    }

    try {
      const { success } = await verifySmsCode(cleanPhone, code);
      console.log("success ==> ", success);
      if (!success) {
        Alert.alert("실패", "인증번호가 올바르지 않습니다.");
        return;
      }

      if (mode === "signup") {
        if (!name || !birth || !idDigit) {
          Alert.alert("에러", "회원가입 정보가 누락되었습니다.");
          return;
        }

        const { dateOfBirth, gender } = deriveDobAndGender(birth, idDigit);

        const res = await signup({
          name,
          dateOfBirth,
          gender,
          phoneNumber: cleanPhone,
          marketingAgreed: false,
        });

        await setSession({
          userId: res.userId,
          phoneNumber: cleanPhone,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        });
        console.log("가입 후 토큰:", res.accessToken);
        return;
      }
      navigation.navigate("Main");

      // // login 모드
      // const res = await login(cleanPhone);

      // await setSession({
      //   userId: res.userId,
      //   phoneNumber: cleanPhone,
      //   accessToken: res.accessToken,
      //   refreshToken: res.refreshToken,
      // });

      // navigation.navigate("Main");
    } catch (e: any) {
      Alert.alert("에러", e?.message ?? "인증 처리 중 문제가 발생했습니다.");
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
        {/* 회원가입 모드에서만 요약 */}
        {/* {mode === "signup" && (
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
            {!!cleanPhone && (
              <>
                <Text style={styles.summaryLabel}>번호</Text>
                <Text style={styles.summaryValue}>{cleanPhone}</Text>
              </>
            )}
          </View>
        )} */}

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
