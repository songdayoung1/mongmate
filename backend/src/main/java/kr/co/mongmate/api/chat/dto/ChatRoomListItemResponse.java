package kr.co.mongmate.api.chat.dto;

import java.time.LocalDateTime;

public record ChatRoomListItemResponse(
        String roomId,
        String title,
        long currentSeq,
        long lastReadSeq,
        long unreadCount,
        ChatRoomLastMessageDto lastMessage,
        LocalDateTime updatedAt
) {}
