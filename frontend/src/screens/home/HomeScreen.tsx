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

type PostType = "WALK" | "DOG_CAFE";

type HomePost = {
  id: string;
  type: PostType;
  title: string;
  region: string;
  deadlineText: string;
  authorNickname: string;
};

const MOCK_POSTS: HomePost[] = [
  {
    id: "1",
    type: "WALK",
    title: "저녁 한강 산책 같이 하실 분 구해요 🐾",
    region: "마포구 성산동",
    deadlineText: "오늘 20:00까지",
    authorNickname: "멍멍맘",
  },
  {
    id: "2",
    type: "DOG_CAFE",
    title: "주말 애견카페 같이 가실 분 구해요 ☕",
    region: "마포구 연남동",
    deadlineText: "내일 오후까지",
    authorNickname: "두부아빠",
  },
  {
    id: "3",
    type: "WALK",
    title: "소형견 위주로 가볍게 동네 산책해요",
    region: "마포구 망원동",
    deadlineText: "이번 주 내",
    authorNickname: "산책러버",
  },
  {
    id: "4",
    type: "WALK",
    title: "중형견 위주로 가볍게 동네 산책해요",
    region: "마포구 망원동",
    deadlineText: "이번 주 내",
    authorNickname: "산책러버",
  },
  {
    id: "5",
    type: "DOG_CAFE",
    title: "대형견 위주로 가볍게 동네 산책해요",
    region: "마포구 망원동",
    deadlineText: "이번 주 내",
    authorNickname: "산책러버",
  },
];

type FilterTab = "ALL" | "WALK" | "DOG_CAFE";

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  const [search, setSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("ALL");

  // TODO: 실제 로그인된 유저 정보 / 통계로 교체
  const profile = {
    nickname: "멍멍맘",
    region: "마포구 성산동",
  };

  const stats = {
    monthWalkCount: 3,
    totalDistanceKm: 12.4,
  };

  const handlePressWrite = () => {
    // TODO: 실제 글쓰기 화면 스택 추가되면 라우트 이름 맞춰서 수정
    // 예: navigation.navigate("CreateWalkPost");
    console.log("산책 글쓰기 버튼 클릭");
  };

  const filteredPosts = MOCK_POSTS.filter((post) => {
    const matchFilter =
      activeFilter === "ALL" ? true : post.type === activeFilter;

    const keyword = search.trim();
    const matchSearch = keyword
      ? post.title.includes(keyword) ||
        post.region.includes(keyword) ||
        post.authorNickname.includes(keyword)
      : true;

    return matchFilter && matchSearch;
  });

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
      {/* 상단 헤더 + 검색 */}
      <TopHeader
        title="반려견 산책 메이트"
        subtitle="우리 동네에서 산책 메이트를 찾아보세요"
        showSearch
        searchPlaceholder="산책글, 동네, 키워드 검색"
        searchValue={search}
        onChangeSearch={setSearch}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 내 프로필 + 업적 요약 */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <View style={styles.avatar} />
            <View style={styles.profileText}>
              <Text style={styles.nickname}>{profile.nickname}</Text>
              <Text style={styles.region}>{profile.region}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statsItem}>
              <Text style={styles.statsLabel}>이번 달 산책</Text>
              <Text style={styles.statsValue}>{stats.monthWalkCount}회</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsLabel}>총 산책 거리</Text>
              <Text style={styles.statsValue}>
                {stats.totalDistanceKm.toFixed(1)} km
              </Text>
            </View>
          </View>
        </View>

        {/* 상단 액션: 필터 + 글쓰기 버튼 */}
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

        {/* 신규 글 리스트 */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>신규 산책글</Text>
          <TouchableOpacity>
            <Text style={styles.listMore}>전체 보기</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>아직 등록된 산책글이 없어요.</Text>
              <Text style={styles.emptySubText}>
                가장 먼저 산책글을 올려보는 건 어떨까요?
              </Text>
            </View>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
      activeOpacity={0.8}
    >
      <Text
        style={[styles.filterChipText, active && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileSection: {
    marginTop: 12,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
    marginRight: 10,
  },
  profileText: {
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  region: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  statsItem: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  statsValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  filterTabs: {
    flexDirection: "row",
    flex: 1,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    borderColor: "#0ACF83",
    backgroundColor: "#ECFDF3",
  },
  filterChipText: {
    fontSize: 12,
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#0ACF83",
    fontWeight: "700",
  },
  writeButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#0ACF83",
  },
  writeButtonText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 10,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  listMore: {
    fontSize: 12,
    color: "#6B7280",
  },
  postCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  postThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginRight: 10,
  },
  postContent: {
    flex: 1,
  },
  postHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  postTypeBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0ACF83",
  },
  postDeadline: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  postTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 4,
  },
  postMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  postRegion: {
    fontSize: 12,
    color: "#6B7280",
  },
  postAuthor: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyWrap: {
    paddingVertical: 32,
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
