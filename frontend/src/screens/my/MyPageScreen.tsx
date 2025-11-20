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
import { useAuthStore } from "../../store/auth";
import { useLogout } from "../../hooks/auth"; // 쓰고 있지 않다면 제거해도 됨
import TopHeader from "../../components/TopHeader";

// 전화번호 마스킹 유틸
function maskPhone(phone: string | undefined | null) {
  if (!phone) return "-";
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + "-****-" + phone.slice(-4);
}

export default function MyPageScreen() {
  const { user } = useAuthStore();
  const logoutMut = useLogout?.() ?? { mutateAsync: async () => {} };

  // 나의 활동 (임시 더미 데이터) - 나중에 API 응답으로 대체
  const myActivity = {
    postCount: 5, // 내가 쓴 산책글 수
    likeReceived: 12, // 내 글에 받은 하트 수 합계
    walkMateCount: 3, // 함께 산책한 메이트 수 (나중에 실제 구현)
    title: "동네 산책왕", // 현재 칭호/업적
  };

  // TODO: 나중에 서버 연동 시 API 응답으로 대체
  const guardian = {
    nickname: "만두",
    region: "영등포구 영등포동",
    intro: "소형견 위주, 저녁 산책 좋아해요 🐶",
    phone: user?.phone ?? "01012345678",
    joinDate: "2025-01-01",
  };

  const walkStats = {
    totalWalkCount: 12,
    totalDistanceKm: 18.4,
    totalDurationMin: 520,
    lastWalkAt: "2025-11-13",
  };

  const dogs = [
    {
      id: "d1",
      name: "콩이",
      breed: "푸들",
      ageYears: 3,
      sex: "여아",
      size: "소형",
      personalityTags: ["활발해요", "사람 좋아해요"],
    },
    {
      id: "d2",
      name: "두부",
      breed: "믹스",
      ageYears: 5,
      sex: "남아",
      size: "중형",
      personalityTags: ["조용한 편", "산책 좋아해요"],
    },
  ];

  const onEditProfile = () => {
    Alert.alert("준비 중", "프로필 수정 기능은 추후에 추가될 예정입니다.");
  };

  const onEditDogs = () => {
    Alert.alert(
      "준비 중",
      "반려견 정보 수정/추가 기능은 추후에 추가될 예정입니다."
    );
  };

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
      {/* 상단 타이틀 */}
      <TopHeader
        title="마이페이지"
        subtitle="내 프로필과 반려견 정보를 확인하세요"
        backgroundColor="#FFFFFF"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 내 프로필 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>내 프로필</Text>
            <TouchableOpacity onPress={onEditProfile}>
              <Text style={styles.sectionAction}>프로필 수정</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar} />
              <View style={styles.profileTextBlock}>
                <Text style={styles.nickname}>{guardian.nickname}</Text>
                <Text style={styles.region}>{guardian.region}</Text>
                <Text style={styles.intro} numberOfLines={2}>
                  {guardian.intro}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>연락처</Text>
              <Text style={styles.infoValue}>{maskPhone(guardian.phone)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>가입일</Text>
              <Text style={styles.infoValue}>{guardian.joinDate}</Text>
            </View>
          </View>
        </View>

        {/* 산책 기록(업적) 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>산책 기록</Text>
          <View style={styles.card}>
            <View style={styles.statsRow}>
              <View style={styles.statsItem}>
                <Text style={styles.statsLabel}>총 산책 횟수</Text>
                <Text style={styles.statsValue}>
                  {walkStats.totalWalkCount}회
                </Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={styles.statsLabel}>총 거리</Text>
                <Text style={styles.statsValue}>
                  {walkStats.totalDistanceKm.toFixed(1)} km
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statsItem}>
                <Text style={styles.statsLabel}>총 시간</Text>
                <Text style={styles.statsValue}>
                  {Math.round(walkStats.totalDurationMin / 60)}시간
                </Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={styles.statsLabel}>최근 산책</Text>
                <Text style={styles.statsValue}>
                  {walkStats.lastWalkAt ?? "-"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 반려견 정보 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>반려견 정보</Text>
            <TouchableOpacity onPress={onEditDogs}>
              <Text style={styles.sectionAction}>반려견 관리</Text>
            </TouchableOpacity>
          </View>

          {dogs.length === 0 ? (
            <View style={styles.emptyDogWrap}>
              <Text style={styles.emptyDogText}>
                등록된 반려견 정보가 없습니다.
              </Text>
              <Text style={styles.emptyDogSub}>
                산책 메이트 찾기를 위해 반려견 정보를 추가해보세요.
              </Text>
            </View>
          ) : (
            dogs.map((dog) => (
              <View key={dog.id} style={styles.dogCard}>
                <View style={styles.dogAvatar} />
                <View style={styles.dogInfo}>
                  <View style={styles.dogHeaderRow}>
                    <Text style={styles.dogName}>{dog.name}</Text>
                    <Text style={styles.dogMetaText}>
                      {dog.ageYears}살 · {dog.sex}
                    </Text>
                  </View>
                  <Text style={styles.dogMetaText}>
                    {[dog.breed, dog.size].filter(Boolean).join(" · ")}
                  </Text>
                  {dog.personalityTags && (
                    <View style={styles.tagRow}>
                      {dog.personalityTags.map((tag) => (
                        <View key={tag} style={styles.tagChip}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* 나의 활동 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>나의 활동</Text>

          <View style={styles.card}>
            {/* 칭호/업적 뱃지 */}
            <View style={styles.titleBadge}>
              <Text style={styles.titleBadgeLabel}>현재 칭호</Text>
              <Text style={styles.titleBadgeText}>{myActivity.title}</Text>
            </View>

            {/* 활동 통계 */}
            <View style={styles.statsRow}>
              <View style={styles.statsItem}>
                <Text style={styles.statsLabel}>쓴 산책글</Text>
                <Text style={styles.statsValue}>{myActivity.postCount}개</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={styles.statsLabel}>받은 하트</Text>
                <Text style={styles.statsValue}>
                  {myActivity.likeReceived}개
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statsItem}>
                <Text style={styles.statsLabel}>함께한 메이트</Text>
                <Text style={styles.statsValue}>
                  {myActivity.walkMateCount}명
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 기타 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기타 정보</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>알림 설정</Text>
              <Text style={styles.infoValue}>추후 설정 예정</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>약관 / 개인정보 처리방침</Text>
              <Text style={styles.infoValue}>앱 하단 메뉴에서 확인 예정</Text>
            </View>
          </View>
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
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  sectionAction: {
    fontSize: 13,
    color: "#0ACF83",
    fontWeight: "600",
  },
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
  profileRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  profileTextBlock: {
    flex: 1,
    justifyContent: "center",
  },
  nickname: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  region: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  intro: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  statsItem: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  statsValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },
  dogCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  dogAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginRight: 10,
  },
  dogInfo: {
    flex: 1,
    justifyContent: "center",
  },
  dogHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  dogName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginRight: 4,
  },
  dogMetaText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#ECFDF3",
  },
  tagText: {
    fontSize: 11,
    color: "#16A34A",
  },
  emptyDogWrap: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyDogText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  emptyDogSub: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  logoutBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "700",
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ECFDF3",
    marginBottom: 10,
  },
  titleBadgeLabel: {
    fontSize: 11,
    color: "#16A34A",
    marginRight: 6,
    fontWeight: "600",
  },
  titleBadgeText: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "700",
  },
  activityHintWrap: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  activityHintText: {
    fontSize: 11,
    color: "#6B7280",
  },
});
