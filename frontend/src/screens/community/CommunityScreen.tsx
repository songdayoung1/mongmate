import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import TopHeader from "../../components/TopHeader";
import { usePostStore, type HomePost, type PostType } from "../../store/posts";

type FilterTab = "ALL" | "WALK" | "DOG_CAFE";

const PRIMARY = "#0ACF83";

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const posts = usePostStore((s) => s.posts);

  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("ALL");

  // ✅ 홈/커뮤니티 동일 데이터 소스 사용
  const filteredPosts = React.useMemo(() => {
    if (activeFilter === "ALL") return posts;
    return posts.filter((p) => p.type === activeFilter);
  }, [posts, activeFilter]);

  // ✅ 홈과 동일한 글쓰기 이동 방식 (RootStack의 CreatePost로)
  const handlePressWrite = () => {
    const rootNav = navigation.getParent?.("RootStack");
    if (!rootNav) {
      console.warn("RootStack 네비게이터를 찾지 못했습니다.");
      return;
    }
    rootNav.navigate("CreatePost");
  };

  // ✅ 홈과 동일한 카드 UI (필드도 posts.ts와 동일)
  const renderPostItem = ({ item }: { item: HomePost }) => {
    const typeLabel = item.type === "WALK" ? "산책" : "애견카페";

    return (
      <TouchableOpacity style={styles.postCard} activeOpacity={0.9}>
        <View style={styles.postThumbnail} />
        <View style={styles.postContent}>
          <View style={styles.postHeaderRow}>
            <Text style={styles.postTypeBadge}>{typeLabel}</Text>
            <Text style={styles.postDeadline}>{item.deadlineText}</Text>
          </View>

          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.postMetaRow}>
            <Text style={styles.postRegion}>{item.region}</Text>
            <Text style={styles.postAuthor}>by {item.authorNickname}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title="커뮤니티" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ 홈과 동일한 상단 액션(필터 + 글쓰기 버튼) */}
        <View style={styles.actionsRow}>
          <View style={styles.filterTabs}>
            <FilterChip
              label="전체"
              active={activeFilter === "ALL"}
              onPress={() => setActiveFilter("ALL")}
            />
            <FilterChip
              label="산책"
              active={activeFilter === "WALK"}
              onPress={() => setActiveFilter("WALK")}
            />
            <FilterChip
              label="애견카페"
              active={activeFilter === "DOG_CAFE"}
              onPress={() => setActiveFilter("DOG_CAFE")}
            />
          </View>

          <TouchableOpacity
            style={styles.writeButton}
            activeOpacity={0.9}
            onPress={handlePressWrite}
          >
            <Text style={styles.writeButtonText}>+ 글쓰기</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ 홈/커뮤니티 공유 글 리스트 */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>글 목록</Text>
          <Text style={styles.listMore}>최신순</Text>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderPostItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>아직 등록된 글이 없어요.</Text>
                <Text style={styles.emptySubText}>
                  가장 먼저 글을 올려보는 건 어떨까요?
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>
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
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  filterTabs: { flexDirection: "row", gap: 8 },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: {
    backgroundColor: "rgba(10, 207, 131, 0.10)",
    borderColor: "rgba(10, 207, 131, 0.35)",
  },
  chipText: { fontSize: 13, fontWeight: "800", color: "#6B7280" },
  chipTextActive: { color: "#0A8F5B" },

  // ✅ 홈과 같은 글쓰기 버튼 UI
  writeButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  writeButtonText: { color: "#fff", fontSize: 13, fontWeight: "900" },

  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  listTitle: { fontSize: 15, fontWeight: "900", color: "#111827" },
  listMore: { fontSize: 12, fontWeight: "700", color: "#6B7280" },

  // ✅ 홈과 동일한 카드 스타일
  postCard: {
    flexDirection: "row",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  postThumbnail: {
    width: 72,
    backgroundColor: "#F3F4F6",
  },
  postContent: { flex: 1, padding: 12, gap: 6 },

  postHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postTypeBadge: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0A8F5B",
    backgroundColor: "rgba(10, 207, 131, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
  },
  postDeadline: { fontSize: 12, color: "#6B7280", fontWeight: "700" },

  postTitle: { fontSize: 14, fontWeight: "900", color: "#111827" },

  postMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  postRegion: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
  postAuthor: { fontSize: 12, color: "#9CA3AF", fontWeight: "700" },

  emptyWrap: {
    paddingVertical: 28,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
});
