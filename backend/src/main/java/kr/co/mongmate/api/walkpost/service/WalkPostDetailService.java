package kr.co.mongmate.api.walkpost.service;

import kr.co.mongmate.api.walkpost.dto.WalkPostDetailResponse;
import kr.co.mongmate.domain.profile.entity.GuardianProfile;
import kr.co.mongmate.domain.profile.repository.GuardianProfileRepository;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import kr.co.mongmate.domain.walkpost.repository.WalkPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WalkPostDetailService {

    private final WalkPostRepository walkPostRepository;
    private final GuardianProfileRepository guardianProfileRepository;

    public WalkPostDetailResponse getDetail(Long postId) {
        WalkPost post = walkPostRepository.findByIdWithAuthor(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "walk post not found"));

        User author = post.getAuthor();
        Long authorId = author != null ? author.getId() : null;
        String nickname = resolveNickname(authorId);

        WalkPostDetailResponse.Author authorDto = new WalkPostDetailResponse.Author(authorId, nickname);
        WalkPostDetailResponse.Region regionDto = new WalkPostDetailResponse.Region(post.getRegionId(), null);
        WalkPostDetailResponse.Chat chatDto = new WalkPostDetailResponse.Chat(false, null);

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
                status,
                post.getCreatedAt(),
                chatDto
        );
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
}
