import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  ArrowLeft,
  MapPin,
  Dog,
  Coffee,
  MessageCircle,
  Share2,
  Clock,
} from "lucide-react-native";
import { usePostStore } from "../../store/posts";
import { RootStackParamList } from "../../navigation/RootNavigator";
import {
  getWalkPostDetail,
  getWalkPostDetailAuthed,
  type WalkPostDetailResponse,
} from "../../api/walkPosts";

type PostDetailRouteProp = RouteProp<RootStackParamList, "PostDetail">;
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function PostDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<PostDetailRouteProp>();
  const { postId } = route.params;

  const posts = usePostStore((s) => s.posts);
  const post = useMemo(
    () => posts.find((p) => p.id === postId),
    [posts, postId],
  );

  const [detail, setDetail] = useState<WalkPostDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    const data = await getWalkPostDetail(postId);
    return data;
  }, [postId]);

  // ✅ store에 없거나 content/장소가 비어있으면 detail로 보강
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const d = await fetchDetail();
        if (!alive) return;
        setDetail(d);
      } catch {
        // detail 실패해도 store 데이터로 화면은 살아있게
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [fetchDetail]);

  const ensureChatRoom = useCallback(async () => {
    if (detail?.chat?.roomId && detail.chat.canChat) {
      return detail.chat.roomId;
    }

    const latest = await getWalkPostDetailAuthed(postId);
    setDetail(latest);
    if (latest.chat?.roomId && latest.chat.canChat) {
      return latest.chat.roomId;
    }
    return null;
  }, [detail, postId]);

  // store + detail 합성 (detail이 있으면 우선)
  const merged = useMemo(() => {
    if (!post && !detail) return null;

    const title = detail?.title ?? post?.title ?? "";
    const content =
      (detail?.content ?? post?.content ?? "") || "내용이 없습니다.";
    const region =
      detail?.region?.displayName ??
      post?.region ??
      (detail?.region?.regionId
        ? `지역 #${detail.region.regionId}`
        : "지역 미정");
    const deadlineText =
      post?.deadlineText ?? detail?.deadlineAt ?? "마감일 미정";
    const authorNickname =
      detail?.authorNickname ?? post?.authorNickname ?? "알 수 없음";
    const createdAt =
      detail?.createdAt ?? post?.createdAt ?? new Date().toISOString();
    const status = post?.status ?? detail?.status ?? "OPEN";
    const placeName = detail?.meetAddress ?? post?.placeName ?? region;
    const photoUrls = detail?.photoUrls ?? [];

    // 타입: store가 제일 정확(우리는 prefix로 보정함)
    const type = post?.type ?? "WALK";

    return {
      title,
      content,
      region,
      deadlineText,
      authorNickname,
      createdAt,
      status,
      placeName,
      type,
      photoUrls,
    };
  }, [post, detail]);

  // ✅ 백엔드 chat.canChat은 신뢰 못하니, 최소한 status + roomId 체크
  const chatRoomId = detail?.chat?.roomId ?? null;
  const serverCanChat = detail?.chat?.canChat;
  const chatTitle = merged?.title ?? "채팅";
  const canChat = merged?.status === "OPEN" && serverCanChat !== false;
  const chatButtonDisabled = !canChat || chatLoading;

  const handleStartChat = useCallback(async () => {
    if (!canChat || chatLoading || !merged) return;

    setChatLoading(true);
    try {
      const resolvedRoomId =
        chatRoomId && serverCanChat !== false
          ? chatRoomId
          : await ensureChatRoom();

      if (!resolvedRoomId) {
        Alert.alert("채팅 시작 불가", "채팅방 정보를 확인할 수 없습니다.");
        return;
      }

      navigation.navigate({
        name: "Main",
        params: {
          screen: "Chat",
          params: {
            screen: "ChatRoom",
            params: {
              roomId: String(resolvedRoomId),
              title: chatTitle,
            },
          },
        },
        merge: true,
      } as never);
    } catch (e: any) {
      Alert.alert("채팅 시작 실패", e?.message ?? "채팅방을 열 수 없습니다.");
    } finally {
      setChatLoading(false);
    }
  }, [
    canChat,
    chatLoading,
    chatRoomId,
    chatTitle,
    ensureChatRoom,
    merged,
    navigation,
    serverCanChat,
  ]);

  if (!merged) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Dog size={48} color="#D1D5DB" />
          <Text style={styles.errorText}>게시글을 찾을 수 없어요 😢</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isWalk = merged.type === "WALK";
  const TypeIcon = isWalk ? Dog : Coffee;
  const themeColor = isWalk ? "#0ACF83" : "#FF9F43";
  const typeLabel = isWalk ? "산책 메이트" : "애견카페 모임";

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={10}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {merged.region}
          </Text>
          <TouchableOpacity style={styles.shareButton} hitSlop={10}>
            <Share2 size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading && (
          <View style={{ paddingVertical: 10 }}>
            <ActivityIndicator />
          </View>
        )}

        {merged.photoUrls.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photoStrip}
            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
          >
            {merged.photoUrls.map((url, idx) => (
              <Image
                key={`${url}-${idx}`}
                source={{ uri: url }}
                style={styles.photo}
              />
            ))}
          </ScrollView>
        )}

        <View
          style={[styles.typeBadge, { backgroundColor: themeColor + "15" }]}
        >
          <TypeIcon size={14} color={themeColor} strokeWidth={2.5} />
          <Text style={[styles.typeText, { color: themeColor }]}>
            {typeLabel}
          </Text>
          <Text style={[styles.statusText, { color: "#6B7280" }]}>
            · {merged.status}
          </Text>
        </View>

        <Text style={styles.title}>{merged.title}</Text>

        <View style={styles.authorRow}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{merged.authorNickname[0]}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{merged.authorNickname}</Text>
            <Text style={styles.postDate}>
              {new Date(merged.createdAt).toLocaleDateString()} 작성
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <Clock size={20} color="#6B7280" />
            </View>
            <View>
              <Text style={styles.infoLabel}>마감 시간</Text>
              <Text style={styles.infoValue}>{merged.deadlineText}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.iconBox}>
              <MapPin size={20} color="#6B7280" />
            </View>
            <View>
              <Text style={styles.infoLabel}>만나는 장소</Text>
              <Text style={styles.infoValue}>{merged.placeName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.contentLabel}>상세 내용</Text>
        <Text style={styles.contentText}>{merged.content}</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.chatButton,
            chatButtonDisabled && styles.chatButtonDisabled,
          ]}
          activeOpacity={0.9}
          disabled={chatButtonDisabled}
          onPress={handleStartChat}
        >
          {chatLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <MessageCircle size={20} color="#FFFFFF" />
          )}
          <Text style={styles.chatButtonText}>
            {chatLoading
              ? "채팅방 준비중..."
              : canChat
                ? "채팅하기"
                : "채팅 불가"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  safe: { backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  shareButton: { padding: 4 },
  scrollContent: { padding: 20 },
  photoStrip: {
    marginBottom: 14,
  },
  photo: {
    width: SCREEN_WIDTH - 60,
    height: 220,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
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
  typeText: { fontSize: 12, fontWeight: "700" },
  statusText: { fontSize: 12, fontWeight: "700" },

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
  avatarText: { fontSize: 16, fontWeight: "700", color: "#9CA3AF" },
  authorName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  postDate: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 20 },
  infoGrid: { gap: 14 },
  infoItem: { flexDirection: "row", gap: 12, alignItems: "center" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },

  contentLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  contentText: { fontSize: 15, color: "#111827", lineHeight: 22 },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  chatButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  chatButtonDisabled: { backgroundColor: "#9CA3AF" },
  chatButtonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errorText: { fontSize: 16, fontWeight: "800", color: "#111827" },
});
