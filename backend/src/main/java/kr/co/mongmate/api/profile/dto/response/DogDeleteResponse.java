package kr.co.mongmate.api.profile.dto.response;

import java.time.LocalDateTime;

public record DogDeleteResponse(
        Long dogId,
        boolean deleted,
        LocalDateTime deletedAt
) {}
