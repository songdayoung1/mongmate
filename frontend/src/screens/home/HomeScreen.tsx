import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  MapPin,
  Plus,
  Search,
  Bell,
  Dog,
  Coffee,
  ChevronRight,
  X,
} from "lucide-react-native";

import { usePostStore, HomePost } from "../../store/posts";
import { useUserStore } from "../../store/user";
import { useProfile } from "../../hooks/profile";
import { useLocalMediaStore } from "../../store/localMedia";
import { COLORS, SHADOWS } from "../../constants/theme";
import {
  COMMUNITY_PLACEHOLDER_URI,
  GUARDIAN_PLACEHOLDER_URI,
} from "../../constants/placeholders";
import AnimatedButton from "../../components/AnimatedButton";

type FilterTab = "ALL" | "WALK" | "DOG_CAFE";
type StatusFilter = "ALL" | "OPEN" | "CLOSED";
type SortOption = "LATEST" | "DEADLINE";

const FILTER_OPTIONS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "WALK", label: "산책" },
  { key: "DOG_CAFE", label: "애견카페" },
];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "LATEST", label: "최신순" },
  { key: "DEADLINE", label: "마감일순" },
];

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "OPEN", label: "모집 중" },
  { key: "CLOSED", label: "모집 마감" },
];

function isOpenStatus(status?: string | null) {
  return status === "OPEN" || status === "ACTIVE";
}

