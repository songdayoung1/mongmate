package kr.co.mongmate.api.walkpost.controller;

import kr.co.mongmate.api.walkpost.dto.WalkPostDetailResponse;
import kr.co.mongmate.api.walkpost.service.WalkPostDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk-posts")
public class WalkPostDetailController {

    private final WalkPostDetailService walkPostDetailService;

    @GetMapping("/{postId}")
    public WalkPostDetailResponse getDetail(@PathVariable Long postId) {
        return walkPostDetailService.getDetail(postId);
    }
}
