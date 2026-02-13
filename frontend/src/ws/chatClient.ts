import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import { tokenStorage } from "../lib/tokenStorage";

const WS_URL = "http://localhost:8080/ws-chat";

let client: Client | null = null;
let connectingPromise: Promise<Client> | null = null;

export type SendChatPayload = {
  roomId: string;
  content: string;
};

export type IncomingChatMessage = {
  roomId: string;
  seq: number;
  userId: string;
  content: string;
  timestamp: number; // or sentAt 형태면 프론트에서 보정
};

function debugLog(msg: string, ...args: any[]) {
  console.log("[chatClient]", msg, ...args);
}

export async function ensureChatSocket(): Promise<Client> {
  if (client && client.connected) return client;
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    const accessToken = await tokenStorage.getAccessToken();
    if (!accessToken) throw new Error("accessToken이 비어있습니다.");

    const c = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (str) => console.log("[STOMP]", str),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    await new Promise<void>((resolve, reject) => {
      c.onConnect = () => {
        debugLog("✅ STOMP connected:", WS_URL);
        resolve();
      };
      c.onStompError = (frame) => {
        console.error("[STOMP] stomp error", frame.headers, frame.body);
        reject(new Error(frame.body || "STOMP error"));
      };
      c.onWebSocketError = (e) => {
        console.error("[STOMP] websocket error", e);
        reject(new Error("WebSocket error"));
      };

      c.activate();
    });

    client = c;
    connectingPromise = null;
    return c;
  })();

  return connectingPromise;
}

export async function disconnectChatSocket() {
  try {
    if (client) {
      await client.deactivate();
      debugLog("🧹 STOMP disconnected");
    }
  } finally {
    client = null;
    connectingPromise = null;
  }
}

export async function subscribeRoom(
  roomId: string,
  onMessage: (msg: IncomingChatMessage) => void,
) {
  const c = await ensureChatSocket();
  const destination = `/topic/chat.room.${roomId}`;

  const sub = c.subscribe(destination, (message: IMessage) => {
    try {
      const parsed = JSON.parse(message.body) as IncomingChatMessage;
      onMessage(parsed);
    } catch (e) {
      console.error("Failed to parse message:", message.body, e);
    }
  });

  return () => sub.unsubscribe();
}

export async function publishChat(payload: SendChatPayload) {
  const c = await ensureChatSocket();
  c.publish({
    destination: "/app/chat.send",
    body: JSON.stringify(payload),
  });
}
