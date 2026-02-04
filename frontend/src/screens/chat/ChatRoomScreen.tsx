import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import TopHeader from "../../components/TopHeader";
import type { ChatStackParamList } from "../../navigation/ChatStackNavigator";

import {
  buildRoomListFromIndex,
  upsertRoomIndex,
  upsertRoomListItem,
  formatRoomTime,
  clearRoomIndex,
  setRoomListCache,
  type RoomListItemCache,
} from "../../lib/chatCache";
import { loadRecentMessages, loadRoomStateSafe } from "../../api/chat";

type Nav = NativeStackNavigationProp<ChatStackParamList, "ChatList">;

function clampPreview(s?: string) {
  if (!s) return "대화를 시작해보세요";
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}

export default function ChatRoomListScreen() {
  const navigation = useNavigation<Nav>();

  const [rooms, setRooms] = React.useState<RoomListItemCache[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const fastLoadFromCache = React.useCallback(async () => {
    const base = await buildRoomListFromIndex();
    setRooms(base);
  }, []);

  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const base = await buildRoomListFromIndex();

      if (base.length === 0) {
        setRooms([]);
        return;
      }

      // 각 방 lastMessage + unread 보강
      const enriched = await Promise.all(
        base.map(async (room) => {
          const rid = String(room.roomId);
          await upsertRoomIndex(rid);
          await upsertRoomListItem({
            roomId: rid,
            title: `채팅방 ${rid}`,
          });
          let lastMessage = room.lastMessage;
          let lastTimestamp = room.lastTimestamp;

          // 1) 최근 1개 메시지
          try {
            const msgs = await loadRecentMessages(rid, 1);
            const last = msgs[msgs.length - 1];
            if (last) {
              lastMessage = last.content;
              lastTimestamp = last.timestamp;
            }
          } catch {
            // messages 실패해도 기존 캐시 유지
          }

          // 2) unread
          let unreadCount = room.unreadCount ?? 0;
          const state = await loadRoomStateSafe(rid);
          if (state && typeof state.unread === "number")
            unreadCount = state.unread;

          // 캐시 갱신(다음 진입 속도용)
          await upsertRoomListItem({
            roomId: rid,
            title: room.title ?? `채팅방 ${rid}`,
            lastMessage,
            lastTimestamp,
            unreadCount,
          });

          return {
            roomId: rid,
            title: room.title ?? `채팅방 ${rid}`,
            lastMessage,
            lastTimestamp,
            unreadCount,
          } as RoomListItemCache;
        }),
      );

      enriched.sort((a, b) => (b.lastTimestamp ?? 0) - (a.lastTimestamp ?? 0));
      setRooms(enriched);
      await setRoomListCache(enriched);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // ✅ 1) 캐시 기반 즉시 렌더
      fastLoadFromCache();
      // ✅ 2) 서버 보강
      refresh();
    }, [fastLoadFromCache, refresh]),
  );

  const onPressRoom = (room: RoomListItemCache) => {
    navigation.navigate("ChatRoom", {
      roomId: room.roomId,
      title: room.title,
    });
  };

  const onReset = async () => {
    await clearRoomIndex();
    await setRoomListCache([]);
    setRooms([]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title="채팅" showBack={false} />

      <FlatList
        data={rooms}
        keyExtractor={(r) => r.roomId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>채팅방이 없어요</Text>
            <Text style={styles.emptySub}>
              채팅방에 한 번 들어가면 목록에 저장됩니다.
            </Text>
            <Pressable style={styles.smallBtn} onPress={onReset}>
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
              <Text style={styles.time}>
                {formatRoomTime(item.lastTimestamp)}
              </Text>
              {!!(item.unreadCount && item.unreadCount > 0) && (
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
