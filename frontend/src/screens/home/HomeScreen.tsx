import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
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
} from "lucide-react-native";

import { usePostStore, HomePost } from "../../store/posts";
import { useUserStore } from "../../store/user";
import { COLORS, SHADOWS, SIZES } from "../../constants/theme";
import AnimatedButton from "../../components/AnimatedButton";

type FilterTab = "ALL" | "WALK" | "DOG_CAFE";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { posts, loadPosts, isLoading } = usePostStore();
  const { profile, stats } = useUserStore();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  // ✅ 홈은 5개만 보여줄 거지만, 필터/정렬 안정적으로 하려고 조금 넉넉히 로드
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
    // ✅ 홈 -> 커뮤니티 탭으로 이동
    navigation.navigate("Community");
  };

  const filteredPosts = useMemo(() => {
    const base = posts.filter((post) => {
      if (activeFilter === "ALL") return true;
      return post.type === activeFilter;
    });

    // ✅ 홈에서는 딱 5개만
    return base.slice(0, 5);
  }, [posts, activeFilter]);

  const renderPostItem = ({ item }: { item: HomePost }) => {
    const isWalk = item.type === "WALK";
    const TypeIcon = isWalk ? Dog : Coffee;
    const typeColor = isWalk ? "#0ACF83" : "#FF9F43";
    const typeLabel = isWalk ? "산책" : "애견카페";

    return (
      <AnimatedButton
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: isWalk
                  ? COLORS.primaryLight
                  : COLORS.secondaryLight,
                borderColor: isWalk ? COLORS.primary : COLORS.secondary,
                borderWidth: 1,
              },
            ]}
          >
            <TypeIcon size={12} color={typeColor} strokeWidth={3} />
            <Text style={[styles.typeText, { color: typeColor }]}>
              {typeLabel}
            </Text>
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
      </AnimatedButton>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greetingSub}>
            반가워요, {profile.nickname}님! 👋
          </Text>
          <Text style={styles.greetingMain}>
            오늘도 댕댕이와 함께{"\n"}즐거운 하루 되세요
          </Text>
        </View>
        <AnimatedButton style={styles.profileButton}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{profile.nickname[0]}</Text>
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
          <View
            style={[styles.statIconWrap, { backgroundColor: COLORS.secondary }]}
          >
            <Dog size={20} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.statLabel}>총 산책 거리</Text>
            <Text style={styles.statValue}>
              {stats.totalDistanceKm.toFixed(1)} km
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <FilterChip
          label="전체"
          active={activeFilter === "ALL"}
          onPress={() => setActiveFilter("ALL")}
        />
        <FilterChip
          label="산책 메이트"
          active={activeFilter === "WALK"}
          onPress={() => setActiveFilter("WALK")}
        />
        <FilterChip
          label="애견카페"
          active={activeFilter === "DOG_CAFE"}
          onPress={() => setActiveFilter("DOG_CAFE")}
        />
      </ScrollView>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>최신 게시글 🌟</Text>
        <AnimatedButton
          style={styles.moreBtn}
          onPress={handlePressMore}
          activeOpacity={0.8}
        >
          <Text style={styles.moreText}>더보기</Text>
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
          <Text style={styles.locationText}>{profile.region}</Text>
        </View>
        <View style={styles.topActions}>
          <AnimatedButton style={styles.iconButton}>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0ACF83"
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Dog size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {isLoading ? "불러오는 중..." : "등록된 게시글이 없어요"}
            </Text>
            <Text style={styles.emptySub}>
              새로운 산책 모임을 만들어보세요!
            </Text>
          </View>
        }
        ListFooterComponent={
          // ✅ 5개만 보여주니, 아래에도 더보기 버튼 한번 더
          <View style={{ paddingTop: 16, paddingBottom: 40 }}>
            <AnimatedButton
              style={styles.moreFooterBtn}
              onPress={handlePressMore}
              activeOpacity={0.9}
            >
              <Text style={styles.moreFooterText}>커뮤니티에서 더 보기</Text>
            </AnimatedButton>
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
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
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
  },
  avatarText: { fontSize: 16, fontWeight: "900", color: COLORS.textMuted },

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

  filterRow: { paddingVertical: 6, gap: 10 },
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
    marginBottom: 10,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
});
