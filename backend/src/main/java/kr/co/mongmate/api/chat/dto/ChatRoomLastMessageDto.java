package kr.co.mongmate.api.chat.dto;

import java.time.LocalDateTime;

public record ChatRoomLastMessageDto(
        String senderId,
        String content,
        long seq,
        LocalDateTime sentAt
) {}
