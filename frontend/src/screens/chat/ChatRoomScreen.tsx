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
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import TopHeader from "../../components/TopHeader";
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
import type { ChatStackParamList } from "../../navigation/ChatStackNavigator";

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

export default function ChatRoomScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<Nav>();
  const { roomId, title } = route.params;

  const myUserId = useAuthStore((s) => String(s.userId ?? ""));
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const unsubRef = useRef<null | (() => void)>(null);

  // ✅ FlatList 하단 이동
  const listRef = useRef<FlatList<UIMessage>>(null);
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

  const dataForInverted = useMemo(() => {
    // inverted=true일 때는 “최신이 위로 오게” reverse해서 줘야 자연스럽게 보임
    return [...messages].sort((a, b) => a.timestamp - b.timestamp).reverse();
  }, [messages]);

  const renderItem = useCallback(
    ({ item }: { item: UIMessage }) => {
      const isMine = item.userId === myUserId;
      const time = formatKakaoTime(item.timestamp);

      return (
        <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft]}>
          {/* 카톡 느낌: 내 메시지는 시간(왼쪽) + 버블(오른쪽), 상대는 버블 + 시간 */}
          {isMine && <Text style={styles.timeText}>{time}</Text>}

          <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
            <Text
              style={[
                styles.bubbleText,
                isMine ? styles.mineText : styles.theirsText,
              ]}
            >
              {item.content}
            </Text>
            {item.pending && <Text style={styles.pending}>전송중…</Text>}
          </View>

          {!isMine && <Text style={styles.timeText}>{time}</Text>}
        </View>
      );
    },
    [myUserId],
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
      <TopHeader
        title={title ? String(title) : "채팅"}
        showBack
        onBack={() => navigation.goBack()}
      />

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  listContent: { padding: 14, paddingBottom: 10 },
  empty: { textAlign: "center", color: "#6B7280", marginTop: 30 },

  row: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },

  timeText: { fontSize: 11, color: "#9CA3AF", marginBottom: 2 },

  bubble: {
    maxWidth: "76%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
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
