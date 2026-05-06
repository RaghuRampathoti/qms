package com.qms.queue.service;

import com.qms.queue.dto.response.QueueStateResponse;
import com.qms.queue.dto.response.TokenResponse;

public interface QueueService {
    TokenResponse callNext(Long cabinId);

    TokenResponse startInterview(String tokenId);

    TokenResponse completeInterview(String tokenId);

    TokenResponse markNoShow(String tokenId);

    TokenResponse cancelToken(String tokenId);

    QueueStateResponse getLiveState();

    TokenResponse getTokenByCandidate(Long candidateId);
}
