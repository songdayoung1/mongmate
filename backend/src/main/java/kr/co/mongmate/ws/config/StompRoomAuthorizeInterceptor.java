package kr.co.mongmate.ws.config;

import kr.co.mongmate.api.chat.service.ChatRoomAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StompRoomAuthorizeInterceptor implements ChannelInterceptor {

    private final ChatRoomAccessService chatRoomAccessService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);
        StompCommand cmd = acc.getCommand();
        if (cmd == null) return message;

        // ✅ SUBSCRIBE + SEND 둘 다 user 복구
        if (cmd == StompCommand.SUBSCRIBE || cmd == StompCommand.SEND) {

            Authentication auth = null;

            if (acc.getUser() instanceof Authentication a) {
                auth = a;
            } else if (acc.getSessionAttributes() != null) {
                Object saved = acc.getSessionAttributes().get(StompAuthChannelInterceptor.AUTH_SESSION_KEY);
                if (saved instanceof Authentication a) {
                    auth = a;
                }
            }

            if (auth == null) {
                throw new IllegalArgumentException("Unauthenticated");
            }

            acc.setUser(auth);

            // ✅ 방 권한 체크는 SUBSCRIBE에서만
            if (cmd == StompCommand.SUBSCRIBE) {
                String dest = acc.getDestination();
                String roomId = extractRoomId(dest);
                String userId = auth.getName();

                System.out.println("[WS-ROOM] SUBSCRIBE session=" + acc.getSessionId()
                        + " user=" + userId
                        + " dest=" + dest);

                chatRoomAccessService.assertMember(roomId, userId);
            }

            // ✅ 변경 적용을 위해 재빌드
            return MessageBuilder.createMessage(message.getPayload(), acc.getMessageHeaders());
        }

        return message;
    }

    private String extractRoomId(String dest) {
        if (dest == null) throw new IllegalArgumentException("destination missing");
        String prefix = "/topic/chat.room.";
        if (!dest.startsWith(prefix)) throw new IllegalArgumentException("invalid destination: " + dest);
        return dest.substring(prefix.length());
    }
}
