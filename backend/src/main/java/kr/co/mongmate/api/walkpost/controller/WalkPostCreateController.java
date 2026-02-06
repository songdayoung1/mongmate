package kr.co.mongmate.api.walkpost.controller;

import kr.co.mongmate.api.walkpost.dto.WalkPostCreateRequest;
import kr.co.mongmate.api.walkpost.dto.WalkPostCreateResponse;
import kr.co.mongmate.api.walkpost.service.WalkPostCreateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk-posts")
public class WalkPostCreateController {

    private final WalkPostCreateService walkPostCreateService;

    @PostMapping
    public ResponseEntity<WalkPostCreateResponse> create(
            @RequestBody WalkPostCreateRequest request,
            Principal principal
    ) {
        String userId = principal != null ? principal.getName() : null;
        WalkPostCreateResponse response = walkPostCreateService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
