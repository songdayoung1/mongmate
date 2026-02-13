package kr.co.mongmate.api.profile.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DogUpdateRequest(
        @NotBlank(message = "INVALID_NAME")
        @Size(max = 30, message = "INVALID_NAME")
        String name,
        @Size(max = 50, message = "INVALID_REQUEST")
        String breed,
        Integer ageYears,
        String genderCode,
        Boolean isNeutered,
        @Size(max = 200, message = "INVALID_REQUEST")
        String vaccinationNote,
        @Size(max = 100, message = "INVALID_REQUEST")
        String dispositionText,
        @Size(max = 255, message = "INVALID_REQUEST")
        String photoUrl
) {}
