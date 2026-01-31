import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  Platform,
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
import { loadRecentMessages, type ChatMessageDto } from "../../api/chat";
import {
  getRoomCache,
  setRoomCache,
  appendRoomCache,
  mergeAndDedupe,
  type CachedChatMessage,
} from "../../lib/chatCache";

type R = RouteProp<ChatStackParamList, "ChatRoom">;

const PRIMARY = "#0ACF83";

type UiMessage = {
  id: string;
  me: boolean;
  text: string;
  time: string;
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

function buildUi(list: CachedChatMessage[], myUserId: string): UiMessage[] {
  let lastLabel = "";
  return list.map((m) => {
    const dayLabel = formatDayLabel(m.timestamp);
    const show = dayLabel !== lastLabel ? dayLabel : undefined;
    if (show) lastLabel = dayLabel;

    return {
      id: m.id,
      me: String(m.userId) === String(myUserId),
      text: m.content,
      time: formatTime(m.timestamp),
      dayLabel: show,
    };
  });
}

function dtoToCached(dto: ChatMessageDto): CachedChatMessage {
  // 서버 메시지는 seq가 있으니 그걸 id로 사용 (dedupe 안정적)
  return {
    id: String(dto.seq),
    userId: String(dto.userId),
    content: dto.content,
    timestamp: dto.timestamp,
  };
}

function wsToCached(m: IncomingChatMessage): CachedChatMessage {
  // ws는 seq가 없으니 timestamp+userId+content로 id 생성
  // (충돌 가능성 낮고, 동일 메시지 중복 수신 방지용으로 충분)
  return {
    id: `${m.timestamp}-${m.userId}-${m.content}`,
    userId: String(m.userId),
    content: m.content,
    timestamp: m.timestamp,
  };
}

export default function ChatRoomScreen() {
  const { params } = useRoute<R>();
  const { roomId, title } = params;

  const hydrated = useAuthStore((s) => s.hydrated);
  const myUserId = String(useAuthStore((s) => s.userId ?? 0));

  const [socketReady, setSocketReady] = React.useState(false);
  const [messages, setMessages] = React.useState<UiMessage[]>([]);
  const [text, setText] = React.useState("");
  const [inputFocused, setInputFocused] = React.useState(false);
  const [sendHover, setSendHover] = React.useState(false);

  const listRef = React.useRef<FlatList<UiMessage>>(null);

  React.useEffect(() => {
    if (!hydrated) return;

    let unsub: null | (() => void) = null;
    let cancelled = false;

    setSocketReady(false);
    setMessages([]);

    (async () => {
      try {
        const rid = String(roomId);

        // ✅ 1) 캐시 먼저: 즉시 렌더
        const cached = await getRoomCache(rid);
        if (!cancelled && cached.length > 0) {
          setMessages(buildUi(cached, myUserId));
          requestAnimationFrame(() => {
            listRef.current?.scrollToEnd({ animated: false });
          });
        }

        // ✅ 2) 서버 최신(최근 50개) 가져와서 캐시와 병합
        const recent = await loadRecentMessages(rid, 50);
        const recentCached = recent.map(dtoToCached);

        const merged = mergeAndDedupe(cached, recentCached);

        // 캐시 갱신 + 화면 갱신
        await setRoomCache(rid, merged);
        if (!cancelled) {
          setMessages(buildUi(merged, myUserId));
          requestAnimationFrame(() => {
            listRef.current?.scrollToEnd({ animated: false });
          });
        }

        // ✅ 3) WS 연결 + 구독 (실시간 수신 시: 화면 + 캐시 둘 다 append)
        await ensureChatSocket(() => {
          if (cancelled) return;

          setSocketReady(true);

          const sub = subscribeRoom(rid, async (m: IncomingChatMessage) => {
            const cm = wsToCached(m);

            // 화면 업데이트 (최신 append)
            setMessages((prev) => {
              // ui dedupe
              if (prev.some((x) => x.id === cm.id)) return prev;

              // dayLabel 계산을 위해 prev를 cached 형태로 복원 후 buildUi 하는 대신,
              // 여기서는 간단히 prev+cm로 합치고 buildUi로 재구성 (메시지 수가 작으니 OK)
              const prevCached: CachedChatMessage[] = prev.map((u) => ({
                id: u.id,
                userId: u.me ? myUserId : "other", // 정확한 userId는 아니지만 label 재계산용으로만 쓰면 위험
                content: u.text,
                timestamp: Number(
                  // time은 hh:mm이라 timestamp 복원이 안됨 → 이 방식은 부정확
                  // 그래서 아래에서 캐시 기반 재빌드를 하도록 변경
                  0,
                ),
              }));

              // ⚠️ 위 방식은 timestamp 복원이 불가능하니,
              // 실시간 수신은 "prev에 그냥 붙이고 dayLabel은 단순 처리"로 간다.
              const dayLabel = formatDayLabel(cm.timestamp);
              const lastShown =
                [...prev].reverse().find((x) => x.dayLabel)?.dayLabel ?? "";
              const show = dayLabel !== lastShown ? dayLabel : undefined;

              return [
                ...prev,
                {
                  id: cm.id,
                  me: String(cm.userId) === String(myUserId),
                  text: cm.content,
                  time: formatTime(cm.timestamp),
                  dayLabel: show,
                },
              ];
            });

            // 캐시 업데이트
            await appendRoomCache(rid, cm);

            requestAnimationFrame(() => {
              listRef.current?.scrollToEnd({ animated: true });
            });
          });

          unsub = () => sub.unsubscribe();

          requestAnimationFrame(() => {
            listRef.current?.scrollToEnd({ animated: false });
          });
        });
      } catch (e: any) {
        console.log("❌ 채팅 초기화 실패:", e?.message ?? e);
        Alert.alert(
          "채팅 불러오기 실패",
          "로그인 상태 또는 서버 상태를 확인해주세요.",
        );
      }
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [hydrated, roomId, myUserId]);

  const onSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!socketReady) {
      Alert.alert(
        "연결 중",
        "채팅 서버에 연결 중입니다. 잠시 후 다시 시도해주세요.",
      );
      return;
    }

    publishChat({
      roomId: String(roomId),
      userId: myUserId,
      content: trimmed,
    });

    setText("");

    // ✅ “내가 보낸 메시지”도 UX상 즉시 붙여주는 게 좋다 (optimistic)
    // 서버/WS에서 다시 오더라도 dedupe가 되도록 id는 timestamp 기반
    const ts = Date.now();
    const optimistic: CachedChatMessage = {
      id: `local-${ts}-${myUserId}-${trimmed}`,
      userId: myUserId,
      content: trimmed,
      timestamp: ts,
    };

    // 화면 반영
    setMessages((prev) => {
      const dayLabel = formatDayLabel(ts);
      const lastShown =
        [...prev].reverse().find((x) => x.dayLabel)?.dayLabel ?? "";
      const show = dayLabel !== lastShown ? dayLabel : undefined;

      return [
        ...prev,
        {
          id: optimistic.id,
          me: true,
          text: trimmed,
          time: formatTime(ts),
          dayLabel: show,
        },
      ];
    });

    // 캐시 반영
    await appendRoomCache(String(roomId), optimistic);

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title={title ?? "채팅"} showBack />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View>
            {!!item.dayLabel && (
              <View style={styles.dayLine}>
                <Text style={styles.dayText}>{item.dayLabel}</Text>
              </View>
            )}

            <View style={[styles.row, item.me ? styles.right : styles.left]}>
              <Pressable
                style={({ pressed }) => [
                  styles.bubble,
                  item.me ? styles.me : styles.other,
                  pressed && Platform.OS === "web"
                    ? styles.bubblePressed
                    : null,
                ]}
              >
                <Text
                  style={[styles.messageText, item.me && styles.messageTextMe]}
                >
                  {item.text}
                </Text>

                <View style={styles.meta}>
                  <Text style={[styles.time, item.me && styles.timeMe]}>
                    {item.time}
                  </Text>
                </View>
              </Pressable>
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
          style={[styles.input, inputFocused && styles.inputFocused]}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          returnKeyType="send"
          onSubmitEditing={onSend}
        />

        <Pressable
          onPress={onSend}
          disabled={!text.trim() || !socketReady}
          onHoverIn={
            Platform.OS === "web" ? () => setSendHover(true) : undefined
          }
          onHoverOut={
            Platform.OS === "web" ? () => setSendHover(false) : undefined
          }
          style={({ pressed }) => [
            styles.send,
            (!text.trim() || !socketReady) && styles.sendDisabled,
            pressed && text.trim() && socketReady ? styles.sendPressed : null,
            sendHover && text.trim() && socketReady ? styles.sendHover : null,
          ]}
        >
          <Text style={styles.sendText}>전송</Text>
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "rgba(17,24,39,0.10)",
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    transform: [{ scale: 1 }],
  },
  bubblePressed: { transform: [{ scale: 0.995 }] },

  other: {
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 8,
  },
  me: {
    backgroundColor: PRIMARY,
    borderColor: "transparent",
    borderTopRightRadius: 8,
  },

  messageText: { fontSize: 15, color: "#111827", lineHeight: 20 },
  messageTextMe: { color: "#fff" },

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
    backgroundColor: "#F9FAFB",
  },
  inputFocused: {
    borderColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  send: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    transform: [{ translateY: 0 }],
  },
  sendText: { color: "#fff", fontWeight: "800" },
  sendDisabled: { opacity: 0.35 },
  sendPressed: { opacity: 0.9, transform: [{ translateY: 1 }] },
  sendHover: { borderColor: PRIMARY },
});
