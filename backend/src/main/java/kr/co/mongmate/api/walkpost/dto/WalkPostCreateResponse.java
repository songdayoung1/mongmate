package kr.co.mongmate.api.walkpost.dto;

import java.time.LocalDateTime;

public record WalkPostCreateResponse(
        Long postId,
        LocalDateTime createdAt
) {}
