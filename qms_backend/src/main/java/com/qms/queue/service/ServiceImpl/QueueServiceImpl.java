package com.qms.queue.service.ServiceImpl;

import com.qms.queue.dto.response.CabinResponse;
import com.qms.queue.dto.response.QueueStateResponse;
import com.qms.queue.dto.response.TokenResponse;
import com.qms.queue.dto.response.UserResponse;
import com.qms.queue.entity.*;
import com.qms.queue.enums.CabinStatus;
import com.qms.queue.enums.CandidateStatus;
import com.qms.queue.enums.TokenStatus;
import com.qms.queue.exceptions.BusinessException;
import com.qms.queue.exceptions.ResourceNotFoundException;
import com.qms.queue.repository.*;
import com.qms.queue.service.EmailService;
import com.qms.queue.service.EmailTemplateService;
import com.qms.queue.service.QueueAssignmentService;
import com.qms.queue.service.QueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QueueServiceImpl implements QueueService {

    private final TokenRepository tokenRepository;
    private final CandidateRepository candidateRepository;
    private final CabinRepository cabinRepository;
    private final QueueStateRepository queueStateRepository;
    private final QueueAssignmentService queueAssignmentService;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;

    @Override
    @Transactional
    public TokenResponse callNext(Long cabinId) {
        Cabin cabin = cabinRepository.findById(cabinId)
                .orElseThrow(() -> new ResourceNotFoundException("Cabin not found: " + cabinId));

        if (cabin.getStatus() == CabinStatus.BUSY) {
            throw new BusinessException("Cabin already has an active interview. Complete it first.");
        }
        if (cabin.getStatus() == CabinStatus.INACTIVE) {
            throw new BusinessException("Cabin is not active. Activate it before calling candidates.");
        }

        List<Token> waitingTokens = tokenRepository.findByStatusOrderByQueuePositionAsc(TokenStatus.WAITING);
        if (waitingTokens.isEmpty()) {
            throw new BusinessException("No candidates are waiting in the queue");
        }

        Token calledToken = waitingTokens.get(0);
        Token token = queueAssignmentService.callNextForCabin(cabin);
        if (token == null) {
            throw new BusinessException("No candidates are waiting in the queue");
        }
        Candidate called = token.getCandidate();
        if (called != null && called.getEmail() != null) {
            String subject = "Your Interview is Starting – Token " + token.getTokenId();
            String htmlBody = emailTemplateService.buildCallNowEmail(
                    called.getFullName(), token.getTokenId(), cabin.getCabinName());
            emailService.sendEmail(called.getEmail(), subject, htmlBody);
            log.info("Call notification email sent to {} for cabin {}", called.getEmail(), cabin.getCabinName());
        }
        tokenRepository.findByStatusOrderByQueuePositionAsc(TokenStatus.WAITING)
                .stream()
                .findFirst()
                .ifPresent(nextToken -> {
                    Candidate next = nextToken.getCandidate();
                    if (next != null && next.getEmail() != null) {
                        String nextSubject = "You're Next in Line! – Token " + nextToken.getTokenId();
                        String nextHtmlBody = emailTemplateService.buildYouAreNextEmail(
                                next.getFullName(), nextToken.getTokenId());
                        emailService.sendEmail(next.getEmail(), nextSubject, nextHtmlBody);
                        log.info("'You're next' email sent to: {}", next.getEmail());
                    }
                });

        updateQueueState();
        return toTokenResponse(token);
    }

    @Override
    @Transactional
    public TokenResponse startInterview(String tokenId) {
        Token token = findToken(tokenId);

        if (token.getStatus() != TokenStatus.CALLED) {
            throw new BusinessException("Token must be in CALLED state to start interview");
        }

        token.setStatus(TokenStatus.IN_PROGRESS);
        token.setStartedAt(LocalDateTime.now());
        tokenRepository.save(token);

        Candidate c = token.getCandidate();
        c.setStatus(CandidateStatus.IN_PROGRESS);
        c.setInterviewStartTime(LocalDateTime.now());
        candidateRepository.save(c);

        updateQueueState();
        queueAssignmentService.broadcastQueueUpdate();
        log.info("Interview started for token {}", tokenId);
        return toTokenResponse(token);
    }

    @Override
    @Transactional
    public TokenResponse completeInterview(String tokenId) {
        Token token = findToken(tokenId);

        if (token.getStatus() != TokenStatus.IN_PROGRESS) {
            throw new BusinessException("Token must be IN_PROGRESS to complete");
        }

        token.setStatus(TokenStatus.COMPLETED);
        token.setCompletedAt(LocalDateTime.now());
        tokenRepository.save(token);

        Candidate c = token.getCandidate();
        c.setStatus(CandidateStatus.COMPLETED);
        c.setInterviewEndTime(LocalDateTime.now());
        candidateRepository.save(c);

        Cabin cabin = token.getCabin();
        if (cabin != null) {
            queueAssignmentService.handleCabinFreed(cabin);
        }

        updateQueueState();
        log.info("Interview completed for token {}", tokenId);
        return toTokenResponse(token);
    }

    @Override
    @Transactional
    public TokenResponse markNoShow(String tokenId) {
        Token token = findToken(tokenId);

        if (token.getStatus() != TokenStatus.CALLED && token.getStatus() != TokenStatus.WAITING) {
            throw new BusinessException("Cannot mark no-show for token in status: " + token.getStatus());
        }

        token.setStatus(TokenStatus.NO_SHOW);
        tokenRepository.save(token);

        Candidate c = token.getCandidate();
        c.setStatus(CandidateStatus.NO_SHOW);
        candidateRepository.save(c);

        Cabin cabin = token.getCabin();
        if (cabin != null) {
            queueAssignmentService.handleCabinFreed(cabin);
        }

        queueAssignmentService.recalculateQueuePositions();
        updateQueueState();
        return toTokenResponse(token);
    }

    @Override
    @Transactional
    public TokenResponse cancelToken(String tokenId) {
        Token token = findToken(tokenId);

        if (token.getStatus() == TokenStatus.COMPLETED) {
            throw new BusinessException("Cannot cancel a completed interview");
        }

        token.setStatus(TokenStatus.CANCELLED);
        tokenRepository.save(token);

        Candidate c = token.getCandidate();
        c.setStatus(CandidateStatus.CANCELLED);
        candidateRepository.save(c);

        Cabin cabin = token.getCabin();
        if (cabin != null) {
            queueAssignmentService.handleCabinFreed(cabin);
        }

        queueAssignmentService.recalculateQueuePositions();
        updateQueueState();
        return toTokenResponse(token);
    }

    @Override
    public QueueStateResponse getLiveState() {
        QueueState state = queueStateRepository.findAll().stream().findFirst()
                .orElse(new QueueState());

        List<CabinResponse> activeCabins = cabinRepository
                .findByStatusIn(List.of(CabinStatus.ACTIVE, CabinStatus.BUSY))
                .stream().map(this::toCabinResponse).toList();

        List<TokenResponse> waitingQueue = tokenRepository
                .findByStatusOrderByQueuePositionAsc(TokenStatus.WAITING)
                .stream().map(this::toTokenResponse).toList();

        return QueueStateResponse.builder()
                .totalRegistered(state.getTotalRegistered())
                .totalWaiting(state.getTotalWaiting())
                .totalInProgress(state.getTotalInProgress())
                .totalCompleted(state.getTotalCompleted())
                .lastAnnouncement(state.getLastAnnouncement())
                .activeCabins(activeCabins)
                .waitingQueue(waitingQueue)
                .build();
    }

    @Override
    public TokenResponse getTokenByCandidate(Long candidateId) {
        Token token = tokenRepository.findByCandidateId(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Token not found for candidate: " + candidateId));
        return toTokenResponse(token);
    }

    private void updateQueueState() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        QueueState state = queueStateRepository.findAll().stream().findFirst()
                .orElse(QueueState.builder().build());

        state.setTotalRegistered((int) candidateRepository.countByCreatedAtAfter(startOfDay));
        state.setTotalWaiting(
                (int) candidateRepository.countByStatusAndCreatedAtAfter(CandidateStatus.WAITING, startOfDay));
        state.setTotalInProgress(
                (int) candidateRepository.countByStatusAndCreatedAtAfter(CandidateStatus.IN_PROGRESS, startOfDay));
        state.setTotalCompleted(
                (int) candidateRepository.countByStatusAndCreatedAtAfter(CandidateStatus.COMPLETED, startOfDay));

        queueStateRepository.save(state);
    }

    private Token findToken(String tokenId) {
        return tokenRepository.findByTokenId(tokenId)
                .orElseThrow(() -> new ResourceNotFoundException("Token not found: " + tokenId));
    }

    private TokenResponse toTokenResponse(Token t) {
        Candidate c = t.getCandidate();
        return TokenResponse.builder()
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
                .cabinId(t.getCabin() != null ? t.getCabin().getId() : null)
                .cabinName(t.getCabin() != null ? t.getCabin().getCabinName() : null)
                .createdAt(t.getCreatedAt())
                .calledAt(t.getCalledAt())
                .startedAt(t.getStartedAt())
                .completedAt(t.getCompletedAt())
                .build();
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
                .currentCandidateId(c.getCurrentCandidate() != null ? c.getCurrentCandidate().getId() : null)
                .currentCandidateName(c.getCurrentCandidate() != null ? c.getCurrentCandidate().getFullName() : null)
                .currentCandidateToken(c.getCurrentCandidate() != null ? c.getCurrentCandidate().getTokenId() : null)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
