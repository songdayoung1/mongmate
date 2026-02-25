package kr.co.mongmate.api.walkpost.controller;

import jakarta.validation.Valid;
import kr.co.mongmate.api.walkpost.dto.WalkPostStatusChangeRequest;
import kr.co.mongmate.api.walkpost.dto.WalkPostStatusChangeResponse;
import kr.co.mongmate.api.walkpost.service.WalkPostStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk-posts")
public class WalkPostStatusController {

    private final WalkPostStatusService walkPostStatusService;

    @PatchMapping("/{postId}/status")
    public ResponseEntity<WalkPostStatusChangeResponse> changeStatus(
            @PathVariable Long postId,
            @Valid @RequestBody WalkPostStatusChangeRequest request,
            Principal principal
    ) {
        String userId = principal != null ? principal.getName() : null;
        WalkPostStatusChangeResponse response = walkPostStatusService.changeStatus(postId, userId, request);
        return ResponseEntity.ok(response);
    }
}
