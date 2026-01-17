package kr.co.mongmate.ws.config;

import kr.co.mongmate.infra.security.jwt.JwtTokenProvider;
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
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    public static final String AUTH_SESSION_KEY = "AUTH";
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(acc.getCommand())) {
            String auth = acc.getFirstNativeHeader("Authorization"); // Bearer xxx
            String token = resolveBearer(auth);

            Authentication authentication = jwtTokenProvider.getAuthentication(token);

            acc.setUser(authentication);

            if (acc.getSessionAttributes() != null) {
                acc.getSessionAttributes().put(AUTH_SESSION_KEY, authentication);
            }

            System.out.println("[WS-AUTH] CONNECT session=" + acc.getSessionId()
                    + " user=" + authentication.getName());

            // ✅ 변경 적용을 위해 반드시 재빌드
            return MessageBuilder.createMessage(message.getPayload(), acc.getMessageHeaders());
        }

        return message;
    }

    private String resolveBearer(String auth) {
        if (auth == null || auth.isBlank()) {
            throw new IllegalArgumentException("Authorization header missing");
        }
        if (!auth.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid Authorization header");
        }
        return auth.substring(7);
    }
}
