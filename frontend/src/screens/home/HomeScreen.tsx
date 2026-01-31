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
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9}
        onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + "15" }]}>
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
      </TouchableOpacity>
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
        <TouchableOpacity style={styles.profileButton}>
           {/* Placeholder for Avatar */}
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarText}>{profile.nickname[0]}</Text>
          </View>
        </TouchableOpacity>
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
           <View style={[styles.statIconWrap, { backgroundColor: "#FF9F43" }]}>
            <Dog size={20} color="#FFFFFF" />
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
          <TouchableOpacity style={styles.iconButton}>
            <Search size={22} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={22} color="#1F2937" />
            <View style={styles.badge} />
          </TouchableOpacity>
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
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.9} 
        onPress={handlePressWrite}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Subcomponents

function FilterChip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: React.ReactNode }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.8}
    >
      {icon && <View style={{ marginRight: 6 }}>{icon}</View>}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
    backgroundColor: "#E6FFFA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0ACF83",
  },
  topActions: {
    flexDirection: "row",
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 10,
    marginBottom: 20,
  },
  greetingSub: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  greetingMain: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 30,
  },
  profileButton: {
    marginTop: 4,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#9CA3AF",
  },
  dashboardCard: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#0ACF83",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0ACF83",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: "#374151",
    marginHorizontal: 10,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  chipActive: {
    backgroundColor: "#111827", // Dark theme active state
    borderColor: "#111827",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  
  // Post Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  deadline: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 24,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#6B7280",
  },
  authorText: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0ACF83",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ACF83",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  emptySub: {
    marginTop: 4,
    fontSize: 13,
    color: "#9CA3AF",
  },
});
