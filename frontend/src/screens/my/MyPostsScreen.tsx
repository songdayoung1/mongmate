import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import TopHeader from "../../components/TopHeader";
import AnimatedButton from "../../components/AnimatedButton";
import { COLORS, SHADOWS } from "../../constants/theme";
import {
  listMyWalkPosts,
  type WalkPostListItem,
} from "../../api/walkPosts";
import { useAuthStore } from "../../store/auth";
import type { RootStackParamList } from "../../navigation/RootNavigator";

const PAGE_SIZE = 20;

export default function MyPostsScreen() {
  const nav =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const userId = useAuthStore((s) => s.userId);
  const [items, setItems] = React.useState<WalkPostListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPosts = React.useCallback(async () => {
    if (!userId) {
      setItems([]);
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await listMyWalkPosts(userId, { page: 0, size: PAGE_SIZE });
      setItems(res.items);
    } catch (e: any) {
      setError(e?.message ?? "내 게시글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchPosts();
    }, [fetchPosts]),
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPosts();
    } finally {
      setRefreshing(false);
    }
  }, [fetchPosts]);

  const renderItem = ({ item }: { item: WalkPostListItem }) => (
    <AnimatedButton
      style={styles.card}
      onPress={() => nav.navigate("PostDetail", { postId: String(item.postId) })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardType}>
          {item.recruitType === "DOG_CAFE" ? "도그카페" : "산책"}
        </Text>
        <View
          style={[
            styles.statusBadge,
            item.status !== "OPEN" && styles.statusBadgeClosed,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.status !== "OPEN" && styles.statusTextClosed,
            ]}
          >
            {statusLabel(item.status)}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.cardMeta}>
        {item.createdAt?.slice(0, 16).replace("T", " ")} ·{" "}
        {item.region?.displayName ||
          (item.region?.regionId
            ? `지역 #${item.region.regionId}`
            : "지역 미정")}
      </Text>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() =>
            nav.navigate("EditMyPost", { postId: String(item.postId) })
          }
        >
          <Text style={styles.editBtnText}>수정</Text>
        </TouchableOpacity>
      </View>
    </AnimatedButton>
  );

  return (
    <View style={styles.safe}>
      <TopHeader
        title="내가 쓴 글"
        subtitle="커뮤니티에 작성한 글을 관리하세요"
        showBack
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPosts}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.postId)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>아직 작성한 글이 없어요</Text>
              <Text style={styles.emptyDesc}>
                홈 탭의 "글 작성" 버튼으로 첫 글을 만들어 보세요.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function statusLabel(status: WalkPostListItem["status"]) {
  switch (status) {
    case "COMPLETED":
      return "완료";
    case "EXPIRED":
      return "마감";
    default:
      return "모집중";
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  errorText: { color: COLORS.error, fontWeight: "800" },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  retryText: { color: "#fff", fontWeight: "800" },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardType: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E7F8EF",
  },
  statusBadgeClosed: { backgroundColor: "#FDECEF" },
  statusText: { fontSize: 11, fontWeight: "800", color: COLORS.primaryDark },
  statusTextClosed: { color: COLORS.error },
  cardTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textMain,
  },
  cardMeta: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "700",
  },
  actionRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editBtnText: { color: COLORS.primary, fontWeight: "900" },
  emptyWrap: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textMain },
  emptyDesc: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
});
