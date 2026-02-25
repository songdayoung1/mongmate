package kr.co.mongmate.api.profile.controller;

import kr.co.mongmate.api.profile.exception.ProfileException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolationException;
import java.util.Map;

@RestControllerAdvice(basePackages = "kr.co.mongmate.api.profile")
public class ProfileExceptionHandler {

    @ExceptionHandler(ProfileException.class)
    public ResponseEntity<Map<String, String>> handleProfile(ProfileException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("error", ex.getReason()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        boolean nicknameError = ex.getBindingResult().getFieldErrors().stream()
                .anyMatch(err -> "nickname".equals(err.getField()));

        String code = nicknameError ? "INVALID_NICKNAME" : "INVALID_REQUEST";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", code));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "INVALID_REQUEST"));
    }
}
