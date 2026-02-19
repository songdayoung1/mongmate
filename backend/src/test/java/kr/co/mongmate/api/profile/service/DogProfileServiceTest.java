package kr.co.mongmate.api.profile.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import kr.co.mongmate.api.profile.dto.request.DogCreateRequest;
import kr.co.mongmate.api.profile.dto.request.DogPatchRequest;
import kr.co.mongmate.api.profile.dto.request.DogUpdateRequest;
import kr.co.mongmate.api.profile.dto.response.DogListResponse;
import kr.co.mongmate.api.profile.dto.response.DogResponse;
import kr.co.mongmate.api.profile.exception.DogProfileException;
import kr.co.mongmate.domain.profile.entity.DogProfile;
import kr.co.mongmate.domain.profile.repository.DogProfileRepository;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class DogProfileServiceTest {

    @Mock
    DogProfileRepository dogProfileRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    DogProfileService dogProfileService;

    @Test
    void create_should_link_guardian_user() {
        User guardian = user(1L);
        DogCreateRequest request = new DogCreateRequest(
                "Kongi",
                "Maltese",
                3,
                "MALE",
                true,
                "Vaccinated",
                "Active",
                "https://photo"
        );

        when(userRepository.getReferenceById(1L)).thenReturn(guardian);
        when(dogProfileRepository.save(any(DogProfile.class)))
                .thenReturn(DogProfile.builder()
                        .id(10L)
                        .guardianUser(guardian)
                        .name("Kongi")
                        .build());

        DogResponse response = dogProfileService.create("1", request);

        ArgumentCaptor<DogProfile> captor = ArgumentCaptor.forClass(DogProfile.class);
        verify(dogProfileRepository).save(captor.capture());

        DogProfile saved = captor.getValue();
        assertThat(saved.getGuardianUser()).isSameAs(guardian);
        assertThat(response.dogId()).isEqualTo(10L);
        assertThat(response.guardianUserId()).isEqualTo(1L);
    }

    @Test
    void create_should_fail_on_invalid_name() {
        DogCreateRequest request = new DogCreateRequest(
                "   ",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        assertThatThrownBy(() -> dogProfileService.create("1", request))
                .isInstanceOf(DogProfileException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).isEqualTo("INVALID_NAME");
                });
    }

    @Test
    void getById_should_fail_when_dog_not_found() {
        when(dogProfileRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dogProfileService.getById(10L, "1"))
                .isInstanceOf(DogProfileException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(rse.getReason()).isEqualTo("DOG_NOT_FOUND");
                });
    }

    @Test
    void getById_should_fail_when_not_owner() {
        User guardian = user(2L);
        DogProfile dog = DogProfile.builder()
                .id(10L)
                .guardianUser(guardian)
                .name("Kongi")
                .build();

        when(dogProfileRepository.findById(10L)).thenReturn(Optional.of(dog));

        assertThatThrownBy(() -> dogProfileService.getById(10L, "1"))
                .isInstanceOf(DogProfileException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).isEqualTo("NOT_OWNER");
                });
    }

    @Test
    void listMine_should_filter_by_guardian_user() {
        User guardian = user(1L);
        List<DogProfile> dogs = List.of(
                DogProfile.builder().id(1L).guardianUser(guardian).name("Kongi").build(),
                DogProfile.builder().id(2L).guardianUser(guardian).name("Dubu").build()
        );

        when(dogProfileRepository.findAllByGuardianUser_Id(1L)).thenReturn(dogs);

        DogListResponse response = dogProfileService.listMine("1");

        verify(dogProfileRepository).findAllByGuardianUser_Id(1L);
        assertThat(response.items()).hasSize(2);
    }

    @Test
    void update_should_fail_when_not_owner() {
        User guardian = user(2L);
        DogProfile dog = DogProfile.builder()
                .id(10L)
                .guardianUser(guardian)
                .name("Kongi")
                .build();

        when(dogProfileRepository.findById(10L)).thenReturn(Optional.of(dog));

        DogUpdateRequest request = new DogUpdateRequest(
                "Kongi",
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        assertThatThrownBy(() -> dogProfileService.update(10L, "1", request))
                .isInstanceOf(DogProfileException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).isEqualTo("NOT_OWNER");
                });
    }

    @Test
    void patch_should_fail_when_not_found() {
        when(dogProfileRepository.findById(10L)).thenReturn(Optional.empty());

        DogPatchRequest request = new DogPatchRequest(null, null, null, null, null, null, null, null);

        assertThatThrownBy(() -> dogProfileService.patch(10L, "1", request))
                .isInstanceOf(DogProfileException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(rse.getReason()).isEqualTo("DOG_NOT_FOUND");
                });
    }

    private User user(Long id) {
        return User.builder()
                .id(id)
                .phoneNumber("0101234" + id)
                .termsAgreedAt(LocalDateTime.now())
                .build();
    }
}
