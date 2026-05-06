package com.qms.queue.controller;

import com.qms.queue.dto.common.ApiResponse;
import com.qms.queue.dto.common.PageResponse;
import com.qms.queue.dto.request.FeedbackRequest;
import com.qms.queue.dto.response.FeedbackResponse;
import com.qms.queue.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
    
    @PostMapping
    @PreAuthorize("hasRole('INTERVIEWER')")
    public ResponseEntity<ApiResponse<FeedbackResponse>> submit(
            @org.springframework.security.core.annotation.AuthenticationPrincipal String username,
            @RequestBody @Valid FeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Feedback submitted successfully",
                feedbackService.submit(request.getTokenId(), request, username)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(ApiResponse.success("Feedback fetched",
                feedbackService.getAll(page, size)));
    }

    @GetMapping("/result/{result}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getByResult(
            @PathVariable String result,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(ApiResponse.success("Feedback fetched",
                feedbackService.getByResult(result, page, size)));
    }

    @GetMapping("/candidate/{candidateId}")
    @PreAuthorize("hasAnyRole('ADMIN','INTERVIEWER')")
    public ResponseEntity<ApiResponse<FeedbackResponse>> getByCandidateId(
            @PathVariable Long candidateId) {
        return ResponseEntity.ok(ApiResponse.success("Feedback fetched",
                feedbackService.getByCandidateId(candidateId)));
    }

    @GetMapping("/token/{tokenId}")
    @PreAuthorize("hasAnyRole('ADMIN','INTERVIEWER')")
    public ResponseEntity<ApiResponse<FeedbackResponse>> getByTokenId(
            @PathVariable String tokenId) {
        return ResponseEntity.ok(ApiResponse.success("Feedback fetched",
                feedbackService.getByTokenId(tokenId)));
    }

    @GetMapping("/my-feedback")
    @PreAuthorize("hasRole('INTERVIEWER')")
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getMyFeedback(
            @org.springframework.security.core.annotation.AuthenticationPrincipal String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(ApiResponse.success("Your feedback fetched",
                feedbackService.getByInterviewer(username, page, size)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('INTERVIEWER')")
    public ResponseEntity<ApiResponse<FeedbackResponse>> update(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal String username,
            @RequestBody @Valid FeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Feedback updated successfully",
                feedbackService.update(id, request, username)));
    }
}