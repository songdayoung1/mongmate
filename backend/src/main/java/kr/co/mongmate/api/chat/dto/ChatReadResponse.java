package kr.co.mongmate.api.chat.dto;

public record ChatReadResponse(
        String roomId,
        String userId,
        long lastReadSeq
) {}
