package kr.co.mongmate.api.profile.controller;

import jakarta.validation.Valid;
import kr.co.mongmate.api.profile.dto.request.ProfileCreateRequest;
import kr.co.mongmate.api.profile.dto.request.ProfilePatchRequest;
import kr.co.mongmate.api.profile.dto.request.ProfileUpdateRequest;
import kr.co.mongmate.api.profile.dto.response.ProfileDeleteResponse;
import kr.co.mongmate.api.profile.dto.response.ProfileResponse;
import kr.co.mongmate.api.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping
    public ResponseEntity<ProfileResponse> create(@Valid @RequestBody ProfileCreateRequest request) {
        ProfileResponse response = profileService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMe() {
        return ResponseEntity.ok(profileService.getMe());
    }

    @PutMapping("/me")
    public ResponseEntity<ProfileResponse> update(@Valid @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(profileService.update(request));
    }

    @PatchMapping("/me")
    public ResponseEntity<ProfileResponse> patch(@Valid @RequestBody ProfilePatchRequest request) {
        return ResponseEntity.ok(profileService.patch(request));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ProfileDeleteResponse> delete() {
        return ResponseEntity.ok(profileService.delete());
    }
}
