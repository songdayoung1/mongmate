// screens/auth/SignupInfoScreen.tsx
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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import TopHeader from "../../components/TopHeader";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CARRIERS = [
  "SKT",
  "KT",
  "LG U+",
  "SKT 알뜰폰",
  "KT 알뜰폰",
  "LG U+ 알뜰폰",
] as const;

type Carrier = (typeof CARRIERS)[number];
// 단계: 1 = 번호, 2 = 통신사, 3 = 이름, 4 = 생년월일+뒷자리
type Step = 1 | 2 | 3 | 4;

export default function SignupInfoScreen() {
  const navigation = useNavigation<Nav>();

  const [step, setStep] = React.useState<Step>(1);

  const [phone, setPhone] = React.useState("");
  const [phoneLocked, setPhoneLocked] = React.useState(false);

  const [carrier, setCarrier] = React.useState<Carrier | null>(null);
  const [carrierOpen, setCarrierOpen] = React.useState(false);

  const [name, setName] = React.useState("");
  const [birth, setBirth] = React.useState(""); // 6자리
  const [idDigit, setIdDigit] = React.useState(""); // 1자리

  const cleanPhone = phone.replace(/\D/g, "");

  const validPhone = /^01\d{8,9}$/.test(cleanPhone);
  const validCarrier = !!carrier;
  const validName = name.trim().length > 1;
  const validBirth = /^\d{6}$/.test(birth);
  const validIdDigit = /^[1-4]$/.test(idDigit);

  const currentStepValid = (() => {
    switch (step) {
      case 1:
        return validPhone;
      case 2:
        return validCarrier;
      case 3:
        return validName;
      case 4:
        return validBirth && validIdDigit;
      default:
        return false;
    }
  })();

  const primaryLabel = step === 4 ? "다음 (인증번호 받기)" : "다음";

  const handleNext = () => {
    if (!currentStepValid) {
      Alert.alert("확인", "현재 단계의 정보를 정확히 입력해주세요.");
      return;
    }

    // TODO: 각 단계별 서버 검증을 여기에 붙이면 됨

    if (step === 1) {
      // 번호 확정 → 인풋 잠금 + 통신사 단계로 이동
      setPhoneLocked(true);
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step === 3) {
      setStep(4);
      return;
    }

    // step === 4 : 여기서는 일단 값만 확인 (나중에 AuthOtp로 이동)
    navigation.navigate("AuthOtp", {
      mode: "signup",
      phone: cleanPhone,
      carrier: carrier!,
      name: name.trim(),
      birth,
      idDigit,
    });

    // Alert.alert(
    //   "입력 정보 확인",
    //   `번호: ${cleanPhone}\n통신사: ${carrier}\n이름: ${name}\n생년월일: ${birth}-${idDigit}******`
    // );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <TopHeader title="회원가입" showBack />

      <View style={styles.container}>
        {/* 1단계: 휴대폰 번호 (항상 보이지만, 2단계부터는 잠금) */}
        <Text style={styles.label}>휴대폰 번호</Text>
        <TextInput
          style={[
            styles.input,
            phoneLocked && {
              backgroundColor: "#E5E7EB",
              color: "#6B7280",
            },
          ]}
          placeholder="01012345678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(t) => !phoneLocked && setPhone(t.replace(/\D/g, ""))}
          maxLength={11}
          editable={!phoneLocked}
        />

        {/* 2단계: 통신사 선택 (step >= 2 에서만 보이게) */}
        {step >= 2 && (
          <>
            <Text style={styles.label}>통신사</Text>
            <TouchableOpacity
              style={styles.dropdown}
              activeOpacity={0.8}
              onPress={() => setCarrierOpen((prev) => !prev)}
            >
              <Text
                style={[styles.dropdownText, !carrier && { color: "#9CA3AF" }]}
              >
                {carrier || "통신사를 선택해주세요"}
              </Text>
            </TouchableOpacity>

            {carrierOpen && (
              <View style={styles.dropdownList}>
                {CARRIERS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCarrier(c);
                      setCarrierOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* 3단계: 명의자 이름 */}
        {step >= 3 && (
          <>
            <Text style={styles.label}>휴대폰 명의자 이름</Text>
            <TextInput
              style={styles.input}
              placeholder="홍길동"
              value={name}
              onChangeText={setName}
            />
          </>
        )}

        {/* 4단계: 생년월일 + 뒷자리 1 */}
        {step >= 4 && (
          <>
            <Text style={styles.label}>생년월일 / 뒷자리</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="예) 970207"
                keyboardType="number-pad"
                maxLength={6}
                value={birth}
                onChangeText={(t) => setBirth(t.replace(/\D/g, "").slice(0, 6))}
              />
              <TextInput
                style={[styles.input, { width: 60, textAlign: "center" }]}
                placeholder="1"
                keyboardType="number-pad"
                maxLength={1}
                value={idDigit}
                onChangeText={(t) =>
                  setIdDigit(t.replace(/\D/g, "").slice(0, 1))
                }
              />
            </View>
          </>
        )}

        {/* 하단 버튼 */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            !currentStepValid && styles.nextButtonDisabled,
          ]}
          disabled={!currentStepValid}
          activeOpacity={0.9}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>{primaryLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
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
    fontSize: 14,
    color: "#111827",
  },
  // 드롭다운
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
  },
  dropdownText: {
    fontSize: 14,
    color: "#111827",
  },
  dropdownList: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  nextButton: {
    marginTop: 32,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#0ACF83",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  nextText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
