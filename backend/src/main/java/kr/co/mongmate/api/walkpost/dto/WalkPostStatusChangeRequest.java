package kr.co.mongmate.api.walkpost.dto;

import jakarta.validation.constraints.NotBlank;

public record WalkPostStatusChangeRequest(
        @NotBlank
        String status
) {
}
