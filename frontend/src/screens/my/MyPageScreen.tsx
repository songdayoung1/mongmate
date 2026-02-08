import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopHeader from "../../components/TopHeader";
import { useLogout } from "../../hooks/auth";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useProfile } from "../../hooks/profile";

function maskPhone(phone: string | null | undefined) {
  if (!phone) return "-";
  const raw = phone.replace(/\D/g, "");
  if (raw.length < 7) return phone;
  return raw.slice(0, 3) + "-****-" + raw.slice(-4);
}

function yyyyMMdd(iso: string | null | undefined) {
  if (!iso) return "-";
  return iso.includes("T") ? iso.split("T")[0] : iso;
}

export default function PageScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logoutMut = useLogout?.() ?? { mutateAsync: async () => {} };
  const { data, isLoading, error, refetch } = useProfile();

  const guardian = data?.guardianProfile;
  const neighborhood = data?.neighborhood;
  const dogs = data?.dogs ?? [];

  const profileNeed = useMemo(
    () => !guardian?.nickname?.trim(),
    [guardian?.nickname],
  );

  const onLogout = async () => {
    try {
      await logoutMut.mutateAsync();
      Alert.alert("로그아웃", "로그아웃 되었습니다.");
    } catch {
      Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader
        title="마이페이지"
        subtitle="내 프로필/반려견 정보를 확인해요"
        backgroundColor="#FFFFFF"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>내 정보를 불러오는 중…</Text>
          </View>
        )}

        {!!error && !isLoading && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>불러오기에 실패했어요</Text>
            <Text style={styles.errorText}>
              네트워크/서버 상태를 확인해주세요.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 내 프로필 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text style={styles.sectionTitle}>내 프로필</Text>
              {profileNeed && (
                <View style={styles.badgeWarn}>
                  <Text style={styles.badgeWarnText}>설정 필요</Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={() => nav.navigate("EditMyProfile")}>
              <Text style={styles.sectionAction}>수정</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nickname}>
                  {guardian?.nickname?.trim()
                    ? guardian.nickname
                    : "닉네임을 설정해주세요"}
                </Text>
                <Text style={styles.bio} numberOfLines={2}>
                  {guardian?.bio?.trim()
                    ? guardian.bio
                    : "소개글을 작성하면 매칭이 쉬워져요"}
                </Text>

                <View style={{ height: 10 }} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>연락처</Text>
                  <Text style={styles.infoValue}>
                    {maskPhone(data?.user.phoneNumber)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>가입일</Text>
                  <Text style={styles.infoValue}>
                    {yyyyMMdd(data?.user.createdAt)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>내 위치</Text>
                  <Text style={styles.infoValue}>
                    {neighborhood
                      ? `regionId: ${neighborhood.regionId}${neighborhood.radiusMeters ? ` · 반경 ${neighborhood.radiusMeters}m` : ""}`
                      : "설정 필요"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 반려견 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>반려견</Text>
            <TouchableOpacity onPress={() => nav.navigate("DogManage")}>
              <Text style={styles.sectionAction}>관리</Text>
            </TouchableOpacity>
          </View>

          {dogs.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>등록된 반려견이 없어요</Text>
              <Text style={styles.muted}>
                산책 메이트를 위해 반려견 정보를 추가해보세요.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => nav.navigate("DogManage")}
              >
                <Text style={styles.primaryBtnText}>반려견 추가</Text>
              </TouchableOpacity>
            </View>
          ) : (
            dogs.map((d) => (
              <View key={d.id} style={styles.dogCard}>
                <View style={styles.dogAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dogName}>{d.name}</Text>
                  <Text style={styles.dogMeta}>
                    {[
                      d.breed,
                      d.ageYears != null ? `${d.ageYears}살` : null,
                      d.genderCode ? `성별:${d.genderCode}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <Text style={styles.dogMeta}>
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
                    <Text style={styles.dogMeta}>
                      성격: {d.dispositionText}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* 로그아웃 */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { flex: 1, paddingHorizontal: 16 },

  section: { marginTop: 16 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  sectionAction: { fontSize: 13, color: "#0ACF83", fontWeight: "700" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E5E7EB",
  },
  nickname: { fontSize: 17, fontWeight: "900", color: "#111827" },
  bio: { fontSize: 12, color: "#4B5563", marginTop: 6 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  infoLabel: { fontSize: 12, color: "#6B7280" },
  infoValue: { fontSize: 12, color: "#111827", fontWeight: "600" },

  dogCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  dogAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  dogName: { fontSize: 15, fontWeight: "900", color: "#111827" },
  dogMeta: { fontSize: 12, color: "#6B7280", marginTop: 3 },

  emptyWrap: { paddingVertical: 20, alignItems: "center" },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  muted: { fontSize: 12, color: "#6B7280" },
  primaryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#0ACF83",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  logoutBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
  },
  logoutText: { fontSize: 14, color: "#EF4444", fontWeight: "800" },

  center: { paddingVertical: 20, alignItems: "center", gap: 8 },

  errorCard: {
    marginTop: 16,
    backgroundColor: "#FFF1F2",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDA4AF",
  },
  errorTitle: { fontSize: 14, fontWeight: "900", color: "#9F1239" },
  errorText: { fontSize: 12, color: "#9F1239", marginTop: 6 },
  retryBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FB7185",
  },
  retryText: { color: "#fff", fontWeight: "900" },

  badgeWarn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
  },
  badgeWarnText: { fontSize: 11, color: "#92400E", fontWeight: "900" },
});
