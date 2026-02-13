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
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import TopHeader from "../../components/TopHeader";
import type { ChatStackParamList } from "../../navigation/ChatStackNavigator";
import { loadChatRooms, type ChatRoomListItemDto } from "../../api/chat";
import { useAuthStore } from "../../store/auth";

type Nav = NativeStackNavigationProp<ChatStackParamList, "ChatList">;

type RoomItem = {
  roomId: string;
  title: string;
  lastMessage?: string;
  unreadCount: number;
  updatedAtTs: number;
  timeText: string;
};

function formatTimeFromIso(iso: string) {
  const d = new Date(iso);
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

function dtoToRoomItem(dto: ChatRoomListItemDto): RoomItem {
  const ts = new Date(dto.updatedAt).getTime();
  return {
    roomId: String(dto.roomId),
    title: dto.title || `채팅방 ${dto.roomId}`,
    lastMessage: dto.lastMessage?.content,
    unreadCount: dto.unreadCount ?? 0,
    updatedAtTs: Number.isFinite(ts) ? ts : 0,
    timeText: dto.updatedAt ? formatTimeFromIso(dto.updatedAt) : "",
  };
}

export default function ChatListScreen() {
  const navigation = useNavigation<Nav>();
  const [rooms, setRooms] = React.useState<RoomItem[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchList = React.useCallback(async () => {
    setRefreshing(true);
    try {
      console.log("store token:", useAuthStore.getState().accessToken);
      const list = await loadChatRooms();

      const items = list.map(dtoToRoomItem);
      items.sort((a, b) => b.updatedAtTs - a.updatedAtTs);

      setRooms(items);
    } catch (e: any) {
      console.log("❌ loadChatRooms error:", e?.message ?? e);
      Alert.alert(
        "채팅방 목록 불러오기 실패",
        e?.message ?? "서버 오류/인증 오류",
      );
      setRooms([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchList();
    }, [fetchList]),
  );

  const onPressRoom = (room: RoomItem) => {
    navigation.navigate("ChatRoom", {
      roomId: room.roomId,
      title: room.title,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title="채팅" showBack={false} />

      <FlatList
        data={rooms}
        keyExtractor={(r) => r.roomId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchList} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>채팅방이 없어요</Text>
            <Text style={styles.emptySub}>
              (서버에서 빈 배열을 주거나 인증이 실패하면 여기로 옵니다)
            </Text>
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
              <Text style={styles.time}>{item.timeText}</Text>
              {item.unreadCount > 0 && (
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
});
