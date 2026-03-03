import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import TopHeader from "../../components/TopHeader";
import AnimatedButton from "../../components/AnimatedButton";
import { COLORS, SHADOWS } from "../../constants/theme";
import { listMyWalkPosts, type MyWalkPostListItem } from "../../api/walkPosts";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useLocalMediaStore } from "../../store/localMedia";
import { COMMUNITY_PLACEHOLDER_URI } from "../../constants/placeholders";

type FilterTab = "ALL" | "WALK" | "DOG_CAFE";
type StatusFilter = "ALL" | "ACTIVE" | "CLOSED";
type SortOption = "LATEST" | "DEADLINE";

const PAGE_SIZE = 20;
const DOG_CAFE_PREFIX = "[DOG_CAFE] ";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "LATEST", label: "최신순" },
  { key: "DEADLINE", label: "마감일순" },
];

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "ACTIVE", label: "모집 중" },
  { key: "CLOSED", label: "모집 마감" },
];

function inferRecruitType(title: string) {
  if (title.startsWith(DOG_CAFE_PREFIX)) {
    return {
      type: "DOG_CAFE" as const,
      displayTitle: title.slice(DOG_CAFE_PREFIX.length).trim(),
    };
  }
  return { type: "WALK" as const, displayTitle: title.trim() };
}

function statusLabel(status: MyWalkPostListItem["status"]) {
  switch (status) {
    case "ACTIVE":
    case "OPEN":
      return "모집 중";
    case "CLOSED":
    case "COMPLETED":
      return "마감됨";
    case "EXPIRED":
      return "만료";
    default:
      return typeof status === "string" && status.trim() ? status : "상태 미정";
  }
}

function isActive(status: MyWalkPostListItem["status"]) {
  return status === "ACTIVE" || status === "OPEN";
}

