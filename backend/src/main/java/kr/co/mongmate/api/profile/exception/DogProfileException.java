package kr.co.mongmate.api.profile.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class DogProfileException extends ResponseStatusException {

    private final String code;

    private DogProfileException(HttpStatus status, String code) {
        super(status, code);
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static DogProfileException invalidName() {
        return new DogProfileException(HttpStatus.BAD_REQUEST, "INVALID_NAME");
    }

    public static DogProfileException invalidGenderCode() {
        return new DogProfileException(HttpStatus.BAD_REQUEST, "INVALID_GENDER_CODE");
    }

    public static DogProfileException invalidRequest() {
        return new DogProfileException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST");
    }

    public static DogProfileException unauthorized() {
        return new DogProfileException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
    }

    public static DogProfileException notOwner() {
        return new DogProfileException(HttpStatus.FORBIDDEN, "NOT_OWNER");
    }

    public static DogProfileException dogNotFound() {
        return new DogProfileException(HttpStatus.NOT_FOUND, "DOG_NOT_FOUND");
    }
}
