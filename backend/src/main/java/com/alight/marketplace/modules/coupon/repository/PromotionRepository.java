package com.alight.marketplace.modules.coupon.repository;

import com.alight.marketplace.modules.coupon.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, UUID> {

    Optional<Promotion> findBySlug(String slug);

    @Query("SELECT p FROM Promotion p " +
           "WHERE p.isActive = true " +
           "AND p.startTime <= :now " +
           "AND (p.endTime IS NULL OR p.endTime >= :now) " +
           "ORDER BY p.displayOrder ASC, p.createdAt DESC")
    List<Promotion> findActivePromotions(@Param("now") Instant now);

    List<Promotion> findAllByOrderByDisplayOrderAscCreatedAtDesc();
}
