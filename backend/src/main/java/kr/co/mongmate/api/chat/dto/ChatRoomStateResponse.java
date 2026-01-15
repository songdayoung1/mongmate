package kr.co.mongmate.api.chat.dto;

public record ChatRoomStateResponse(
        String roomId,
        long currentSeq,
        long lastReadSeq,
        long unreadCount
) {}