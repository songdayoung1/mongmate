package kr.co.mongmate.ws.config;

import kr.co.mongmate.api.chat.service.ChatRoomAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StompRoomAuthorizeInterceptor implements ChannelInterceptor {

    private final ChatRoomAccessService chatRoomAccessService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);

        if (StompCommand.SUBSCRIBE.equals(acc.getCommand())) {
            String dest = acc.getDestination(); // /topic/chat.room.123
            String roomId = extractRoomId(dest);

            // CONNECT에서 setUser(authentication) 해둔 덕분에 여기서 user를 꺼낼 수 있음
            String userId = acc.getUser() != null ? acc.getUser().getName() : null;
            if (userId == null) {
                throw new IllegalArgumentException("Unauthenticated subscribe");
            }

            chatRoomAccessService.assertMember(roomId, userId);
        }

        return message;
    }

    private String extractRoomId(String dest) {
        if (dest == null) throw new IllegalArgumentException("destination missing");
        // 우리 패턴만 허용 (안전)
        String prefix = "/topic/chat.room.";
        if (!dest.startsWith(prefix)) throw new IllegalArgumentException("invalid destination: " + dest);
        return dest.substring(prefix.length());
    }
}
