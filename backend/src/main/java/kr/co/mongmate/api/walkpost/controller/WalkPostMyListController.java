package kr.co.mongmate.api.walkpost.controller;

import kr.co.mongmate.api.walkpost.dto.WalkPostMyListResponse;
import kr.co.mongmate.api.walkpost.service.WalkPostMyListService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk-posts")
public class WalkPostMyListController {

    private final WalkPostMyListService walkPostMyListService;

    @GetMapping("/my")
    public WalkPostMyListResponse listMy(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            Principal principal
    ) {
        String userId = principal != null ? principal.getName() : null;
        return walkPostMyListService.list(userId, status, page, size);
    }
}
