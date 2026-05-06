package com.qms.queue.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalCandidates;
    private long waiting;
    private long inProgress;
    private long completed;
    private long cancelled;
    private long activeCabins;
    private long totalCabins;
    private double averageInterviewMinutes;
    private long selectedCount;
    private long rejectedCount;
    private long onHoldCount;
    private long nextRoundCount;
}