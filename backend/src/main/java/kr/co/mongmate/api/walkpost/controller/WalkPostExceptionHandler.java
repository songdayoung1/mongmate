package kr.co.mongmate.api.walkpost.controller;

import jakarta.validation.ConstraintViolationException;
import kr.co.mongmate.api.walkpost.exception.WalkPostException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(basePackages = "kr.co.mongmate.api.walkpost")
public class WalkPostExceptionHandler {

    @ExceptionHandler(WalkPostException.class)
    public ResponseEntity<Map<String, String>> handleWalkPost(WalkPostException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("error", ex.getReason()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        boolean statusError = ex.getBindingResult().getFieldErrors().stream()
                .anyMatch(err -> "status".equals(err.getField()));
        String code = statusError ? "INVALID_STATUS" : "INVALID_REQUEST";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", code));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "INVALID_REQUEST"));
    }
}
