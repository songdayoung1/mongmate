import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MapPin, Plus, Search, Bell, Dog, Coffee } from "lucide-react-native";

import { usePostStore, HomePost } from "../../store/posts";
import { useUserStore } from "../../store/user";
import { COLORS, SHADOWS, SIZES } from "../../constants/theme";
import AnimatedButton from "../../components/AnimatedButton";

type FilterTab = "ALL" | "WALK" | "DOG_CAFE";

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  // Stores
  const { posts } = usePostStore();
  const { profile, stats } = useUserStore();

  // Local State
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  // Mock Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handlePressWrite = () => {
    navigation.navigate("CreatePost");
  };

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === "ALL") return true;
    return post.type === activeFilter;
  });

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
          <View style={[styles.typeBadge, {
            backgroundColor: isWalk ? COLORS.primaryLight : COLORS.secondaryLight,
            borderColor: isWalk ? COLORS.primary : COLORS.secondary,
            borderWidth: 1,
          }]}>
            <TypeIcon size={12} color={typeColor} strokeWidth={3} />
            <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
          </View>
          <Text style={styles.deadline}>{item.deadlineText}</Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

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
      {/* Greeting Section */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greetingSub}>반가워요, {profile.nickname}님! 👋</Text>
          <Text style={styles.greetingMain}>오늘도 댕댕이와 함께{"\n"}즐거운 하루 되세요</Text>
        </View>
        <AnimatedButton style={styles.profileButton}>
          {/* Placeholder for Avatar */}
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{profile.nickname[0]}</Text>
          </View>
        </AnimatedButton>
      </View>

      {/* Dashboard Card */}
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
            <Text style={styles.statLabel}>총 산책 거리</Text>
            <Text style={styles.statValue}>{stats.totalDistanceKm.toFixed(1)} km</Text>
          </View>
        </View>
      </View>

      {/* Filter Section */}
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
          icon={<Dog size={14} color={activeFilter === "WALK" ? "#FFF" : "#6B7280"} />}
        />
        <FilterChip
          label="애견카페"
          active={activeFilter === "DOG_CAFE"}
          onPress={() => setActiveFilter("DOG_CAFE")}
          icon={<Coffee size={14} color={activeFilter === "DOG_CAFE" ? "#FFF" : "#6B7280"} />}
        />
      </ScrollView>

      <Text style={styles.sectionTitle}>최신 게시글 🌟</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Custom Top Bar */}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ACF83" />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Dog size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>등록된 게시글이 없어요</Text>
            <Text style={styles.emptySub}>새로운 산책 모임을 만들어보세요!</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
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

// Subcomponents

function FilterChip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: React.ReactNode }) {
  return (
    <AnimatedButton
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.8}
    >
      {icon && <View style={{ marginRight: 6 }}>{icon}</View>}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radius.circle,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  topActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 8,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.circle,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.error,
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 16,
    marginBottom: 24,
  },
  greetingSub: {
    fontSize: 14,
    color: COLORS.textSub,
    marginBottom: 6,
    fontWeight: "500",
  },
  greetingMain: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textMain,
    lineHeight: 34,
  },
  profileButton: {
    marginTop: 4,
    ...SHADOWS.soft,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },
  dashboardCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textMain,
  },
  divider: {
    width: 1,
    height: "80%",
    backgroundColor: "#374151",
    marginHorizontal: 16,
    alignSelf: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
    paddingHorizontal: 4, // for shadow clipping
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: SIZES.radius.circle,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSub,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textMain,
    marginBottom: 16,
  },

  // Post Card Styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  deadline: {
    fontSize: 12,
    color: COLORS.textSub,
    fontWeight: "600",
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textMain,
    lineHeight: 26,
    marginBottom: 16,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSub,
  },
  authorText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textMuted,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
