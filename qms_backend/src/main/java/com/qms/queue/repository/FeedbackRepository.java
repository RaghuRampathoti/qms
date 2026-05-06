package com.qms.queue.repository;

import com.qms.queue.entity.Feedback;
import com.qms.queue.enums.FeedbackResult;
import com.qms.queue.entity.Token;
import com.qms.queue.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    Optional<Feedback> findByToken(Token token);

    boolean existsByToken(Token token);

    List<Feedback> findByInterviewer(User interviewer);

    Page<Feedback> findByInterviewer(User interviewer, Pageable pageable);

    Page<Feedback> findByResult(FeedbackResult result, Pageable pageable);

    @Query("SELECT f FROM Feedback f WHERE f.candidate.id = :candidateId")
    Optional<Feedback> findByCandidateId(@Param("candidateId") Long candidateId);

    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.result = :result")
    long countByResult(@Param("result") FeedbackResult result);
}