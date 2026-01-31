import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Platform } from "react-native";
import { tokenStorage } from "../lib/tokenStorage";
import { useAuthStore } from "../store/auth";

export type IncomingChatMessage = {
  roomId: string;
  userId: string;
  content: string;
  timestamp: number;
};

export type SendChatPayload = {
  roomId: string;
  userId: string;
  content: string;
};

// ✅ 서버 주소는 너희 환경에 맞게 조절
// - Android emulator: 10.0.2.2
// - iOS simulator: localhost
// - 실기기: PC의 LAN IP로 바꿔야 함
const HOST =
  Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";

const WS_URL = `${HOST}/ws-chat`;

let client: Client | null = null;
let currentToken = "";

/** 현재 연결 상태 */
export function isChatConnected() {
  return !!client?.connected;
}

/** 내부: 토큰 확보 */
async function getAccessTokenSafely(): Promise<string | null> {
  let token = useAuthStore.getState().accessToken;

  if (!token) {
    token = (await tokenStorage.getAccessToken()) ?? null;
    if (token) {
      // store에도 반영
      useAuthStore
        .getState()
        .setTokens(token)
        .catch(() => {});
    }
  }
  return token;
}

/**
 * ✅ 소켓 보장 함수
 * - 이미 연결돼 있으면: 즉시 onConnected 호출 + client 반환
 * - 연결 안 돼 있으면: 연결 시도하고, 연결 완료 시 onConnected 호출
 */
export async function ensureChatSocket(
  onConnected?: () => void,
): Promise<Client> {
  const token = await getAccessTokenSafely();
  if (!token) throw new Error("채팅 연결 실패: accessToken이 비어있습니다.");

  const tokenChanged = token !== currentToken;

  // ✅ 이미 연결 & 토큰 동일: 콜백 즉시 호출하고 그대로 사용
  if (client?.connected && !tokenChanged) {
    onConnected?.();
    return client;
  }

  // 토큰이 바뀐 경우 기존 연결 종료 후 재생성
  if (client && tokenChanged) {
    try {
      await client.deactivate();
    } catch {}
    client = null;
  }

  currentToken = token;

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 3000,
    debug: (msg) => console.log("[STOMP]", msg),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  client.onConnect = () => {
    console.log("✅ STOMP connected:", WS_URL);
    onConnected?.();
  };

  client.onStompError = (frame) => {
    console.log("❌ STOMP error headers:", frame.headers);
    console.log("❌ STOMP error body:", frame.body);
  };

  client.onWebSocketError = (evt) => {
    console.log("❌ WS error:", evt);
  };

  client.onWebSocketClose = (evt) => {
    console.log("❌ WS close:", evt.code, evt.reason || "");
  };

  client.activate();

  return client;
}

/** 방 구독 */
export function subscribeRoom(
  roomId: string,
  onMessage: (m: IncomingChatMessage) => void,
): StompSubscription {
  if (!client) throw new Error("STOMP client is not initialized");
  if (!client.connected) throw new Error("STOMP client is not connected");

  const topic = `/topic/chat.room.${roomId}`;
  console.log("✅ subscribe:", topic);

  return client.subscribe(topic, (msg: IMessage) => {
    try {
      onMessage(JSON.parse(msg.body));
    } catch {
      console.log("❌ Invalid ws message:", msg.body);
    }
  });
}

/** 전송 */
export function publishChat(payload: SendChatPayload) {
  if (!client || !client.connected) {
    console.log("❌ STOMP not connected, skip send");
    return;
  }

  client.publish({
    destination: "/app/chat.send",
    body: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${currentToken}` },
  });

  console.log("✅ sent:", payload);
}

/** 로그아웃/앱 종료 등에서만 호출 */
export async function disconnectChatSocket() {
  if (!client) return;
  try {
    await client.deactivate();
  } catch {}
  client = null;
  currentToken = "";
}
