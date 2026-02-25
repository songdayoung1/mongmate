package kr.co.mongmate.domain.walkpost.status;

import kr.co.mongmate.domain.walkpost.entity.WalkPost;

public enum WalkPostStatus {
    ACTIVE,
    CLOSED;

    public WalkPost.Status toEntityStatus() {
        return this == ACTIVE ? WalkPost.Status.OPEN : WalkPost.Status.COMPLETED;
    }

    public static WalkPostStatus fromEntity(WalkPost.Status status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
            case OPEN -> ACTIVE;
            case COMPLETED, EXPIRED -> CLOSED;
        };
    }
}
