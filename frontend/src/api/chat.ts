import { apiFetch } from "./client";

export type ChatMessageDto = {
  roomId: string;
  seq: number;
  userId: string;
  content: string;
  timestamp: number;
};

// state 응답 형태가 프로젝트마다 다를 수 있어서 unread만 사용
export type ChatRoomStateDto = {
  unread?: number;
  currentSeq?: number;
  lastReadSeq?: number;
};

export async function loadRecentMessages(roomId: string, limit = 50) {
  const safe = Math.max(1, Math.min(limit, 200));
  return apiFetch<ChatMessageDto[]>(
    `/api/chat/rooms/${roomId}/messages?limit=${safe}`,
    { method: "GET" },
  );
}

/** ✅ state는 멤버/예외로 500 날 수 있으니 절대 throw 하지 않게 */
export async function loadRoomStateSafe(roomId: string) {
  try {
    return await apiFetch<ChatRoomStateDto>(`/api/chat/rooms/${roomId}/state`, {
      method: "GET",
    });
  } catch {
    return null;
  }
}
