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
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

import TopHeader from "../../components/TopHeader";
import { COLORS, SIZES, SHADOWS } from "../../constants/theme";
import { MAX_POST_MEDIA_COUNT } from "../../constants/upload";
import { usePhotoPicker } from "../../hooks/usePhotoPicker";
import { createWalkPost } from "../../api/walkPosts";
import { usePostStore } from "../../store/posts";
import { useLocalMediaStore } from "../../store/localMedia";
import { saveLocalImageCopy } from "../../lib/localUpload";

const DOG_CAFE_PREFIX = "[DOG_CAFE] ";
type PostType = "WALK" | "DOG_CAFE";

function formatDeadlineDisplay(date: Date) {
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, "0");
  const D = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D} ${hh}:${mm}`;
}

function toLocalIsoString(date: Date) {
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, "0");
  const D = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D}T${hh}:${mm}:00`;
}

function mergeDateTime(previous: Date | null, next: Date, mode: "date" | "time") {
  const base = previous ? new Date(previous) : new Date();
  const merged = new Date(base);
  if (mode === "date") {
    merged.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
  } else {
    merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
  }
  return merged;
}

function formatDateInputValue(date: Date) {
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, "0");
  const D = String(date.getDate()).padStart(2, "0");
  return `${Y}-${M}-${D}`;
}

