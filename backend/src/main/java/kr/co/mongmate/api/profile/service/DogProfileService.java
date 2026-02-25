package kr.co.mongmate.api.profile.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import kr.co.mongmate.api.profile.dto.request.DogCreateRequest;
import kr.co.mongmate.api.profile.dto.request.DogPatchRequest;
import kr.co.mongmate.api.profile.dto.request.DogUpdateRequest;
import kr.co.mongmate.api.profile.dto.response.DogDeleteResponse;
import kr.co.mongmate.api.profile.dto.response.DogListResponse;
import kr.co.mongmate.api.profile.dto.response.DogResponse;
import kr.co.mongmate.api.profile.exception.DogProfileException;
import kr.co.mongmate.domain.profile.entity.DogProfile;
import kr.co.mongmate.domain.profile.repository.DogProfileRepository;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DogProfileService {

    private static final int NAME_MAX_LENGTH = 30;
    private static final int BREED_MAX_LENGTH = 50;
    private static final int VACCINATION_NOTE_MAX_LENGTH = 200;
    private static final int DISPOSITION_TEXT_MAX_LENGTH = 100;
    private static final int PHOTO_URL_MAX_LENGTH = 255;

    private static final Set<String> ALLOWED_GENDER_CODES = Set.of("MALE", "FEMALE", "UNKNOWN");

    private final DogProfileRepository dogProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public DogResponse create(String userId, DogCreateRequest request) {
        if (request == null) {
            throw DogProfileException.invalidRequest();
        }
        Long guardianUserId = parseUserId(userId);

        String name = validateName(request.name());
        validateGenderCode(request.genderCode());
        validateOptionalLengths(request.breed(), request.vaccinationNote(), request.dispositionText(), request.photoUrl());

        User guardian = userRepository.getReferenceById(guardianUserId);

        DogProfile saved = dogProfileRepository.save(
                DogProfile.builder()
                        .guardianUser(guardian)
                        .name(name)
                        .breed(request.breed())
                        .ageYears(request.ageYears())
                        .genderCode(request.genderCode())
                        .isNeutered(request.isNeutered())
                        .vaccinationNote(request.vaccinationNote())
                        .dispositionText(request.dispositionText())
                        .photoUrl(request.photoUrl())
                        .build()
        );

        return DogResponse.full(saved);
    }

    @Transactional(readOnly = true)
    public DogListResponse listMine(String userId) {
        Long guardianUserId = parseUserId(userId);
        List<DogResponse> items = dogProfileRepository.findAllByGuardianUser_Id(guardianUserId).stream()
                .map(DogResponse::withoutGuardian)
                .collect(Collectors.toList());
        return new DogListResponse(items);
    }

    @Transactional(readOnly = true)
    public DogResponse getById(Long dogId, String userId) {
        Long guardianUserId = parseUserId(userId);
        DogProfile dog = findOwnedDog(dogId, guardianUserId);
        return DogResponse.full(dog);
    }

    @Transactional
    public DogResponse update(Long dogId, String userId, DogUpdateRequest request) {
        if (request == null) {
            throw DogProfileException.invalidRequest();
        }
        Long guardianUserId = parseUserId(userId);

        String name = validateName(request.name());
        validateGenderCode(request.genderCode());
        validateOptionalLengths(request.breed(), request.vaccinationNote(), request.dispositionText(), request.photoUrl());

        DogProfile dog = findOwnedDog(dogId, guardianUserId);

        dog.changeName(name);
        dog.updateBreed(request.breed());
        dog.updateAge(request.ageYears());
        dog.updateGender(request.genderCode());
        if (request.isNeutered() != null) {
            dog.markNeutered(request.isNeutered());
        }
        dog.updateVaccinationNote(request.vaccinationNote());
        dog.updateDisposition(request.dispositionText());
        dog.updatePhoto(request.photoUrl());

        return DogResponse.forUpdate(dog);
    }

    @Transactional
    public DogResponse patch(Long dogId, String userId, DogPatchRequest request) {
        if (request == null) {
            throw DogProfileException.invalidRequest();
        }
        Long guardianUserId = parseUserId(userId);

        DogProfile dog = findOwnedDog(dogId, guardianUserId);

        boolean changed = false;

        if (request.name() != null) {
            String name = validateName(request.name());
            dog.changeName(name);
            changed = true;
        }
        if (request.breed() != null) {
            validateMaxLength(request.breed(), BREED_MAX_LENGTH);
            dog.updateBreed(request.breed());
            changed = true;
        }
        if (request.ageYears() != null) {
            dog.updateAge(request.ageYears());
            changed = true;
        }
        if (request.genderCode() != null) {
            validateGenderCode(request.genderCode());
            dog.updateGender(request.genderCode());
            changed = true;
        }
        if (request.isNeutered() != null) {
            dog.markNeutered(request.isNeutered());
            changed = true;
        }
        if (request.vaccinationNote() != null) {
            validateMaxLength(request.vaccinationNote(), VACCINATION_NOTE_MAX_LENGTH);
            dog.updateVaccinationNote(request.vaccinationNote());
            changed = true;
        }
        if (request.dispositionText() != null) {
            validateMaxLength(request.dispositionText(), DISPOSITION_TEXT_MAX_LENGTH);
            dog.updateDisposition(request.dispositionText());
            changed = true;
        }
        if (request.photoUrl() != null) {
            validateMaxLength(request.photoUrl(), PHOTO_URL_MAX_LENGTH);
            dog.updatePhoto(request.photoUrl());
            changed = true;
        }

        if (!changed) {
            throw DogProfileException.invalidRequest();
        }

        return DogResponse.forPatch(dog);
    }

    @Transactional
    public DogDeleteResponse delete(Long dogId, String userId) {
        Long guardianUserId = parseUserId(userId);
        DogProfile dog = findOwnedDog(dogId, guardianUserId);
        dogProfileRepository.delete(dog);
        return new DogDeleteResponse(dog.getId(), true, LocalDateTime.now());
    }

    private DogProfile findOwnedDog(Long dogId, Long guardianUserId) {
        DogProfile dog = dogProfileRepository.findById(dogId)
                .orElseThrow(DogProfileException::dogNotFound);
        if (dog.getGuardianUser() == null
                || dog.getGuardianUser().getId() == null
                || !Objects.equals(dog.getGuardianUser().getId(), guardianUserId)) {
            throw DogProfileException.notOwner();
        }
        return dog;
    }

    private Long parseUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            throw DogProfileException.unauthorized();
        }
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException e) {
            throw DogProfileException.unauthorized();
        }
    }

    private String validateName(String name) {
        if (name == null) {
            throw DogProfileException.invalidName();
        }
        String trimmed = name.trim();
        if (trimmed.isEmpty() || trimmed.length() > NAME_MAX_LENGTH) {
            throw DogProfileException.invalidName();
        }
        return trimmed;
    }

    private void validateOptionalLengths(
            String breed,
            String vaccinationNote,
            String dispositionText,
            String photoUrl
    ) {
        if (breed != null) {
            validateMaxLength(breed, BREED_MAX_LENGTH);
        }
        if (vaccinationNote != null) {
            validateMaxLength(vaccinationNote, VACCINATION_NOTE_MAX_LENGTH);
        }
        if (dispositionText != null) {
            validateMaxLength(dispositionText, DISPOSITION_TEXT_MAX_LENGTH);
        }
        if (photoUrl != null) {
            validateMaxLength(photoUrl, PHOTO_URL_MAX_LENGTH);
        }
    }

    private void validateMaxLength(String value, int max) {
        if (value != null && value.length() > max) {
            throw DogProfileException.invalidRequest();
        }
    }

    private void validateGenderCode(String genderCode) {
        if (genderCode == null) {
            return;
        }
        if (genderCode.isBlank() || !ALLOWED_GENDER_CODES.contains(genderCode)) {
            throw DogProfileException.invalidGenderCode();
        }
    }
}
