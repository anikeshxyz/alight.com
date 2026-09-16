package com.alight.marketplace.modules.returns.repository;

import com.alight.marketplace.modules.returns.entity.RmaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RmaItemRepository extends JpaRepository<RmaItem, UUID> {
    List<RmaItem> findByRmaId(UUID rmaId);
}
