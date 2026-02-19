package kr.co.mongmate.api.walkpost.service;

import kr.co.mongmate.api.walkpost.dto.WalkPostStatusChangeRequest;
import kr.co.mongmate.api.walkpost.dto.WalkPostStatusChangeResponse;
import kr.co.mongmate.api.walkpost.exception.WalkPostException;
import kr.co.mongmate.domain.user.entity.User;
import kr.co.mongmate.domain.walkpost.entity.WalkPost;
import kr.co.mongmate.domain.walkpost.repository.WalkPostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalkPostStatusServiceTest {

    @Mock
    WalkPostRepository walkPostRepository;

    @InjectMocks
    WalkPostStatusService walkPostStatusService;

    @Test
    void changeStatus_notOwner_throws403() {
        WalkPost post = WalkPost.builder()
                .author(User.builder()
                        .id(2L)
                        .phoneNumber("01099998888")
                        .termsAgreedAt(LocalDateTime.now())
                        .marketingAgreed(false)
                        .build())
                .title("title")
                .content("content")
                .regionId(1L)
                .status(WalkPost.Status.OPEN)
                .build();

        when(walkPostRepository.findByIdWithAuthor(10L)).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> walkPostStatusService.changeStatus(10L, "1", new WalkPostStatusChangeRequest("CLOSED")))
                .isInstanceOf(WalkPostException.class)
                .extracting(e -> ((WalkPostException) e).getStatusCode().value())
                .isEqualTo(403);
    }

    @Test
    void changeStatus_notFound_throws404() {
        when(walkPostRepository.findByIdWithAuthor(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> walkPostStatusService.changeStatus(10L, "1", new WalkPostStatusChangeRequest("CLOSED")))
                .isInstanceOf(WalkPostException.class)
                .extracting(e -> ((WalkPostException) e).getStatusCode().value())
                .isEqualTo(404);
    }

    @Test
    void changeStatus_invalidStatus_throws400() {
        assertThatThrownBy(() -> walkPostStatusService.changeStatus(10L, "1", new WalkPostStatusChangeRequest("WRONG")))
                .isInstanceOf(WalkPostException.class)
                .extracting(e -> ((WalkPostException) e).getStatusCode().value())
                .isEqualTo(400);
    }

    @Test
    void changeStatus_success_updatesStatus() {
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

        when(walkPostRepository.findByIdWithAuthor(10L)).thenReturn(Optional.of(post));

        WalkPostStatusChangeResponse response =
                walkPostStatusService.changeStatus(10L, "1", new WalkPostStatusChangeRequest("CLOSED"));

        assertThat(response.status()).isEqualTo("CLOSED");
        assertThat(post.getStatus()).isEqualTo(WalkPost.Status.COMPLETED);
    }
}
