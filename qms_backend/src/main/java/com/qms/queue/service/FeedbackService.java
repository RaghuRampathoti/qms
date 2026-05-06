package com.qms.queue.service;

import com.qms.queue.dto.common.PageResponse;
import com.qms.queue.dto.request.FeedbackRequest;
import com.qms.queue.dto.response.FeedbackResponse;

public interface FeedbackService {
    FeedbackResponse submit(String tokenId, FeedbackRequest request, String interviewerUsername);

    FeedbackResponse getByTokenId(String tokenId);

    FeedbackResponse getByCandidateId(Long candidateId);

    PageResponse<FeedbackResponse> getAll(int page, int size);

    PageResponse<FeedbackResponse> getByResult(String result, int page, int size);

    PageResponse<FeedbackResponse> getByInterviewer(String username, int page, int size);
    
    FeedbackResponse update(Long id, FeedbackRequest request, String interviewerUsername);
}
