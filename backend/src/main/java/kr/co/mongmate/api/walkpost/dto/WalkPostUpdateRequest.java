package kr.co.mongmate.api.walkpost.dto;

import java.time.LocalDateTime;

public record WalkPostUpdateRequest(
        String title,
        String content,
        LocalDateTime deadlineAt,
        String meetAddress,
        Long regionId,
        String recruitType
) {}
