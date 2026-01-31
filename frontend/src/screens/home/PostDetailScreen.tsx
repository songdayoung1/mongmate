import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Dog,
  Coffee,
  MessageCircle,
  Share2,
  Clock,
} from "lucide-react-native";
import { usePostStore } from "../../store/posts";
import { RootStackParamList } from "../../navigation/RootNavigator";

type PostDetailRouteProp = RouteProp<RootStackParamList, "PostDetail">;

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function PostDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<PostDetailRouteProp>();
  const { postId } = route.params;

  const posts = usePostStore((s) => s.posts);
  const post = useMemo(() => posts.find((p) => p.id === postId), [posts, postId]);

  if (!post) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Dog size={48} color="#D1D5DB" />
          <Text style={styles.errorText}>게시글을 찾을 수 없어요 😢</Text>
          <Text style={styles.errorSubText}>삭제되었거나 존재하지 않는 글입니다.</Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.homeButtonText}>홈으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isWalk = post.type === "WALK";
  const TypeIcon = isWalk ? Dog : Coffee;
  const themeColor = isWalk ? "#0ACF83" : "#FF9F43";
  const typeLabel = isWalk ? "산책 메이트" : "애견카페 모임";

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={10}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {post.region}
          </Text>
          <TouchableOpacity style={styles.shareButton} hitSlop={10}>
            <Share2 size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: themeColor + "15" }]}>
          <TypeIcon size={14} color={themeColor} strokeWidth={2.5} />
          <Text style={[styles.typeText, { color: themeColor }]}>{typeLabel}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{post.title}</Text>

        {/* Author Info */}
        <View style={styles.authorRow}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{post.authorNickname[0]}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{post.authorNickname}</Text>
            <Text style={styles.postDate}>
              {new Date(post.createdAt).toLocaleDateString()} 작성
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <Clock size={20} color="#6B7280" />
            </View>
            <View>
              <Text style={styles.infoLabel}>마감 시간</Text>
              <Text style={styles.infoValue}>{post.deadlineText}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <MapPin size={20} color="#6B7280" />
            </View>
            <View>
              <Text style={styles.infoLabel}>만나는 장소</Text>
              <Text style={styles.infoValue}>{post.placeName || post.region}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Content */}
        <Text style={styles.contentLabel}>상세 내용</Text>
        <Text style={styles.contentText}>{post.content}</Text>

        {/* Bottom Space for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatButton} activeOpacity={0.9}>
          <MessageCircle size={20} color="#FFFFFF" />
          <Text style={styles.chatButtonText}>채팅하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safe: {
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  shareButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  typeBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 30,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  postDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 4,
    marginBottom: 20,
  },
  infoGrid: {
    gap: 16,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  contentLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#374151",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0ACF83",
    height: 52,
    borderRadius: 16,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 24,
  },
  homeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  homeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
});
