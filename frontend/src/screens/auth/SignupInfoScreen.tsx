// screens/auth/SignupInfoScreen.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import TopHeader from "../../components/TopHeader";
import { sendSmsCode } from "../../api/auth";

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

export default function SignupInfoScreen() {
  const navigation = useNavigation<Nav>();

  const [phone, setPhone] = React.useState("");
  const [carrier, setCarrier] = React.useState<Carrier | null>(null);
  const [carrierOpen, setCarrierOpen] = React.useState(false);

  const [name, setName] = React.useState("");
  const [birth, setBirth] = React.useState(""); // 6자리
  const [idDigit, setIdDigit] = React.useState(""); // 1자리

  const cleanPhone = phone.replace(/\D/g, "");

  const validPhone = /^01\d{9}$/.test(cleanPhone);
  const validCarrier = !!carrier;
  const validName = name.trim().length > 1;
  const validBirth = /^\d{6}$/.test(birth);
  const validIdDigit = /^[1-4]$/.test(idDigit);

  const nameInputRef = React.useRef<TextInput>(null);
  const [nameConfirmed, setNameConfirmed] = React.useState(false);

  React.useEffect(() => {
    setNameConfirmed(false);
  }, [carrier]);

  // ✅ 자동 노출 조건
  const showCarrier = validPhone;
  const showName = validPhone && validCarrier;
  const showBirth = validPhone && validCarrier && nameConfirmed;

  // ✅ 마지막까지 유효해야 버튼 등장
  const canRequestOtp =
    validPhone && validCarrier && validName && validBirth && validIdDigit;

  /**
   * ✅ 번호가 "유효해지는 순간" 자동으로 통신사 리스트 오픈
   * - 처음 유효해질 때만 열리게(prevValidPhone 비교)
   * - carrier가 아직 없을 때만 열리게 (선택되어 있으면 굳이 다시 열 필요 X)
   */
  const prevValidPhoneRef = React.useRef(false);
  React.useEffect(() => {
    const prev = prevValidPhoneRef.current;

    // false -> true 로 바뀌는 순간
    if (!prev && validPhone) {
      if (!carrier) {
        setCarrierOpen(true);
      }
      // UX: 번호 입력 완료 순간 키보드 내리면 리스트가 잘 보임
      Keyboard.dismiss();
    }

    // true -> false 로 바뀌면(번호 다시 수정해서 깨짐) 드롭다운 닫기 + 선택 초기화(선택)
    if (prev && !validPhone) {
      setCarrierOpen(false);
      setCarrier(null);
      setName("");
      setBirth("");
      setIdDigit("");
    }

    prevValidPhoneRef.current = validPhone;
  }, [validPhone, carrier]);

  const handleRequestOtp = async () => {
    if (!canRequestOtp) return;

    try {
      await sendSmsCode(cleanPhone);

      navigation.navigate("AuthOtp", {
        mode: "signup",
        phoneNumber: cleanPhone,
        carrier: carrier!,
        name: name.trim(),
        birth,
        idDigit,
      });
    } catch (e) {
      Alert.alert(
        "오류",
        "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <TopHeader title="회원가입" showBack />

      <View style={styles.container}>
        {/* ✅ 최종 순서(위→아래): 생년월일 → 이름 → 통신사 → 번호 → 버튼 */}

        {/* 4) 생년월일 + 뒷자리 1 */}
        {showBirth && (
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

            {birth.length > 0 && !validBirth && (
              <Text style={styles.helpText}>
                생년월일은 6자리로 입력해 주세요.
              </Text>
            )}
            {idDigit.length > 0 && !validIdDigit && (
              <Text style={styles.helpText}>
                뒷자리는 1~4 중 하나로 입력해 주세요.
              </Text>
            )}
          </>
        )}

        {/* 3) 이름 */}
        {showName && (
          <>
            <Text style={styles.label}>휴대폰 명의자 이름</Text>
            <TextInput
              ref={nameInputRef}
              style={styles.input}
              placeholder="홍길동"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (nameConfirmed) setNameConfirmed(false);
              }}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (validName) setNameConfirmed(true);
              }}
            />
            {!validName && name.length > 0 && (
              <Text style={styles.helpText}>
                이름을 2자 이상 입력해 주세요.
              </Text>
            )}

            {/* ✅ 이름 입력 후 '다음' 버튼 */}
            <TouchableOpacity
              style={[
                styles.nameNextButton,
                !validName && styles.nameNextButtonDisabled,
              ]}
              disabled={!validName}
              activeOpacity={0.9}
              onPress={() => setNameConfirmed(true)}
            >
              <Text style={styles.nameNextText}>다음</Text>
            </TouchableOpacity>
          </>
        )}

        {/* 2) 통신사 */}
        {showCarrier && (
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

                      // 드롭다운 닫힌 다음 렌더 후 포커스
                      requestAnimationFrame(() => {
                        setTimeout(() => nameInputRef.current?.focus(), 30);
                      });
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* 1) 휴대폰 번호 (맨 아래) */}
        <Text style={styles.label}>휴대폰 번호</Text>
        <TextInput
          style={styles.input}
          placeholder="01012345678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/\D/g, ""))}
          maxLength={11}
        />
        {!validPhone && phone.length > 0 && (
          <Text style={styles.helpText}>번호를 정확히 입력해 주세요.</Text>
        )}

        {/* 버튼(마지막까지 입력 완료 시에만 생성) */}
        {canRequestOtp && (
          <TouchableOpacity
            style={styles.nextButton}
            activeOpacity={0.9}
            onPress={handleRequestOtp}
          >
            <Text style={styles.nextText}>인증번호 받기</Text>
          </TouchableOpacity>
        )}
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
  helpText: {
    marginTop: 6,
    fontSize: 12,
    color: "#EF4444",
  },
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
  nextText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  nameNextButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  nameNextButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  nameNextText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
