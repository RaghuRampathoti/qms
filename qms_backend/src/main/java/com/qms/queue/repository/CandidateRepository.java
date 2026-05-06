package com.qms.queue.repository;

import com.qms.queue.entity.Candidate;
import com.qms.queue.enums.CandidateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    boolean existsByMobileNumberAndCreatedAtAfter(String mobileNumber, LocalDateTime startOfDay);
 
    boolean existsByEmailAndCreatedAtAfter(String email, LocalDateTime startOfDay);
 
    long countByCreatedAtAfter(LocalDateTime startOfDay);
 
    long countByStatusAndCreatedAtAfter(CandidateStatus status, LocalDateTime startOfDay);
 
    Optional<Candidate> findByTokenId(String tokenId);

    List<Candidate> findByStatusOrderByQueueNumberAsc(CandidateStatus status);

    Page<Candidate> findByStatus(CandidateStatus status, Pageable pageable);

    List<Candidate> findByStatus(CandidateStatus status);

    Page<Candidate> findAll(Pageable pageable);

    long countByStatus(CandidateStatus status);

    Page<Candidate> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<Candidate> findByStatusAndCreatedAtBetween(CandidateStatus status, LocalDateTime from, LocalDateTime to, Pageable pageable);

    @Query("SELECT c FROM Candidate c WHERE c.createdAt BETWEEN :from AND :to ORDER BY c.createdAt ASC")
    List<Candidate> findByCreatedAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT c FROM Candidate c WHERE c.status = :status AND c.createdAt BETWEEN :from AND :to")
    List<Candidate> findByStatusAndDateRange(
            @Param("status") CandidateStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (c.interview_end_time - c.interview_start_time)) / 60) " +
            "FROM candidates c WHERE c.status = 'COMPLETED' " +
            "AND c.interview_start_time IS NOT NULL AND c.interview_end_time IS NOT NULL", nativeQuery = true)
    Double findAverageInterviewDurationMinutes();
}
