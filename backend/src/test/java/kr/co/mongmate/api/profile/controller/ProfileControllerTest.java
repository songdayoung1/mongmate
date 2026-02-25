package kr.co.mongmate.api.profile.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.mongmate.domain.profile.entity.GuardianProfile;
import kr.co.mongmate.domain.profile.repository.GuardianProfileRepository;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProfileControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    UserRepository userRepository;

    @Autowired
    GuardianProfileRepository guardianProfileRepository;

    private Long userId;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .phoneNumber("01012345678")
                .termsAgreedAt(LocalDateTime.now())
                .marketingAgreed(false)
                .build();
        userId = userRepository.save(user).getId();
    }

    @Test
    void createProfile_success() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "nickname", "만두",
                "genderCode", "MALE",
                "bio", "저녁 산책 좋아해요",
                "avatarUrl", "https://example.com/avatar.png"
        ));

        mockMvc.perform(post("/api/profile")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(userId))
                .andExpect(jsonPath("$.nickname").value("만두"))
                .andExpect(jsonPath("$.genderCode").value("MALE"))
                .andExpect(jsonPath("$.heartsCount").value(0));
    }

    @Test
    void getProfile_success() throws Exception {
        GuardianProfile profile = GuardianProfile.builder()
                .user(userRepository.getReferenceById(userId))
                .nickname("만두")
                .gender(GuardianProfile.Gender.UNKNOWN)
                .bio("소개")
                .avatarUrl(null)
                .build();
        guardianProfileRepository.save(profile);

        mockMvc.perform(get("/api/profile/me")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId))
                .andExpect(jsonPath("$.nickname").value("만두"))
                .andExpect(jsonPath("$.genderCode").value("UNKNOWN"));
    }

    @Test
    void updateProfile_success() throws Exception {
        GuardianProfile profile = GuardianProfile.builder()
                .user(userRepository.getReferenceById(userId))
                .nickname("만두")
                .gender(GuardianProfile.Gender.UNKNOWN)
                .bio("소개")
                .avatarUrl(null)
                .build();
        guardianProfileRepository.save(profile);

        String body = objectMapper.writeValueAsString(Map.of(
                "nickname", "두부",
                "genderCode", "FEMALE",
                "bio", "산책 메이트 구해요",
                "avatarUrl", "https://example.com/a.png"
        ));

        mockMvc.perform(put("/api/profile/me")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").value("두부"))
                .andExpect(jsonPath("$.genderCode").value("FEMALE"));
    }

    @Test
    void patchProfile_success() throws Exception {
        GuardianProfile profile = GuardianProfile.builder()
                .user(userRepository.getReferenceById(userId))
                .nickname("만두")
                .gender(GuardianProfile.Gender.UNKNOWN)
                .bio("소개")
                .avatarUrl(null)
                .build();
        guardianProfileRepository.save(profile);

        String body = objectMapper.writeValueAsString(Map.of(
                "bio", "저녁 산책 좋아해요"
        ));

        mockMvc.perform(patch("/api/profile/me")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("저녁 산책 좋아해요"));
    }

    @Test
    void deleteProfile_success() throws Exception {
        GuardianProfile profile = GuardianProfile.builder()
                .user(userRepository.getReferenceById(userId))
                .nickname("만두")
                .gender(GuardianProfile.Gender.UNKNOWN)
                .bio("소개")
                .avatarUrl(null)
                .build();
        guardianProfileRepository.save(profile);

        mockMvc.perform(delete("/api/profile/me")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId))
                .andExpect(jsonPath("$.deleted").value(true));
    }

    @Test
    void createProfile_invalidNickname_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "nickname", "   "
        ));

        mockMvc.perform(post("/api/profile")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createProfile_duplicate_returns409() throws Exception {
        GuardianProfile profile = GuardianProfile.builder()
                .user(userRepository.getReferenceById(userId))
                .nickname("만두")
                .gender(GuardianProfile.Gender.UNKNOWN)
                .bio("소개")
                .avatarUrl(null)
                .build();
        guardianProfileRepository.save(profile);

        String body = objectMapper.writeValueAsString(Map.of(
                "nickname", "만두"
        ));

        mockMvc.perform(post("/api/profile")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void getProfile_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/profile/me")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId))))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateProfile_notFound_returns404() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "nickname", "만두"
        ));

        mockMvc.perform(put("/api/profile/me")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }
}
