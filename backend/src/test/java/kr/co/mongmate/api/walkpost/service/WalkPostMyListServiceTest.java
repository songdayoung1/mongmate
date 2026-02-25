package kr.co.mongmate.api.walkpost.service;

import kr.co.mongmate.api.walkpost.dto.WalkPostMyListResponse;
import kr.co.mongmate.api.walkpost.exception.WalkPostException;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import kr.co.mongmate.domain.walkpost.repository.WalkPostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalkPostMyListServiceTest {

    @Mock
    WalkPostRepository walkPostRepository;

    @InjectMocks
    WalkPostMyListService walkPostMyListService;

    @Test
    void listMy_callsRepositoryWithUserIdAndStatus() {
        WalkPost post = WalkPost.builder()
                .author(User.builder()
                        .id(1L)
                        .phoneNumber("01012345678")
                        .termsAgreedAt(LocalDateTime.now())
                        .marketingAgreed(false)
                        .build())
                .title("title")
                .content("content")
                .regionId(1L)
                .status(WalkPost.Status.OPEN)
                .build();

        when(walkPostRepository.findByAuthor_IdAndStatusOrderByCreatedAtDesc(eq(1L), eq(WalkPost.Status.OPEN), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(post), PageRequest.of(0, 20), 1));

        WalkPostMyListResponse response = walkPostMyListService.list("1", "ACTIVE", 0, 20);

        assertThat(response.items()).hasSize(1);
        ArgumentCaptor<WalkPost.Status> statusCaptor = ArgumentCaptor.forClass(WalkPost.Status.class);
        verify(walkPostRepository, times(1))
                .findByAuthor_IdAndStatusOrderByCreatedAtDesc(eq(1L), statusCaptor.capture(), any(Pageable.class));
        assertThat(statusCaptor.getValue()).isEqualTo(WalkPost.Status.OPEN);
    }

    @Test
    void listMy_invalidStatus_throws400() {
        assertThatThrownBy(() -> walkPostMyListService.list("1", "WRONG", 0, 20))
                .isInstanceOf(WalkPostException.class)
                .extracting(e -> ((WalkPostException) e).getStatusCode().value())
                .isEqualTo(400);
    }
}
