package kr.co.mongmate.api.profile.dto.response;

import java.time.LocalDateTime;

public record ProfileDeleteResponse(
        Long userId,
        boolean deleted,
        LocalDateTime deletedAt
) {
}
