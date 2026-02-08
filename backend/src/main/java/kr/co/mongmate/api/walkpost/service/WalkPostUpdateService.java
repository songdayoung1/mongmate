package kr.co.mongmate.api.walkpost.service;

import kr.co.mongmate.api.walkpost.dto.WalkPostUpdateRequest;
import kr.co.mongmate.api.walkpost.dto.WalkPostUpdateResponse;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import kr.co.mongmate.domain.walkpost.repository.WalkPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WalkPostUpdateService {

    private static final int TITLE_MAX_LENGTH = 100;
    private static final int CONTENT_MAX_LENGTH = 5000;
    private static final int MEET_ADDRESS_MAX_LENGTH = 200;

    private final WalkPostRepository walkPostRepository;

    @Transactional
    public WalkPostUpdateResponse update(Long postId, String userId, WalkPostUpdateRequest request) {
        if (request == null) {
            throw badRequest("request body is required");
        }

        Long uid = parseUserId(userId);

        if (request.regionId() != null || request.recruitType() != null) {
            throw badRequest("regionId/recruitType cannot be updated");
        }

        WalkPost post = walkPostRepository.findByIdWithAuthor(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "walk post not found"));

        if (post.getAuthor() == null || post.getAuthor().getId() == null
                || !post.getAuthor().getId().equals(uid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "forbidden");
        }

        boolean changed = false;

        if (request.title() != null) {
            String title = request.title().trim();
            if (title.isEmpty() || title.length() > TITLE_MAX_LENGTH) {
                throw badRequest("title length must be between 1 and " + TITLE_MAX_LENGTH);
            }
            post.changeTitle(title);
            changed = true;
        }

        if (request.content() != null) {
            if (request.content().length() > CONTENT_MAX_LENGTH) {
                throw badRequest("content length must be <= " + CONTENT_MAX_LENGTH);
            }
            post.changeContent(request.content());
            changed = true;
        }

        if (request.deadlineAt() != null) {
            if (request.deadlineAt().isBefore(LocalDateTime.now())) {
                throw badRequest("deadlineAt must be in the future");
            }
            post.changeDeadline(request.deadlineAt());
            changed = true;
        }

        if (request.meetAddress() != null) {
            if (request.meetAddress().length() > MEET_ADDRESS_MAX_LENGTH) {
                throw badRequest("meetAddress length must be <= " + MEET_ADDRESS_MAX_LENGTH);
            }
            post.changeMeetAddress(request.meetAddress());
            changed = true;
        }

        if (!changed) {
            throw badRequest("no fields to update");
        }

        return new WalkPostUpdateResponse(post.getId(), post.getUpdatedAt());
    }

    private Long parseUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized");
        }
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized");
        }
    }

    private ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
