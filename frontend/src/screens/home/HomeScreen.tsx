import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import TopHeader from "../../components/TopHeader";
import { usePostStore, HomePost } from "../../store/posts";

type FilterTab = "ALL" | "WALK" | "DOG_CAFE";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const posts = usePostStore((s) => s.posts);

  const [search, setSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("ALL");
  const [writeHover, setWriteHover] = React.useState(false);

  const profile = {
    nickname: "만두",
    region: "마포구 성산동",
  };

  const stats = {
    monthWalkCount: 3,
    totalDistanceKm: 12.4,
  };

  const handlePressWrite = () => {
    const rootNav = navigation.getParent?.("RootStack");
    if (!rootNav) {
      console.warn("RootStack 네비게이터를 찾지 못했습니다.");
      return;
    }
    rootNav.navigate("CreatePost");
  };

  const filteredPosts = posts.filter((post) => {
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
      <Pressable
        onPress={() => {
          // TODO: 상세 화면 연결 가능
        }}
        onHoverIn={Platform.OS === "web" ? () => {} : undefined}
        style={({ pressed, hovered }: any) => [
          styles.postCard,
          hovered && Platform.OS === "web" ? styles.cardHover : null,
          pressed ? styles.cardPressed : null,
        ]}
      >
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
      </Pressable>
    );
  };

  const FilterButton = ({ tab, label }: { tab: FilterTab; label: string }) => {
    const active = activeFilter === tab;
    return (
      <Pressable
        onPress={() => setActiveFilter(tab)}
        style={({ pressed, hovered }: any) => [
          styles.filterBtn,
          active ? styles.filterBtnActive : null,
          hovered && Platform.OS === "web" ? styles.filterBtnHover : null,
          pressed ? styles.filterBtnPressed : null,
        ]}
      >
        <Text style={[styles.filterText, active && styles.filterTextActive]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
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
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <View style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.nickname}>{profile.nickname}</Text>
              <Text style={styles.region}>{profile.region}</Text>
            </View>

            <Pressable
              onPress={handlePressWrite}
              onHoverIn={
                Platform.OS === "web" ? () => setWriteHover(true) : undefined
              }
              onHoverOut={
                Platform.OS === "web" ? () => setWriteHover(false) : undefined
              }
              style={({ pressed }) => [
                styles.writeBtn,
                writeHover && Platform.OS === "web"
                  ? styles.writeBtnHover
                  : null,
                pressed ? styles.writeBtnPressed : null,
              ]}
            >
              <Text style={styles.writeBtnText}>글쓰기</Text>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>이번 달 산책</Text>
              <Text style={styles.statValue}>{stats.monthWalkCount}회</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>누적 거리</Text>
              <Text style={styles.statValue}>{stats.totalDistanceKm}km</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          <FilterButton tab="ALL" label="전체" />
          <FilterButton tab="WALK" label="산책" />
          <FilterButton tab="DOG_CAFE" label="애견카페" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>추천 글</Text>
          <Text style={styles.sectionSub}>{filteredPosts.length}개</Text>
        </View>

        <FlatList
          data={filteredPosts}
          renderItem={renderPostItem}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const PRIMARY = "#0ACF83";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flex: 1, backgroundColor: "#FFFFFF" },

  profileSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  profileInfo: { flex: 1 },
  nickname: { fontSize: 16, fontWeight: "800", color: "#111827" },
  region: { marginTop: 2, fontSize: 12, color: "#6B7280" },

  writeBtn: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  writeBtnText: { color: "#FFFFFF", fontWeight: "800" },
  writeBtnHover: { borderColor: PRIMARY },
  writeBtnPressed: { opacity: 0.9, transform: [{ translateY: 1 }] },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: "rgba(17,24,39,0.10)",
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  statLabel: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
  statValue: {
    marginTop: 6,
    fontSize: 18,
    color: "#111827",
    fontWeight: "900",
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 12,
    paddingBottom: 6,
  },
  filterBtn: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: {
    backgroundColor: PRIMARY,
    borderColor: "transparent",
  },
  filterBtnHover: {
    borderColor: PRIMARY,
  },
  filterBtnPressed: { opacity: 0.9, transform: [{ translateY: 1 }] },
  filterText: { fontSize: 13, color: "#6B7280", fontWeight: "800" },
  filterTextActive: { color: "#fff" },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  sectionSub: { fontSize: 12, color: "#6B7280", fontWeight: "700" },

  postCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 12,
    shadowColor: "rgba(17,24,39,0.10)",
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    transform: [{ translateY: 0 }],
  },
  cardHover: {
    borderColor: PRIMARY,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },

  postThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  postContent: { flex: 1, gap: 6 },

  postHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  postDeadline: { fontSize: 12, color: "#6B7280", fontWeight: "700" },

  postTitle: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "900",
    lineHeight: 20,
  },

  postMetaRow: { flexDirection: "row", justifyContent: "space-between" },
  postRegion: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
  postAuthor: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
});
