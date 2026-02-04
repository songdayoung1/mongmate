import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * =========================
 * Types
 * =========================
 */

export type CachedChatMessage = {
  id: string; // seq or fallback
  userId: string;
  content: string;
  timestamp: number;
};

export type RoomListItemCache = {
  roomId: string; // ✅ threadId
  title: string; // 표시용 (없으면 placeholder)
  lastMessage?: string;
  lastTimestamp?: number;
  unreadCount?: number;
};

/**
 * =========================
 * Keys
 * =========================
 */

const ROOM_CACHE_KEY = (roomId: string) => `CHAT_ROOM_CACHE_V1:${roomId}`;
const ROOM_INDEX_KEY = `CHAT_ROOM_INDEX_V1`; // string[]
const ROOM_LIST_KEY = `CHAT_ROOM_LIST_V1`; // RoomListItemCache[]

const MAX_ROOMS = 200;
const MAX_MSGS_PER_ROOM = 500;

/**
 * =========================
 * (A) Room index: 내가 들어가 본 방 목록
 * =========================
 */

export async function getRoomIndex(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(ROOM_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String);
  } catch {
    return [];
  }
}

export async function upsertRoomIndex(roomId: string) {
  const rid = String(roomId);
  const prev = await getRoomIndex();
  const next = [rid, ...prev.filter((x) => x !== rid)].slice(0, MAX_ROOMS);
  try {
    await AsyncStorage.setItem(ROOM_INDEX_KEY, JSON.stringify(next));
  } catch {}
}

export async function clearRoomIndex() {
  try {
    await AsyncStorage.removeItem(ROOM_INDEX_KEY);
  } catch {}
}

/**
 * =========================
 * (B) Room list cache: 리스트용 미리보기 데이터
 * =========================
 */

export async function getRoomListCache(): Promise<RoomListItemCache[]> {
  try {
    const raw = await AsyncStorage.getItem(ROOM_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RoomListItemCache[];
  } catch {
    return [];
  }
}

export async function setRoomListCache(list: RoomListItemCache[]) {
  try {
    const trimmed = list.slice(0, MAX_ROOMS);
    await AsyncStorage.setItem(ROOM_LIST_KEY, JSON.stringify(trimmed));
  } catch {}
}

/** roomId 기준으로 업데이트(없으면 추가) + 최신 timestamp로 정렬 */
export async function upsertRoomListItem(
  partial: Partial<RoomListItemCache> & { roomId: string },
) {
  const rid = String(partial.roomId);
  const prev = await getRoomListCache();
  const map = new Map<string, RoomListItemCache>();
  prev.forEach((r) => map.set(String(r.roomId), r));

  const existed = map.get(rid);

  map.set(rid, {
    roomId: rid,
    title: partial.title ?? existed?.title ?? `채팅방 ${rid}`,
    lastMessage: partial.lastMessage ?? existed?.lastMessage,
    lastTimestamp: partial.lastTimestamp ?? existed?.lastTimestamp,
    unreadCount: partial.unreadCount ?? existed?.unreadCount ?? 0,
  });

  const next = Array.from(map.values());
  next.sort((a, b) => (b.lastTimestamp ?? 0) - (a.lastTimestamp ?? 0));
  await setRoomListCache(next);
}

/** 리스트 아이템을 roomIndex 기준으로 보정(인덱스에 있는데 리스트에 없으면 placeholder 추가) */
export async function buildRoomListFromIndex(): Promise<RoomListItemCache[]> {
  const [ids, list] = await Promise.all([getRoomIndex(), getRoomListCache()]);
  const map = new Map<string, RoomListItemCache>();
  list.forEach((r) => map.set(String(r.roomId), r));

  const merged = ids.map((rid) => {
    const existed = map.get(String(rid));
    return (
      existed ?? { roomId: String(rid), title: `채팅방 ${rid}`, unreadCount: 0 }
    );
  });

  // 정렬은 lastTimestamp 기준
  merged.sort((a, b) => (b.lastTimestamp ?? 0) - (a.lastTimestamp ?? 0));
  return merged;
}

/**
 * =========================
 * (C) Room message cache: 방별 메시지 캐시
 * =========================
 */

export async function getRoomCache(
  roomId: string,
): Promise<CachedChatMessage[]> {
  const key = ROOM_CACHE_KEY(String(roomId));
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CachedChatMessage[];
  } catch {
    return [];
  }
}

export async function setRoomCache(roomId: string, list: CachedChatMessage[]) {
  const key = ROOM_CACHE_KEY(String(roomId));
  try {
    const trimmed = list.slice(-MAX_MSGS_PER_ROOM);
    await AsyncStorage.setItem(key, JSON.stringify(trimmed));
  } catch {}
}

/** append + id 중복 방지(1차) */
export async function appendRoomCache(roomId: string, msg: CachedChatMessage) {
  const rid = String(roomId);
  const prev = await getRoomCache(rid);

  // id 중복 방지
  if (prev.some((x) => x.id === msg.id)) return;

  const next = [...prev, msg].slice(-MAX_MSGS_PER_ROOM);
  await setRoomCache(rid, next);

  // ✅ 방 리스트 미리보기도 여기서 같이 갱신 가능(선택)
  await upsertRoomListItem({
    roomId: rid,
    lastMessage: msg.content,
    lastTimestamp: msg.timestamp,
  });
}

/**
 * =========================
 * (D) Merge / Dedupe utilities
 * - cached(id=seq가 아닐 수 있음)와 server(seq 기반) 병합 시 중복 제거
 * =========================
 */

export function mergeAndDedupeByContentTime(
  cached: CachedChatMessage[],
  recent: CachedChatMessage[],
) {
  // 1) 일단 단순 합치기
  const all = [...cached, ...recent];

  // 2) 시간/작성자/내용이 거의 같은 것 제거
  //    - id가 다를 수 있어서 이 기준이 필요
  //    - time tolerance: 2초
  const TOL = 2000;

  const sorted = all.sort((a, b) => a.timestamp - b.timestamp);

  const out: CachedChatMessage[] = [];
  for (const m of sorted) {
    const last = out[out.length - 1];
    if (
      last &&
      last.userId === m.userId &&
      last.content === m.content &&
      Math.abs(last.timestamp - m.timestamp) <= TOL
    ) {
      continue;
    }
    out.push(m);
  }

  // 3) id 기준 중복 제거(마지막 방어)
  const seen = new Set<string>();
  const final: CachedChatMessage[] = [];
  for (const m of out) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    final.push(m);
  }

  return final;
}

export function formatRoomTime(ts?: number) {
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
