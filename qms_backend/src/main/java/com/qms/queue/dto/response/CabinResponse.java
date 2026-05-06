package com.qms.queue.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CabinResponse {
    private Long id;
    private String cabinName;
    private String status;
    private Integer panelSize;
    private java.util.List<UserResponse> interviewers;
    private Long currentCandidateId;
    private String currentCandidateName;
    private String currentCandidateToken;
    private String currentCandidateStatus;
    private LocalDateTime createdAt;
}
