package kr.co.mongmate.api.profile.service;

import kr.co.mongmate.api.profile.dto.request.ProfileCreateRequest;
import kr.co.mongmate.api.profile.dto.request.ProfilePatchRequest;
import kr.co.mongmate.api.profile.dto.request.ProfileUpdateRequest;
import kr.co.mongmate.api.profile.dto.response.ProfileDeleteResponse;
import kr.co.mongmate.api.profile.dto.response.ProfileResponse;
import kr.co.mongmate.api.profile.exception.ProfileException;
import kr.co.mongmate.domain.profile.entity.GuardianProfile;
import kr.co.mongmate.domain.profile.repository.GuardianProfileRepository;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final GuardianProfileRepository guardianProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProfileResponse create(ProfileCreateRequest request) {
        Long userId = requireUserId();

        if (guardianProfileRepository.existsById(userId)) {
            throw ProfileException.profileAlreadyExists();
        }

        String nickname = normalizeNickname(request.nickname());
        GuardianProfile.Gender gender = parseGender(request.genderCode());

        User user = userRepository.getReferenceById(userId);

        GuardianProfile profile = guardianProfileRepository.save(
                GuardianProfile.builder()
                        .user(user)
                        .nickname(nickname)
                        .gender(gender)
                        .bio(request.bio())
                        .avatarUrl(request.avatarUrl())
                        .build()
        );

        return toResponse(profile);
    }

    @Transactional(readOnly = true)
    public ProfileResponse getMe() {
        Long userId = requireUserId();
        GuardianProfile profile = guardianProfileRepository.findById(userId)
                .orElseThrow(ProfileException::profileNotFound);

        return toResponse(profile);
    }

    @Transactional
    public ProfileResponse update(ProfileUpdateRequest request) {
        Long userId = requireUserId();
        GuardianProfile profile = guardianProfileRepository.findById(userId)
                .orElseThrow(ProfileException::profileNotFound);

        String nickname = normalizeNickname(request.nickname());
        GuardianProfile.Gender gender = parseGender(request.genderCode());

        profile.changeNickname(nickname);
        profile.updateGender(gender);
        profile.updateBio(request.bio());
        profile.updateAvatar(request.avatarUrl());

        return toResponse(profile);
    }

    @Transactional
    public ProfileResponse patch(ProfilePatchRequest request) {
        Long userId = requireUserId();
        GuardianProfile profile = guardianProfileRepository.findById(userId)
                .orElseThrow(ProfileException::profileNotFound);

        if (request.nickname() != null) {
            String nickname = normalizeNickname(request.nickname());
            profile.changeNickname(nickname);
        }

        if (request.genderCode() != null) {
            GuardianProfile.Gender gender = parseGender(request.genderCode());
            profile.updateGender(gender);
        }

        if (request.bio() != null) {
            profile.updateBio(request.bio());
        }

        if (request.avatarUrl() != null) {
            profile.updateAvatar(request.avatarUrl());
        }

        return toResponse(profile);
    }

    @Transactional
    public ProfileDeleteResponse delete() {
        Long userId = requireUserId();
        GuardianProfile profile = guardianProfileRepository.findById(userId)
                .orElseThrow(ProfileException::profileNotFound);

        guardianProfileRepository.delete(profile);

        return new ProfileDeleteResponse(userId, true, LocalDateTime.now());
    }

    private ProfileResponse toResponse(GuardianProfile profile) {
        return new ProfileResponse(
                profile.getUserId(),
                profile.getNickname(),
                profile.getGender() != null ? profile.getGender().name() : null,
                profile.getBio(),
                profile.getAvatarUrl(),
                0,
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    private String normalizeNickname(String nickname) {
        if (nickname == null) {
            throw ProfileException.invalidNickname();
        }
        String trimmed = nickname.trim();
        if (trimmed.isEmpty() || trimmed.length() > 30) {
            throw ProfileException.invalidNickname();
        }
        return trimmed;
    }

    private GuardianProfile.Gender parseGender(String genderCode) {
        if (genderCode == null || genderCode.isBlank()) {
            return null;
        }
        try {
            return GuardianProfile.Gender.valueOf(genderCode.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ProfileException.invalidGenderCode();
        }
    }

    private Long requireUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw ProfileException.unauthorized();
        }
        try {
            return Long.parseLong(auth.getName());
        } catch (NumberFormatException e) {
            throw ProfileException.unauthorized();
        }
    }
}
