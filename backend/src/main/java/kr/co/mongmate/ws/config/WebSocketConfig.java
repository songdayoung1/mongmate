
package kr.co.mongmate.ws.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;
    private final StompRoomAuthorizeInterceptor stompRoomAuthorizeInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*") // 개발 단계라 일단 전체 허용
                .withSockJS(); // SockJS 사용(브라우저 호환성)
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트가 구독할 prefix
        // 예: /topic/chat.room.1
        registry.enableSimpleBroker("/topic");

        // 클라이언트가 send 할 때 붙일 prefix
        // 예: /app/chat.send
        registry.setApplicationDestinationPrefixes("/app");
    }

   
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(
                stompAuthChannelInterceptor,
                stompRoomAuthorizeInterceptor
        );
    }
}
