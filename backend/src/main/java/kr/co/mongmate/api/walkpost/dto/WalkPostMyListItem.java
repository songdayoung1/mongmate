package kr.co.mongmate.api.walkpost.dto;

import java.time.LocalDateTime;

public record WalkPostMyListItem(
        Long postId,
        String status,
        String title,
        String regionText,
        String deadlineText,
        LocalDateTime createdAt
) {
}
