package kr.co.mongmate.api.profile.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import kr.co.mongmate.domain.profile.entity.DogProfile;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DogResponse(
        Long dogId,
        Long guardianUserId,
        String name,
        String breed,
        Integer ageYears,
        String genderCode,
        Boolean isNeutered,
        String vaccinationNote,
        String dispositionText,
        String photoUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static DogResponse full(DogProfile dog) {
        return new DogResponse(
                dog.getId(),
                dog.getGuardianUser() != null ? dog.getGuardianUser().getId() : null,
                dog.getName(),
                dog.getBreed(),
                dog.getAgeYears(),
                dog.getGenderCode(),
                dog.getIsNeutered(),
                dog.getVaccinationNote(),
                dog.getDispositionText(),
                dog.getPhotoUrl(),
                dog.getCreatedAt(),
                dog.getUpdatedAt()
        );
    }

    public static DogResponse withoutGuardian(DogProfile dog) {
        return new DogResponse(
                dog.getId(),
                null,
                dog.getName(),
                dog.getBreed(),
                dog.getAgeYears(),
                dog.getGenderCode(),
                dog.getIsNeutered(),
                dog.getVaccinationNote(),
                dog.getDispositionText(),
                dog.getPhotoUrl(),
                dog.getCreatedAt(),
                dog.getUpdatedAt()
        );
    }

    public static DogResponse forUpdate(DogProfile dog) {
        return new DogResponse(
                dog.getId(),
                null,
                dog.getName(),
                dog.getBreed(),
                dog.getAgeYears(),
                dog.getGenderCode(),
                dog.getIsNeutered(),
                dog.getVaccinationNote(),
                dog.getDispositionText(),
                dog.getPhotoUrl(),
                null,
                dog.getUpdatedAt()
        );
    }

    public static DogResponse forPatch(DogProfile dog) {
        return new DogResponse(
                dog.getId(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                dog.getUpdatedAt()
        );
    }
}
