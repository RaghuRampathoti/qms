package com.qms.queue.repository;

import com.qms.queue.entity.Cabin;
import com.qms.queue.enums.CabinStatus;
import com.qms.queue.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CabinRepository extends JpaRepository<Cabin, Long> {

    List<Cabin> findByStatus(CabinStatus status);

    List<Cabin> findByStatusIn(List<CabinStatus> statuses);

    List<Cabin> findByInterviewersContaining(User interviewer);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Cabin c JOIN c.interviewers i WHERE i.id = :interviewerId")
    List<Cabin> findByInterviewerId(@org.springframework.data.repository.query.Param("interviewerId") Long interviewerId);

    boolean existsByCabinName(String cabinName);

    long countByStatus(CabinStatus status);
}
