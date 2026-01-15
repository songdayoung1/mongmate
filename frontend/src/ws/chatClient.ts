import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

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

const WS_URL = "http://localhost:8080/ws-chat";

let client: Client | null = null;
let currentToken = "";
// ✅ 최신 토큰을 가져오는 함수(재연결/토큰갱신 대응)
let getAccessToken: (() => string) | null = null;

/**
 * 앱 시작 시 1번 등록해두면,
 * ensureChatSocket()이 연결/재연결할 때마다 최신 토큰을 헤더에 실어줌.
 */
export function setChatTokenProvider(fn: () => string) {
  getAccessToken = fn;
}
export function ensureChatSocket(token: string, onConnected?: () => void) {
  // 토큰 갱신되면 연결 다시 잡는 게 안전함
  const tokenChanged = token && token !== currentToken;

  if (client?.connected && !tokenChanged) return client;

  // 토큰이 바뀌었는데 이미 연결돼 있으면 끊고 재연결(권장)
  if (client && tokenChanged) {
    try {
      client.deactivate();
    } catch {}
    client = null;
  }

  currentToken = token;

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 3000,
    debug: () => {},
    connectHeaders: {
      Authorization: `Bearer ${token}`,
      // 서버가 다른 키면 여기 변경:
      // accessToken: token,
    },
  });

  client.onConnect = () => onConnected?.();
  client.onStompError = (frame) => {
    console.log("STOMP error:", frame.headers["message"], frame.body);
  };

  client.activate();
  return client;
}

export function subscribeRoom(
  roomId: string,
  onMessage: (m: IncomingChatMessage) => void
): StompSubscription {
  if (!client?.connected) {
    throw new Error("STOMP client is not connected");
  }

  return client.subscribe(`/topic/chat.room.${roomId}`, (msg: IMessage) => {
    try {
      onMessage(JSON.parse(msg.body));
    } catch {
      console.log("Invalid ws message:", msg.body);
    }
  });
}

export function publishChat(payload: SendChatPayload) {
  if (!client?.connected) {
    throw new Error("STOMP client is not connected");
  }

  client.publish({
    destination: "/app/chat.send",
    body: JSON.stringify(payload),
  });
}
