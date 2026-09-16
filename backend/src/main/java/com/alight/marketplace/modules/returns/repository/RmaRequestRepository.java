package com.alight.marketplace.modules.returns.repository;

import com.alight.marketplace.modules.returns.entity.RmaRequest;
import com.alight.marketplace.modules.returns.entity.RmaStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RmaRequestRepository extends JpaRepository<RmaRequest, UUID> {

    Optional<RmaRequest> findByRmaNumber(String rmaNumber);

    java.util.List<RmaRequest> findByVendorOrderId(UUID vendorOrderId);

    Page<RmaRequest> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<RmaRequest> findByVendorIdOrderByCreatedAtDesc(UUID vendorId, Pageable pageable);

    Page<RmaRequest> findByVendorIdAndStatusOrderByCreatedAtDesc(UUID vendorId, RmaStatus status, Pageable pageable);

    Page<RmaRequest> findByStatusOrderByCreatedAtDesc(RmaStatus status, Pageable pageable);

    @Query("SELECT r FROM RmaRequest r " +
           "WHERE (:status IS NULL OR r.status = :status) " +
           "AND (:searchTerm IS NULL OR LOWER(r.rmaNumber) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) " +
           "     OR LOWER(r.order.orderNumber) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) " +
           "     OR LOWER(r.user.email) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')) " +
           "     OR LOWER(r.reverseAwbNumber) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')))")
    Page<RmaRequest> searchAllAdmin(@Param("status") RmaStatus status,
                                    @Param("searchTerm") String searchTerm,
                                    Pageable pageable);

    long countByStatus(RmaStatus status);

    long countByVendorIdAndStatus(UUID vendorId, RmaStatus status);
}
