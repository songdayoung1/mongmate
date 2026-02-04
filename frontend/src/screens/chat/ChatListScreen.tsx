import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import TopHeader from "../../components/TopHeader";
import type { ChatStackParamList } from "../../navigation/ChatStackNavigator";
import { loadRecentMessages, loadRoomStateSafe } from "../../api/chat";

type Nav = NativeStackNavigationProp<ChatStackParamList, "ChatList">;

const ROOM_IDS_KEY = "CHAT_ROOM_IDS_V1";

type RoomItem = {
  roomId: string; // ✅ threadId
  title: string; // 지금은 정보가 없으니 placeholder
  lastMessage?: string;
  lastTimestamp?: number;
  unreadCount: number;
};

function formatTime(ts?: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();

  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function clampPreview(s?: string) {
  if (!s) return "대화를 시작해보세요";
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}

async function getRoomIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(ROOM_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String);
  } catch {
    return [];
  }
}

export default function ChatRoomListScreen() {
  const navigation = useNavigation<Nav>();
  const [rooms, setRooms] = React.useState<RoomItem[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const buildList = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const roomIds = await getRoomIds();

      if (roomIds.length === 0) {
        setRooms([]);
        return;
      }

      // ✅ 방 리스트 구성: 최근 1개 메시지 + state(unread) (state는 실패해도 0)
      const items = await Promise.all(
        roomIds.map(async (roomId) => {
          let lastMessage: string | undefined;
          let lastTimestamp: number | undefined;
          let unreadCount = 0;

          // 1) last message
          try {
            const msgs = await loadRecentMessages(roomId, 1);
            const last = msgs[msgs.length - 1];
            if (last) {
              lastMessage = last.content;
              lastTimestamp = last.timestamp;
            }
          } catch {
            // messages 실패해도 목록은 유지
          }

          // 2) unread (state는 500 가능 → safe)
          try {
            const state = await loadRoomStateSafe(roomId);
            if (state && typeof state.unread === "number") {
              unreadCount = state.unread;
            }
          } catch {
            // safe라 여기까지는 잘 안 옴
          }

          return {
            roomId: String(roomId),
            title: `채팅방 ${roomId}`, // ✅ title 정보가 없으니 임시. (post title 원하면 postId 매핑 필요)
            lastMessage,
            lastTimestamp,
            unreadCount,
          } satisfies RoomItem;
        }),
      );

      // 최신 메시지 기준 정렬
      items.sort((a, b) => (b.lastTimestamp ?? 0) - (a.lastTimestamp ?? 0));
      setRooms(items);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      buildList();
    }, [buildList]),
  );

  const onPressRoom = (room: RoomItem) => {
    navigation.navigate("ChatRoom", {
      roomId: room.roomId,
      title: room.title,
    });
  };

  const clearList = async () => {
    await AsyncStorage.removeItem(ROOM_IDS_KEY);
    setRooms([]);
    Alert.alert("초기화", "채팅방 목록을 초기화했어요.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title="채팅" showBack={false} />

      <FlatList
        data={rooms}
        keyExtractor={(r) => r.roomId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={buildList} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>채팅방이 없어요</Text>
            <Text style={styles.emptySub}>
              채팅방에 한 번 들어가면 목록에 저장됩니다.
            </Text>
            <Pressable style={styles.smallBtn} onPress={clearList}>
              <Text style={styles.smallBtnText}>목록 초기화</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => onPressRoom(item)}>
            <View style={styles.left}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {clampPreview(item.lastMessage)}
              </Text>
            </View>

            <View style={styles.right}>
              <Text style={styles.time}>{formatTime(item.lastTimestamp)}</Text>

              {!!(item.unreadCount > 0) && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.unreadCount > 99 ? "99+" : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  list: { padding: 12, gap: 10 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  left: { flex: 1, paddingRight: 10 },
  right: { alignItems: "flex-end", gap: 6 },

  title: { fontSize: 15, fontWeight: "800", color: "#111827" },
  preview: { fontSize: 13, color: "#6B7280", marginTop: 4 },

  time: { fontSize: 12, color: "#6B7280", fontWeight: "700" },

  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#0ACF83",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  empty: { paddingTop: 80, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  emptySub: { fontSize: 13, color: "#6B7280", textAlign: "center" },

  smallBtn: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  smallBtnText: { fontWeight: "800", color: "#111827" },
});
