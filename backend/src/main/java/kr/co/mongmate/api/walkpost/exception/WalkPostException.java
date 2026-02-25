package kr.co.mongmate.api.walkpost.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class WalkPostException extends ResponseStatusException {

    private final String code;

    private WalkPostException(HttpStatus status, String code) {
        super(status, code);
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static WalkPostException invalidStatus() {
        return new WalkPostException(HttpStatus.BAD_REQUEST, "INVALID_STATUS");
    }

    public static WalkPostException invalidRequest() {
        return new WalkPostException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST");
    }

    public static WalkPostException unauthorized() {
        return new WalkPostException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }

    public static WalkPostException notOwner() {
        return new WalkPostException(HttpStatus.FORBIDDEN, "NOT_OWNER");
    }

    public static WalkPostException walkPostNotFound() {
        return new WalkPostException(HttpStatus.NOT_FOUND, "WALK_POST_NOT_FOUND");
    }
}
