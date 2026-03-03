import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { MapPin, Dog, Coffee, Plus, Search, X } from "lucide-react-native";

import TopHeader from "../../components/TopHeader";
import AnimatedButton from "../../components/AnimatedButton";
import { listWalkPosts, type WalkPostStatus } from "../../api/walkPosts";
import { COLORS, SHADOWS } from "../../constants/theme";
import { useLocalMediaStore } from "../../store/localMedia";
import { COMMUNITY_PLACEHOLDER_URI } from "../../constants/placeholders";

type FilterTab = "ALL" | "WALK" | "DOG_CAFE";
type PostType = "WALK" | "DOG_CAFE";
type StatusFilter = "ALL" | "OPEN" | "CLOSED";
type SortOption = "LATEST" | "DEADLINE";
const DOG_CAFE_PREFIX = "[DOG_CAFE] ";

const FILTER_TAB_OPTIONS: { key: FilterTab; label: string }[] = [
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

type Item = {
  id: string;
  type: PostType;
  title: string;
  region: string;
  authorNickname: string;
  createdAt: string;
  deadlineText: string;
  deadlineAt: string | null;
  status?: WalkPostStatus | null;
};

function inferTypeAndTitle(serverType: string, title: string) {
  if (title.startsWith(DOG_CAFE_PREFIX)) {
    return {
      type: "DOG_CAFE" as PostType,
      title: title.replace(DOG_CAFE_PREFIX, "").trim(),
    };
  }
  return {
    type: (serverType === "DOG_CAFE" ? "DOG_CAFE" : "WALK") as PostType,
    title: title.trim(),
  };
}

function isOpen(status?: string | null) {
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

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const listRef = React.useRef<FlatList<Item>>(null);
  const scrollOffsetRef = React.useRef(0);
  const shouldRestoreScrollRef = React.useRef(false);

  const [filter, setFilter] = React.useState<FilterTab>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [sortOption, setSortOption] = React.useState<SortOption>("LATEST");
  const [searchDraft, setSearchDraft] = React.useState("");
  const [keyword, setKeyword] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [filterModalOpen, setFilterModalOpen] = React.useState(false);
  const postMediaMap = useLocalMediaStore((s) => s.postMedia);
  const handleSearchKeyPress = React.useCallback((event: any) => {
    if (Platform.OS === "web") {
      event.stopPropagation?.();
      if (event?.nativeEvent?.key === "Enter") {
        event.preventDefault?.();
      }
    }
  }, []);

  const [items, setItems] = React.useState<Item[]>([]);
  const [page, setPage] = React.useState(0);
  const [hasNext, setHasNext] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const loadingRef = React.useRef(false);

  const fetchPage = React.useCallback(
    async (pageToLoad: number, append: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const res = await listWalkPosts({ page: pageToLoad, size: 10 });
        const mapped: Item[] = res.items.map((it) => {
          const fixed = inferTypeAndTitle(it.recruitType, it.title);
          return {
            id: String(it.postId),
            type: fixed.type,
            title: fixed.title,
            region:
              it.region?.displayName ??
              (it.region?.regionId ? `지역 #${it.region.regionId}` : "지역 정보 없음"),
            authorNickname: it.authorNickname ?? "익명",
            createdAt: it.createdAt,
            deadlineText: it.deadlineAt ?? "마감일 미정",
            deadlineAt: it.deadlineAt ?? null,
            status: it.status ?? null,
          };
        });

        setHasNext(res.page?.hasNext ?? false);
        setPage(pageToLoad);

        if (!append) {
          mapped.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setItems(mapped);
        } else {
          setItems((prev) => {
            const merged = [...prev, ...mapped];
            const uniq = new Map<string, Item>();
            for (const x of merged) uniq.set(x.id, x);
            return Array.from(uniq.values());
          });
        }
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [],
  );

  React.useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.refresh === true) {
        scrollOffsetRef.current = 0;
        shouldRestoreScrollRef.current = true;
        fetchPage(0, false).finally(() => {
          navigation.setParams?.({ refresh: false });
        });
        return;
      }
      shouldRestoreScrollRef.current = true;
    }, [route?.params?.refresh, fetchPage, navigation]),
  );

  const restoreScrollIfNeeded = React.useCallback(() => {
    if (!shouldRestoreScrollRef.current) return;
    shouldRestoreScrollRef.current = false;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: scrollOffsetRef.current, animated: false });
    });
  }, []);

  const onScroll = React.useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      scrollOffsetRef.current = 0;
      shouldRestoreScrollRef.current = true;
      await fetchPage(0, false);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const onEndReached = React.useCallback(() => {
    if (loadingRef.current) return;
    if (!hasNext) return;
    fetchPage(page + 1, true);
  }, [hasNext, page, fetchPage]);

  const handleOpenSearch = React.useCallback(() => {
    setSearchDraft(keyword);
    setSearchOpen(true);
  }, [keyword]);

  const handleApplySearch = React.useCallback(() => {
    setKeyword(searchDraft.trim());
    setSearchOpen(false);
  }, [searchDraft]);

  const handleCancelSearch = React.useCallback(() => {
    setSearchDraft(keyword);
    setSearchOpen(false);
  }, [keyword]);

  const handleClearSearch = React.useCallback(() => {
    setSearchDraft("");
    setKeyword("");
    setSearchOpen(false);
  }, []);

  const filtered = React.useMemo(() => {
    let base = items.filter((x) => {
      if (filter !== "ALL" && x.type !== filter) return false;
      if (statusFilter === "OPEN" && !isOpen(x.status)) return false;
      if (statusFilter === "CLOSED" && isOpen(x.status)) return false;
      return true;
    });

    if (keyword) {
      const lowered = keyword.toLowerCase();
      base = base.filter((x) => {
        const haystack = `${x.title} ${x.authorNickname} ${x.region}`.toLowerCase();
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

    return sorted;
  }, [items, filter, statusFilter, sortOption, keyword]);

  const sortLabel = sortOption === "LATEST" ? "최신순" : "마감일순";
  const statusLabel =
    statusFilter === "OPEN"
      ? "모집 중"
      : statusFilter === "CLOSED"
        ? "모집 마감"
        : "전체";

  const handlePressWrite = () => {
    navigation.navigate("CreatePost", { from: "Community" });
  };

  const renderItem = ({ item }: { item: Item }) => {
    const isWalk = item.type === "WALK";
    const Icon = isWalk ? Dog : Coffee;
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
            <View style={styles.cardTop}>
              <View
                style={[
                  styles.badge,
                  { borderColor: isWalk ? "#0ACF83" : "#FF9F43" },
                ]}
              >
                <Icon size={12} color={isWalk ? "#0ACF83" : "#FF9F43"} />
                <Text
                  style={[
                    styles.badgeText,
                    { color: isWalk ? "#0ACF83" : "#FF9F43" },
                  ]}
                >
                  {isWalk ? "산책" : "애견카페"}
                </Text>
              </View>
              <Text style={styles.deadline}>{item.deadlineText}</Text>
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>

            <View style={styles.cardBottom}>
              <View style={styles.metaRow}>
                <MapPin size={14} color="#9CA3AF" />
                <Text style={styles.meta}>{item.region}</Text>
              </View>
              <Text style={styles.meta}>by {item.authorNickname}</Text>
            </View>
          </View>
        </View>
      </AnimatedButton>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title="커뮤니티" showBack={false} />

      <View style={styles.searchTriggerRow}>
        <AnimatedButton
          style={styles.searchButton}
          activeOpacity={0.85}
          onPress={handleOpenSearch}
        >
          <Search size={16} color="#111827" />
          <Text style={styles.searchButtonText}>검색</Text>
        </AnimatedButton>
      </View>

      <View style={styles.filterRowContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          style={styles.filterRowScroll}
        >
          {FILTER_TAB_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.key}
              label={opt.label}
              active={filter === opt.key}
              onPress={() => setFilter(opt.key)}
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

      <FlatList
        ref={listRef}
        data={filtered}
        keyExtractor={(x) => x.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.7}
        onEndReached={onEndReached}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={restoreScrollIfNeeded}
        ListFooterComponent={
          <View style={{ paddingVertical: 18, alignItems: "center" }}>
            {loading && (
              <Text style={{ color: "#6B7280", fontWeight: "800" }}>
                불러오는 중...
              </Text>
            )}
            {!hasNext && items.length > 0 && (
              <Text style={{ color: "#9CA3AF", fontWeight: "800" }}>
                마지막 페이지입니다
              </Text>
            )}
            {!loading && filtered.length === 0 && (
              <Text style={{ color: "#9CA3AF", fontWeight: "800" }}>
                조건에 맞는 글이 없어요
              </Text>
            )}
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
          {FILTER_TAB_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.filterOption,
                filter === opt.key && styles.filterOptionActive,
              ]}
              onPress={() => setFilter(opt.key)}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  filter === opt.key && styles.filterOptionTextActive,
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
            <View style={styles.searchActions}>
              <TouchableOpacity
                style={[styles.searchActionBtn, styles.searchResetBtn]}
                onPress={handleClearSearch}
              >
                <Text style={[styles.searchActionText, styles.searchResetText]}>
                  초기화
                </Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
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
    <AnimatedButton
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.85}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  searchTriggerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
  },
  searchButtonText: { fontWeight: "800", color: COLORS.textMain },
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
  searchBackdrop: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  searchModal: {
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 16,
    ...SHADOWS.soft,
  },
  searchFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  searchActions: {
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
  searchActionText: { color: "#fff", fontWeight: "900" },
  searchCancelBtn: { backgroundColor: "#EFF1F5" },
  searchCancelText: { color: COLORS.textMain },
  searchResetBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchResetText: { color: COLORS.textMuted },
  filterRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  filterRowScroll: { flexGrow: 0, flexShrink: 1, flexBasis: "auto" },
  filters: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 32,
    alignItems: "center",
  },
  sortButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...SHADOWS.soft,
  },
  sortButtonText: { fontWeight: "700", color: COLORS.textSub, fontSize: 13 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...SHADOWS.soft,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: { fontWeight: "900", color: "#6B7280" },
  chipTextActive: { color: COLORS.primaryDark },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...SHADOWS.soft,
  },
  cardRow: {
    flexDirection: "row",
    gap: 14,
  },
  cardImage: {
    width: 92,
    height: 92,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  cardBody: { flex: 1, justifyContent: "space-between" },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontWeight: "900", fontSize: 12 },
  deadline: { color: "#9CA3AF", fontWeight: "900", fontSize: 12 },
  title: {
    fontWeight: "900",
    color: "#111827",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { color: "#6B7280", fontWeight: "900", fontSize: 12 },
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
