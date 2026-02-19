import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import TopHeader from "../../components/TopHeader";
import { COLORS, SIZES, SHADOWS } from "../../constants/theme";
import { createWalkPost } from "../../api/walkPosts";
import { usePostStore } from "../../store/posts";

type PostType = "WALK" | "DOG_CAFE";
const DOG_CAFE_PREFIX = "[DOG_CAFE] ";

function parseDeadlineToIsoLocal(input: string): string | null {
  // 허용: "2026-02-13 18:00" 또는 "2026-02-13T18:00"
  const v = input.trim();
  if (!v) return null;

  const normalized = v.includes("T") ? v.replace("T", " ") : v;
  const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;

  const [_, Y, M, D, hh, mm] = m;
  const year = Number(Y);
  const month = Number(M);
  const day = Number(D);
  const hour = Number(hh);
  const minute = Number(mm);

  if (
    year < 2000 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  // ✅ 백엔드 LocalDateTime용 ISO
  return `${Y}-${M}-${D}T${hh}:${mm}:00`;
}

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const loadPosts = usePostStore((s) => s.loadPosts);

  const [type, setType] = React.useState<PostType>("WALK");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  const [regionIdText, setRegionIdText] = React.useState("1");
  const [meetAddress, setMeetAddress] = React.useState("");

  // ✅ 마감시간 입력 (YYYY-MM-DD HH:mm)
  const [deadlineInput, setDeadlineInput] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit =
    !submitting &&
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    regionIdText.trim().length > 0;

  const goBackSafe = () => {
    if (navigation.canGoBack?.()) navigation.goBack();
    else navigation.navigate("Community");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const regionId = Number(regionIdText);
    if (!Number.isFinite(regionId) || regionId <= 0) {
      Alert.alert("확인", "regionId는 숫자여야 합니다. 예) 1");
      return;
    }

    const deadlineAt = parseDeadlineToIsoLocal(deadlineInput);
    if (deadlineInput.trim() && !deadlineAt) {
      Alert.alert(
        "마감시간 형식 오류",
        "YYYY-MM-DD HH:mm 형식으로 입력해 주세요.\n예) 2026-02-13 18:00",
      );
      return;
    }

    const rawTitle = title.trim();
    const savedTitle =
      type === "DOG_CAFE" ? `${DOG_CAFE_PREFIX}${rawTitle}` : rawTitle;

    try {
      setSubmitting(true);

      await createWalkPost({
        title: savedTitle,
        content: content.trim(),
        regionId,
        deadlineAt: deadlineAt ?? null, // ✅ 서버에 전달
        meetAddress: meetAddress.trim() || null,
        meetLat: null,
        meetLng: null,
      });

      // ✅ 최신 글 반영(홈/커뮤니티)
      await loadPosts({ page: 0, size: 20 });

      // ✅ 웹에서는 Alert 콜백이 안 먹는 경우가 많아서 분기
      if (Platform.OS === "web") {
        window.alert("등록 완료!");
        goBackSafe();
      } else {
        Alert.alert("등록 완료", "게시글이 등록되었습니다.", [
          { text: "확인", onPress: goBackSafe },
        ]);
      }
    } catch (e: any) {
      Alert.alert("등록 실패", e?.message ?? "오류");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader
        title="글쓰기"
        subtitle="산책/애견카페 메이트를 모집해요"
        showBack
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>모집 유형</Text>
        <View style={styles.typeRow}>
          <TypeChip
            label="산책"
            active={type === "WALK"}
            onPress={() => setType("WALK")}
          />
          <TypeChip
            label="애견카페"
            active={type === "DOG_CAFE"}
            onPress={() => setType("DOG_CAFE")}
          />
        </View>

        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          placeholder="예) 오늘 저녁 같이 산책하실 분!"
          value={title}
          onChangeText={setTitle}
          editable={!submitting}
        />

        <Text style={styles.label}>지역 ID (임시)</Text>
        <TextInput
          style={styles.input}
          placeholder="예) 1"
          value={regionIdText}
          onChangeText={setRegionIdText}
          keyboardType="number-pad"
          editable={!submitting}
        />

        <Text style={styles.label}>만나는 장소</Text>
        <TextInput
          style={styles.input}
          placeholder="예) 망원한강공원 입구"
          value={meetAddress}
          onChangeText={setMeetAddress}
          editable={!submitting}
        />

        <Text style={styles.label}>마감시간</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD HH:mm  (예: 2026-02-13 18:00)"
          value={deadlineInput}
          onChangeText={setDeadlineInput}
          editable={!submitting}
          autoCapitalize="none"
        />
        <Text style={styles.helper}>
          입력하면 서버에 마감시간이 저장됩니다. (비워두면 마감시간 없음)
        </Text>

        <Text style={styles.label}>내용</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="상세 내용을 입력하세요."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          editable={!submitting}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!canSubmit || submitting) && styles.submitDisabled,
          ]}
          disabled={!canSubmit || submitting}
          activeOpacity={0.9}
          onPress={handleSubmit}
        >
          {submitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.submitText}>등록 중…</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>글 등록하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function TypeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.typeChip, active && styles.typeChipActive]}
    >
      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textMain,
    marginTop: 18,
    marginBottom: 8,
  },
  helper: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  input: {
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textMain,
    ...Platform.select({ ios: SHADOWS.soft, android: { elevation: 1 } }),
  },
  textarea: { height: 160, lineHeight: 22, paddingTop: 16 },
  typeRow: { flexDirection: "row", gap: 12 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
  },
  typeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  typeChipText: { fontSize: 14, fontWeight: "800", color: COLORS.textSub },
  typeChipTextActive: { color: COLORS.primaryDark },

  submitButton: {
    marginTop: 28,
    height: 56,
    borderRadius: SIZES.radius.xl,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },
  submitDisabled: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: { color: "#fff", fontSize: 17, fontWeight: "900" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
});
