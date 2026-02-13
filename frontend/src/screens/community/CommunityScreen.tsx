import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { MapPin, Dog, Coffee, Plus } from "lucide-react-native";

import TopHeader from "../../components/TopHeader";
import AnimatedButton from "../../components/AnimatedButton";
import { listWalkPosts } from "../../api/walkPosts";
import { COLORS, SHADOWS } from "../../constants/theme";

type FilterTab = "ALL" | "WALK" | "DOG_CAFE";
type PostType = "WALK" | "DOG_CAFE";
const DOG_CAFE_PREFIX = "[DOG_CAFE] ";

type Item = {
  id: string;
  type: PostType;
  title: string;
  region: string;
  authorNickname: string;
  createdAt: string;
  deadlineText: string;
};

function inferTypeAndTitle(
  serverType: string,
  title: string,
): { type: PostType; title: string } {
  if (title.startsWith(DOG_CAFE_PREFIX))
    return { type: "DOG_CAFE", title: title.replace(DOG_CAFE_PREFIX, "") };
  return { type: serverType === "DOG_CAFE" ? "DOG_CAFE" : "WALK", title };
}

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const listRef = React.useRef<FlatList<Item>>(null);

  const [filter, setFilter] = React.useState<FilterTab>("ALL");
  const [items, setItems] = React.useState<Item[]>([]);
  const [page, setPage] = React.useState(0);
  const [hasNext, setHasNext] = React.useState(true);

  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // ✅ 스크롤 위치 저장
  const scrollOffsetRef = React.useRef(0);
  const shouldRestoreScrollRef = React.useRef(false);

  // ✅ 중복 호출 방지
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
              (it.region?.regionId
                ? `지역 #${it.region.regionId}`
                : "지역 미정"),
            authorNickname: it.authorNickname ?? "알 수 없음",
            createdAt: it.createdAt,
            deadlineText: it.deadlineAt ?? "마감일 미정",
          };
        });

        setHasNext(res.page?.hasNext ?? false);
        setPage(pageToLoad);

        if (!append) {
          // ✅ replace일 때만 정렬 (새로고침/처음 로드)
          mapped.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setItems(mapped);
        } else {
          // ✅ append는 뒤에 붙이고 중복만 제거
          setItems((prev) => {
            const next = [...prev, ...mapped];
            const uniq = new Map<string, Item>();
            for (const x of next) uniq.set(x.id, x);
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

  // ✅ 최초 1회만 로드 (포커스마다 리로드 금지 → 스크롤 튐 방지)
  React.useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  // ✅ 상세 갔다가 돌아오면: 스크롤 복원만 (리로드 X)
  useFocusEffect(
    React.useCallback(() => {
      // 글쓰기/수정 후 refresh 플래그가 있으면 그때만 리로드
      if (route?.params?.refresh === true) {
        // refresh 후에는 스크롤은 맨 위로 가는 게 자연스러움
        scrollOffsetRef.current = 0;
        shouldRestoreScrollRef.current = true;

        fetchPage(0, false).finally(() => {
          navigation.setParams?.({ refresh: false }); // 플래그 제거
        });
        return;
      }

      // 그냥 뒤로 돌아온 경우: 스크롤 복원
      shouldRestoreScrollRef.current = true;
    }, [route?.params?.refresh, fetchPage, navigation]),
  );

  // ✅ 데이터 렌더 후 스크롤 복원
  const restoreScrollIfNeeded = React.useCallback(() => {
    if (!shouldRestoreScrollRef.current) return;
    shouldRestoreScrollRef.current = false;

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: scrollOffsetRef.current,
        animated: false,
      });
    });
  }, []);

  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
    },
    [],
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // 새로고침은 맨 위로 + replace
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

  const filtered = React.useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((x) => x.type === filter);
  }, [items, filter]);

  const handlePressWrite = () => {
    navigation.navigate("CreatePost", {
      // ✅ 글 작성 후 돌아올 때 커뮤니티를 갱신시키기 위한 힌트
      from: "Community",
    });
  };

  const renderItem = ({ item }: { item: Item }) => {
    const isWalk = item.type === "WALK";
    const Icon = isWalk ? Dog : Coffee;

    return (
      <AnimatedButton
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
      >
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
      </AnimatedButton>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title="커뮤니티" showBack={false} />

      <View style={styles.filters}>
        <FilterChip
          label="전체"
          active={filter === "ALL"}
          onPress={() => setFilter("ALL")}
        />
        <FilterChip
          label="산책"
          active={filter === "WALK"}
          onPress={() => setFilter("WALK")}
        />
        <FilterChip
          label="애견카페"
          active={filter === "DOG_CAFE"}
          onPress={() => setFilter("DOG_CAFE")}
        />
      </View>

      <FlatList
        ref={listRef}
        data={filtered}
        keyExtractor={(x) => x.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReachedThreshold={0.7}
        onEndReached={onEndReached}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={restoreScrollIfNeeded}
        ListFooterComponent={
          <View style={{ paddingVertical: 18, alignItems: "center" }}>
            {loading && (
              <Text style={{ color: "#6B7280", fontWeight: "800" }}>
                불러오는 중…
              </Text>
            )}
            {!hasNext && items.length > 0 && (
              <Text style={{ color: "#9CA3AF", fontWeight: "800" }}>
                마지막 글이에요
              </Text>
            )}
          </View>
        }
      />

      <AnimatedButton
        style={styles.fab}
        activeOpacity={0.9}
        onPress={handlePressWrite}
      >
        <Plus size={28} color="#FFFFFF" />
      </AnimatedButton>
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
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  filters: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
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
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
});
