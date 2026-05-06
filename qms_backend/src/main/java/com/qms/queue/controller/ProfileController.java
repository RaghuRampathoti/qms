package com.qms.queue.controller;

import com.qms.queue.dto.request.UpdateProfileRequest;
import com.qms.queue.dto.response.UserResponse;
import com.qms.queue.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.security.Principal;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(Principal principal, @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(principal.getName(), request));
    }

    @GetMapping
    public ResponseEntity<UserResponse> getProfile(Principal principal) {
        return ResponseEntity.ok(userService.getByUsername(principal.getName()));
    }
}
