package kr.co.mongmate.infra.chat.service;

import static org.assertj.core.api.Assertions.assertThat;

import kr.co.mongmate.api.chat.dto.ChatMessageDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

@SpringJUnitConfig
@ContextConfiguration(classes = ChatRedisServiceTest.TestConfig.class)
class ChatRedisServiceTest {

    @Autowired ChatRedisService chatRedisService;
    @Autowired StringRedisTemplate redisTemplate;

    @Test
    void saveMessage_should_push_to_redis_list() {
        String roomId = "test-2";
        String key = "chat:" + roomId + ":messages";

        redisTemplate.delete(key);

        ChatMessageDto msg = ChatMessageDto.of(roomId, "user-2", "hello22");
        chatRedisService.saveMessage(msg);

        String saved = redisTemplate.opsForList().index(key, 0);

        assertThat(saved).isNotNull();
        assertThat(saved).contains("user-2");
        assertThat(saved).contains("hello22");
    }

    @Configuration
    static class TestConfig {

        @Bean
        public RedisConnectionFactory redisConnectionFactory() {
            // 도커 Redis가 localhost:6380로 포워딩 되어있다는 가정
            return new LettuceConnectionFactory("localhost", 6380);
        }

        @Bean
        public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory cf) {
            return new StringRedisTemplate(cf);
        }

        @Bean
        public ChatRedisService chatRedisService(StringRedisTemplate redisTemplate) {
            return new ChatRedisService(redisTemplate);
        }
    }
}
