import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  Modal,
  Pressable,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopHeader from "../../components/TopHeader";
import { useCreateDog, useProfile, useUpdateDog } from "../../hooks/profile";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type R = RouteProp<RootStackParamList, "DogEdit">;
type GenderCode = "M" | "F" | null;

const BREEDS = [
  "푸들",
  "말티즈",
  "포메라니안",
  "비숑 프리제",
  "시츄",
  "요크셔테리어",
  "치와와",
  "닥스훈트",
  "웰시코기",
  "골든리트리버",
  "래브라도리트리버",
  "보더콜리",
  "시바",
  "진돗개",
  "스피츠",
  "불독",
  "믹스",
  "기타(직접입력)",
] as const;

function toIntOrNull(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeGender(code: string | null | undefined): GenderCode {
  const c = (code ?? "").toUpperCase();
  if (c === "M" || c === "MALE") return "M";
  if (c === "F" || c === "FEMALE") return "F";
  return null;
}

export default function DogEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<R>();
  const { data } = useProfile();
  const createMut = useCreateDog();
  const updateMut = useUpdateDog();

  const mode = route.params.mode;

  const editingDog = useMemo(() => {
    if (mode !== "edit") return null;
    return data?.dogs.find((d) => d.id === route.params.dogId) ?? null;
  }, [mode, route.params, data?.dogs]);

  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [genderCode, setGenderCode] = useState<GenderCode>(null);
  const [isNeutered, setIsNeutered] = useState<boolean>(false);
  const [vaccinationNote, setVaccinationNote] = useState("");
  const [dispositionText, setDispositionText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [breedModalOpen, setBreedModalOpen] = useState(false);

  useEffect(() => {
    if (!editingDog) {
      setName("");
      setBreed("");
      setCustomBreed("");
      setAgeYears("");
      setGenderCode(null);
      setIsNeutered(false);
      setVaccinationNote("");
      setDispositionText("");
      setPhotoUrl("");
      return;
    }

    setName(editingDog.name ?? "");
    setBreed(editingDog.breed ?? "");
    setCustomBreed("");
    setAgeYears(editingDog.ageYears != null ? String(editingDog.ageYears) : "");
    setGenderCode(normalizeGender(editingDog.genderCode));
    setIsNeutered(!!editingDog.isNeutered);
    setVaccinationNote(editingDog.vaccinationNote ?? "");
    setDispositionText(editingDog.dispositionText ?? "");
    setPhotoUrl(editingDog.photoUrl ?? "");
  }, [editingDog]);

  const effectiveBreed = useMemo(() => {
    if (breed === "기타(직접입력)") return customBreed.trim();
    return breed.trim();
  }, [breed, customBreed]);

  // ✅ DogEdit에서 나갈 목적지는 DogManage로 고정
  const goDogManage = () => {
    // 스택이 정상이라면 goBack이 제일 자연스러움
    // (DogManage -> DogEdit로 왔을 테니까)
    if (navigation.canGoBack?.() && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    // 스택이 꼬인 경우를 대비한 fallback
    navigation.navigate("DogManage");
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert("이름", "반려견 이름은 필수입니다.");
      return;
    }
    if (breed === "기타(직접입력)" && !customBreed.trim()) {
      Alert.alert("견종", "기타를 선택한 경우 견종을 직접 입력해주세요.");
      return;
    }

    const body = {
      name: name.trim(),
      breed: effectiveBreed ? effectiveBreed : null,
      ageYears: ageYears.trim() ? toIntOrNull(ageYears.trim()) : null,
      genderCode,
      isNeutered,
      vaccinationNote: vaccinationNote.trim() ? vaccinationNote.trim() : null,
      dispositionText: dispositionText.trim() ? dispositionText.trim() : null,
      photoUrl: photoUrl.trim() ? photoUrl.trim() : null,
    };

    try {
      if (mode === "create") {
        await createMut.mutateAsync(body);
        Alert.alert("추가 완료", "반려견이 추가되었습니다.");
      } else {
        await updateMut.mutateAsync({ dogId: route.params.dogId, body });
        Alert.alert("수정 완료", "반려견 정보가 수정되었습니다.");
      }

      // ✅ 저장 후에는 DogManage로
      goDogManage();
    } catch (e: any) {
      Alert.alert("저장 실패", e?.message ?? "문제가 발생했습니다.");
    }
  };

  const pending = createMut.isPending || updateMut.isPending;

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader
        title={mode === "create" ? "반려견 추가" : "반려견 수정"}
        subtitle="견종/성별은 선택으로 입력해요"
        backgroundColor="#FFFFFF"
        showBack
        // ✅ TopHeader 새 기능: 문자열로 목적지 지정
        // (스택이 꼬인 경우에도 DogManage로 강제 이동 가능)
        onBack="DogManage"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.label}>이름 (필수)</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="예) 콩이"
            maxLength={30}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>견종</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setBreedModalOpen(true)}
          >
            <Text style={[styles.selectText, !breed && { color: "#9CA3AF" }]}>
              {breed ? breed : "견종을 선택하세요"}
            </Text>
          </TouchableOpacity>

          {breed === "기타(직접입력)" && (
            <TextInput
              style={styles.input}
              value={customBreed}
              onChangeText={setCustomBreed}
              placeholder="견종을 직접 입력"
              maxLength={50}
            />
          )}

          <Text style={[styles.label, { marginTop: 12 }]}>나이(살)</Text>
          <TextInput
            style={styles.input}
            value={ageYears}
            onChangeText={setAgeYears}
            placeholder="예) 3"
            keyboardType="number-pad"
            maxLength={2}
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
                남아
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
                여아
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

          <View style={styles.switchRow}>
            <Text style={styles.label}>중성화</Text>
            <Switch value={isNeutered} onValueChange={setIsNeutered} />
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>예방접종 메모</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={vaccinationNote}
            onChangeText={setVaccinationNote}
            placeholder="예) 기본 접종 완료"
            maxLength={200}
            multiline
          />

          <Text style={[styles.label, { marginTop: 12 }]}>성격</Text>
          <TextInput
            style={styles.input}
            value={dispositionText}
            onChangeText={setDispositionText}
            placeholder="예) 활발/사람좋아"
            maxLength={100}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>사진 URL</Text>
          <TextInput
            style={styles.input}
            value={photoUrl}
            onChangeText={setPhotoUrl}
            placeholder="https://..."
            maxLength={255}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.primaryBtn, pending && { opacity: 0.6 }]}
            onPress={onSave}
            disabled={pending}
          >
            <Text style={styles.primaryBtnText}>
              {pending ? "저장 중…" : "저장"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 견종 선택 모달 */}
      <Modal visible={breedModalOpen} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setBreedModalOpen(false)}
        />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>견종 선택</Text>
          <FlatList
            data={BREEDS as unknown as string[]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setBreed(item);
                  if (item !== "기타(직접입력)") setCustomBreed("");
                  setBreedModalOpen(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { flex: 1, paddingHorizontal: 16 },
  card: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    elevation: 2,
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
  textarea: { minHeight: 88, textAlignVertical: "top" },

  selectBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  selectText: { fontSize: 14, fontWeight: "700", color: "#111827" },

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

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  primaryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#0ACF83",
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  modalSheet: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 120,
    bottom: 120,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalItemText: { fontSize: 14, fontWeight: "700", color: "#111827" },
});
