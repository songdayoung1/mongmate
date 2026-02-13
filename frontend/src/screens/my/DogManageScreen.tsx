import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopHeader from "../../components/TopHeader";
import { useDeleteDog, useProfile } from "../../hooks/profile";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

function genderKo(code: string | null | undefined) {
  const c = (code ?? "").toUpperCase();
  if (c === "M" || c === "MALE") return "남아";
  if (c === "F" || c === "FEMALE") return "여아";
  return "미설정";
}

export default function DogManageScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data } = useProfile();
  const delMut = useDeleteDog();
  const dogs = data?.dogs ?? [];

  const onDelete = (dogId: number) => {
    Alert.alert("삭제", "이 반려견 정보를 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await delMut.mutateAsync(dogId);
          } catch (e: any) {
            Alert.alert("삭제 실패", e?.message ?? "문제가 발생했습니다.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader
        title="반려견 관리"
        subtitle="추가/수정/삭제할 수 있어요"
        backgroundColor="#FFFFFF"
        showBack
        onBack={{ name: "Main", params: { screen: "MyPage" } }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => nav.navigate("DogEdit", { mode: "create" })}
        >
          <Text style={styles.primaryBtnText}>+ 반려견 추가</Text>
        </TouchableOpacity>

        {dogs.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>아직 등록된 반려견이 없어요</Text>
            <Text style={styles.muted}>추가 버튼으로 등록해보세요.</Text>
          </View>
        ) : (
          dogs.map((d) => (
            <View key={d.id} style={styles.card}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{d.name}</Text>
                  <Text style={styles.meta}>
                    {[
                      d.breed,
                      d.ageYears != null ? `${d.ageYears}살` : null,
                      d.genderCode
                        ? `성별:${genderKo(d.genderCode)}`
                        : "성별:미설정",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <Text style={styles.meta}>
                    {[
                      d.isNeutered != null
                        ? d.isNeutered
                          ? "중성화 O"
                          : "중성화 X"
                        : null,
                      d.vaccinationNote,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  {!!d.dispositionText?.trim() && (
                    <Text style={styles.meta}>성격: {d.dispositionText}</Text>
                  )}
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() =>
                    nav.navigate("DogEdit", { mode: "edit", dogId: d.id })
                  }
                >
                  <Text style={styles.outlineBtnText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outlineBtn, styles.dangerOutline]}
                  onPress={() => onDelete(d.id)}
                  disabled={delMut.isPending}
                >
                  <Text style={[styles.outlineBtnText, styles.dangerText]}>
                    {delMut.isPending ? "처리 중…" : "삭제"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { flex: 1, paddingHorizontal: 16 },

  primaryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#0ACF83",
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  emptyWrap: { paddingVertical: 30, alignItems: "center" },
  emptyTitle: { fontSize: 14, fontWeight: "900", color: "#111827" },
  muted: { fontSize: 12, color: "#6B7280", marginTop: 6 },

  card: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  name: { fontSize: 15, fontWeight: "900", color: "#111827" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 4 },

  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  outlineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  outlineBtnText: { fontWeight: "900", color: "#111827", fontSize: 13 },
  dangerOutline: { borderColor: "#FCA5A5" },
  dangerText: { color: "#EF4444" },
});
