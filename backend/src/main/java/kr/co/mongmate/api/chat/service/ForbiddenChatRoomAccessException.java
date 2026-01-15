package kr.co.mongmate.api.chat.service;


public class ForbiddenChatRoomAccessException extends RuntimeException {
    public ForbiddenChatRoomAccessException(String message) { super(message); }
}