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

const HOST =
  Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";

const WS_URL = `${HOST}/ws-chat`;

let client: Client | null = null;
let currentToken = "";

// ✅ 동시에 여러 곳에서 ensureChatSocket 호출돼도, 연결은 1번만 하도록 락
let connectPromise: Promise<Client> | null = null;

function sanitizeToken(t: any): string | null {
  if (t == null) return null;
  const s = String(t).trim();
  if (!s) return null;
  if (s === "null" || s === "undefined") return null;
  // 토큰이 'Bearer ...' 형태로 저장됐다면 Bearer 제거
  if (s.toLowerCase().startsWith("bearer ")) return s.slice(7).trim() || null;
  return s;
}

async function getTokenSafely(): Promise<string | null> {
  // store 우선
  const storeToken = sanitizeToken(useAuthStore.getState().accessToken);
  if (storeToken) return storeToken;

  // storage fallback
  const stored = sanitizeToken(await tokenStorage.getAccessToken());
  if (stored) {
    // store에도 반영 (에러는 무시)
    useAuthStore
      .getState()
      .setTokens(stored)
      .catch(() => {});
    return stored;
  }

  return null;
}

export function isChatConnected() {
  return !!client?.connected;
}

export async function ensureChatSocket(
  onConnected?: () => void,
): Promise<Client> {
  // 이미 연결돼 있으면 즉시 콜백 호출
  if (client?.connected) {
    onConnected?.();
    return client;
  }

  // 연결 진행 중이면 그 Promise를 재사용
  if (connectPromise) {
    const c = await connectPromise;
    if (c.connected) onConnected?.();
    return c;
  }

  connectPromise = (async () => {
    const token = await getTokenSafely();
    if (!token) {
      // ✅ 토큰 없으면 절대 연결 시도하지 않음 (무한 reconnect 방지)
      throw new Error("채팅 연결 실패: accessToken이 비어있습니다.");
    }

    const tokenChanged = token !== currentToken;

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
  })();

  try {
    const c = await connectPromise;
    return c;
  } finally {
    // ✅ 연결 성공/실패와 무관하게 락 해제
    connectPromise = null;
  }
}

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

export function publishChat(payload: SendChatPayload) {
  if (!client || !client.connected) {
    console.log("❌ STOMP not connected, skip send");
    return;
  }

  // ✅ 토큰 없으면 보내지 않음
  const token = sanitizeToken(currentToken);
  if (!token) {
    console.log("❌ token missing, skip send");
    return;
  }

  client.publish({
    destination: "/app/chat.send",
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("✅ sent:", payload);
}

export async function disconnectChatSocket() {
  try {
    if (client) await client.deactivate();
  } catch {}
  client = null;
  currentToken = "";
  connectPromise = null;
}
