import AsyncStorage from "@react-native-async-storage/async-storage";

export type RoomListItemCache = {
  roomId: string; // ✅ threadId (chat_thread.id)
  postId?: string; // ✅ 연결된 글 id (chat_thread.post_id)
  title: string; // 표시용(게시글 제목/상대 이름)
  lastMessage?: string;
  lastTimestamp?: number;
  unreadCount?: number;
};

export type RoomIndexItem = {
  roomId: string; // ✅ threadId
  title?: string; // 게시글 제목/상대 이름 등 (없으면 placeholder)
  postId?: string; // 연결된 글 id (있으면 좋음)
  touchedAt: number; // 최근 진입/갱신 시간(정렬 보조)
};

const KEY = "chat_rooms_cache_v2";
const MAX_ROOMS = 200;

export async function getRoomsCache(): Promise<RoomListItemCache[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RoomListItemCache[];
  } catch {
    return [];
  }
}

export async function setRoomsCache(list: RoomListItemCache[]) {
  try {
    const trimmed = list.slice(0, MAX_ROOMS);
    await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {}
}

export function mergeRoomsByRoomId(
  cached: RoomListItemCache[],
  fresh: RoomListItemCache[],
) {
  const map = new Map<string, RoomListItemCache>();
  for (const r of cached) map.set(String(r.roomId), r);

  for (const r of fresh) {
    const key = String(r.roomId);
    const prev = map.get(key);
    map.set(key, {
      ...prev,
      ...r,
      // lastMessage/lastTimestamp가 fresh에 없으면 prev 유지
      lastMessage: r.lastMessage ?? prev?.lastMessage,
      lastTimestamp: r.lastTimestamp ?? prev?.lastTimestamp,
      unreadCount: r.unreadCount ?? prev?.unreadCount ?? 0,
      postId: r.postId ?? prev?.postId,
    });
  }

  const merged = Array.from(map.values());
  merged.sort((a, b) => (b.lastTimestamp ?? 0) - (a.lastTimestamp ?? 0));
  return merged;
}
