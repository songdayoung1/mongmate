package kr.co.mongmate.api.profile.dto.response;

import java.time.LocalDateTime;

public record ProfileResponse(
        Long userId,
        String nickname,
        String genderCode,
        String bio,
        String avatarUrl,
        int heartsCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
