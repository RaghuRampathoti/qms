package com.qms.queue.service;

public interface EmailTemplateService {

    String buildRegistrationEmail(String candidateName,
            String tokenId,
            int queuePosition,
            int candidatesAhead,
            int estimatedWait);

    String buildCallNowEmail(String candidateName,
            String tokenId,
            String cabinName);

    String buildYouAreNextEmail(String candidateName, String tokenId);
}
