package kr.co.mongmate.api.walkpost.service;

import kr.co.mongmate.api.walkpost.dto.WalkPostMyListItem;
import kr.co.mongmate.api.walkpost.dto.WalkPostMyListResponse;
import kr.co.mongmate.api.walkpost.exception.WalkPostException;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import kr.co.mongmate.domain.walkpost.enum.WalkPostStatus;
import kr.co.mongmate.domain.walkpost.repository.WalkPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WalkPostMyListService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 50;
    private static final DateTimeFormatter DEADLINE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final WalkPostRepository walkPostRepository;

    public WalkPostMyListResponse list(String userId, String status, Integer page, Integer size) {
        Long uid = parseUserId(userId);

        int resolvedPage = page != null ? page : DEFAULT_PAGE;
        int resolvedSize = size != null ? size : DEFAULT_SIZE;

        if (resolvedPage < 0 || resolvedSize < 0 || resolvedSize > MAX_SIZE) {
            throw WalkPostException.invalidRequest();
        }

        WalkPostStatus statusFilter = parseStatus(status);
        WalkPost.Status entityStatus = statusFilter.toEntityStatus();

        Pageable pageable = PageRequest.of(resolvedPage, resolvedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<WalkPost> pageResult = walkPostRepository.findByAuthor_IdAndStatusOrderByCreatedAtDesc(
                uid,
                entityStatus,
                pageable
        );

        List<WalkPostMyListItem> items = pageResult.getContent().stream()
                .map(post -> toItem(post, statusFilter))
                .toList();

        return new WalkPostMyListResponse(
                items,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    private WalkPostMyListItem toItem(WalkPost post, WalkPostStatus statusFilter) {
        WalkPostStatus status = WalkPostStatus.fromEntity(post.getStatus());
        if (status == null) {
            status = statusFilter;
        }

        return new WalkPostMyListItem(
                post.getId(),
                status.name(),
                post.getTitle(),
                resolveRegionText(post.getMeetAddress()),
                formatDeadline(post.getDeadlineAt()),
                post.getCreatedAt()
        );
    }

    private String resolveRegionText(String meetAddress) {
        if (meetAddress == null || meetAddress.isBlank()) {
            return null;
        }
        return meetAddress;
    }

    private String formatDeadline(LocalDateTime deadlineAt) {
        if (deadlineAt == null) {
            return null;
        }
        return deadlineAt.format(DEADLINE_FORMATTER) + "까지";
    }

    private WalkPostStatus parseStatus(String status) {
        String value = (status == null || status.isBlank()) ? WalkPostStatus.ACTIVE.name() : status.trim();
        try {
            return WalkPostStatus.valueOf(value.toUpperCase());
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
