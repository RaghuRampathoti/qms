package com.qms.queue.repository;

import com.qms.queue.entity.Token;
import com.qms.queue.enums.TokenStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TokenRepository extends JpaRepository<Token, Long> {

    Optional<Token> findByTokenId(String tokenId);

    Optional<Token> findByCandidateId(Long candidateId);

    List<Token> findByStatusOrderByQueuePositionAsc(TokenStatus status);

    Optional<Token> findFirstByStatusOrderByQueuePositionAsc(TokenStatus status);

    long countByStatus(TokenStatus status);

    @Modifying
    @Query("UPDATE Token t SET t.queuePosition = t.queuePosition - 1 " +
            "WHERE t.status = 'WAITING' AND t.queuePosition > :position")
    void decrementQueuePositionsAfter(@Param("position") int position);

    @Query("SELECT COALESCE(MAX(t.sequence), 0) FROM Token t WHERE t.createdAt >= :startOfDay")
    long findMaxSequenceToday(@Param("startOfDay") java.time.LocalDateTime startOfDay);
}
