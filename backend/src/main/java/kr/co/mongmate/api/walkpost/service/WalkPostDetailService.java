package kr.co.mongmate.api.walkpost.service;

import kr.co.mongmate.api.walkpost.dto.WalkPostDetailResponse;
import kr.co.mongmate.domain.chat.entity.ChatReadState;
import kr.co.mongmate.domain.chat.entity.ChatThread;
import kr.co.mongmate.domain.chat.repository.ChatReadStateRepository;
import kr.co.mongmate.domain.chat.repository.ChatThreadRepository;
import kr.co.mongmate.domain.profile.entity.GuardianProfile;
import kr.co.mongmate.domain.profile.repository.GuardianProfileRepository;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import kr.co.mongmate.domain.walkpost.entity.WalkPostPhoto;
import kr.co.mongmate.domain.walkpost.repository.WalkPostPhotoRepository;
import kr.co.mongmate.domain.walkpost.repository.WalkPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class WalkPostDetailService {

    private final WalkPostRepository walkPostRepository;
    private final GuardianProfileRepository guardianProfileRepository;
    private final ChatThreadRepository chatThreadRepository;
    private final ChatReadStateRepository chatReadStateRepository;
    private final UserRepository userRepository;
    private final WalkPostPhotoRepository walkPostPhotoRepository;

    @Transactional
    public WalkPostDetailResponse getDetail(Long postId, String userId) {
        WalkPost post = walkPostRepository.findByIdWithAuthor(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "walk post not found"));

        User author = post.getAuthor();
        Long authorId = author != null ? author.getId() : null;
        String nickname = resolveNickname(authorId);

        WalkPostDetailResponse.Author authorDto = new WalkPostDetailResponse.Author(authorId, nickname);
        WalkPostDetailResponse.Region regionDto = new WalkPostDetailResponse.Region(post.getRegionId(), null);
        WalkPostDetailResponse.Chat chatDto = resolveChatInfo(post, userId);
        java.util.List<String> photoUrls = loadPhotoUrls(post.getId());

        String status = post.getStatus() != null ? post.getStatus().name() : null;

        return new WalkPostDetailResponse(
                post.getId(),
                "WALK",
                post.getTitle(),
                authorDto,
                regionDto,
                post.getDeadlineAt(),
                post.getMeetAddress(),
                post.getContent(),
                photoUrls,
                status,
                post.getCreatedAt(),
                chatDto
        );
    }

    private java.util.List<String> loadPhotoUrls(Long postId) {
        if (postId == null) {
            return java.util.List.of();
        }
        return walkPostPhotoRepository.findAllByWalkPostIdOrderBySortOrderAsc(postId).stream()
                .map(WalkPostPhoto::getPhotoUrl)
                .toList();
    }

    private String resolveNickname(Long authorId) {
        if (authorId == null) {
            return "알 수 없음";
        }
        Optional<GuardianProfile> profile = guardianProfileRepository.findById(authorId);
        return profile.map(GuardianProfile::getNickname)
                .filter(name -> !name.isBlank())
                .orElse("알 수 없음");
    }

    private WalkPostDetailResponse.Chat resolveChatInfo(WalkPost post, String userId) {
        Long uid = parseUserIdOrNull(userId);
        User author = post.getAuthor();
        if (uid == null || author == null || author.getId() == null) {
            return new WalkPostDetailResponse.Chat(false, null);
        }
        if (Objects.equals(author.getId(), uid)) {
            return new WalkPostDetailResponse.Chat(false, null);
        }

        ChatThread thread = findOrCreateThread(post, author, uid);
        ensureReadState(thread, author);
        ensureReadState(thread, userRepository.getReferenceById(uid));

        return new WalkPostDetailResponse.Chat(true, String.valueOf(thread.getId()));
    }

    private ChatThread findOrCreateThread(WalkPost post, User author, Long participantId) {
        Long postId = post.getId();
        Long authorId = author.getId();

        Optional<ChatThread> existing = chatThreadRepository
                .findByWalkPostIdAndAuthorIdAndParticipantId(postId, authorId, participantId);
        if (existing.isPresent()) {
            return existing.get();
        }

        User participant = userRepository.getReferenceById(participantId);
        try {
            return chatThreadRepository.save(ChatThread.create(post, author, participant));
        } catch (DataIntegrityViolationException e) {
            return chatThreadRepository
                    .findByWalkPostIdAndAuthorIdAndParticipantId(postId, authorId, participantId)
                    .orElseThrow(() -> e);
        }
    }

    private void ensureReadState(ChatThread thread, User user) {
        if (thread == null || user == null || thread.getId() == null || user.getId() == null) {
            return;
        }
        boolean exists = chatReadStateRepository.existsByIdThreadIdAndIdUserId(thread.getId(), user.getId());
        if (exists) {
            return;
        }
        chatReadStateRepository.save(
                ChatReadState.builder()
                        .chatThread(thread)
                        .user(user)
                        .build()
        );
    }

    private Long parseUserIdOrNull(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
