import React from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import TopHeader from "../../components/TopHeader";
import AnimatedButton from "../../components/AnimatedButton";
import { COLORS, SHADOWS } from "../../constants/theme";
import type { ChatStackParamList } from "../../navigation/ChatStackNavigator";
import { loadChatRooms, type ChatRoomListItemDto } from "../../api/chat";

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
  return s.length > 35 ? s.slice(0, 35) + "…" : s;
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
      const list = await loadChatRooms();
      const items = list.map(dtoToRoomItem);
      items.sort((a, b) => b.updatedAtTs - a.updatedAtTs);
      setRooms(items);
    } catch (e: any) {
      console.log("❌ loadChatRooms error:", e?.message ?? e);
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
    // ✅ UX: 들어가는 순간 뱃지 0으로 먼저
    setRooms((prev) =>
      prev.map((r) =>
        r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r,
      ),
    );

    navigation.navigate("ChatRoom", {
      roomId: room.roomId,
      title: room.title,
    });
  };

  const renderItem = ({ item }: { item: RoomItem }) => (
    <AnimatedButton
      style={styles.item}
      activeOpacity={0.95}
      onPress={() => onPressRoom(item)}
    >
      <View style={styles.avatarPlaceholder} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.time}>{item.timeText}</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.preview} numberOfLines={1}>
            {clampPreview(item.lastMessage)}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedButton>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title="채팅" showBack={false} />

      <FlatList
        data={rooms}
        keyExtractor={(r) => r.roomId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchList}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>채팅방이 없어요 텅!</Text>
            <Text style={styles.emptySub}>
              산책 메이트와 대화를 시작해보세요.
            </Text>
          </View>
        }
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: 20, paddingVertical: 12, gap: 12 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    marginRight: 14,
  },

  content: { flex: 1, justifyContent: "center", gap: 4 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMain,
    flex: 1,
    marginRight: 8,
  },
  time: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
  preview: { fontSize: 14, color: COLORS.textSub, flex: 1, marginRight: 8 },

  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: COLORS.white, fontWeight: "800", fontSize: 11 },

  empty: { paddingTop: 100, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textMain },
  emptySub: { fontSize: 14, color: COLORS.textMuted },
});
