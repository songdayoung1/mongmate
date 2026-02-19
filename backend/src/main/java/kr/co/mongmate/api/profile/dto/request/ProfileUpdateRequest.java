package kr.co.mongmate.api.profile.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank
        @Size(min = 1, max = 30)
        String nickname,
        String genderCode,
        @Size(max = 300)
        String bio,
        @Size(max = 255)
        String avatarUrl
) {
}
