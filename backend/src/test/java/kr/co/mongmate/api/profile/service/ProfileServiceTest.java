package kr.co.mongmate.api.profile.service;

import kr.co.mongmate.api.profile.dto.request.ProfileCreateRequest;
import kr.co.mongmate.api.profile.dto.request.ProfileUpdateRequest;
import kr.co.mongmate.api.profile.dto.response.ProfileResponse;
import kr.co.mongmate.domain.profile.entity.GuardianProfile;
import kr.co.mongmate.domain.profile.repository.GuardianProfileRepository;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    GuardianProfileRepository guardianProfileRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    ProfileService profileService;

    @BeforeEach
    void setAuth() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("1", "", null)
        );
    }

    @AfterEach
    void clearAuth() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createProfile_duplicate_throws409() {
        when(guardianProfileRepository.existsById(1L)).thenReturn(true);

        ProfileCreateRequest req = new ProfileCreateRequest("만두", "MALE", null, null);

        assertThatThrownBy(() -> profileService.create(req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void createProfile_invalidNickname_throws400() {
        ProfileCreateRequest req = new ProfileCreateRequest("   ", "MALE", null, null);

        assertThatThrownBy(() -> profileService.create(req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void getProfile_notFound_throws404() {
        when(guardianProfileRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.getMe())
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateProfile_notFound_throws404() {
        when(guardianProfileRepository.findById(1L)).thenReturn(Optional.empty());

        ProfileUpdateRequest req = new ProfileUpdateRequest("만두", "MALE", null, null);

        assertThatThrownBy(() -> profileService.update(req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void heartsCount_isAlwaysZero_inResponse() {
        User user = User.builder()
                .id(1L)
                .phoneNumber("01012345678")
                .termsAgreedAt(LocalDateTime.now())
                .marketingAgreed(false)
                .build();

        GuardianProfile profile = GuardianProfile.builder()
                .user(user)
                .nickname("만두")
                .gender(GuardianProfile.Gender.MALE)
                .bio("소개")
                .avatarUrl(null)
                .heartsCount(99)
                .build();

        when(guardianProfileRepository.findById(1L)).thenReturn(Optional.of(profile));

        ProfileResponse res = profileService.getMe();
        assertThat(res.heartsCount()).isZero();
    }

    @Test
    void createProfile_success() {
        when(guardianProfileRepository.existsById(1L)).thenReturn(false);
        User user = User.builder()
                .id(1L)
                .phoneNumber("01012345678")
                .termsAgreedAt(LocalDateTime.now())
                .marketingAgreed(false)
                .build();
        when(userRepository.getReferenceById(1L)).thenReturn(user);

        GuardianProfile saved = GuardianProfile.builder()
                .user(user)
                .nickname("만두")
                .gender(GuardianProfile.Gender.UNKNOWN)
                .bio(null)
                .avatarUrl(null)
                .build();

        when(guardianProfileRepository.save(any(GuardianProfile.class))).thenReturn(saved);

        ProfileCreateRequest req = new ProfileCreateRequest("만두", "UNKNOWN", null, null);
        ProfileResponse res = profileService.create(req);

        assertThat(res.nickname()).isEqualTo("만두");
        assertThat(res.genderCode()).isEqualTo("UNKNOWN");
        verify(guardianProfileRepository, times(1)).save(any(GuardianProfile.class));
    }
}
