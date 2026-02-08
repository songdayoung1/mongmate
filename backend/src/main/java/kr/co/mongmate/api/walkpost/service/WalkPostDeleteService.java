package kr.co.mongmate.api.walkpost.service;

import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import kr.co.mongmate.domain.walkpost.repository.WalkPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class WalkPostDeleteService {

    private final WalkPostRepository walkPostRepository;

    @Transactional
    public void delete(Long postId, String userId) {
        Long uid = parseUserId(userId);

        WalkPost post = walkPostRepository.findByIdWithAuthor(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "walk post not found"));

        if (post.getAuthor() == null || post.getAuthor().getId() == null
                || !post.getAuthor().getId().equals(uid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "forbidden");
        }

        walkPostRepository.delete(post);
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
}
