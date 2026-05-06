package com.qms.queue.controller;

import com.qms.queue.dto.common.ApiResponse;
import com.qms.queue.dto.response.CabinResponse;
import com.qms.queue.dto.response.TokenResponse;
import com.qms.queue.dto.response.UserResponse;
import com.qms.queue.entity.Cabin;
import com.qms.queue.entity.Candidate;
import com.qms.queue.entity.User;
import com.qms.queue.enums.TokenStatus;
import com.qms.queue.exceptions.BusinessException;
import com.qms.queue.exceptions.ResourceNotFoundException;
import com.qms.queue.repository.CabinRepository;
import com.qms.queue.repository.FeedbackRepository;
import com.qms.queue.repository.TokenRepository;
import com.qms.queue.repository.UserRepository;
import com.qms.queue.service.QueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviewer")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','INTERVIEWER')")
@Slf4j
public class InterviewerController {

        private final UserRepository userRepository;
        private final CabinRepository cabinRepository;
        private final TokenRepository tokenRepository;
        private final FeedbackRepository feedbackRepository;
        private final QueueService queueService;

        @GetMapping("/my-cabin")
        public ResponseEntity<ApiResponse<CabinResponse>> getMyCabin(
                        @AuthenticationPrincipal String username) {
                log.info("Fetching cabin for interviewer: {}", username);
                User user = findUser(username);

                List<Cabin> cabins = cabinRepository.findByInterviewerId(user.getId());
                log.info("Found {} cabin(s) for user {}", cabins.size(), username);

                if (cabins.isEmpty()) {
                        return ResponseEntity.ok(ApiResponse.success("No cabin assigned", null));
                }

                Cabin cabin = cabins.stream()
                                .filter(c -> c.getStatus().name().equals("ACTIVE")
                                                || c.getStatus().name().equals("BUSY"))
                                .findFirst()
                                .orElse(cabins.get(0));

                log.info("Returning cabin: {}", cabin.getCabinName());
                return ResponseEntity.ok(ApiResponse.success("Cabin fetched", toCabinResponse(cabin)));
        }

        @PostMapping("/call-next")
        public ResponseEntity<ApiResponse<TokenResponse>> callNext(
                        @AuthenticationPrincipal String username) {
                User user = findUser(username);

                List<Cabin> cabins = cabinRepository.findByInterviewerId(user.getId());
                if (cabins.isEmpty()) {
                        throw new ResourceNotFoundException("No cabin assigned to this interviewer");
                }

                Cabin cabin = cabins.stream()
                                .filter(c -> c.getStatus().name().equals("ACTIVE"))
                                .findFirst()
                                .orElseThrow(() -> new BusinessException(
                                                "Your cabin is either INACTIVE or already BUSY. Complete the current interview first."));

                TokenResponse token = queueService.callNext(cabin.getId());
                return ResponseEntity.ok(ApiResponse.success("Candidate called", token));
        }

        @PostMapping("/start/{tokenId}")
        public ResponseEntity<ApiResponse<TokenResponse>> startInterview(
                        @PathVariable String tokenId) {
                return ResponseEntity.ok(ApiResponse.success("Interview started",
                                queueService.startInterview(tokenId)));
        }

        @PostMapping("/complete/{tokenId}")
        public ResponseEntity<ApiResponse<TokenResponse>> completeInterview(
                        @PathVariable String tokenId) {
                return ResponseEntity.ok(ApiResponse.success("Interview completed",
                                queueService.completeInterview(tokenId)));
        }

        @PostMapping("/no-show/{tokenId}")
        public ResponseEntity<ApiResponse<TokenResponse>> markNoShow(
                        @PathVariable String tokenId) {
                return ResponseEntity.ok(ApiResponse.success("Marked as no-show",
                                queueService.markNoShow(tokenId)));
        }

        @GetMapping("/queue")
        public ResponseEntity<ApiResponse<List<TokenResponse>>> getWaitingQueue() {
                List<TokenResponse> queue = tokenRepository
                                .findByStatusOrderByQueuePositionAsc(TokenStatus.WAITING)
                                .stream()
                                .map(t -> TokenResponse.builder()
                                                .id(t.getId())
                                                .tokenId(t.getTokenId())
                                                .sequence(t.getSequence())
                                                .queuePosition(t.getQueuePosition())
                                                .status(t.getStatus().name())
                                                .candidateId(t.getCandidate() != null ? t.getCandidate().getId() : null)
                                                .candidateName(t.getCandidate() != null ? t.getCandidate().getFullName() : null)
                                                .candidateEmail(t.getCandidate() != null ? t.getCandidate().getEmail() : null)
                                                .candidateMobile(t.getCandidate() != null ? t.getCandidate().getMobileNumber() : null)
                                                .applyingPosition(t.getCandidate() != null ? t.getCandidate().getApplyingPosition() : null)
                                                .currentLocation(t.getCandidate() != null ? t.getCandidate().getCurrentLocation() : null)
                                                .purposeOfVisit(t.getCandidate() != null ? t.getCandidate().getPurposeOfVisit() : null)
                                                .qualification(t.getCandidate() != null ? t.getCandidate().getQualification() : null)
                                                .yearOfPassOut(t.getCandidate() != null ? t.getCandidate().getYearOfPassOut() : null)
                                                .reference(t.getCandidate() != null ? t.getCandidate().getReference() : null)
                                                .photoUrl(t.getCandidate() != null ? t.getCandidate().getPhotoUrl() : null)
                                                .resumeUrl(t.getCandidate() != null ? t.getCandidate().getResumeUrl() : null)
                                                .candidateCreatedAt(t.getCandidate() != null ? t.getCandidate().getCreatedAt() : null)
                                                .cabinId(t.getCabin() != null ? t.getCabin().getId() : null)
                                                .cabinName(t.getCabin() != null ? t.getCabin().getCabinName() : null)
                                                .createdAt(t.getCreatedAt())
                                                .build())
                                .toList();
                return ResponseEntity.ok(ApiResponse.success("Queue fetched", queue));
        }

