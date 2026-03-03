import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ChevronRight,
  Settings,
  Bell,
  FileText,
  LogOut,
  MapPin,
  Dog,
} from "lucide-react-native";

import TopHeader from "../../components/TopHeader";
import AnimatedButton from "../../components/AnimatedButton";
import { COLORS, SHADOWS } from "../../constants/theme";
import guardianPlaceholder from "../../assets/placeholders/guardian-placeholder.png";
import { useLogout } from "../../hooks/auth";
import { useProfile } from "../../hooks/profile";
import { useUserStore } from "../../store/user";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { resolveDogPhotoUri } from "../../utils/dog";
import { summarizeBadges } from "../../constants/badges";

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

export default function MyPageScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logoutMut = useLogout();

  const { data, isLoading, error, refetch } = useProfile();
  const { stats } = useUserStore();

  const guardian = data?.guardianProfile;
  const guardianAvatarSource: ImageSourcePropType =
    guardian?.avatarUrl && guardian.avatarUrl.trim().length > 0
      ? { uri: guardian.avatarUrl }
      : guardianPlaceholder;
  const needsProfile = data?.profileExists === false;
  const neighborhood = data?.neighborhood;
  const dogs = data?.dogs ?? [];
  const badgeContext = useMemo(
    () => ({
      monthWalkCount: stats.monthWalkCount ?? 0,
      totalDistanceKm: stats.totalDistanceKm ?? 0,
      heartsCount: guardian?.heartsCount ?? 0,
      reviewCount: guardian?.reviewCount ?? 0,
      dogCount: dogs.length,
    }),
    [
      stats.monthWalkCount,
      stats.totalDistanceKm,
      guardian?.heartsCount,
      guardian?.reviewCount,
      dogs.length,
    ],
  );
  const badges = useMemo(
    () => summarizeBadges(badgeContext),
    [badgeContext],
  );
  const earnedBadgeCount = useMemo(
    () => badges.filter((b) => b.achieved).length,
    [badges],
  );

  const profileNeed = useMemo(
    () => !guardian?.nickname?.trim(),
    [guardian?.nickname],
  );

  const onLogout = async () => {
    console.log("[MyPage] logout pressed");
    try {
      await logoutMut.mutateAsync();
      console.log("[MyPage] logout success -> reset to AuthStart");

      // 비로그인 상태나 로그아웃 이후에는 스택을 초기화해 AuthStart로 이동시킨다.
      // RootNavigator가 guest 스택으로 바뀌면 AuthStart가 첫 화면이 되도록 전체를 리셋한다.
      nav.reset({
        index: 0,
        routes: [{ name: "AuthStart" as any }],
      });
    } catch (e) {
      console.log("[MyPage] logout error:", e);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopHeader title="마이페이지" />
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.muted}>프로필 정보를 불러오는 중이에요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopHeader title="마이페이지" />
        <View style={styles.center}>
          <Text style={styles.errorTitle}>프로필을 불러오지 못했어요.</Text>
          <AnimatedButton style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </AnimatedButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title="마이페이지" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {needsProfile && (
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>프로필을 먼저 설정해주세요</Text>
            <Text style={styles.setupDesc}>
              닉네임과 소개를 입력해야 커뮤니티 기능을 이용할 수 있어요.
            </Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => nav.navigate("EditMyProfile", { forceSetup: true })}
            >
              <Text style={styles.setupButtonText}>지금 설정하기</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* 1. Profile Card */}
        <AnimatedButton
          style={styles.profileCard}
          activeOpacity={0.95}
          onPress={() => nav.navigate("EditMyProfile")}
        >
          <View style={styles.profileContent}>
            <View style={styles.avatar}>
              {guardianAvatarSource ? (
                <Image source={guardianAvatarSource} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {guardian?.nickname?.[0] ?? "G"}
                </Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.nickname}>
                  {guardian?.nickname || "닉네임을 설정해주세요"}
                </Text>
                {profileNeed && <View style={styles.badgeWarn} />}
              </View>
              <Text style={styles.bio} numberOfLines={1}>
                {guardian?.bio || "자기 소개를 입력해주세요"}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={COLORS.textMuted} />
                <Text style={styles.locationText}>
                  {neighborhood?.regionId
                    ? `지역 #${neighborhood.regionId}`
                    : "활동 지역을 설정해주세요"}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={COLORS.textMuted} />
          </View>
        </AnimatedButton>

        {/* 2. Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>이번 달 산책</Text>
            <Text style={styles.statValue}>{stats.monthWalkCount}회</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>누적 산책 거리</Text>
            <Text style={styles.statValue}>{stats.totalDistanceKm}km</Text>
          </View>
        </View>

        {/* 3. Dogs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>나의 반려견 카드</Text>
          <AnimatedButton onPress={() => nav.navigate("DogManage")}>
            <Text style={styles.sectionAction}>관리</Text>
          </AnimatedButton>
        </View>

        {dogs.length === 0 ? (
          <AnimatedButton
            style={styles.emptyDogCard}
            onPress={() => nav.navigate("DogManage")}
          >
            <View
              style={[styles.dogAvatar, { backgroundColor: COLORS.background }]}
            >
              <Dog size={24} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyDogText}>반려견을 등록해주세요</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </AnimatedButton>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dogList}
          >
            {dogs.map((dog) => (
              <AnimatedButton
                key={dog.id}
                style={styles.dogCard}
                activeOpacity={0.9}
                onPress={() => nav.navigate("DogManage")}
              >
                <View style={styles.dogAvatar}>
                  <Image
                    source={{
                      uri: resolveDogPhotoUri(dog.photoUrl),
                    }}
                    style={styles.dogAvatarImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.dogInfo}>
                  <Text style={styles.dogName}>{dog.name}</Text>
                  <Text style={styles.dogBreed}>{dog.breed}</Text>
                </View>
              </AnimatedButton>
            ))}
          </ScrollView>
        )}

        {/* 4. Badges */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>나의 뱃지</Text>
          <Text style={styles.badgeCounter}>
            {earnedBadgeCount}/{badges.length}개 획득
          </Text>
        </View>
        <View style={styles.badgeGrid}>
          {badges.map((badge) => {
            const progressText = badge.progress(badgeContext);
            return (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  badge.achieved && styles.badgeCardAchieved,
                ]}
              >
                <View
                  style={[
                    styles.badgeIconWrap,
                    { backgroundColor: `${badge.color}22` },
                  ]}
                >
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                </View>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDesc}>{badge.description}</Text>
                <Text style={styles.badgeProgress}>{progressText}</Text>
                <Text
                  style={[
                    styles.badgeStatus,
                    badge.achieved ? styles.badgeStatusOn : styles.badgeStatusOff,
                  ]}
                >
                  {badge.achieved ? "획득 완료" : "도전 중"}
                </Text>
              </View>
            );
          })}
        </View>

        {/* 5. Menu */}
        <View style={styles.menuContainer}>
          <MenuItem icon={FileText} label="내가 쓴 글" onPress={() => nav.navigate("MyPosts")} />
          <MenuItem icon={Bell} label="알림 설정" onPress={() => {}} />
          <MenuItem icon={Settings} label="앱 설정" onPress={() => {}} />
        </View>

        {/* 6. Logout */}
        <AnimatedButton style={styles.logoutButton} onPress={onLogout}>
          <LogOut size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </AnimatedButton>

        <Text style={styles.versionText}>버전 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) {
  return (
    <AnimatedButton style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View style={styles.menuIconBox}>
          <Icon size={18} color={COLORS.textMain} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color={COLORS.textMuted} />
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  setupCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFF9ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    gap: 8,
  },
  setupTitle: { fontSize: 15, fontWeight: "900", color: "#9A3412" },
  setupDesc: { fontSize: 13, color: "#9A3412", fontWeight: "600" },
  setupButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  setupButtonText: { color: "#fff", fontWeight: "900" },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  muted: { marginTop: 12, color: COLORS.textMuted, fontWeight: "600" },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textMain,
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  retryText: { color: "#fff", fontWeight: "800" },

  profileCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
    padding: 18,
  },
  profileContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarText: { fontSize: 20, fontWeight: "900", color: COLORS.primary },
  avatarImage: { width: "100%", height: "100%" },
  profileInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nickname: { fontSize: 18, fontWeight: "900", color: COLORS.textMain },
  badgeWarn: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  bio: { color: COLORS.textSub, fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { color: COLORS.textMuted, fontWeight: "600", fontSize: 12 },

  statsContainer: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  statBox: { flex: 1, gap: 6 },
  statLabel: { color: COLORS.textMuted, fontWeight: "700", fontSize: 12 },
  statValue: { color: COLORS.textMain, fontWeight: "900", fontSize: 18 },
  divider: {
    width: 1,
    height: 34,
    backgroundColor: COLORS.divider,
    marginHorizontal: 14,
  },
  badgeCounter: { fontSize: 12, fontWeight: "700", color: COLORS.textSub },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  badgeCard: {
    flexBasis: "47%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    padding: 12,
    gap: 6,
  },
  badgeCardAchieved: {
    borderColor: "#CFFAFE",
    backgroundColor: "#F0FDFA",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIcon: { fontSize: 18 },
  badgeTitle: { fontWeight: "900", color: COLORS.textMain, fontSize: 14 },
  badgeDesc: { fontSize: 12, color: COLORS.textSub, fontWeight: "600" },
  badgeProgress: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700" },
  badgeStatus: { fontSize: 11, fontWeight: "900" },
  badgeStatusOn: { color: COLORS.primary },
  badgeStatusOff: { color: COLORS.textMuted },

  sectionHeader: {
    marginTop: 18,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textMain },
  sectionAction: { fontSize: 13, fontWeight: "800", color: COLORS.primary },

  emptyDogCard: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emptyDogText: { flex: 1, fontWeight: "800", color: COLORS.textMain },

  dogList: { gap: 12, paddingHorizontal: 20, paddingTop: 2, paddingBottom: 2 },
  dogCard: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    padding: 14,
    width: 140,
  },
  dogAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dogAvatarImage: { width: "100%", height: "100%" },
  dogInfo: { gap: 2 },
  dogName: { fontWeight: "900", color: COLORS.textMain },
  dogBreed: { fontWeight: "700", color: COLORS.textMuted, fontSize: 12 },

  menuContainer: { marginTop: 18, marginHorizontal: 20, gap: 10 },
  menuItem: {
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontWeight: "800", color: COLORS.textMain },

  logoutButton: {
    marginTop: 18,
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#ffe0e0",
    ...SHADOWS.soft,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoutText: { color: COLORS.error, fontWeight: "900" },
  versionText: {
    marginTop: 14,
    textAlign: "center",
    color: COLORS.textMuted,
    fontWeight: "700",
    fontSize: 12,
  },
});