function formatTimeInputValue(date: Date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const loadPosts = usePostStore((s) => s.loadPosts);
  const setPostMedia = useLocalMediaStore((s) => s.setPostMedia);

  const [type, setType] = React.useState<PostType>("WALK");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [regionIdText, setRegionIdText] = React.useState("1");
  const [meetAddress, setMeetAddress] = React.useState("");
  const [deadlineDate, setDeadlineDate] = React.useState<Date | null>(null);
  const formattedDeadline = deadlineDate
    ? formatDeadlineDisplay(deadlineDate)
    : "마감 시간이 아직 설정되지 않았어요";
  const webDateValue = React.useMemo(
    () => (deadlineDate ? formatDateInputValue(deadlineDate) : ""),
    [deadlineDate],
  );
  const webTimeValue = React.useMemo(
    () => (deadlineDate ? formatTimeInputValue(deadlineDate) : ""),
    [deadlineDate],
  );

  const [iosPickerVisible, setIosPickerVisible] = React.useState(false);
  const [iosPickerMode, setIosPickerMode] = React.useState<"date" | "time">("date");
  const [pendingPickerDate, setPendingPickerDate] = React.useState(new Date());
  const [webPickerMode, setWebPickerMode] = React.useState<"date" | "time" | null>(
    null,
  );
  const [webPickerVisible, setWebPickerVisible] = React.useState(false);

  const {
    photos,
    pickFromLibrary,
    captureFromCamera,
    removePhoto,
    resetPhotos,
  } = usePhotoPicker({ maxCount: MAX_POST_MEDIA_COUNT });

  const [submitting, setSubmitting] = React.useState(false);

  const canSubmit =
    !submitting &&
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    regionIdText.trim().length > 0;

  const goBackSafe = React.useCallback(() => {
    if (navigation.canGoBack?.()) navigation.goBack();
    else navigation.navigate("Community");
  }, [navigation]);

  const closeWebPicker = React.useCallback(() => {
    setWebPickerVisible(false);
    setWebPickerMode(null);
  }, []);

  const openDeadlinePicker = React.useCallback(
    (mode: "date" | "time") => {
      if (Platform.OS === "web") {
        setPendingPickerDate(deadlineDate ?? new Date());
        setWebPickerMode(mode);
        setWebPickerVisible(true);
        return;
      }
      if (Platform.OS === "android") {
        DateTimePickerAndroid.open({
          value: deadlineDate ?? new Date(),
          mode,
          is24Hour: true,
          onChange: (_, selectedDate) => {
            if (selectedDate) {
              setDeadlineDate((prev) => mergeDateTime(prev, selectedDate, mode));
            }
          },
        });
        return;
      }
      setPendingPickerDate(deadlineDate ?? new Date());
      setIosPickerMode(mode);
      setIosPickerVisible(true);
    },
    [deadlineDate],
  );

  const handleIOSPickerChange = React.useCallback(
    (_: DateTimePickerEvent, date?: Date) => {
      if (date) setPendingPickerDate(date);
    },
    [],
  );

  const handleIOSConfirm = React.useCallback(() => {
    setDeadlineDate((prev) => mergeDateTime(prev, pendingPickerDate, iosPickerMode));
    setIosPickerVisible(false);
  }, [iosPickerMode, pendingPickerDate]);

  const handleWebDateChange = React.useCallback(
    (event: any) => {
      const value = event.target.value;
      if (!value) return;
      const parts = value.split("-");
      if (parts.length !== 3) return;
      const [Y, M, D] = parts.map((v) => Number(v));
      if (!Number.isFinite(Y) || !Number.isFinite(M) || !Number.isFinite(D)) return;
      const next = new Date();
      next.setFullYear(Y, M - 1, D);
      setDeadlineDate((prev) => mergeDateTime(prev, next, "date"));
      closeWebPicker();
    },
    [closeWebPicker],
  );

  const handleWebTimeChange = React.useCallback(
    (event: any) => {
      const value = event.target.value;
      if (!value) return;
      const [hh, mm] = value.split(":").map((v) => Number(v));
      if (!Number.isFinite(hh) || !Number.isFinite(mm)) return;
      const next = new Date();
      next.setHours(hh, mm, 0, 0);
      setDeadlineDate((prev) => mergeDateTime(prev, next, "time"));
      closeWebPicker();
    },
    [closeWebPicker],
  );

  const handleClearDeadline = React.useCallback(() => {
    setDeadlineDate(null);
    closeWebPicker();
  }, [closeWebPicker]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const regionId = Number(regionIdText);
    if (!Number.isFinite(regionId) || regionId <= 0) {
      Alert.alert("입력 오류", "지역 ID는 1 이상의 숫자여야 합니다.");
      return;
    }

    const deadlineAt = deadlineDate ? toLocalIsoString(deadlineDate) : null;
    const rawTitle = title.trim();
    const savedTitle = type === "DOG_CAFE" ? `${DOG_CAFE_PREFIX}${rawTitle}` : rawTitle;

    try {
      setSubmitting(true);
      const created = await createWalkPost({
        title: savedTitle,
        content: content.trim(),
        regionId,
        deadlineAt,
        meetAddress: meetAddress.trim() || null,
        meetLat: null,
        meetLng: null,
      });

      if (created?.postId && photos.length > 0) {
        const savedUris: string[] = [];
        for (const photo of photos) {
          const copied = await saveLocalImageCopy(photo.uri, {
            category: "posts",
          });
          savedUris.push(copied.uri);
        }
        setPostMedia(String(created.postId), savedUris);
      }

      await loadPosts({ page: 0, size: 20 });
      resetPhotos();
      setDeadlineDate(null);
      setPendingPickerDate(new Date());
      setTitle("");
      setContent("");
      setMeetAddress("");
      closeWebPicker();

      if (Platform.OS === "web") {
        window.alert("게시글이 등록되었습니다.");
        goBackSafe();
      } else {
        Alert.alert("등록 완료", "모집글이 등록되었습니다.", [
          { text: "확인", onPress: goBackSafe },
        ]);
      }
    } catch (e: any) {
      Alert.alert("등록 실패", e?.message ?? "게시글을 등록하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title="글 작성" subtitle="산책/애견카페 모집글을 등록하세요" showBack />

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
          placeholder="제목을 입력하세요"
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

        <Text style={styles.label}>만남 장소</Text>
        <TextInput
          style={styles.input}
          placeholder="예) 서울시 OO구 OO동"
          value={meetAddress}
          onChangeText={setMeetAddress}
          editable={!submitting}
        />

        <Text style={styles.label}>마감 시각</Text>
        <View style={styles.deadlineRow}>
          <TouchableOpacity
            style={styles.deadlineBtn}
            onPress={() => openDeadlinePicker("date")}
            disabled={submitting}
          >
            <Text style={styles.deadlineBtnText}>날짜 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deadlineBtn}
            onPress={() => openDeadlinePicker("time")}
            disabled={submitting || !deadlineDate}
          >
            <Text style={styles.deadlineBtnText}>시간 선택</Text>
          </TouchableOpacity>
          {deadlineDate && (
            <TouchableOpacity
              style={[styles.deadlineBtn, styles.deadlineClear]}
              onPress={handleClearDeadline}
              disabled={submitting}
            >
              <Text style={[styles.deadlineBtnText, styles.deadlineClearText]}>
                초기화
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {Platform.OS === "web" && webPickerVisible && webPickerMode && (
          <View style={styles.webPickerPopover}>
            <Text style={styles.webPickerTitle}>
              {webPickerMode === "date" ? "날짜를 선택하세요" : "시간을 선택하세요"}
            </Text>
            {/* @ts-ignore */}
            <input
              type={webPickerMode === "date" ? "date" : "time"}
              value={webPickerMode === "date" ? webDateValue : webTimeValue}
              onChange={
                webPickerMode === "date" ? handleWebDateChange : handleWebTimeChange
              }
              autoFocus
              style={{
                padding: 10,
                fontSize: 15,
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                minWidth: webPickerMode === "date" ? 220 : 140,
              }}
            />
            <TouchableOpacity
              style={styles.webPickerClose}
              onPress={closeWebPicker}
              activeOpacity={0.8}
            >
              <Text style={styles.webPickerCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.deadlineValue}>{formattedDeadline}</Text>
        <Text style={styles.helper}>
          버튼으로 날짜와 시간을 각각 지정하면 자동으로 하나의 마감 시각이 만들어집니다.
          비워두면 "상시 모집"으로 표시돼요.
        </Text>

        <Text style={styles.label}>내용</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="상세 내용을 입력해주세요"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          editable={!submitting}
        />

        <Text style={styles.label}>사진 첨부</Text>
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoItem}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() => removePhoto(photo.id)}
                disabled={submitting}
              >
                <Text style={styles.photoRemoveText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < MAX_POST_MEDIA_COUNT && (
            <TouchableOpacity
              style={styles.photoAdd}
              onPress={pickFromLibrary}
              disabled={submitting}
            >
              <Text style={styles.photoAddText}>+ 추가</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.photoActions}>
          <TouchableOpacity
            style={styles.photoActionBtn}
            onPress={pickFromLibrary}
            disabled={submitting}
          >
            <Text style={styles.photoActionText}>앨범에서 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.photoActionBtn}
            onPress={captureFromCamera}
            disabled={submitting}
          >
            <Text style={styles.photoActionText}>카메라 촬영</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helper}>
          최대 {MAX_POST_MEDIA_COUNT}장까지 첨부할 수 있어요. 웹에서는 로컬에만 저장되며 서버와 연동되진 않습니다.
        </Text>

        <TouchableOpacity
          style={[styles.submitButton, (!canSubmit || submitting) && styles.submitDisabled]}
          disabled={!canSubmit || submitting}
          activeOpacity={0.9}
          onPress={handleSubmit}
        >
          {submitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.submitText}>등록 중...</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>게시글 등록하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {Platform.OS === "web" && (
        <View style={styles.hiddenInputs}>
          {/* @ts-ignore - HTML element only rendered on web */}
          <input
            ref={dateInputRef}
            type="date"
            value={webDateValue}
            onChange={handleWebDateChange}
          />
          {/* @ts-ignore - HTML element only rendered on web */}
          <input
            ref={timeInputRef}
            type="time"
            value={webTimeValue}
            onChange={handleWebTimeChange}
          />
        </View>
      )}

      {Platform.OS === "ios" && (
        <Modal
          visible={iosPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIosPickerVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.pickerSheet}>
              <DateTimePicker
                value={pendingPickerDate}
                mode={iosPickerMode}
                display="spinner"
                onChange={handleIOSPickerChange}
                locale="ko"
              />
              <View style={styles.pickerActions}>
                <TouchableOpacity
                  style={[styles.pickerBtn, styles.pickerCancel]}
                  onPress={() => setIosPickerVisible(false)}
                >
                  <Text style={styles.pickerCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerBtn} onPress={handleIOSConfirm}>
                  <Text style={styles.pickerConfirmText}>완료</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.typeChip, active && styles.typeChipActive]}>
      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{label}</Text>
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
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deadlineBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  deadlineBtnText: { fontWeight: "800", color: COLORS.textMain },
  deadlineClear: {
    backgroundColor: COLORS.background,
  },
  deadlineClearText: { color: COLORS.textMuted },
  deadlineValue: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textMain,
  },
  webPickerPopover: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignSelf: "flex-start",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  webPickerTitle: { fontWeight: "800", color: COLORS.textMain, fontSize: 13 },
  webPickerClose: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
  },
  webPickerCloseText: { fontWeight: "700", color: COLORS.primary, fontSize: 13 },
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
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoItem: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoImage: { width: "100%", height: "100%" },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: { color: "#fff", fontWeight: "900" },
  photoAdd: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAddText: { color: COLORS.textMuted, fontWeight: "800" },
  photoActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  photoActionBtn: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    paddingVertical: 10,
  },
  photoActionText: { color: COLORS.primary, fontWeight: "800" },
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

  hiddenInputs: { height: 0, width: 0, overflow: "hidden" },

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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#fff",
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 10,
  },
  pickerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  pickerCancel: { backgroundColor: COLORS.background },
  pickerCancelText: { color: COLORS.textMain, fontWeight: "800" },
  pickerConfirmText: { color: "#fff", fontWeight: "800" },
});
