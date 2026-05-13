package com.qms.queue.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FeedbackResponse {
    private Long id;
    private String tokenId;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private String applyingPosition;
    private Long interviewerId;
    private String interviewerName;
    private String result;
    private Integer rating;
    private String comments;
    private String strengths;
    private String improvements;
    private boolean nextRoundScheduled;
    private String nextRoundDate;
    private String nextRoundTime;
    private String nextRoundVenue;
    private LocalDateTime submittedAt;
}
