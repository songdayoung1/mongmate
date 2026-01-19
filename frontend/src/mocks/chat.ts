export type RoomId = "1" | "2" | "3";

export type ChatRoom = {
  id: RoomId;
  title: string;
  avatarUrl?: string;
};

export type ChatMessage = {
  id: string;
  roomId: RoomId;
  me: boolean;
  text: string;
  time: string; // "10:01" / "지금" (목)
  read: boolean; // ✅ "내가 상대 메시지를 읽었는지"만 의미
  dayLabel?: string; // "오늘" / "어제" / "12/28"
};

export const chatRooms: ChatRoom[] = [
  {
    id: "1",
    title: "테스트방",
    avatarUrl:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop",
  },
  {
    id: "2",
    title: "몽이 아빠",
    avatarUrl:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop",
  },
  {
    id: "3",
    title: "동네 산책 모임",
    avatarUrl:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop",
  },
];

// ✅ "프론트-only store" (나중에 API로 교체하면 됨)
let messagesStore: Record<RoomId, ChatMessage[]> = {
  "1": [
    {
      id: "r1-1",
      roomId: "1",
      me: false,
      text: "안녕하세요! 코코랑 산책 메이트 구하시나요?",
      time: "10:01",
      read: false,
      dayLabel: "오늘",
    },
    {
      id: "r1-2",
      roomId: "1",
      me: true,
      text: "네 😊 오늘 저녁 가능해요!",
      time: "10:02",
      read: true,
    },
    {
      id: "r1-3",
      roomId: "1",
      me: false,
      text: "좋아요! 7시 한강공원 어때요?",
      time: "10:03",
      read: false,
    },
  ],

  "2": [
    {
      id: "r2-1",
      roomId: "2",
      me: false,
      text: "몽이랑 같이 산책 가능할까요?",
      time: "19:20",
      read: false,
      dayLabel: "어제",
    },
  ],

  "3": [
    {
      id: "r3-1",
      roomId: "3",
      me: false,
      text: "이번 주말 단체 산책 인원 체크합니다!",
      time: "21:05",
      read: false,
      dayLabel: "12/28",
    },
    {
      id: "r3-2",
      roomId: "3",
      me: false,
      text: "참여하실 분은 '참여'라고 남겨주세요!",
      time: "21:06",
      read: false,
    },
  ],
};

// ✅ getter: 방 메시지 가져오기
export function getMessages(roomId: RoomId): ChatMessage[] {
  return messagesStore[roomId] ?? [];
}

// ✅ 읽음 처리: "상대가 보낸 것"만 read=true
export function markRoomAsRead(roomId: RoomId) {
  messagesStore = {
    ...messagesStore,
    [roomId]: (messagesStore[roomId] ?? []).map((m) =>
      !m.me ? { ...m, read: true } : m
    ),
  };
}

// ✅ 메시지 추가: 내가 보낸 메시지(읽음은 true로)
export function appendMyMessage(roomId: RoomId, text: string) {
  const newMsg: ChatMessage = {
    id: String(Date.now()),
    roomId,
    me: true,
    text,
    time: "지금",
    read: true,
  };
  messagesStore = {
    ...messagesStore,
    [roomId]: [...(messagesStore[roomId] ?? []), newMsg],
  };
  return newMsg;
}

// ✅ 안읽은 메시지 수(상대가 보낸 것 중 read=false)
export function getUnreadCount(roomId: RoomId) {
  return (messagesStore[roomId] ?? []).filter((m) => !m.me && !m.read).length;
}

// ✅ 마지막 메시지 프리뷰
export function getRoomPreview(roomId: RoomId) {
  const list = messagesStore[roomId] ?? [];
  const last = list[list.length - 1];
  return {
    lastMessage: last?.text ?? "",
    lastTime: last?.time ?? "",
  };
}
