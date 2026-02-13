import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopHeader from "../../components/TopHeader";
import { useNavigation } from "@react-navigation/native";
import { useProfile, useUpsertProfile } from "../../hooks/profile";

type GenderCode = "M" | "F" | null;

function normalizeGender(code: string | null | undefined): GenderCode {
  const c = (code ?? "").toUpperCase();
  if (c === "M" || c === "MALE") return "M";
  if (c === "F" || c === "FEMALE") return "F";
  return null;
}

export default function EditMyProfileScreen() {
  const nav = useNavigation();
  const { data } = useProfile();
  const mut = useUpsertProfile();

  const initial = useMemo(() => {
    return {
      nickname: data?.guardianProfile?.nickname ?? "",
      genderCode: normalizeGender(data?.guardianProfile?.genderCode),
      bio: data?.guardianProfile?.bio ?? "",
      avatarUrl: data?.guardianProfile?.avatarUrl ?? "",
    };
  }, [data?.guardianProfile]);

  const [nickname, setNickname] = useState("");
  const [genderCode, setGenderCode] = useState<GenderCode>(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    setNickname(initial.nickname);
    setGenderCode(initial.genderCode);
    setBio(initial.bio);
    setAvatarUrl(initial.avatarUrl);
  }, [initial]);

  const onSave = async () => {
    if (!nickname.trim()) {
      Alert.alert("닉네임", "닉네임은 필수입니다.");
      return;
    }

    try {
      await mut.mutateAsync({
        guardian: {
          nickname: nickname.trim(),
          genderCode, // "M" | "F" | null
          bio: bio.trim() ? bio.trim() : null,
          avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
        },
        // ✅ 내 위치는 아직 미구현 → 저장/수정 안 함
        neighborhood: null,
      });

      Alert.alert("저장 완료", "프로필이 저장되었습니다.");
      // @ts-ignore
      nav.goBack();
    } catch (e: any) {
      Alert.alert("저장 실패", e?.message ?? "문제가 발생했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader
        title="프로필 수정"
        subtitle="닉네임/소개/성별을 설정해요"
        backgroundColor="#FFFFFF"
        showBack
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>내 정보</Text>

          <Text style={styles.label}>닉네임 (필수)</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="예) 만두"
            maxLength={30}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>성별</Text>
          <View style={styles.pillRow}>
            <TouchableOpacity
              style={[styles.pill, genderCode === "M" && styles.pillOn]}
              onPress={() => setGenderCode(genderCode === "M" ? null : "M")}
            >
              <Text
                style={[
                  styles.pillText,
                  genderCode === "M" && styles.pillTextOn,
                ]}
              >
                남
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pill, genderCode === "F" && styles.pillOn]}
              onPress={() => setGenderCode(genderCode === "F" ? null : "F")}
            >
              <Text
                style={[
                  styles.pillText,
                  genderCode === "F" && styles.pillTextOn,
                ]}
              >
                여
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pill, genderCode === null && styles.pillOn]}
              onPress={() => setGenderCode(null)}
            >
              <Text
                style={[
                  styles.pillText,
                  genderCode === null && styles.pillTextOn,
                ]}
              >
                선택안함
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>소개글</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={bio}
            onChangeText={setBio}
            placeholder="예) 저녁 산책 선호해요 🐶"
            maxLength={300}
            multiline
          />

          <Text style={[styles.label, { marginTop: 12 }]}>아바타 URL</Text>
          <TextInput
            style={styles.input}
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://..."
            maxLength={255}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>내 위치</Text>
          <Text style={styles.hintText}>
            현재 기능 미구현(추후 업데이트 예정)
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, mut.isPending && { opacity: 0.6 }]}
          onPress={onSave}
          disabled={mut.isPending}
        >
          <Text style={styles.primaryBtnText}>
            {mut.isPending ? "저장 중…" : "저장"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { flex: 1, paddingHorizontal: 16 },

  card: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },

  label: { fontSize: 12, fontWeight: "900", color: "#111827" },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  textarea: { minHeight: 96, textAlignVertical: "top" },

  pillRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
  },
  pillOn: { backgroundColor: "#ECFDF3", borderColor: "#0ACF83" },
  pillText: { fontWeight: "900", color: "#111827", fontSize: 13 },
  pillTextOn: { color: "#0ACF83" },

  hintCard: {
    marginTop: 12,
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  hintTitle: { fontSize: 13, fontWeight: "900", color: "#9A3412" },
  hintText: { marginTop: 6, fontSize: 12, color: "#9A3412" },

  primaryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#0ACF83",
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
