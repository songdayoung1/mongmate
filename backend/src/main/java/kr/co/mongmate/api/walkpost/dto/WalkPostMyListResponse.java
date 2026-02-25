package kr.co.mongmate.api.walkpost.dto;

import java.util.List;

public record WalkPostMyListResponse(
        List<WalkPostMyListItem> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
