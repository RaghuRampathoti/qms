package com.qms.queue.repository;

import com.qms.queue.entity.QueueState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QueueStateRepository extends JpaRepository<QueueState, Long> {
}