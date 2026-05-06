package com.qms.queue.dto.request;

import lombok.Data;

@Data
public class UpdateCandidateRequest {
    private String fullName;
    private String email;
    private String mobileNumber;
    private String currentLocation;
    private String applyingPosition;
    private String purposeOfVisit;
    private String status;
}
