package kr.co.mongmate.api.chat.service;

import kr.co.mongmate.api.chat.dto.ChatMessageDto;
import kr.co.mongmate.api.chat.dto.ChatRoomLastMessageDto;
import kr.co.mongmate.api.chat.dto.ChatRoomListItemResponse;
import kr.co.mongmate.domain.chat.entity.ChatReadState;
import kr.co.mongmate.domain.chat.entity.ChatThread;
import kr.co.mongmate.domain.chat.repository.ChatReadStateRepository;
import kr.co.mongmate.domain.profile.entity.GuardianProfile;
import kr.co.mongmate.domain.profile.repository.GuardianProfileRepository;
import kr.co.mongmate.infra.chat.service.ChatRedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.OptionalLong;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRoomListService {

    private final ChatReadStateRepository chatReadStateRepository;
    private final GuardianProfileRepository guardianProfileRepository;
    private final ChatRedisService chatRedisService;

    public List<ChatRoomListItemResponse> loadMyRooms(String userId) {
        Long uid = parseLongOrThrow(userId, "userId");

        List<ChatReadState> states = chatReadStateRepository.findAllByUserIdWithThread(uid);
        if (states.isEmpty()) {
            return List.of();
        }

        Map<Long, String> nicknameByUserId = loadNicknames(states, uid);

        List<ChatRoomListItemResponse> items = new ArrayList<>();
        for (ChatReadState state : states) {
            ChatThread thread = state.getChatThread();
            String roomId = String.valueOf(thread.getId());

            long currentSeq = chatRedisService.getCurrentSeq(roomId);
            long lastReadSeq = resolveLastReadSeq(roomId, userId, currentSeq);
            long unreadCount = Math.max(0, currentSeq - lastReadSeq);

            ChatRoomLastMessageDto lastMessage = loadLastMessage(roomId);
            LocalDateTime updatedAt = resolveUpdatedAt(thread, lastMessage);

            Long counterpartId = resolveCounterpartId(thread, uid);
            String title = resolveTitle(counterpartId, nicknameByUserId);

            items.add(new ChatRoomListItemResponse(
                    roomId,
                    title,
                    currentSeq,
                    lastReadSeq,
                    unreadCount,
                    lastMessage,
                    updatedAt
            ));
        }

        items.sort(Comparator.comparing(ChatRoomListItemResponse::updatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        return items;
    }

    private Map<Long, String> loadNicknames(List<ChatReadState> states, Long myId) {
        Set<Long> counterpartIds = states.stream()
                .map(ChatReadState::getChatThread)
                .map(thread -> resolveCounterpartId(thread, myId))
                .collect(Collectors.toSet());

        List<GuardianProfile> profiles = guardianProfileRepository.findAllByUserIdIn(counterpartIds);
        return profiles.stream()
                .collect(Collectors.toMap(GuardianProfile::getUserId, GuardianProfile::getNickname));
    }

    private Long resolveCounterpartId(ChatThread thread, Long myId) {
        Long authorId = thread.getAuthor().getId();
        if (Objects.equals(authorId, myId)) {
            return thread.getParticipant().getId();
        }
        return authorId;
    }

    private String resolveTitle(Long counterpartId, Map<Long, String> nicknameByUserId) {
        String nickname = nicknameByUserId.get(counterpartId);
        if (nickname != null && !nickname.isBlank()) {
            return nickname;
        }
        log.warn("Missing GuardianProfile nickname for userId={}", counterpartId);
        return "알 수 없음";
    }

    private ChatRoomLastMessageDto loadLastMessage(String roomId) {
        List<ChatMessageDto> messages = chatRedisService.loadRecent(roomId, 1);
        if (messages.isEmpty()) {
            return null;
        }
        ChatMessageDto last = messages.get(0);
        return new ChatRoomLastMessageDto(
                last.userId(),
                last.content(),
                last.seq(),
                toLocalDateTime(last.timestamp())
        );
    }

    private LocalDateTime resolveUpdatedAt(ChatThread thread, ChatRoomLastMessageDto lastMessage) {
        if (lastMessage != null && lastMessage.sentAt() != null) {
            return lastMessage.sentAt();
        }
        if (thread.getUpdatedAt() != null) {
            return thread.getUpdatedAt();
        }
        return thread.getCreatedAt();
    }

    private LocalDateTime toLocalDateTime(long epochMillis) {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), ZoneId.systemDefault());
    }

    private long resolveLastReadSeq(String roomId, String userId, long currentSeq) {
        OptionalLong existing = chatRedisService.getLastReadSeqIfPresent(roomId, userId);
        if (existing.isPresent()) {
            return existing.getAsLong();
        }
        chatRedisService.setLastReadSeq(roomId, userId, currentSeq);
        return currentSeq;
    }

    private Long parseLongOrThrow(String value, String field) {
        try {
            return Long.parseLong(value);
        } catch (Exception e) {
            throw new IllegalArgumentException(field + " must be a number: " + value);
        }
    }
}
