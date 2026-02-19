package kr.co.mongmate.api.profile.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfilePatchRequest(
        @Size(max = 30)
        @Pattern(regexp = ".*\\S.*", message = "INVALID_NICKNAME")
        String nickname,
        String genderCode,
        @Size(max = 300)
        String bio,
        @Size(max = 255)
        String avatarUrl
) {
}
