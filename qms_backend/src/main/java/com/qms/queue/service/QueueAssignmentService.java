package com.qms.queue.service;

import com.qms.queue.entity.Cabin;
import com.qms.queue.entity.Candidate;
import com.qms.queue.entity.Token;
import com.qms.queue.enums.CabinStatus;
import com.qms.queue.enums.CandidateStatus;
import com.qms.queue.enums.TokenStatus;
import com.qms.queue.repository.CabinRepository;
import com.qms.queue.repository.CandidateRepository;
import com.qms.queue.repository.TokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QueueAssignmentService {

    private final CabinRepository cabinRepository;
    private final CandidateRepository candidateRepository;
    private final TokenRepository tokenRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void tryAutoAssign(Candidate candidate, Token token) {
        // Disabled auto-assignment as per user request. 
        // Candidates stay in WAITING status until manually called.
        log.debug("Auto-assignment disabled. Candidate {} added to queue.", candidate.getFullName());
    }
 
    @Transactional
    public Token callNextForCabin(Cabin cabin) {
        Token nextToken = tokenRepository.findFirstByStatusOrderByQueuePositionAsc(TokenStatus.WAITING)
                .orElse(null);
 
        if (nextToken == null) {
            log.warn("No WAITING tokens available for cabin {}", cabin.getCabinName());
            return null;
        }
 
        assignToCabin(nextToken, cabin, nextToken.getCandidate());
        return nextToken;
    }
 
    @Transactional
    public void handleCabinFreed(Cabin cabin) {
        cabin.setCurrentCandidate(null);
        cabin.setStatus(CabinStatus.ACTIVE);
        cabinRepository.save(cabin);
 
        // Removed auto-assignment logic. Interviewers must manually call the next candidate.
 
        recalculateQueuePositions();
        broadcastQueueUpdate();
    }

    @Transactional
    public void recalculateQueuePositions() {
        List<Token> waitingTokens = tokenRepository.findByStatusOrderByQueuePositionAsc(TokenStatus.WAITING);
        for (int i = 0; i < waitingTokens.size(); i++) {
            Token t = waitingTokens.get(i);
            int newPos = i + 1;
            if (t.getQueuePosition() != newPos) {
                t.setQueuePosition(newPos);
                Candidate c = t.getCandidate();
                c.setQueueNumber(newPos);
                tokenRepository.save(t);
                candidateRepository.save(c);
            }
        }
    }

    private void assignToCabin(Token token, Cabin cabin, Candidate candidate) {
        token.setStatus(TokenStatus.CALLED);
        token.setCalledAt(LocalDateTime.now());
        token.setCabin(cabin);
        tokenRepository.save(token);

        candidate.setStatus(CandidateStatus.CALLED);
        candidateRepository.save(candidate);

        cabin.setCurrentCandidate(candidate);
        cabin.setStatus(CabinStatus.BUSY);
        cabinRepository.save(cabin);

        log.info("Assigned token {} to cabin {}", token.getTokenId(), cabin.getCabinName());
        broadcastQueueUpdate();
    }

    public void broadcastQueueUpdate() {
        messagingTemplate.convertAndSend("/topic/queue", "QUEUE_UPDATED");
    }
}