function compareDeadlineAsc(a?: string | null, b?: string | null) {
  const aTime = a ? new Date(a).getTime() : null;
  const bTime = b ? new Date(b).getTime() : null;
  if (aTime == null && bTime == null) return 0;
  if (aTime == null) return 1;
  if (bTime == null) return -1;
  return aTime - bTime;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { posts, loadPosts, isLoading } = usePostStore();
  const { profile: fallbackProfile, stats } = useUserStore();
  const { data: profileData } = useProfile();
  const postMediaMap = useLocalMediaStore((s) => s.postMedia);

  const guardian = profileData?.guardianProfile;
  const nickname = guardian?.nickname?.trim() || fallbackProfile.nickname || "회원";
  const avatarInitial = nickname.trim().charAt(0).toUpperCase();
  const avatarUri = guardian?.avatarUrl ?? null;
  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : GUARDIAN_PLACEHOLDER_URI
      ? { uri: GUARDIAN_PLACEHOLDER_URI }
      : null;
  const locationLabel =
    profileData?.neighborhood?.regionId != null
      ? `지역 #${profileData.neighborhood.regionId}`
      : fallbackProfile.region ?? "위치 미설정";

  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("LATEST");
  const [searchDraft, setSearchDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const handleSearchKeyPress = React.useCallback((event: any) => {
    if (Platform.OS === "web") {
      event.stopPropagation?.();
      if (event?.nativeEvent?.key === "Enter") {
        event.preventDefault?.();
      }
    }
  }, []);

  const greetingSubtitle = `반가워요, ${nickname}님!`;
  const greetingHeadline = "오늘도 즐거운 산책 메이트를 찾아볼까요?";

  useEffect(() => {
    loadPosts({ page: 0, size: 20 });
  }, [loadPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPosts({ page: 0, size: 20 });
    } finally {
      setRefreshing(false);
    }
  }, [loadPosts]);

  const handlePressWrite = () => {
    navigation.navigate("CreatePost");
  };

  const handlePressMore = () => {
    navigation.navigate("Community");
  };

  const handlePressProfile = useCallback(() => {
    navigation.navigate("EditMyProfile");
  }, [navigation]);

  const handleOpenSearch = useCallback(() => {
    setSearchDraft(keyword);
    setSearchOpen(true);
  }, [keyword]);

  const handleApplySearch = useCallback(() => {
    setKeyword(searchDraft.trim());
    setSearchOpen(false);
  }, [searchDraft]);

  const handleCancelSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchDraft(keyword);
  }, [keyword]);

  const handleClearSearch = useCallback(() => {
    setSearchDraft("");
    setKeyword("");
    setSearchOpen(false);
  }, []);

  const filteredPosts = useMemo(() => {
    let base = posts.filter((post) => {
      if (activeFilter !== "ALL" && post.type !== activeFilter) return false;
      if (statusFilter === "OPEN" && !isOpenStatus(post.status)) return false;
      if (statusFilter === "CLOSED" && isOpenStatus(post.status)) return false;
      return true;
    });

    if (keyword) {
      const lowered = keyword.toLowerCase();
      base = base.filter((post) => {
        const haystack = `${post.title} ${post.authorNickname} ${post.region}`.toLowerCase();
        return haystack.includes(lowered);
        });
    }

    const sorted = [...base];
    if (sortOption === "DEADLINE") {
      sorted.sort((a, b) => compareDeadlineAsc(a.deadlineAt, b.deadlineAt));
    } else {
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return sorted.slice(0, 5);
  }, [posts, activeFilter, statusFilter, sortOption, keyword]);

  const sortLabel = sortOption === "LATEST" ? "최신순" : "마감일순";
  const statusLabel =
    statusFilter === "OPEN"
      ? "모집 중"
      : statusFilter === "CLOSED"
        ? "모집 마감"
        : "전체";

  const renderPostItem = ({ item }: { item: HomePost }) => {
    const isWalk = item.type === "WALK";
    const TypeIcon = isWalk ? Dog : Coffee;
    const typeColor = isWalk ? "#0ACF83" : "#FF9F43";
    const typeLabel = isWalk ? "산책" : "애견카페";
    const coverUri = postMediaMap[item.id]?.[0] ?? null;
    const coverSource = coverUri
      ? { uri: coverUri }
      : { uri: COMMUNITY_PLACEHOLDER_URI };

    return (
      <AnimatedButton
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
      >
        <View style={styles.cardRow}>
          <Image
            source={coverSource}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor: isWalk ? COLORS.primaryLight : COLORS.secondaryLight,
                    borderColor: isWalk ? COLORS.primary : COLORS.secondary,
                    borderWidth: 1,
                  },
                ]}
              >
                <TypeIcon size={12} color={typeColor} strokeWidth={3} />
                <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
              </View>
              <Text style={styles.deadline}>{item.deadlineText}</Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>

            <View style={styles.cardMeta}>
              <View style={styles.metaRow}>
                <MapPin size={14} color="#9CA3AF" />
                <Text style={styles.metaText}>{item.region}</Text>
              </View>
              <Text style={styles.authorText}>by {item.authorNickname}</Text>
            </View>
          </View>
        </View>
      </AnimatedButton>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.greetingRow}>
        <View style={styles.greetingCopy}>
          <Text style={styles.greetingSub}>{greetingSubtitle}</Text>
          <Text style={styles.greetingMain}>{greetingHeadline}</Text>
        </View>
        <AnimatedButton style={styles.profileButton} onPress={handlePressProfile} activeOpacity={0.85}>
          <View style={styles.avatarPlaceholder}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            )}
          </View>
        </AnimatedButton>
      </View>

      <View style={styles.dashboardCard}>
        <View style={styles.statItem}>
          <View style={styles.statIconWrap}>
            <MapPin size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.statLabel}>이번 달 산책</Text>
            <Text style={styles.statValue}>{stats.monthWalkCount}회</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <View style={[styles.statIconWrap, { backgroundColor: COLORS.secondary }]}>
            <Dog size={20} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.statLabel}>누적 이동 거리</Text>
            <Text style={styles.statValue}>{stats.totalDistanceKm.toFixed(1)} km</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterRowContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterRowScroll}
        >
          {FILTER_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.key}
              label={opt.label}
              active={activeFilter === opt.key}
              onPress={() => setActiveFilter(opt.key)}
            />
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.sortButton}
          activeOpacity={0.85}
          onPress={() => setFilterModalOpen(true)}
        >
          <Text style={styles.sortButtonText}>
            {`정렬: ${sortLabel} · 상태: ${statusLabel}`}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>방금 올라온 모집글</Text>
        <AnimatedButton style={styles.moreBtn} onPress={handlePressMore} activeOpacity={0.8}>
          <Text style={styles.moreText}>더 보기</Text>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </AnimatedButton>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <View style={styles.locationChip}>
          <MapPin size={14} color="#0ACF83" />
          <Text style={styles.locationText}>{locationLabel}</Text>
        </View>
        <View style={styles.topActions}>
          <AnimatedButton style={styles.iconButton} onPress={handleOpenSearch}>
            <Search size={22} color="#1F2937" />
          </AnimatedButton>
          <AnimatedButton style={styles.iconButton}>
            <Bell size={22} color="#1F2937" />
            <View style={styles.badge} />
          </AnimatedButton>
        </View>
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPostItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ACF83" />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Dog size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {isLoading ? "모집글을 불러오는 중이에요" : "아직 등록된 모집글이 없어요"}
            </Text>
            <Text style={styles.emptySub}>가장 먼저 모집글을 등록해보세요!</Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ paddingTop: 16, paddingBottom: 40 }}>
            <AnimatedButton style={styles.moreFooterBtn} onPress={handlePressMore} activeOpacity={0.9}>
              <Text style={styles.moreFooterText}>커뮤니티에서 더 보기</Text>
            </AnimatedButton>
          </View>
        }
      />

      <AnimatedButton style={styles.fab} activeOpacity={0.9} onPress={handlePressWrite}>
        <Plus size={28} color="#FFFFFF" />
      </AnimatedButton>

      <Modal
        visible={filterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.filterModalBackdrop}
          activeOpacity={1}
          onPress={() => setFilterModalOpen(false)}
        />
        <View style={styles.filterModal}>
          <Text style={styles.filterModalTitle}>정렬 기준</Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.filterOption,
                sortOption === opt.key && styles.filterOptionActive,
              ]}
              onPress={() => setSortOption(opt.key)}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  sortOption === opt.key && styles.filterOptionTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.filterModalTitle, { marginTop: 18 }]}>
            모집 상태
          </Text>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.filterOption,
                statusFilter === opt.key && styles.filterOptionActive,
              ]}
              onPress={() => setStatusFilter(opt.key)}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  statusFilter === opt.key && styles.filterOptionTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.filterModalTitle, { marginTop: 18 }]}>
            카테고리
          </Text>
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.filterOption,
                activeFilter === opt.key && styles.filterOptionActive,
              ]}
              onPress={() => setActiveFilter(opt.key)}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  activeFilter === opt.key && styles.filterOptionTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.filterModalClose}
            onPress={() => setFilterModalOpen(false)}
          >
            <Text style={styles.filterModalCloseText}>완료</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {searchOpen && (
        <View style={styles.searchOverlay}>
          <TouchableOpacity
            style={styles.searchBackdrop}
            activeOpacity={1}
            onPress={handleCancelSearch}
          />
          <View style={styles.searchModal}>
            <View style={styles.searchFieldRow}>
              <Search size={18} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                autoFocus
                value={searchDraft}
                onChangeText={setSearchDraft}
                placeholder="제목 또는 닉네임 검색"
                returnKeyType="search"
                onKeyPress={handleSearchKeyPress}
                onSubmitEditing={handleApplySearch}
              />
              {searchDraft.length > 0 && (
                <TouchableOpacity
                  style={styles.searchClear}
                  onPress={() => setSearchDraft("")}
                >
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.searchActionRow}>
              <TouchableOpacity
                style={[styles.searchActionBtn, styles.searchResetBtn]}
                onPress={handleClearSearch}
              >
                <Text style={[styles.searchActionText, styles.searchResetText]}>
                  초기화
                </Text>
              </TouchableOpacity>
              <View style={styles.searchActionSpacer} />
              <TouchableOpacity
                style={[styles.searchActionBtn, styles.searchCancelBtn]}
                onPress={handleCancelSearch}
              >
                <Text style={[styles.searchActionText, styles.searchCancelText]}>
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchActionBtn} onPress={handleApplySearch}>
                <Text style={styles.searchActionText}>검색</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedButton onPress={onPress} style={[styles.chip, active && styles.chipActive]} activeOpacity={0.8}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8FFF5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  locationText: { fontSize: 13, fontWeight: "700", color: "#0ACF83" },
  topActions: { flexDirection: "row", gap: 10 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 10 },
  headerContainer: { paddingBottom: 12 },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  greetingCopy: { flex: 1, paddingRight: 12 },
  greetingSub: { fontSize: 14, color: COLORS.textSub, fontWeight: "600" },
  greetingMain: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textMain,
    marginTop: 6,
    lineHeight: 30,
  },
  profileButton: {},
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    overflow: "hidden",
  },
  avatarText: { fontSize: 16, fontWeight: "900", color: COLORS.textMuted },
  avatarImage: { width: "100%", height: "100%" },
  dashboardCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700" },
  statValue: {
    fontSize: 18,
    color: COLORS.textMain,
    fontWeight: "900",
    marginTop: 2,
  },
  divider: { width: 1, backgroundColor: COLORS.divider, marginHorizontal: 12 },
  searchOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  searchBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  searchModal: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 16,
    ...SHADOWS.soft,
  },
  searchFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMain,
  },
  searchClear: { padding: 4 },
  searchActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  searchActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  searchActionText: { fontWeight: "900", color: "#FFFFFF" },
  searchCancelBtn: { backgroundColor: "#EFF1F5" },
  searchCancelText: { color: COLORS.textMain },
  searchResetBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchResetText: { color: COLORS.textMuted },
  searchActionSpacer: { flex: 1 },
  filterRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  filterRowScroll: { flexGrow: 0, flexShrink: 1, flexBasis: "auto" },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 10,
    paddingRight: 32,
  },
  sortButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 9,
    ...SHADOWS.soft,
  },
  sortButtonText: { fontSize: 13, fontWeight: "700", color: COLORS.textSub },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.textSub },
  chipTextActive: { color: COLORS.primaryDark },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textMain },
  moreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  moreText: { fontSize: 13, fontWeight: "800", color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
  },
  cardImage: {
    width: 92,
    height: 92,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  cardBody: { flex: 1, justifyContent: "space-between" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  typeText: { fontSize: 12, fontWeight: "900" },
  deadline: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700" },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textMain,
    lineHeight: 22,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "700" },
  authorText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700" },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    gap: 10,
  },
  emptyText: { fontSize: 16, fontWeight: "800", color: COLORS.textMain },
  emptySub: { fontSize: 13, color: COLORS.textMuted, fontWeight: "700" },
  moreFooterBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },
  moreFooterText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },
  filterModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  filterModal: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "25%",
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 20,
    ...SHADOWS.soft,
  },
  filterModalTitle: { fontSize: 14, fontWeight: "900", color: COLORS.textMain },
  filterOption: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filterOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  filterOptionText: { fontWeight: "800", color: COLORS.textSub },
  filterOptionTextActive: { color: COLORS.primaryDark },
  filterModalClose: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  filterModalCloseText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});
