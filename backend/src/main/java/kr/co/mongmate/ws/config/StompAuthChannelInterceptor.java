package kr.co.mongmate.ws.config;

import kr.co.mongmate.infra.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider; // 너 프로젝트 JWT 유틸에 맞춰

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String auth = accessor.getFirstNativeHeader("Authorization"); // "Bearer xxx"

            String token = resolveBearer(auth);
            Authentication authentication = jwtTokenProvider.getAuthentication(token);

            accessor.setUser(authentication); // ⭐ 여기서 Principal 세팅됨
        }

        return message;
    }

    private String resolveBearer(String auth) {
        if (auth == null) throw new IllegalArgumentException("Authorization header missing");
        if (!auth.startsWith("Bearer ")) throw new IllegalArgumentException("Invalid Authorization header");
        return auth.substring(7);
    }
}
