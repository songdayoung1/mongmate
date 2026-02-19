package kr.co.mongmate.api.walkpost.service;

import kr.co.mongmate.api.walkpost.dto.WalkPostStatusChangeRequest;
import kr.co.mongmate.api.walkpost.dto.WalkPostStatusChangeResponse;
import kr.co.mongmate.api.walkpost.exception.WalkPostException;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import kr.co.mongmate.domain.walkpost.enum.WalkPostStatus;
import kr.co.mongmate.domain.walkpost.repository.WalkPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WalkPostStatusService {

    private final WalkPostRepository walkPostRepository;

    @Transactional
    public WalkPostStatusChangeResponse changeStatus(Long postId, String userId, WalkPostStatusChangeRequest request) {
        if (request == null) {
            throw WalkPostException.invalidRequest();
        }
        Long uid = parseUserId(userId);
        WalkPostStatus status = parseStatus(request.status());

        WalkPost post = walkPostRepository.findByIdWithAuthor(postId)
                .orElseThrow(WalkPostException::walkPostNotFound);

        if (post.getAuthor() == null || post.getAuthor().getId() == null
                || !post.getAuthor().getId().equals(uid)) {
            throw WalkPostException.notOwner();
        }

        post.changeStatus(status.toEntityStatus());

        return new WalkPostStatusChangeResponse(
                post.getId(),
                status.name(),
                post.getUpdatedAt()
        );
    }

    private WalkPostStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            throw WalkPostException.invalidStatus();
        }
        try {
            return WalkPostStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw WalkPostException.invalidStatus();
        }
    }

    private Long parseUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            throw WalkPostException.unauthorized();
        }
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException e) {
            throw WalkPostException.unauthorized();
        }
    }
}
