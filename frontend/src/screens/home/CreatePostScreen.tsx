import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import TopHeader from "../../components/TopHeader";
import { PostType, usePostStore } from "../../store/posts";

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const addPost = usePostStore((s) => s.addPost);

  const [type, setType] = React.useState<PostType>("WALK");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [region, setRegion] = React.useState("마포구 성산동");
  const [deadlineText, setDeadlineText] = React.useState("");
  const [placeName, setPlaceName] = React.useState("");

  // TODO: 나중에 useAuthStore에서 가져오기
  const myNickname = "멍멍맘";

  const canSubmit =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    region.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      Alert.alert("확인", "제목 / 동네 / 상세 내용을 모두 입력해주세요.");
      return;
    }

    addPost({
      type,
      title: title.trim(),
      content: content.trim(),
      region: region.trim(),
      deadlineText: deadlineText.trim() || "마감일 미정",
      placeName: placeName.trim(),
      authorNickname: myNickname,
    });

    Alert.alert("등록 완료", "산책글이 등록되었습니다.", [
      {
        text: "확인",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader
        title="산책 글쓰기"
        subtitle="함께 산책할 메이트를 모집해보세요"
        showBack={true}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 타입 선택 */}
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

        {/* 제목 */}
        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          placeholder="예) 오늘 저녁 한강 산책 같이 하실 분 구해요"
          value={title}
          onChangeText={setTitle}
        />

        {/* 동네 */}
        <Text style={styles.label}>동네</Text>
        <TextInput
          style={styles.input}
          placeholder="예) 마포구 성산동"
          value={region}
          onChangeText={setRegion}
        />

        {/* 약속 장소 */}
        <Text style={styles.label}>약속 장소</Text>
        <TextInput
          style={styles.input}
          placeholder="예) 망원한강공원 입구"
          value={placeName}
          onChangeText={setPlaceName}
        />

        {/* 마감 */}
        <Text style={styles.label}>모집 마감</Text>
        <TextInput
          style={styles.input}
          placeholder="예) 오늘 20:00까지 / 이번 주말까지"
          value={deadlineText}
          onChangeText={setDeadlineText}
        />

        {/* 내용 */}
        <Text style={styles.label}>상세 내용</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder={
            "언제, 어디서, 어떤 강아지들과 산책할지 구체적으로 적어주세요.\n예) 7시 합정역 8번 출구에서 만나서 한강 따라 1~2시간 정도 걸어요."
          }
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {/* 등록 버튼 */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
          ]}
          disabled={!canSubmit}
          activeOpacity={0.9}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>글 등록하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

type TypeChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function TypeChip({ label, active, onPress }: TypeChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.typeChip, active && styles.typeChipActive]}
    >
      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scroll: {
    flex: 1,
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
    fontSize: 14,
    color: "#111827",
  },
  textarea: {
    height: 140,
    lineHeight: 20,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  typeChipActive: {
    borderColor: "#0ACF83",
    backgroundColor: "#ECFDF3",
  },
  typeChipText: {
    fontSize: 13,
    color: "#6B7280",
  },
  typeChipTextActive: {
    color: "#0ACF83",
    fontWeight: "700",
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 12,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#0ACF83",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
