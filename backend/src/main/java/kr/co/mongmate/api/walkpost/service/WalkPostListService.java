package kr.co.mongmate.api.walkpost.service;

import kr.co.mongmate.api.walkpost.dto.WalkPostListResponse;
import kr.co.mongmate.domain.profile.entity.GuardianProfile;
import kr.co.mongmate.domain.profile.repository.GuardianProfileRepository;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import kr.co.mongmate.domain.walkpost.repository.WalkPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalkPostListService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 50;

    private final WalkPostRepository walkPostRepository;
    private final GuardianProfileRepository guardianProfileRepository;

    public WalkPostListResponse list(
            Integer page,
            Integer size,
            Long regionId,
            String status,
            String recruitType
    ) {
        int resolvedPage = page != null ? page : DEFAULT_PAGE;
        int resolvedSize = size != null ? size : DEFAULT_SIZE;

        if (resolvedPage < 0 || resolvedSize < 0 || resolvedSize > MAX_SIZE) {
            throw badRequest("invalid page/size");
        }

        WalkPost.Status statusFilter = parseStatus(status);
        String recruitFilter = parseRecruitType(recruitType);

        if (recruitFilter != null && !"WALK".equals(recruitFilter)) {
            Pageable pageable = PageRequest.of(resolvedPage, resolvedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
            return emptyResponse(pageable);
        }

        Pageable pageable = PageRequest.of(resolvedPage, resolvedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<WalkPost> pageResult = walkPostRepository.findAllWithAuthor(regionId, statusFilter, pageable);

        Map<Long, String> nicknameByUserId = loadNicknames(pageResult.getContent());

        List<WalkPostListResponse.Item> items = pageResult.getContent().stream()
                .map(post -> toItem(post, nicknameByUserId))
                .toList();

        WalkPostListResponse.PageInfo pageInfo = new WalkPostListResponse.PageInfo(
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.hasNext()
        );

        return new WalkPostListResponse(pageInfo, items);
    }

    private WalkPostListResponse emptyResponse(Pageable pageable) {
        WalkPostListResponse.PageInfo pageInfo = new WalkPostListResponse.PageInfo(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                0,
                0,
                false
        );
        return new WalkPostListResponse(pageInfo, List.of());
    }

    private WalkPost.Status parseStatus(String status) {
        String value = (status == null || status.isBlank()) ? "OPEN" : status.trim();
        try {
            return WalkPost.Status.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw badRequest("invalid status");
        }
    }

    private String parseRecruitType(String recruitType) {
        if (recruitType == null || recruitType.isBlank()) {
            return null;
        }
        String value = recruitType.trim().toUpperCase();
        if (!"WALK".equals(value) && !"DOG_CAFE".equals(value)) {
            throw badRequest("invalid recruitType");
        }
        return value;
    }

    private Map<Long, String> loadNicknames(Collection<WalkPost> posts) {
        List<Long> userIds = posts.stream()
                .map(post -> post.getAuthor() != null ? post.getAuthor().getId() : null)
                .filter(id -> id != null)
                .distinct()
                .toList();
        if (userIds.isEmpty()) {
            return Map.of();
        }
        List<GuardianProfile> profiles = guardianProfileRepository.findAllByUserIdIn(userIds);
        return profiles.stream()
                .collect(Collectors.toMap(GuardianProfile::getUserId, GuardianProfile::getNickname));
    }

    private WalkPostListResponse.Item toItem(WalkPost post, Map<Long, String> nicknameByUserId) {
        Long authorId = post.getAuthor() != null ? post.getAuthor().getId() : null;
        String nickname = nicknameByUserId.get(authorId);
        if (nickname == null || nickname.isBlank()) {
            nickname = "알 수 없음";
        }

        WalkPostListResponse.Region region = new WalkPostListResponse.Region(post.getRegionId(), null);

        String status = post.getStatus() != null ? post.getStatus().name() : null;

        return new WalkPostListResponse.Item(
                post.getId(),
                "WALK",
                post.getTitle(),
                region,
                post.getDeadlineAt(),
                nickname,
                status,
                post.getCreatedAt()
        );
    }

    private ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
