package kr.co.mongmate.infra.chat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.mongmate.api.chat.dto.ChatMessageDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.OptionalLong;

@Service
@RequiredArgsConstructor
public class ChatRedisService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private String seqKey(String roomId) { return "chat:" + roomId + ":seq"; }
    private String msgKey(String roomId) { return "chat:" + roomId + ":messages"; }
    private String readKey(String roomId, String userId) { return "chat:" + roomId + ":read:" + userId; }


    /** 방별 seq 발급(원자적) */
    public long nextSeq(String roomId) {
        Long seq = redisTemplate.opsForValue().increment(seqKey(roomId));
        if (seq == null) throw new IllegalStateException("seq 발급 실패");
        return seq;
    }


    /** 방 최신 seq 조회 (없으면 0) */
    public long getCurrentSeq(String roomId) {
        String v = redisTemplate.opsForValue().get(seqKey(roomId));
        if (v == null) return 0L;
        try { return Long.parseLong(v); }
        catch (NumberFormatException e) { return 0L; }
    }


    /** 유저 lastReadSeq 조회 (없으면 0) */
    public long getLastReadSeq(String roomId, String userId) {
        String v = redisTemplate.opsForValue().get(readKey(roomId, userId));
        if (v == null) return 0L;
        try { return Long.parseLong(v); }
        catch (NumberFormatException e) { return 0L; }
    }

    /** 유저 lastReadSeq 조회 (없으면 OptionalLong.empty) */
    public OptionalLong getLastReadSeqIfPresent(String roomId, String userId) {
        String v = redisTemplate.opsForValue().get(readKey(roomId, userId));
        if (v == null) return OptionalLong.empty();
        try { return OptionalLong.of(Long.parseLong(v)); }
        catch (NumberFormatException e) { return OptionalLong.empty(); }
    }


    /** lastReadSeq 저장 */
    public void setLastReadSeq(String roomId, String userId, long lastReadSeq) {
        redisTemplate.opsForValue().set(readKey(roomId, userId), String.valueOf(lastReadSeq));
    }


    /** 메시지 저장(JSON) */
    public void saveMessage(ChatMessageDto msg) {
        redisTemplate.opsForList().leftPush(msgKey(msg.roomId()), toJson(msg));
        redisTemplate.opsForList().trim(msgKey(msg.roomId()), 0, 999);
    }


    /** 최근 메시지 조회 */
    public List<ChatMessageDto> loadRecent(String roomId, int limit) {
        List<String> raw = redisTemplate.opsForList().range(msgKey(roomId), 0, limit - 1);
        if (raw == null || raw.isEmpty()) return List.of();

        Collections.reverse(raw); // 최신 → 과거를 과거 → 최신으로
        return raw.stream().map(this::fromJson).toList();
    }


    private String toJson(ChatMessageDto msg) {
        try {
            return objectMapper.writeValueAsString(msg);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("ChatMessageDto JSON 직렬화 Fail", e);
        }
    }

    private ChatMessageDto fromJson(String json) {
        try {
            return objectMapper.readValue(json, ChatMessageDto.class);
        } catch (Exception e) {
            throw new IllegalStateException("ChatMessageDto JSON 역직렬화 Fail : " + json, e);
        }
    }
}
