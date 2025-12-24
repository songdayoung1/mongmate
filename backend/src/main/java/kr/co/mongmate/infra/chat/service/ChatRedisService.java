package kr.co.mongmate.infra.chat.service;


import kr.co.mongmate.api.chat.dto.ChatMessageDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatRedisService {

    private final StringRedisTemplate redisTemplate;

    public void saveMessage(ChatMessageDto msg) {
        String key = "chat:" + msg.roomId() + ":messages";

        // 직렬화 간단하게 (나중에 JSON으로 바꿔도 됨)
        String value = msg.userId() + "|" + msg.content() + "|" + msg.timestamp();

        redisTemplate.opsForList().leftPush(key, value);
        redisTemplate.opsForList().trim(key, 0, 999); // 최근 1000개만 유지
    }
}

