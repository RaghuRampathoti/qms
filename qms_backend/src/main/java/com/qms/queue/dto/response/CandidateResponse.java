package com.qms.queue.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CandidateResponse {
    private Long id;
    private String fullName;
    private String mobileNumber;
    private String email;
    private String currentLocation;
    private String applyingPosition;
    private String purposeOfVisit;
    private String qualification;
    private String yearOfPassOut;
    private String reference;
    private String photoUrl;
    private String resumeUrl;
    private String status;
    private String tokenId;
    private Integer queueNumber;
    private LocalDateTime interviewStartTime;
    private LocalDateTime interviewEndTime;
    private LocalDateTime createdAt;
}
