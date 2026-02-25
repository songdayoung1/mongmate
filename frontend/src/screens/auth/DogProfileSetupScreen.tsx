import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import TopHeader from "../../components/TopHeader";
import AnimatedButton from "../../components/AnimatedButton";
import { COLORS, SIZES, SHADOWS } from "../../constants/theme";
import { createDog } from "../../api/profile";
import { useAuthStore } from "../../store/auth";

type Nav = NativeStackNavigationProp<RootStackParamList, "DogProfileSetup">;

export default function DogProfileSetupScreen() {
  const navigation = useNavigation<Nav>();
  const setNewUser = useAuthStore((s) => s.setNewUser);

  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [loading, setLoading] = useState(false);

  const finishSetup = () => {
    // ✅ AuthStore의 isNewUser를 false로 변경하면 RootNavigator가 알아서 Main으로 전환
    setNewUser(false);
  };

  const handleSkip = () => {
    finishSetup();
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("알림", "강아지 이름을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await createDog({
        name: trimmedName,
        breed: breed.trim() || undefined,
      });
      // 완료 시 메인 탭으로
      finishSetup();
    } catch (e: any) {
      Alert.alert("오류", e.message ?? "강아지 프로필 저장 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = name.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <TopHeader title="강아지 프로필" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>
            함께할 반려견을 등록해주세요! 🐶
          </Text>
          <Text style={styles.subtitle}>
            아직 강아지가 없거나, 나중에 등록하시려면 건너뛰기를 눌러주세요.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>강아지 이름 (필수)</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="예: 몽이"
              maxLength={20}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>견종 (선택)</Text>
            <TextInput
              style={styles.input}
              value={breed}
              onChangeText={setBreed}
              placeholder="예: 말티즈, 리트리버"
              maxLength={30}
            />
          </View>

          <View style={{ flex: 1 }} />

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>나중에 하기 (건너뛰기)</Text>
          </TouchableOpacity>

          <AnimatedButton
            style={[
              styles.nextButton,
              !canProceed && styles.nextButtonDisabled,
            ]}
            disabled={!canProceed || loading}
            activeOpacity={0.9}
            onPress={handleSubmit}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.nextText}>완료 및 시작하기</Text>
            )}
          </AnimatedButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingBottom: 40 },
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
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
  skipButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  skipText: {
    color: COLORS.textSub,
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  nextButton: {
    height: 56,
    borderRadius: SIZES.radius.xl,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
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
