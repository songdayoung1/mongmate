import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  BackHandler,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useAuthStore } from "../../store/auth";
import {
  loadRecentMessages,
  loadRoomState,
  markRoomRead,
  ChatMessageDto,
} from "../../api/chat";
import {
  publishChat,
  subscribeRoom,
  IncomingChatMessage,
} from "../../ws/chatClient";
import { getWalkPostDetail } from "../../api/walkPosts";
import type {
  ChatRoomPostSummary,
  ChatStackParamList,
} from "../../navigation/ChatStackNavigator";
import { useChatMetaStore } from "../../store/chatMeta";
import { GUARDIAN_PLACEHOLDER_URI } from "../../constants/placeholders";

type R = RouteProp<ChatStackParamList, "ChatRoom">;
type Nav = NativeStackNavigationProp<ChatStackParamList, "ChatRoom">;

type UIMessage = {
  key: string;
  roomId: string;
  seq?: number;
  userId: string;
  content: string;
  timestamp: number;
  pending?: boolean;
};

type ChatListItem =
  | { kind: "date"; key: string; label: string }
  | { kind: "message"; key: string; message: UIMessage; showTime: boolean };

function toTs(m: any) {
  if (typeof m?.timestamp === "number") return m.timestamp;
  const iso = m?.sentAt ?? m?.createdAt ?? "";
  const p = Date.parse(iso);
  return Number.isFinite(p) ? p : Date.now();
}

function toUIMessage(m: ChatMessageDto): UIMessage {
  return {
    key: `${m.roomId}-${m.seq}`,
    roomId: m.roomId,
    seq: m.seq,
    userId: m.userId,
    content: m.content,
    timestamp: toTs(m),
  };
}

function toUIMessageFromWS(m: IncomingChatMessage): UIMessage {
  return {
    key: `${m.roomId}-${m.seq}`,
    roomId: m.roomId,
    seq: m.seq,
    userId: m.userId,
    content: m.content,
    timestamp: toTs(m),
  };
}

function formatKakaoTime(ts: number) {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "오전" : "오후";
  const hh = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, "0");
  return `${ampm} ${hh}:${mm}`;
}

function formatDateKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function formatDateLabel(ts: number) {
  const d = new Date(ts);
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${month}월 ${date}일 ${weekdays[d.getDay()]}요일`;
}

function minuteKey(ts: number) {
  const d = new Date(ts);
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D} ${hh}:${mm}`;
}

function recruitTypeLabel(type?: string | null) {
  if (!type) return "산책";
  return type === "DOG_CAFE" ? "애견카페" : "산책";
}

function chatStatusLabel(status?: string | null) {
  if (!status) return "";
  const normalized = status.toUpperCase();
  if (normalized === "OPEN" || normalized === "ACTIVE") return "모집 중";
  if (normalized === "COMPLETED" || normalized === "CLOSED") return "마감";
  if (normalized === "EXPIRED") return "만료";
  return status;
}

function isStatusOpen(status?: string | null) {
  if (!status) return false;
  const normalized = status.toUpperCase();
  return normalized === "OPEN" || normalized === "ACTIVE";
}

