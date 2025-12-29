import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import TopHeader from "../../components/TopHeader";
import {
  getMessages,
  markRoomAsRead,
  appendMyMessage,
  type RoomId,
  type ChatMessage,
} from "../../mocks/chat";
import type { ChatStackParamList } from "../../navigation/ChatStackNavigator";

type R = RouteProp<ChatStackParamList, "ChatRoom">;

const PRIMARY = "#0ACF83";

export default function ChatRoomScreen() {
  const { params } = useRoute<R>();
  const { roomId, title } = params;

  const listRef = React.useRef<FlatList<ChatMessage>>(null);

  const [messages, setMessages] = React.useState<ChatMessage[]>(
    getMessages(roomId as RoomId)
  );
  const [text, setText] = React.useState("");

  // ✅ 진입 시 읽음 처리(store에 반영) + 최신 메시지 하단으로 스크롤
  React.useEffect(() => {
    markRoomAsRead(roomId as RoomId);
    setMessages(getMessages(roomId as RoomId));

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: false });
    });
  }, [roomId]);

  // ✅ 메시지 추가/변경 시에도 맨 아래 유지
  React.useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const onSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMyMessage(roomId as RoomId, trimmed);
    setMessages(getMessages(roomId as RoomId));
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
                  {/* ✅ "내가 읽었는지" 표시이므로 상대 메시지에만 읽음 노출 */}
                  {!item.me && item.read && (
                    <Text style={styles.read}>읽음</Text>
                  )}
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
          disabled={!text.trim()}
          style={({ pressed }) => [
            styles.send,
            !text.trim() && { opacity: 0.4 },
            pressed && text.trim() ? { opacity: 0.85 } : null,
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

  list: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },

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

    // ✅ iOS shadow
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },

    // ✅ Android shadow
    elevation: 1,
  },

  other: {
    backgroundColor: "#F9FAFB", // ✅ 기존 #F3F4F6보다 더 "화이트에 가까운" 톤인데
    borderWidth: 1, // ✅ 테두리로 확실히 구분
    borderColor: "#E5E7EB",
    borderTopLeftRadius: 6,
  },

  me: {
    backgroundColor: PRIMARY,
    borderTopRightRadius: 6,
  },

  text: { fontSize: 15, color: "#111827" },

  meta: { flexDirection: "row", gap: 6, alignSelf: "flex-end" },
  read: { fontSize: 11, color: "#6B7280", fontWeight: "700" },
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
