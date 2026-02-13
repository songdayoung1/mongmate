package kr.co.mongmate.api.profile.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class ProfileException extends ResponseStatusException {

    private final String code;

    private ProfileException(HttpStatus status, String code) {
        super(status, code);
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static ProfileException invalidNickname() {
        return new ProfileException(HttpStatus.BAD_REQUEST, "INVALID_NICKNAME");
    }

    public static ProfileException invalidGenderCode() {
        return new ProfileException(HttpStatus.BAD_REQUEST, "INVALID_GENDER_CODE");
    }

    public static ProfileException invalidRequest() {
        return new ProfileException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST");
    }

    public static ProfileException unauthorized() {
        return new ProfileException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }

    public static ProfileException forbidden() {
        return new ProfileException(HttpStatus.FORBIDDEN, "FORBIDDEN");
    }

    public static ProfileException profileNotFound() {
        return new ProfileException(HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND");
    }

    public static ProfileException profileAlreadyExists() {
        return new ProfileException(HttpStatus.CONFLICT, "PROFILE_ALREADY_EXISTS");
    }
}
