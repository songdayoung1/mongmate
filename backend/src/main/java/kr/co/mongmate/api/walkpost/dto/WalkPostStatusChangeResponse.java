package kr.co.mongmate.api.walkpost.dto;

import java.time.LocalDateTime;

public record WalkPostStatusChangeResponse(
        Long postId,
        String status,
        LocalDateTime updatedAt
) {
}
