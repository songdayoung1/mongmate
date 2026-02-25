package kr.co.mongmate.api.walkpost.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.user.repository.UserRepository;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import kr.co.mongmate.domain.walkpost.repository.WalkPostRepository;
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
class WalkPostMyListControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    UserRepository userRepository;

    @Autowired
    WalkPostRepository walkPostRepository;

    private Long userId;
    private Long otherUserId;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .phoneNumber("01012345678")
                .termsAgreedAt(LocalDateTime.now())
                .marketingAgreed(false)
                .build();
        userId = userRepository.save(user).getId();

        User other = User.builder()
                .phoneNumber("01099998888")
                .termsAgreedAt(LocalDateTime.now())
                .marketingAgreed(false)
                .build();
        otherUserId = userRepository.save(other).getId();
    }

    @Test
    void listMy_defaultStatus_active_returns200() throws Exception {
        savePost(userId, WalkPost.Status.OPEN, "active");
        savePost(userId, WalkPost.Status.COMPLETED, "closed");

        mockMvc.perform(get("/api/walk-posts/my")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].status").value("ACTIVE"));
    }

    @Test
    void listMy_closed_returns200() throws Exception {
        savePost(userId, WalkPost.Status.COMPLETED, "closed");

        mockMvc.perform(get("/api/walk-posts/my")
                        .param("status", "CLOSED")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].status").value("CLOSED"));
    }

    @Test
    void changeStatus_toClosed_returns200() throws Exception {
        WalkPost post = savePost(userId, WalkPost.Status.OPEN, "active");
        String body = objectMapper.writeValueAsString(Map.of("status", "CLOSED"));

        mockMvc.perform(patch("/api/walk-posts/{postId}/status", post.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    void changeStatus_toActive_returns200() throws Exception {
        WalkPost post = savePost(userId, WalkPost.Status.COMPLETED, "closed");
        String body = objectMapper.writeValueAsString(Map.of("status", "ACTIVE"));

        mockMvc.perform(patch("/api/walk-posts/{postId}/status", post.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void listMy_invalidStatus_returns400() throws Exception {
        mockMvc.perform(get("/api/walk-posts/my")
                        .param("status", "WRONG")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS"));
    }

    @Test
    void changeStatus_invalidStatus_returns400() throws Exception {
        WalkPost post = savePost(userId, WalkPost.Status.OPEN, "active");
        String body = objectMapper.writeValueAsString(Map.of("status", "WRONG"));

        mockMvc.perform(patch("/api/walk-posts/{postId}/status", post.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS"));
    }

    @Test
    void changeStatus_notOwner_returns403() throws Exception {
        WalkPost post = savePost(otherUserId, WalkPost.Status.OPEN, "active");
        String body = objectMapper.writeValueAsString(Map.of("status", "CLOSED"));

        mockMvc.perform(patch("/api/walk-posts/{postId}/status", post.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));
    }

    @Test
    void changeStatus_notFound_returns404() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("status", "CLOSED"));

        mockMvc.perform(patch("/api/walk-posts/{postId}/status", 9999L)
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("WALK_POST_NOT_FOUND"));
    }

    @Test
    void listMy_sizeTooLarge_returns400() throws Exception {
        mockMvc.perform(get("/api/walk-posts/my")
                        .param("size", "100")
                        .with(SecurityMockMvcRequestPostProcessors.user(String.valueOf(userId))))
                .andExpect(status().isBadRequest());
    }

    private WalkPost savePost(Long authorId, WalkPost.Status status, String title) {
        WalkPost post = WalkPost.builder()
                .author(userRepository.getReferenceById(authorId))
                .title(title)
                .content("content")
                .regionId(1L)
                .status(status)
                .meetAddress("마포구 성산동")
                .build();
        return walkPostRepository.save(post);
    }
}
