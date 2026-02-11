package kr.co.mongmate.api.walkpost.dto;

import java.time.LocalDateTime;
import java.util.List;

public record WalkPostListResponse(
        PageInfo page,
        List<Item> items
) {
    public record PageInfo(
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean hasNext
    ) {}

    public record Item(
            Long postId,
            String recruitType,
            String title,
            Region region,
            LocalDateTime deadlineAt,
            String authorNickname,
            String status,
            LocalDateTime createdAt
    ) {}

    public record Region(Long regionId, String displayName) {}
}
