import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import TopHeader from "../../components/TopHeader";
import type { ChatStackParamList } from "../../navigation/ChatStackNavigator";
import {
  ensureChatSocket,
  subscribeRoom,
  publishChat,
  type IncomingChatMessage,
} from "../../ws/chatClient";
import { useAuthStore } from "../../store/auth";

type R = RouteProp<ChatStackParamList, "ChatRoom">;

const PRIMARY = "#0ACF83";

type UiMessage = {
  id: string;
  me: boolean;
  text: string;
  time: string;
  read: boolean;
  dayLabel?: string;
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDayLabel(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const same =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (same) return "오늘";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ChatRoomScreen() {
  const { params } = useRoute<R>();
  const { roomId, title } = params;

  const myUserId = String(useAuthStore((s) => s.userId ?? "0"));

  const [socketReady, setSocketReady] = React.useState(false);
  const [messages, setMessages] = React.useState<UiMessage[]>([]);
  const [text, setText] = React.useState("");

  const listRef = React.useRef<FlatList<UiMessage>>(null);
  const lastDayLabelRef = React.useRef<string>("");
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);

  React.useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      console.log("채팅 연결 스킵: token 없음");
      return;
    }

    let unsub: null | (() => void) = null;

    ensureChatSocket(token, () => {
      setSocketReady(true);
      console.log("✅ STOMP connected");

      const sub = subscribeRoom(String(roomId), (m: IncomingChatMessage) => {
        const dayLabel = formatDayLabel(m.timestamp);
        const showDayLabel =
          dayLabel !== lastDayLabelRef.current ? dayLabel : undefined;
        if (showDayLabel) lastDayLabelRef.current = dayLabel;

        setMessages((prev) => [
          ...prev,
          {
            id: `${m.timestamp}-${Math.random()}`,
            me: m.userId === myUserId,
            text: m.content,
            time: formatTime(m.timestamp),
            read: true,
            dayLabel: showDayLabel,
          },
        ]);

        requestAnimationFrame(() => {
          listRef.current?.scrollToEnd({ animated: true });
        });
      });

      unsub = () => sub.unsubscribe();
      console.log("✅ subscribed:", `/topic/chat.room.${roomId}`);
    });

    return () => {
      unsub?.();
    };
  }, [hydrated, token, roomId, myUserId]);

  const onSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!socketReady) {
      Alert.alert(
        "연결 중",
        "채팅 서버에 연결 중입니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    publishChat({
      roomId: String(roomId),
      userId: myUserId,
      content: trimmed,
    });

    setText("");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title={title ?? "채팅"} showBack />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View>
            {!!item.dayLabel && (
              <View style={styles.dayLine}>
                <Text style={styles.dayText}>{item.dayLabel}</Text>
              </View>
            )}

            <View style={[styles.row, item.me ? styles.right : styles.left]}>
              <View style={[styles.bubble, item.me ? styles.me : styles.other]}>
                <Text style={[styles.text, item.me && { color: "#fff" }]}>
                  {item.text}
                </Text>

                <View style={styles.meta}>
                  <Text style={[styles.time, item.me && styles.timeMe]}>
                    {item.time}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.inputBar}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="메시지 입력"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
        <Pressable
          onPress={onSend}
          disabled={!text.trim() || !socketReady}
          style={({ pressed }) => [
            styles.send,
            (!text.trim() || !socketReady) && { opacity: 0.4 },
            pressed && text.trim() && socketReady ? { opacity: 0.85 } : null,
          ]}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>전송</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  list: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10, gap: 10 },

  dayLine: {
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    marginBottom: 6,
  },
  dayText: { fontSize: 12, color: "#6B7280", fontWeight: "700" },

  row: { flexDirection: "row" },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },

  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  other: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderTopLeftRadius: 6,
  },

  me: {
    backgroundColor: PRIMARY,
    borderTopRightRadius: 6,
  },

  text: { fontSize: 15, color: "#111827" },

  meta: { flexDirection: "row", gap: 6, alignSelf: "flex-end" },
  time: { fontSize: 11, color: "#6B7280" },
  timeMe: { color: "rgba(255,255,255,0.85)" },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  send: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
});
