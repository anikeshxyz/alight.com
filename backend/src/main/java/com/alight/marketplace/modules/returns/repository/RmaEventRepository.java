package com.alight.marketplace.modules.returns.repository;

import com.alight.marketplace.modules.returns.entity.RmaEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RmaEventRepository extends JpaRepository<RmaEvent, UUID> {
    List<RmaEvent> findByRmaIdOrderByCreatedAtAsc(UUID rmaId);
}
