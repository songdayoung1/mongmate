package kr.co.mongmate.api.walkpost.controller;

import kr.co.mongmate.api.walkpost.dto.WalkPostUpdateRequest;
import kr.co.mongmate.api.walkpost.dto.WalkPostUpdateResponse;
import kr.co.mongmate.api.walkpost.service.WalkPostDeleteService;
import kr.co.mongmate.api.walkpost.service.WalkPostUpdateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk-posts")
public class WalkPostUpdateController {

    private final WalkPostUpdateService walkPostUpdateService;
    private final WalkPostDeleteService walkPostDeleteService;

    @PutMapping("/{postId}")
    public WalkPostUpdateResponse update(
            @PathVariable Long postId,
            @RequestBody WalkPostUpdateRequest request,
            Principal principal
    ) {
        String userId = principal != null ? principal.getName() : null;
        return walkPostUpdateService.update(postId, userId, request);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> delete(@PathVariable Long postId, Principal principal) {
        String userId = principal != null ? principal.getName() : null;
        walkPostDeleteService.delete(postId, userId);
        return ResponseEntity.noContent().build();
    }
}
