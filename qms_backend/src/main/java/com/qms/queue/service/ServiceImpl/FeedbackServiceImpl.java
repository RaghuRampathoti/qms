package com.qms.queue.service.ServiceImpl;

import com.qms.queue.dto.common.PageResponse;
import com.qms.queue.dto.request.FeedbackRequest;
import com.qms.queue.dto.response.FeedbackResponse;
import com.qms.queue.entity.*;
import com.qms.queue.enums.FeedbackResult;
import com.qms.queue.enums.TokenStatus;
import com.qms.queue.exceptions.BusinessException;
import com.qms.queue.exceptions.DuplicateResourceException;
import com.qms.queue.exceptions.ResourceNotFoundException;
import com.qms.queue.repository.FeedbackRepository;
import com.qms.queue.repository.TokenRepository;
import com.qms.queue.repository.UserRepository;
import com.qms.queue.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final TokenRepository tokenRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public FeedbackResponse submit(String tokenId, FeedbackRequest request, String interviewerUsername) {
        Token token = tokenRepository.findByTokenId(tokenId)
                .orElseThrow(() -> new ResourceNotFoundException("Token not found: " + tokenId));

        if (token.getStatus() != TokenStatus.COMPLETED) {
            throw new BusinessException("Feedback can only be submitted after interview is completed");
        }

        if (feedbackRepository.existsByToken(token)) {
            throw new DuplicateResourceException("Feedback already submitted for token: " + tokenId);
        }

        User interviewer = userRepository.findByUserName(interviewerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Interviewer not found"));

        FeedbackResult result;
        if (request.getResult() == null) {
            throw new BusinessException("Result is required");
        }
        try {
            result = FeedbackResult.valueOf(request.getResult().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid result. Valid values: SELECTED, REJECTED, ON_HOLD, NEXT_ROUND");
        }

        Feedback feedback = Feedback.builder()
                .token(token)
                .candidate(token.getCandidate())
                .interviewer(interviewer)
                .result(result)
                .rating(request.getRating())
                .comments(request.getComments())
                .strengths(request.getStrengths())
                .improvements(request.getImprovements())
                .build();

        return toResponse(feedbackRepository.save(feedback));
    }

    @Override
    public FeedbackResponse getByTokenId(String tokenId) {
        Token token = tokenRepository.findByTokenId(tokenId)
                .orElseThrow(() -> new ResourceNotFoundException("Token not found: " + tokenId));
        Feedback feedback = feedbackRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found for token: " + tokenId));
        return toResponse(feedback);
    }

    @Override
    public FeedbackResponse getByCandidateId(Long candidateId) {
        Feedback feedback = feedbackRepository.findByCandidateId(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found for candidate: " + candidateId));
        return toResponse(feedback);
    }

    @Override
    public PageResponse<FeedbackResponse> getAll(int page, int size) {
        Page<Feedback> result = feedbackRepository.findAll(
                PageRequest.of(page, size, Sort.by("submittedAt").descending()));
        return toPageResponse(result);
    }

    @Override
    public PageResponse<FeedbackResponse> getByResult(String result, int page, int size) {
        FeedbackResult fr;
        try {
            fr = FeedbackResult.valueOf(result.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid result: " + result);
        }
        Page<Feedback> resultPage = feedbackRepository.findByResult(fr,
                PageRequest.of(page, size, Sort.by("submittedAt").descending()));
        return toPageResponse(resultPage);
    }

    @Override
    public PageResponse<FeedbackResponse> getByInterviewer(String username, int page, int size) {
        User interviewer = userRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Interviewer not found"));
        Page<Feedback> resultPage = feedbackRepository.findByInterviewer(interviewer,
                PageRequest.of(page, size, Sort.by("submittedAt").descending()));
        return toPageResponse(resultPage);
    }

    @Override
    @Transactional
    public FeedbackResponse update(Long id, FeedbackRequest request, String interviewerUsername) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found: " + id));

        if (!feedback.getInterviewer().getUserName().equals(interviewerUsername)) {
            throw new BusinessException("You can only update your own feedback");
        }

        if (request.getResult() != null) {
            try {
                feedback.setResult(FeedbackResult.valueOf(request.getResult().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Invalid result. Valid values: SELECTED, REJECTED, ON_HOLD, NEXT_ROUND");
            }
        }

        if (request.getRating() != 0) {
            feedback.setRating(request.getRating());
        }

        if (request.getComments() != null) {
            feedback.setComments(request.getComments());
        }

        if (request.getStrengths() != null) {
            feedback.setStrengths(request.getStrengths());
        }

        if (request.getImprovements() != null) {
            feedback.setImprovements(request.getImprovements());
        }

        return toResponse(feedbackRepository.save(feedback));
    }

    private PageResponse<FeedbackResponse> toPageResponse(Page<Feedback> page) {
        return PageResponse.<FeedbackResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private FeedbackResponse toResponse(Feedback f) {
        return FeedbackResponse.builder()
                .id(f.getId())
                .tokenId(f.getToken().getTokenId())
                .candidateId(f.getCandidate().getId())
                .candidateName(f.getCandidate().getFullName())
                .candidateEmail(f.getCandidate().getEmail())
                .applyingPosition(f.getCandidate().getApplyingPosition())
                .interviewerId(f.getInterviewer().getId())
                .interviewerName(f.getInterviewer().getUserName())
                .result(f.getResult().name())
                .rating(f.getRating())
                .comments(f.getComments())
                .strengths(f.getStrengths())
                .improvements(f.getImprovements())
                .submittedAt(f.getSubmittedAt())
                .build();
    }
}
