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
import { loadRecentMessages, ChatMessageDto } from "../../api/chat";
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
};

function toUIMessage(m: ChatMessageDto): UIMessage {
  // 백엔드가 timestamp(number) or sentAt(ISO) 섞일 수 있으니 안전 처리
  const ts =
    typeof (m as any).timestamp === "number"
      ? (m as any).timestamp
      : Date.parse((m as any).sentAt ?? "") || Date.now();

  return {
    key: `${m.roomId}-${m.seq}`,
    roomId: m.roomId,
    seq: m.seq,
    userId: m.userId,
    content: m.content,
    timestamp: ts,
  };
}

function toUIMessageFromWS(m: IncomingChatMessage): UIMessage {
  return {
    key: `${m.roomId}-${m.seq}`,
    roomId: m.roomId,
    seq: m.seq,
    userId: m.userId,
    content: m.content,
    timestamp: typeof m.timestamp === "number" ? m.timestamp : Date.now(),
  };
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

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      const recent = await loadRecentMessages(roomId, 50);
      // 최신 -> 과거로 올 수도 있어서 일단 timestamp 기준 정렬 후 아래에서 invert로 보여줌
      const ui = recent
        .map(toUIMessage)
        .sort((a, b) => a.timestamp - b.timestamp);
      setMessages(ui);
    } catch (e: any) {
      Alert.alert("채팅 불러오기 실패", e?.message ?? "오류");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    // 진짜 “방 상세”로 들어올 때:
    // 1) 최근 메시지 로드
    // 2) WS 구독
    loadInitial();

    (async () => {
      try {
        unsubRef.current?.();
        unsubRef.current = await subscribeRoom(roomId, (m) => {
          const ui = toUIMessageFromWS(m);
          setMessages((prev) => {
            // 중복 방지
            if (prev.some((x) => x.key === ui.key)) return prev;
            return [...prev, ui].sort((a, b) => a.timestamp - b.timestamp);
          });
        });
      } catch (e: any) {
        console.error(e);
        Alert.alert("실시간 연결 실패", e?.message ?? "오류");
      }
    })();

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [roomId, loadInitial]);

  const onSend = useCallback(async () => {
    const content = text.trim();
    if (!content) return;

    setText("");

    // UI에 먼저 반영(옵션)
    const optimistic: UIMessage = {
      key: `local-${Date.now()}`,
      roomId,
      userId: myUserId || "me",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) =>
      [...prev, optimistic].sort((a, b) => a.timestamp - b.timestamp),
    );

    try {
      await publishChat({ roomId, content });
    } catch (e: any) {
      Alert.alert("전송 실패", e?.message ?? "오류");
    }
  }, [text, roomId, myUserId]);

  const renderItem = useCallback(
    ({ item }: { item: UIMessage }) => {
      const isMine = item.userId === myUserId;
      return (
        <View style={[styles.bubbleRow, isMine ? styles.right : styles.left]}>
          <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
            <Text
              style={[
                styles.bubbleText,
                isMine ? styles.mineText : styles.theirsText,
              ]}
            >
              {item.content}
            </Text>
          </View>
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
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={(m) => m.key}
        renderItem={renderItem}
        ListEmptyComponent={empty}
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

  bubbleRow: { marginBottom: 10, flexDirection: "row" },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },

  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  mine: { backgroundColor: "#0ACF83" },
  theirs: { backgroundColor: "#E5E7EB" },

  bubbleText: { fontSize: 15 },
  mineText: { color: "#fff" },
  theirsText: { color: "#111827" },

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
