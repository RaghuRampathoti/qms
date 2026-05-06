package com.qms.queue.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QueueStateResponse {
    private Integer totalRegistered;
    private Integer totalWaiting;
    private Integer totalInProgress;
    private Integer totalCompleted;
    private String lastAnnouncement;
    private List<CabinResponse> activeCabins;
    private List<TokenResponse> waitingQueue;
}