        @GetMapping("/current-token")
        public ResponseEntity<ApiResponse<TokenResponse>> getCurrentToken(
                        @AuthenticationPrincipal String username) {
                User user = findUser(username);

                List<Cabin> cabins = cabinRepository.findByInterviewersContaining(user);
                if (cabins.isEmpty()) {
                        return ResponseEntity.ok(ApiResponse.success("No cabin assigned", null));
                }

                for (Cabin cabin : cabins) {
                        if (cabin.getCurrentCandidate() != null) {
                                return tokenRepository.findByCandidateId(cabin.getCurrentCandidate().getId())
                                                .map(t -> {
                                                        Candidate c = t.getCandidate();
                                                        return ResponseEntity.ok(ApiResponse.success("Current token",
                                                                        TokenResponse.builder()
                                                                                        .id(t.getId())
                                                                                        .tokenId(t.getTokenId())
                                                                                        .sequence(t.getSequence())
                                                                                        .queuePosition(t.getQueuePosition())
                                                                                        .status(t.getStatus().name())
                                                                                        .candidateId(c != null ? c.getId() : null)
                                                                                        .candidateName(c != null ? c.getFullName() : null)
                                                                                        .candidateEmail(c != null ? c.getEmail() : null)
                                                                                        .candidateMobile(c != null ? c.getMobileNumber() : null)
                                                                                        .applyingPosition(c != null ? c.getApplyingPosition() : null)
                                                                                        .currentLocation(c != null ? c.getCurrentLocation() : null)
                                                                                        .purposeOfVisit(c != null ? c.getPurposeOfVisit() : null)
                                                                                        .qualification(c != null ? c.getQualification() : null)
                                                                                        .yearOfPassOut(c != null ? c.getYearOfPassOut() : null)
                                                                                        .reference(c != null ? c.getReference() : null)
                                                                                        .photoUrl(c != null ? c.getPhotoUrl() : null)
                                                                                        .resumeUrl(c != null ? c.getResumeUrl() : null)
                                                                                        .candidateCreatedAt(c != null ? c.getCreatedAt() : null)
                                                                                        .cabinId(cabin.getId())
                                                                                        .cabinName(cabin.getCabinName())
                                                                                        .createdAt(t.getCreatedAt())
                                                                                        .calledAt(t.getCalledAt())
                                                                                        .startedAt(t.getStartedAt())
                                                                                        .build()));
                                                })
                                                .orElse(ResponseEntity
                                                                .ok(ApiResponse.success("No current token", null)));
                        }
                }
                return ResponseEntity.ok(ApiResponse.success("No current token", null));
        }

        @GetMapping("/completed-count")
        public ResponseEntity<ApiResponse<Long>> getCompletedCount(
                        @AuthenticationPrincipal String username) {
                User user = findUser(username);
                long count = feedbackRepository.findByInterviewer(user).size();
                return ResponseEntity.ok(ApiResponse.success("Completed count fetched", count));
        }

        private User findUser(String username) {
                return userRepository.findByUserName(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        }

        private CabinResponse toCabinResponse(Cabin c) {
                return CabinResponse.builder()
                                .id(c.getId())
                                .cabinName(c.getCabinName())
                                .status(c.getStatus().name())
                                .panelSize(c.getPanelSize())
                                .interviewers(c.getInterviewers().stream()
                                                .map(u -> UserResponse.builder()
                                                                .id(u.getId())
                                                                .userName(u.getUserName())
                                                                .email(u.getEmail())
                                                                .phoneNumber(u.getPhoneNumber())
                                                                .role(u.getRole().name())
                                                                .active(u.getActive())
                                                                .build())
                                                .toList())
                                .currentCandidateId(c.getCurrentCandidate() != null ? c.getCurrentCandidate().getId()
                                                : null)
                                .currentCandidateName(
                                                c.getCurrentCandidate() != null ? c.getCurrentCandidate().getFullName()
                                                                : null)
                                .currentCandidateToken(
                                                c.getCurrentCandidate() != null ? c.getCurrentCandidate().getTokenId()
                                                                : null)
                                .currentCandidateStatus(c.getCurrentCandidate() != null
                                                ? tokenRepository.findByCandidateId(c.getCurrentCandidate().getId())
                                                                .map(t -> t.getStatus().name()).orElse(null)
                                                : null)
                                .createdAt(c.getCreatedAt())
                                .build();
        }
}