function parseDeadline(deadlineText: string | null) {
  if (!deadlineText) return null;
  const date = new Date(deadlineText);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

export default function MyPostsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const postMedia = useLocalMediaStore((s) => s.postMedia);

  const [items, setItems] = React.useState<MyWalkPostListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [typeFilter, setTypeFilter] = React.useState<FilterTab>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [sortOption, setSortOption] = React.useState<SortOption>("LATEST");
  const [filterModalOpen, setFilterModalOpen] = React.useState(false);

  const fetchPosts = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await listMyWalkPosts({ page: 0, size: PAGE_SIZE });
      setItems(res.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "내가 쓴 글을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const decorated = React.useMemo(() => {
    return items.map((item) => {
      const meta = inferRecruitType(item.title ?? "");
      return { ...item, recruitType: meta.type, displayTitle: meta.displayTitle };
    });
  }, [items]);

  const filtered = React.useMemo(() => {
    let base = decorated;
    if (typeFilter !== "ALL") {
      base = base.filter((item) => item.recruitType === typeFilter);
    }
    if (statusFilter === "ACTIVE") {
      base = base.filter((item) => isActive(item.status));
    } else if (statusFilter === "CLOSED") {
      base = base.filter((item) => !isActive(item.status));
    }

    const sorted = [...base];
    if (sortOption === "DEADLINE") {
      sorted.sort((a, b) => {
        const aTime = parseDeadline(a.deadlineText);
        const bTime = parseDeadline(b.deadlineText);
        if (aTime == null && bTime == null) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (aTime == null) return 1;
        if (bTime == null) return -1;
        return aTime - bTime;
      });
    } else {
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return sorted;
  }, [decorated, typeFilter, statusFilter, sortOption]);

  const sortLabel = sortOption === "LATEST" ? "최신순" : "마감일순";
  const statusSummary =
    statusFilter === "ACTIVE"
      ? "모집 중"
      : statusFilter === "CLOSED"
        ? "모집 마감"
        : "전체";

  const renderItem = ({ item }: { item: typeof decorated[number] }) => {
    const regionText = item.regionText?.trim() || "지역 정보 없음";
    const isActiveStatus = isActive(item.status);
    const coverUri =
      postMedia[String(item.postId)]?.[0] ?? COMMUNITY_PLACEHOLDER_URI;

    return (
      <AnimatedButton
        style={styles.card}
        onPress={() =>
          nav.navigate("PostDetail", {
            postId: String(item.postId),
            allowEdit: true,
          })
        }
      >
        <View style={styles.cardRow}>
          <Image source={{ uri: coverUri }} style={styles.cover} resizeMode="cover" />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardType}>
                {item.recruitType === "WALK" ? "산책" : "애견카페"}
              </Text>
              <View
                style={[styles.statusBadge, !isActiveStatus && styles.statusBadgeClosed]}
              >
                <Text
                  style={[styles.statusText, !isActiveStatus && styles.statusTextClosed]}
                >
                  {statusLabel(item.status)}
                </Text>
              </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.displayTitle || "제목 정보 없음"}
            </Text>
            <Text style={styles.cardMeta}>
              {formatDate(item.createdAt)} · {regionText}
            </Text>
            {item.deadlineText && (
              <Text style={styles.deadlineText}>마감 {item.deadlineText}</Text>
            )}
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
          </View>
        </View>
      </AnimatedButton>
    );
  };

  return (
    <View style={styles.safe}>
      <TopHeader title="내가 쓴 글" subtitle="작성한 모집글을 확인하고 수정하세요" showBack />

      <View style={styles.filterRow}>
        <FilterChip label="전체" active={typeFilter === "ALL"} onPress={() => setTypeFilter("ALL")} />
        <FilterChip label="산책" active={typeFilter === "WALK"} onPress={() => setTypeFilter("WALK")} />
        <FilterChip label="애견카페" active={typeFilter === "DOG_CAFE"} onPress={() => setTypeFilter("DOG_CAFE")} />
      </View>
      <View style={styles.filterSummaryRow}>
        <TouchableOpacity
          style={styles.filterSummaryButton}
          activeOpacity={0.85}
          onPress={() => setFilterModalOpen(true)}
        >
          <Text style={styles.filterSummaryText}>
            {`정렬: ${sortLabel} · 상태: ${statusSummary}`}
          </Text>
        </TouchableOpacity>
      </View>

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
          data={filtered}
          keyExtractor={(item) => String(item.postId)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>아직 작성한 게시글이 없어요</Text>
              <Text style={styles.emptyDesc}>홈 화면의 "글 작성" 버튼으로 첫 모집글을 만들어 보세요.</Text>
            </View>
          }
        />
      )}

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

          <TouchableOpacity
            style={styles.filterModalClose}
            onPress={() => setFilterModalOpen(false)}
          >
            <Text style={styles.filterModalCloseText}>완료</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return iso.replace("T", " ").slice(0, 16);
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
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
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
  errorText: { color: COLORS.error, fontWeight: "800", textAlign: "center" },
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
  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  filterSummaryRow: { paddingHorizontal: 20, paddingTop: 8 },
  filterSummaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 9,
    ...SHADOWS.soft,
  },
  filterSummaryText: { fontSize: 13, fontWeight: "700", color: COLORS.textSub },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: { fontSize: 12, fontWeight: "800", color: COLORS.textSub },
  chipTextActive: { color: COLORS.primaryDark },
  card: {
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...SHADOWS.soft,
  },
  cardRow: {
    flexDirection: "row",
    gap: 14,
  },
  cardBody: {
    flex: 1,
    justifyContent: "space-between",
    gap: 4,
  },
  cover: {
    width: 92,
    height: 92,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
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
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textMain,
  },
  cardMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "700",
    marginTop: 2,
  },
  deadlineText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: "700",
  },
  actionRow: {
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
  filterModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  filterModal: {
    position: "absolute",
    left: 30,
    right: 30,
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
