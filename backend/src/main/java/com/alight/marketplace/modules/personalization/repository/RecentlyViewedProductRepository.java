package com.alight.marketplace.modules.personalization.repository;

import com.alight.marketplace.modules.personalization.entity.RecentlyViewedProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecentlyViewedProductRepository extends JpaRepository<RecentlyViewedProduct, UUID> {

    List<RecentlyViewedProduct> findTop10ByUserIdOrderByViewedAtDesc(UUID userId);

    Optional<RecentlyViewedProduct> findByUserIdAndProductId(UUID userId, UUID productId);

    @Modifying
    @Query("DELETE FROM RecentlyViewedProduct r WHERE r.user.id = :userId AND r.id NOT IN " +
           "(SELECT r2.id FROM RecentlyViewedProduct r2 WHERE r2.user.id = :userId ORDER BY r2.viewedAt DESC LIMIT 30)")
    void pruneOldViewsForUser(@Param("userId") UUID userId);
}
