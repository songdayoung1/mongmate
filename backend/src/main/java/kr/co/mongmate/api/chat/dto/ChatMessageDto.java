package kr.co.mongmate.api.chat.dto;

/**
 * WebSocket 으로 주고받는 채팅 메시지 DTO
 * - roomId: 방 ID
 * - userId: 보낸 유저 ID
 * - content: 메시지 내용
 * - timestamp: 서버 기준 전송 시각 (millis)
 */
public record ChatMessageDto(
        String roomId,
        String userId,
        String content,
        long timestamp
) {

    public static ChatMessageDto of(String roomId, String userId, String content) {
        return new ChatMessageDto(roomId, userId, content, System.currentTimeMillis());
    }
}