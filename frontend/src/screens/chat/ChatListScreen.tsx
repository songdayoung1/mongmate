import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import TopHeader from "../../components/TopHeader";
import type { ChatStackParamList } from "../../navigation/ChatStackNavigator";
import {
  chatRooms,
  getRoomPreview,
  getUnreadCount,
  type RoomId,
} from "../../mocks/chat";

type Nav = NativeStackNavigationProp<ChatStackParamList, "ChatList">;

const PRIMARY = "#0ACF83";

export default function ChatListScreen() {
  const navigation = useNavigation<Nav>();

  // ✅ ChatRoom에서 읽음 처리 후 "리스트로 돌아왔을 때" 다시 렌더되도록
  const [, force] = React.useReducer((x) => x + 1, 0);
  useFocusEffect(
    React.useCallback(() => {
      force();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <TopHeader title="채팅" />

      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => {
          const roomId = item.id as RoomId;
          const preview = getRoomPreview(roomId);
          const unread = getUnreadCount(roomId);

          return (
            <Pressable
              onPress={() =>
                navigation.navigate("ChatRoom", {
                  roomId: roomId,
                  title: item.title,
                })
              }
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: "#F9FAFB" },
              ]}
            >
              <Image
                source={{ uri: item.avatarUrl }}
                style={styles.avatar}
                resizeMode="cover"
              />

              <View style={styles.center}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {preview.lastMessage}
                </Text>
              </View>

              <View style={styles.right}>
                <Text style={styles.time}>{preview.lastTime}</Text>

                {unread > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unread > 99 ? "99+" : unread}
                    </Text>
                  </View>
                ) : (
                  <View style={{ height: 20 }} />
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  sep: { height: 1, backgroundColor: "#F3F4F6" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },

  center: { flex: 1, gap: 6 },
  name: { fontSize: 15, fontWeight: "800", color: "#111827" },
  lastMessage: { fontSize: 13, color: "#6B7280" },

  right: { alignItems: "flex-end", gap: 8 },
  time: { fontSize: 12, color: "#9CA3AF" },

  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, color: "#fff", fontWeight: "900" },
});