export default function ChatRoomScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<Nav>();
  const { roomId, title, avatarUrl } = route.params;

  const handleBackToList = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: "ChatList" }],
    });
    const tabNav = navigation.getParent();
    tabNav?.navigate?.("Chat");
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        handleBackToList();
        return true;
      });
      return () => sub.remove();
    }, [handleBackToList, navigation]),
  );

  const myUserId = useAuthStore((s) => String(s.userId ?? ""));
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const cachedMeta = useChatMetaStore((s) => s.roomMeta[roomId]);
  const saveChatMeta = useChatMetaStore((s) => s.saveMeta);
  const [postSummary, setPostSummary] = useState<ChatRoomPostSummary | undefined>(
    route.params.post ?? cachedMeta,
  );
  const titledFromRoute = title ? String(title) : undefined;
  const displayTitle = titledFromRoute ?? postSummary?.title ?? "채팅";
  const postStatusText = chatStatusLabel(postSummary?.status);
  const postStatusIsOpen = isStatusOpen(postSummary?.status);
  const canOpenPost = Boolean(postSummary?.postId);
  const counterpartName = titledFromRoute ?? "상대방";
  const counterpartInitial = useMemo(() => {
    const trimmed = counterpartName.trim();
    if (!trimmed) return "상";
    const firstChar = trimmed[0];
    if (!firstChar) return "상";
    return firstChar.toUpperCase?.() ?? firstChar ?? "상";
  }, [counterpartName]);
  const counterpartAvatarUri = avatarUrl ?? null;
  const counterpartAvatarSource = useMemo(() => {
    const uri = counterpartAvatarUri || GUARDIAN_PLACEHOLDER_URI;
    return uri ? { uri } : null;
  }, [counterpartAvatarUri]);

  const unsubRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (route.params.post) {
      setPostSummary(route.params.post);
      saveChatMeta(roomId, route.params.post);
    }
  }, [route.params.post, roomId, saveChatMeta]);

  useEffect(() => {
    if (!route.params.post && cachedMeta) {
      setPostSummary((prev) => prev ?? cachedMeta);
    }
  }, [cachedMeta, route.params.post]);

  useEffect(() => {
    const currentPostId = postSummary?.postId;
    if (!currentPostId) return;
    let active = true;
    (async () => {
      try {
        const detail = await getWalkPostDetail(currentPostId);
        if (!active) return;
        setPostSummary((prev) => ({
          postId: prev?.postId ?? String(currentPostId),
          title: detail.title ?? prev?.title ?? "",
          recruitType: detail.recruitType ?? prev?.recruitType,
          status: detail.status ?? prev?.status,
        }));
      } catch {
        // ignore detail fetch failure
      }
    })();
    return () => {
      active = false;
    };
  }, [postSummary?.postId]);

  useEffect(() => {
    if (postSummary?.postId) {
      saveChatMeta(roomId, postSummary);
    }
  }, [
    postSummary?.postId,
    postSummary?.title,
    postSummary?.status,
    postSummary?.recruitType,
    roomId,
    saveChatMeta,
  ]);

  // ✅ FlatList 하단 이동
  const listRef = useRef<FlatList<ChatListItem>>(null);
  const didInitialScroll = useRef(false);

  // ✅ markRead 디바운스
  const lastMarkedRef = useRef<number>(0);
  const markTimerRef = useRef<any>(null);

  const scheduleMarkRead = useCallback(
    (seq: number) => {
      if (!Number.isFinite(seq)) return;
      if (seq <= lastMarkedRef.current) return;

      if (markTimerRef.current) clearTimeout(markTimerRef.current);
      markTimerRef.current = setTimeout(async () => {
        try {
          await markRoomRead(roomId, seq);
          lastMarkedRef.current = seq;
        } catch {}
      }, 250);
    },
    [roomId],
  );

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);

      const recent = await loadRecentMessages(roomId, 50);
      const ui = recent
        .map(toUIMessage)
        .sort((a, b) => a.timestamp - b.timestamp);
      setMessages(ui);

      // ✅ 방 입장 시 currentSeq까지 읽음 처리
      const st = await loadRoomState(roomId);
      scheduleMarkRead(st.currentSeq);

      // ✅ 최신 메시지로 이동 (inverted list라 offset 0이 “맨 아래(최신)”)
      requestAnimationFrame(() => {
        didInitialScroll.current = true;
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    } catch (e: any) {
      Alert.alert("채팅 불러오기 실패", e?.message ?? "오류");
    } finally {
      setLoading(false);
    }
  }, [roomId, scheduleMarkRead]);

  const handleOpenPost = useCallback(() => {
    if (!postSummary?.postId) return;
    const tabNav: any = navigation.getParent?.();
    const rootNav: any = tabNav?.getParent?.();
    const targetNav: any = rootNav ?? tabNav ?? navigation;
    targetNav?.navigate?.("PostDetail", {
      postId: String(postSummary.postId),
    });
  }, [navigation, postSummary?.postId]);

  useEffect(() => {
    loadInitial();

    (async () => {
      try {
        unsubRef.current?.();
        unsubRef.current = await subscribeRoom(roomId, (m) => {
          const incoming = toUIMessageFromWS(m);

          setMessages((prev) => {
            // 중복 방지
            if (prev.some((x) => x.key === incoming.key)) return prev;

            // ✅ 내가 보낸 메시지면 pending 하나 제거(중복처럼 보이는 문제 해결)
            let next = prev;
            if (incoming.userId === myUserId) {
              const idx = prev.findIndex(
                (x) => x.pending && x.content === incoming.content,
              );
              if (idx >= 0)
                next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
            }
            return [...next, incoming].sort(
              (a, b) => a.timestamp - b.timestamp,
            );
          });

          // ✅ 새 메시지 들어오면 read 갱신
          if (typeof incoming.seq === "number") scheduleMarkRead(incoming.seq);

          // ✅ 최신으로 유지(카톡처럼)
          requestAnimationFrame(() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
          });
        });
      } catch (e: any) {
        Alert.alert("실시간 연결 실패", e?.message ?? "오류");
      }
    })();

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
      if (markTimerRef.current) clearTimeout(markTimerRef.current);
    };
  }, [roomId, loadInitial, myUserId, scheduleMarkRead]);

  const onSend = useCallback(async () => {
    const content = text.trim();
    if (!content) return;

    setText("");

    const pending: UIMessage = {
      key: `pending-${Date.now()}`,
      roomId,
      userId: myUserId || "me",
      content,
      timestamp: Date.now(),
      pending: true,
    };

    setMessages((prev) =>
      [...prev, pending].sort((a, b) => a.timestamp - b.timestamp),
    );

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });

    try {
      await publishChat({ roomId, content });
    } catch (e: any) {
      setMessages((prev) => prev.filter((x) => x.key !== pending.key));
      Alert.alert("전송 실패", e?.message ?? "오류");
    }
  }, [text, roomId, myUserId]);

  const chronologicalItems = useMemo<ChatListItem[]>(() => {
    const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    const out: ChatListItem[] = [];
    let lastDateKey: string | null = null;

    for (let i = 0; i < sorted.length; i++) {
      const msg = sorted[i];
      const dateKey = formatDateKey(msg.timestamp);
      if (dateKey !== lastDateKey) {
        out.push({
          kind: "date",
          key: `date-${dateKey}-${msg.timestamp}`,
          label: formatDateLabel(msg.timestamp),
        });
        lastDateKey = dateKey;
      }

      const next = sorted[i + 1];
      const sameSender =
        next && next.userId === msg.userId && next.roomId === msg.roomId;
      const sameMinute =
        sameSender && minuteKey(next.timestamp) === minuteKey(msg.timestamp);
      const showTime = !sameMinute;

      out.push({
        kind: "message",
        key: msg.key,
        message: msg,
        showTime,
      });
    }

    return out;
  }, [messages]);

  const dataForInverted = useMemo<ChatListItem[]>(
    () => [...chronologicalItems].reverse(),
    [chronologicalItems],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatListItem }) => {
      if (item.kind === "date") {
        return (
          <View style={styles.dateDivider}>
            <Text style={styles.dateDividerText}>{item.label}</Text>
          </View>
        );
      }

      const message = item.message;
      const isMine = message.userId === myUserId;
      const time = formatKakaoTime(message.timestamp);

      return (
        <View
          style={[
            styles.messageWrapper,
            isMine ? styles.messageRight : styles.messageLeft,
          ]}
        >
          {!isMine && (
            <View style={styles.avatarColumn}>
              <View style={styles.avatarSmall}>
                {counterpartAvatarSource ? (
                  <Image source={counterpartAvatarSource} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitial}>{counterpartInitial}</Text>
                )}
              </View>
            </View>
          )}
          <View
            style={[
              styles.messageBody,
              isMine ? styles.messageBodyMine : styles.messageBodyTheirs,
            ]}
          >
            {!isMine && (
              <View style={styles.counterHeader}>
                <Text style={styles.counterName}>{counterpartName}</Text>
              </View>
            )}
            <View
              style={[
                styles.messageLine,
                isMine ? styles.messageLineMine : styles.messageLineTheirs,
              ]}
            >
              {isMine && item.showTime && (
                <Text style={[styles.inlineTime, styles.inlineTimeLeft]}>
                  {time}
                </Text>
              )}
              <View style={styles.bubbleWrapper}>
                {!isMine && (
                  <View style={styles.tailLeft}>
                    <View style={styles.tailLeftInner} />
                  </View>
                )}
                <View
                  style={[styles.bubble, isMine ? styles.mine : styles.theirs]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      isMine ? styles.mineText : styles.theirsText,
                    ]}
                  >
                    {message.content}
                  </Text>
                  {message.pending && (
                    <Text style={styles.pending}>전송중…</Text>
                  )}
                </View>
                {isMine && (
                  <View style={styles.tailRight}>
                    <View style={styles.tailRightInner} />
                  </View>
                )}
              </View>
              {!isMine && item.showTime && (
                <Text style={[styles.inlineTime, styles.inlineTimeRight]}>
                  {time}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    },
    [counterpartAvatarSource, counterpartInitial, counterpartName, myUserId],
  );

  const empty = useMemo(() => {
    if (loading) return <Text style={styles.empty}>불러오는 중…</Text>;
    return <Text style={styles.empty}>메시지가 없어요</Text>;
  }, [loading]);

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
    >
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            hitSlop={12}
            onPress={handleBackToList}
          >
            <Text style={styles.headerBackIcon}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{displayTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <TouchableOpacity
          activeOpacity={canOpenPost ? 0.9 : 1}
          style={styles.postCard}
          onPress={handleOpenPost}
          disabled={!canOpenPost}
        >
          <View style={styles.postCardText}>
            <Text style={styles.postCardLabel}>
              {postSummary ? "연결된 모집글" : "연결된 모집글 정보를 찾는 중"}
            </Text>
            <Text style={styles.postCardTitle} numberOfLines={2}>
              {postSummary
                ? postSummary.title || `산책글 #${postSummary.postId}`
                : "게시글 정보를 불러오지 못했습니다"}
            </Text>
            <View style={styles.postCardMeta}>
              <Text style={styles.postMetaType}>
                {postSummary
                  ? recruitTypeLabel(postSummary.recruitType)
                  : "정보 없음"}
              </Text>
              {postStatusText ? (
                <View
                  style={[
                    styles.postStatusBadge,
                    postStatusIsOpen
                      ? styles.postStatusBadgeOpen
                      : styles.postStatusBadgeClosed,
                  ]}
                >
                  <Text
                    style={[
                      styles.postStatusText,
                      postStatusIsOpen
                        ? styles.postStatusTextOpen
                        : styles.postStatusTextClosed,
                    ]}
                  >
                    {postStatusText}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.postLinkText}>
            {canOpenPost ? "보러가기" : "정보 없음"}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      <FlatList
        ref={listRef}
        inverted
        contentContainerStyle={styles.listContent}
        data={dataForInverted}
        keyExtractor={(m) => m.key}
        renderItem={renderItem}
        ListEmptyComponent={empty}
        onContentSizeChange={() => {
          // 최초 진입 시 한 번 더 확실히 최신으로
          if (!didInitialScroll.current && dataForInverted.length > 0) {
            didInitialScroll.current = true;
            listRef.current?.scrollToOffset({ offset: 0, animated: false });
          }
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="메시지 입력…"
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={onSend}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={onSend}
          activeOpacity={0.8}
        >
          <Text style={styles.sendText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const TAIL_SIZE = 10;
const TAIL_VERTICAL_OFFSET = 10;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  headerSafe: { backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackIcon: { fontSize: 18, fontWeight: "900", color: "#111827" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  headerSpacer: { width: 36 },
  postCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  postCardText: { flex: 1, gap: 8 },
  postCardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },
  postCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  postCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  postMetaType: { fontSize: 12, fontWeight: "800", color: "#0ACF83" },
  postStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  postStatusBadgeOpen: { backgroundColor: "#E7F8EF" },
  postStatusBadgeClosed: { backgroundColor: "#FDECEF" },
  postStatusText: { fontSize: 11, fontWeight: "800" },
  postStatusTextOpen: { color: "#0ACF83" },
  postStatusTextClosed: { color: "#F43F5E" },
  postLinkText: { fontSize: 13, fontWeight: "800", color: "#0ACF83" },
  listContent: { padding: 14, paddingBottom: 10 },
  empty: { textAlign: "center", color: "#6B7280", marginTop: 30 },

  dateDivider: {
    marginVertical: 10,
    alignItems: "center",
  },
  dateDividerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    backgroundColor: "#EFF2F5",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
  },

  messageWrapper: {
    flexDirection: "row",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  messageLeft: { justifyContent: "flex-start" },
  messageRight: { justifyContent: "flex-end" },

  avatarColumn: { marginRight: 8 },
  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarInitial: { fontWeight: "900", color: "#1F2937", fontSize: 15 },
  avatarImage: { width: "100%", height: "100%", borderRadius: 21 },

  messageBody: { maxWidth: "80%", gap: 4 },
  messageBodyMine: { alignItems: "flex-end", alignSelf: "flex-end" },
  messageBodyTheirs: { alignItems: "flex-start" },
  counterHeader: { marginBottom: 2 },
  counterName: { fontSize: 12, fontWeight: "800", color: "#4B5563" },
  messageLine: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  messageLineMine: { justifyContent: "flex-end" },
  messageLineTheirs: { justifyContent: "flex-start" },
  bubbleWrapper: { flexDirection: "row", alignItems: "center" },
  tailLeft: {
    width: TAIL_SIZE,
    height: TAIL_SIZE,
    marginRight: -(TAIL_SIZE / 2),
    overflow: "hidden",
    alignSelf: "flex-start",
    marginTop: TAIL_VERTICAL_OFFSET,
  },
  tailLeftInner: {
    position: "absolute",
    width: TAIL_SIZE * 2,
    height: TAIL_SIZE * 2,
    borderRadius: TAIL_SIZE,
    backgroundColor: "#E5E7EB",
    right: -TAIL_SIZE,
    top: -TAIL_SIZE,
  },
  tailRight: {
    width: TAIL_SIZE,
    height: TAIL_SIZE,
    marginLeft: -(TAIL_SIZE / 2),
    overflow: "hidden",
    alignSelf: "flex-start",
    marginTop: TAIL_VERTICAL_OFFSET,
  },
  tailRightInner: {
    position: "absolute",
    width: TAIL_SIZE * 2,
    height: TAIL_SIZE * 2,
    borderRadius: TAIL_SIZE,
    backgroundColor: "#0ACF83",
    left: -TAIL_SIZE,
    top: -TAIL_SIZE,
  },

  bubble: {
    maxWidth: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  mine: { backgroundColor: "#0ACF83" },
  theirs: { backgroundColor: "#E5E7EB" },

  bubbleText: { fontSize: 15 },
  mineText: { color: "#fff" },
  theirsText: { color: "#111827" },

  pending: {
    marginTop: 6,
    fontSize: 11,
    opacity: 0.85,
    color: "#ffffff",
    textAlign: "right",
  },
  inlineTime: { fontSize: 11, color: "#9CA3AF", minWidth: 44 },
  inlineTimeLeft: { textAlign: "right" },
  inlineTimeRight: { textAlign: "left" },

  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  sendBtn: {
    marginLeft: 10,
    height: 44,
    minWidth: 64,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  sendText: { color: "#fff", fontWeight: "800" },
});
