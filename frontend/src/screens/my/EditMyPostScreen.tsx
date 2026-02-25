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
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import TopHeader from "../../components/TopHeader";
import { COLORS, SIZES, SHADOWS } from "../../constants/theme";
import {
  getWalkPostDetailAuthed,
  updateWalkPost,
  type WalkPostUpdateRequest,
} from "../../api/walkPosts";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { usePostStore } from "../../store/posts";

type Route = RouteProp<RootStackParamList, "EditMyPost">;
type PostType = "WALK" | "DOG_CAFE";
const DOG_CAFE_PREFIX = "[DOG_CAFE] ";

function parseDeadlineToIsoLocal(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  const normalized = v.includes("T") ? v.replace("T", " ") : v;
  const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [_, Y, M, D, hh, mm] = m;
  return `${Y}-${M}-${D}T${hh}:${mm}:00`;
}

function formatDeadlineInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D} ${hh}:${mm}`;
}

export default function EditMyPostScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const loadPosts = usePostStore((s) => s.loadPosts);

  const [type, setType] = React.useState<PostType>("WALK");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [regionIdText, setRegionIdText] = React.useState("");
  const [meetAddress, setMeetAddress] = React.useState("");
  const [deadlineInput, setDeadlineInput] = React.useState("");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const canSubmit =
    !saving &&
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    regionIdText.trim().length > 0;

  const loadDetail = React.useCallback(async () => {
    try {
      setLoading(true);
      const detail = await getWalkPostDetailAuthed(route.params.postId);
      setType(detail.recruitType === "DOG_CAFE" ? "DOG_CAFE" : "WALK");
      setTitle(detail.title ?? "");
      setContent(detail.content ?? "");
      setRegionIdText(
        detail.region?.regionId != null ? String(detail.region.regionId) : "",
      );
      setMeetAddress(detail.meetAddress ?? "");
      setDeadlineInput(formatDeadlineInput(detail.deadlineAt ?? null));
    } catch (e: any) {
      Alert.alert("불러오기 실패", e?.message ?? "게시글 정보를 가져오지 못했습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [navigation, route.params.postId]);

  React.useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const onSubmit = async () => {
    if (!canSubmit) return;

    const regionId = Number(regionIdText);
    if (!Number.isFinite(regionId) || regionId <= 0) {
      Alert.alert("입력 오류", "지역 ID는 1 이상의 숫자여야 합니다.");
      return;
    }

    const deadlineAt = parseDeadlineToIsoLocal(deadlineInput);
    if (deadlineInput.trim() && !deadlineAt) {
      Alert.alert(
        "마감시간 형식 오류",
        "YYYY-MM-DD HH:mm 형식으로 입력해주세요. 예) 2026-02-13 18:00",
      );
      return;
    }

    const rawTitle = title.trim();
    const savedTitle =
      type === "DOG_CAFE" ? `${DOG_CAFE_PREFIX}${rawTitle}` : rawTitle;

    const payload: WalkPostUpdateRequest = {
      title: savedTitle,
      content: content.trim(),
      regionId,
      deadlineAt: deadlineAt ?? null,
      meetAddress: meetAddress.trim() || null,
      meetLat: null,
      meetLng: null,
    };

    try {
      setSaving(true);
      await updateWalkPost(route.params.postId, payload);
      await loadPosts({ page: 0, size: 20 }).catch(() => {});
      Alert.alert("수정 완료", "게시글이 수정되었습니다.", [
        {
          text: "확인",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e: any) {
      Alert.alert("수정 실패", e?.message ?? "게시글을 수정하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopHeader title="글 수정" showBack />
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>게시글 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader
        title="글 수정"
        subtitle="내용을 변경하고 저장하세요"
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
            label="도그카페"
            active={type === "DOG_CAFE"}
            onPress={() => setType("DOG_CAFE")}
          />
        </View>

        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          placeholder="제목을 입력하세요"
          value={title}
          onChangeText={setTitle}
          editable={!saving}
        />

        <Text style={styles.label}>지역 ID (임시)</Text>
        <TextInput
          style={styles.input}
          placeholder="예) 1"
          value={regionIdText}
          onChangeText={setRegionIdText}
          keyboardType="number-pad"
          editable={!saving}
        />

        <Text style={styles.label}>만남 장소</Text>
        <TextInput
          style={styles.input}
          placeholder="예) 서울시 OO구 OO동"
          value={meetAddress}
          onChangeText={setMeetAddress}
          editable={!saving}
        />

        <Text style={styles.label}>마감 시각</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD HH:mm"
          value={deadlineInput}
          onChangeText={setDeadlineInput}
          editable={!saving}
          autoCapitalize="none"
        />
        <Text style={styles.helper}>
          공백으로 두면 마감시간이 없는 모집글로 표시됩니다.
        </Text>

        <Text style={styles.label}>내용</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="상세 내용을 입력하세요"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          editable={!saving}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!canSubmit || saving) && styles.submitDisabled,
          ]}
          disabled={!canSubmit || saving}
          activeOpacity={0.9}
          onPress={onSubmit}
        >
          {saving ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.submitText}>수정 중...</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>게시글 수정하기</Text>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: { color: COLORS.textMuted, fontWeight: "600" },
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
