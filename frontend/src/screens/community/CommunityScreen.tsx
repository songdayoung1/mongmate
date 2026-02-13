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
import TopHeader from "../../components/TopHeader";
import { Plus } from "lucide-react-native";
import { usePostStore, type HomePost, type PostType } from "../../store/posts";
import { COLORS, SHADOWS, SIZES } from "../../constants/theme";
import AnimatedButton from "../../components/AnimatedButton";
import { useNavigation } from "@react-navigation/native";

type FilterTab = "ALL" | "WALK" | "DOG_CAFE";

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const posts = usePostStore((s) => s.posts);
  const loadPosts = usePostStore((s) => s.loadPosts);

  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("ALL");

  // ✅ 커뮤니티 진입 시에도 서버 데이터 로드 (홈을 먼저 안 거쳐도 보이게)
  React.useEffect(() => {
    loadPosts({ page: 0, size: 20 });
  }, [loadPosts]);

  const filteredPosts = React.useMemo(() => {
    if (activeFilter === "ALL") return posts;
    return posts.filter((p) => p.type === activeFilter);
  }, [posts, activeFilter]);

  const handlePressWrite = () => {
    const rootNav = navigation.getParent?.("RootStack");
    if (!rootNav) {
      console.warn("RootStack 네비게이터를 찾지 못했습니다.");
      return;
    }
    rootNav.navigate("CreatePost");
  };

  const renderPostItem = ({ item }: { item: HomePost }) => {
    const isWalk = item.type === "WALK";
    const typeLabel = isWalk ? "산책" : "애견카페";
    const typeColor = isWalk ? "#0ACF83" : "#FF9F43";

    return (
      <AnimatedButton
        style={styles.postCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
      >
        <View style={styles.postThumbnail} />
        <View style={styles.postContent}>
          <View style={styles.postHeaderRow}>
            <View
              style={[
                styles.postTypeBadge,
                {
                  backgroundColor: isWalk
                    ? COLORS.primaryLight
                    : COLORS.secondaryLight,
                  borderColor: isWalk ? COLORS.primary : COLORS.secondary,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.postTypeText, { color: typeColor }]}>
                {typeLabel}
              </Text>
            </View>
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
      </AnimatedButton>
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
        <View style={styles.actionsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
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
          </ScrollView>
        </View>

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
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  actionsRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.textSub },
  chipTextActive: { color: COLORS.white },

  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  listTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textMain },
  listMore: { fontSize: 13, fontWeight: "600", color: COLORS.textSub },

  postCard: {
    flexDirection: "row",
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginHorizontal: 4,
    ...SHADOWS.card,
  },
  postThumbnail: { width: 80, backgroundColor: COLORS.background },
  postContent: { flex: 1, padding: 16, gap: 8 },
  postHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  postTypeText: { fontSize: 11, fontWeight: "700" },
  postDeadline: { fontSize: 12, color: COLORS.textSub, fontWeight: "600" },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMain,
    lineHeight: 22,
  },
  postMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },
  postRegion: { fontSize: 13, color: COLORS.textSub, fontWeight: "500" },
  postAuthor: { fontSize: 13, color: COLORS.textMuted, fontWeight: "500" },

  emptyWrap: { paddingVertical: 40, alignItems: "center" },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMain,
    marginBottom: 6,
  },
  emptySubText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center" },

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
});
