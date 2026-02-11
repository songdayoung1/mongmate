package kr.co.mongmate.api.walkpost.controller;

import kr.co.mongmate.api.walkpost.dto.WalkPostListResponse;
import kr.co.mongmate.api.walkpost.service.WalkPostListService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk-posts")
public class WalkPostListController {

    private final WalkPostListService walkPostListService;

    @GetMapping
    public WalkPostListResponse list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String recruitType
    ) {
        return walkPostListService.list(page, size, regionId, status, recruitType);
    }
}
