package kr.co.mongmate.api.walkpost.dto;

import java.time.LocalDateTime;

public record WalkPostDetailResponse(
        Long postId,
        String recruitType,
        String title,
        Author author,
        Region region,
        LocalDateTime deadlineAt,
        String meetAddress,
        String content,
        String status,
        LocalDateTime createdAt,
        Chat chat
) {
    public record Author(Long userId, String nickname) {}
    public record Region(Long regionId, String displayName) {}
    public record Chat(boolean canChat, String roomId) {}
}
