package com.qms.queue.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CandidateRegistrationResponse {
    private Long id;
    private String tokenId;
    private Integer queueNumber;
    private Integer candidatesAhead;
    private Integer estimatedWaitMinutes;
    private String status;
    private String message;
}