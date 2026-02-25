import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import TopHeader from "../../components/TopHeader";
import AnimatedButton from "../../components/AnimatedButton";
import { COLORS, SIZES, SHADOWS } from "../../constants/theme";
import { upsertProfile } from "../../api/profile";

type Nav = NativeStackNavigationProp<RootStackParamList, "GuardianProfileSetup">;

const ADJECTIVES = [
  "행복한", "즐거운", "용감한", "활기찬", "멋진", "귀여운", "사랑스러운", "신나는", "다정한", "따뜻한"
];
const NOUNS = [
  "보호자", "집사", "주인님", "산책러", "가디언", "친구", "동반자", "탐험가", "메이트", "견주님"
];

function generateRandomNickname() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 100 ~ 999
  return `${adj}_${noun}_${num}`;
}

export default function GuardianProfileSetupScreen() {
  const navigation = useNavigation<Nav>();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 진입 시 자동 랜덤 닉네임 부여
    setNickname(generateRandomNickname());
  }, []);

  const handleRandomize = () => {
    setNickname(generateRandomNickname());
  };

  const handleNext = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      Alert.alert("알림", "닉네임을 입력해주세요.");
      return;
    }
    if (trimmed.length > 30) {
      Alert.alert("알림", "닉네임은 30자를 초과할 수 없습니다.");
      return;
    }

    try {
      setLoading(true);
      // 백엔드 API 호출로 보호자 프로필 생성 (존재 시 업데이트)
      await upsertProfile({
        guardian: { nickname: trimmed }
      });
      // 완료되면 강아지 프로필 설정 창으로 이동
      navigation.navigate("DogProfileSetup");
    } catch (e: any) {
      Alert.alert("오류", e.message ?? "프로필 저장 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = nickname.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <TopHeader title="가디언즈 프로필" />

      <View style={styles.container}>
        <Text style={styles.title}>
          활동하실 닉네임을 설정해주세요!
        </Text>
        <Text style={styles.subtitle}>
          언제든지 마이페이지에서 수정할 수 있습니다.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>닉네임 (최대 30자)</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력하세요"
            maxLength={30}
          />
        </View>

        <AnimatedButton
          style={styles.randomButton}
          activeOpacity={0.8}
          onPress={handleRandomize}
        >
          <Text style={styles.randomButtonText}>🎲 랜덤 닉네임 생성</Text>
        </AnimatedButton>

        <View style={{ flex: 1 }} />

        <AnimatedButton
          style={[
            styles.nextButton,
            !canProceed && styles.nextButtonDisabled,
          ]}
          disabled={!canProceed || loading}
          activeOpacity={0.9}
          onPress={handleNext}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.nextText}>다음</Text>
          )}
        </AnimatedButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textMain,
    marginBottom: 8,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSub,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSub,
    marginBottom: 8,
  },
  input: {
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textMain,
    ...SHADOWS.soft,
  },
  randomButton: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.md,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  randomButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textMain,
  },
  nextButton: {
    height: 56,
    borderRadius: SIZES.radius.xl,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
    marginBottom: 16,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
});
