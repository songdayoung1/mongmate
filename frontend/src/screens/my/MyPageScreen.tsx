import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, Settings, Bell, FileText, LogOut, MapPin, Dog } from "lucide-react-native";

import TopHeader from "../../components/TopHeader";
import AnimatedButton from "../../components/AnimatedButton";
import { COLORS, SHADOWS, SIZES } from "../../constants/theme";
import { useLogout } from "../../hooks/auth";
import { useProfile } from "../../hooks/profile";
import { useUserStore } from "../../store/user"; // For stats mock
import type { RootStackParamList } from "../../navigation/RootNavigator";

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
  const logoutMut = useLogout?.() ?? { mutateAsync: async () => { } };

  // Real profile data
  const { data, isLoading, error, refetch } = useProfile();

  // Mock stats from store for display improvements
  const { stats } = useUserStore();

  const guardian = data?.guardianProfile;
  const neighborhood = data?.neighborhood;
  const dogs = data?.dogs ?? [];

  const profileNeed = useMemo(
    () => !guardian?.nickname?.trim(),
    [guardian?.nickname],
  );

  const onLogout = async () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutMut.mutateAsync();
          } catch {
            Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopHeader title="마이페이지" />
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.muted}>내 정보를 불러오는 중…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopHeader title="마이페이지" />
        <View style={styles.center}>
          <Text style={styles.errorTitle}>정보를 불러올 수 없어요 😢</Text>
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
        {/* 1. Profile Card */}
        <AnimatedButton
          style={styles.profileCard}
          activeOpacity={0.95}
          onPress={() => nav.navigate("EditMyProfile")}
        >
          <View style={styles.profileContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {guardian?.nickname?.[0] ?? "G"}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.nickname}>
                  {guardian?.nickname || "닉네임 설정 필요"}
                </Text>
                {profileNeed && <View style={styles.badgeWarn} />}
              </View>
              <Text style={styles.bio} numberOfLines={1}>
                {guardian?.bio || "자기소개를 입력해주세요"}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={COLORS.textMuted} />
                <Text style={styles.locationText}>
                  {neighborhood?.regionId
                    ? `지역코드 ${neighborhood.regionId}`
                    : "위치 설정 필요"}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={COLORS.textMuted} />
          </View>
        </AnimatedButton>

        {/* 2. Stats Dashboard */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>이번 달 산책</Text>
            <Text style={styles.statValue}>{stats.monthWalkCount}회</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>총 산책 거리</Text>
            <Text style={styles.statValue}>{stats.totalDistanceKm}km</Text>
          </View>
        </View>

        {/* 3. Dogs Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>나의 반려견 🐾</Text>
          <AnimatedButton onPress={() => nav.navigate("DogManage")}>
            <Text style={styles.sectionAction}>관리</Text>
          </AnimatedButton>
        </View>

        {dogs.length === 0 ? (
          <AnimatedButton
            style={styles.emptyDogCard}
            onPress={() => nav.navigate("DogManage")}
          >
            <View style={[styles.dogAvatar, { backgroundColor: COLORS.background }]}>
              <Dog size={24} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyDogText}>반려견을 등록해주세요</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </AnimatedButton>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}>
            {dogs.map((dog) => (
              <AnimatedButton key={dog.id} style={styles.dogCard} activeOpacity={0.9} onPress={() => nav.navigate("DogManage")}>
                <View style={styles.dogAvatarInput} />
                <View style={styles.dogInfo}>
                  <Text style={styles.dogName}>{dog.name}</Text>
                  <Text style={styles.dogBreed}>{dog.breed}</Text>
                </View>
              </AnimatedButton>
            ))}
          </ScrollView>
        )}

        {/* 4. Menu List */}
        <View style={styles.menuContainer}>
          <MenuItem icon={FileText} label="내가 쓴 글" onPress={() => { }} />
          <MenuItem icon={Bell} label="알림 설정" onPress={() => { }} />
          <MenuItem icon={Settings} label="앱 설정" onPress={() => { }} />
        </View>

        {/* 5. Logout */}
        <AnimatedButton style={styles.logoutButton} onPress={onLogout}>
          <LogOut size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </AnimatedButton>
        <Text style={styles.versionText}>버전 1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon: Icon, label, onPress }: { icon: any, label: string, onPress: () => void }) {
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
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: COLORS.textMuted, marginTop: 12 },

  // 1. Profile
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nickname: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textMain,
  },
  badgeWarn: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.error,
  },
  bio: {
    fontSize: 13,
    color: COLORS.textSub,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
  },

  // 2. Stats
  statsContainer: {
    flexDirection: "row",
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.soft,
    alignItems: "center",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSub,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  // 3. Dogs
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textMain,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  emptyDogCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  emptyDogText: {
    fontSize: 14,
    color: COLORS.textSub,
    fontWeight: "600",
    flex: 1,
  },
  dogCard: {
    width: 140,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 20,
    ...SHADOWS.soft,
    gap: 10,
    alignItems: "center",
    marginVertical: 4,
  },
  dogAvatarInput: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background,
  },
  dogInfo: {
    alignItems: "center",
    gap: 2,
  },
  dogName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  dogBreed: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // 4. Menu
  menuContainer: {
    marginTop: 32,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
    ...SHADOWS.soft,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textMain,
  },

  // 5. Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    gap: 8,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.error,
  },
  versionText: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Error/Retry
  errorTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: { color: COLORS.white, fontWeight: "700" },
});
