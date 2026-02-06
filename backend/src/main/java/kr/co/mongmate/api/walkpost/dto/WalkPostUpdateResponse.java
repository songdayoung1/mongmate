package kr.co.mongmate.api.walkpost.dto;

import java.time.LocalDateTime;

public record WalkPostUpdateResponse(
        Long postId,
        LocalDateTime updatedAt
) {}
