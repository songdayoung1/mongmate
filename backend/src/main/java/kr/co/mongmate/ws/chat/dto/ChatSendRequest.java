package kr.co.mongmate.ws.chat.dto;

public record ChatSendRequest(
        String roomId,
        String content
) {}