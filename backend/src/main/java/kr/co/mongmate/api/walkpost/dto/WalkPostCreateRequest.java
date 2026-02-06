package kr.co.mongmate.api.walkpost.dto;

import java.time.LocalDateTime;

public record WalkPostCreateRequest(
        String title,
        String content,
        Long regionId,
        LocalDateTime deadlineAt,
        String meetAddress,
        Double meetLat,
        Double meetLng
) {}
