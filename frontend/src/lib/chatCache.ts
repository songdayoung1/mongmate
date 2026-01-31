import AsyncStorage from "@react-native-async-storage/async-storage";

export type CachedChatMessage = {
  id: string; // dedupe key
  userId: string;
  content: string;
  timestamp: number;
};

const KEY_PREFIX = "chat_cache_room:";
const MAX_CACHE_PER_ROOM = 120; // 최근 120개까지만 유지 (원하면 조절)

function key(roomId: string) {
  return `${KEY_PREFIX}${roomId}`;
}

export async function getRoomCache(
  roomId: string,
): Promise<CachedChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(key(roomId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CachedChatMessage[];
  } catch {
    return [];
  }
}

export async function setRoomCache(
  roomId: string,
  messages: CachedChatMessage[],
) {
  try {
    const trimmed =
      messages.length > MAX_CACHE_PER_ROOM
        ? messages.slice(messages.length - MAX_CACHE_PER_ROOM)
        : messages;

    await AsyncStorage.setItem(key(roomId), JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export async function appendRoomCache(roomId: string, msg: CachedChatMessage) {
  const prev = await getRoomCache(roomId);

  // dedupe by id
  const exists = prev.some((m) => m.id === msg.id);
  const merged = exists ? prev : [...prev, msg];

  // timestamp ascending 보장
  merged.sort((a, b) => a.timestamp - b.timestamp);

  await setRoomCache(roomId, merged);
}

export function mergeAndDedupe(a: CachedChatMessage[], b: CachedChatMessage[]) {
  const map = new Map<string, CachedChatMessage>();
  for (const m of a) map.set(m.id, m);
  for (const m of b) map.set(m.id, m);

  const merged = Array.from(map.values());
  merged.sort((x, y) => x.timestamp - y.timestamp);
  return merged.length > MAX_CACHE_PER_ROOM
    ? merged.slice(merged.length - MAX_CACHE_PER_ROOM)
    : merged;
}

export async function clearAllChatCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const chatKeys = keys.filter((k) => k.startsWith(KEY_PREFIX));
    if (chatKeys.length) await AsyncStorage.multiRemove(chatKeys);
  } catch {
    // ignore
  }
}
