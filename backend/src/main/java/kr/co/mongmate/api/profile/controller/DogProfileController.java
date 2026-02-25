package kr.co.mongmate.api.profile.controller;

import jakarta.validation.Valid;
import java.security.Principal;
import kr.co.mongmate.api.profile.dto.request.DogCreateRequest;
import kr.co.mongmate.api.profile.dto.request.DogPatchRequest;
import kr.co.mongmate.api.profile.dto.request.DogUpdateRequest;
import kr.co.mongmate.api.profile.dto.response.DogDeleteResponse;
import kr.co.mongmate.api.profile.dto.response.DogListResponse;
import kr.co.mongmate.api.profile.dto.response.DogResponse;
import kr.co.mongmate.api.profile.exception.DogProfileException;
import kr.co.mongmate.api.profile.service.DogProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dogs")
public class DogProfileController {

    private final DogProfileService dogProfileService;

    @PostMapping
    public ResponseEntity<DogResponse> create(
            @Valid @RequestBody DogCreateRequest request,
            BindingResult bindingResult,
            Principal principal
    ) {
        handleValidation(bindingResult);
        String userId = principal != null ? principal.getName() : null;
        DogResponse response = dogProfileService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<DogListResponse> listMine(Principal principal) {
        String userId = principal != null ? principal.getName() : null;
        DogListResponse response = dogProfileService.listMine(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{dogId}")
    public ResponseEntity<DogResponse> getById(
            @PathVariable Long dogId,
            Principal principal
    ) {
        String userId = principal != null ? principal.getName() : null;
        DogResponse response = dogProfileService.getById(dogId, userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{dogId}")
    public ResponseEntity<DogResponse> update(
            @PathVariable Long dogId,
            @Valid @RequestBody DogUpdateRequest request,
            BindingResult bindingResult,
            Principal principal
    ) {
        handleValidation(bindingResult);
        String userId = principal != null ? principal.getName() : null;
        DogResponse response = dogProfileService.update(dogId, userId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{dogId}")
    public ResponseEntity<DogResponse> patch(
            @PathVariable Long dogId,
            @Valid @RequestBody DogPatchRequest request,
            BindingResult bindingResult,
            Principal principal
    ) {
        handleValidation(bindingResult);
        String userId = principal != null ? principal.getName() : null;
        DogResponse response = dogProfileService.patch(dogId, userId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{dogId}")
    public ResponseEntity<DogDeleteResponse> delete(
            @PathVariable Long dogId,
            Principal principal
    ) {
        String userId = principal != null ? principal.getName() : null;
        DogDeleteResponse response = dogProfileService.delete(dogId, userId);
        return ResponseEntity.ok(response);
    }

    private void handleValidation(BindingResult bindingResult) {
        if (bindingResult == null || !bindingResult.hasErrors()) {
            return;
        }
        if (bindingResult.hasFieldErrors("name")) {
            throw DogProfileException.invalidName();
        }
        throw DogProfileException.invalidRequest();
    }
}
