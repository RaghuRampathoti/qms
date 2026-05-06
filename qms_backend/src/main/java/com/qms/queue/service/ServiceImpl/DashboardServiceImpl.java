package com.qms.queue.service.ServiceImpl;

import com.qms.queue.dto.response.DashboardStatsResponse;
import com.qms.queue.enums.CabinStatus;
import com.qms.queue.enums.CandidateStatus;
import com.qms.queue.enums.FeedbackResult;
import com.qms.queue.repository.CabinRepository;
import com.qms.queue.repository.CandidateRepository;
import com.qms.queue.repository.FeedbackRepository;
import com.qms.queue.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final CandidateRepository candidateRepository;
    private final CabinRepository cabinRepository;
    private final FeedbackRepository feedbackRepository;

    @Override
    public DashboardStatsResponse getStats() {
        Double avg = candidateRepository.findAverageInterviewDurationMinutes();

        return DashboardStatsResponse.builder()
                .totalCandidates(candidateRepository.count())
                .waiting(candidateRepository.countByStatus(CandidateStatus.WAITING))
                .inProgress(candidateRepository.countByStatus(CandidateStatus.IN_PROGRESS))
                .completed(candidateRepository.countByStatus(CandidateStatus.COMPLETED))
                .cancelled(candidateRepository.countByStatus(CandidateStatus.CANCELLED))
                .activeCabins(cabinRepository.countByStatus(CabinStatus.ACTIVE)
                        + cabinRepository.countByStatus(CabinStatus.BUSY))
                .totalCabins(cabinRepository.count())
                .averageInterviewMinutes(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .selectedCount(feedbackRepository.countByResult(FeedbackResult.SELECTED))
                .rejectedCount(feedbackRepository.countByResult(FeedbackResult.REJECTED))
                .onHoldCount(feedbackRepository.countByResult(FeedbackResult.ON_HOLD))
                .nextRoundCount(feedbackRepository.countByResult(FeedbackResult.NEXT_ROUND))
                .build();
    }
}
