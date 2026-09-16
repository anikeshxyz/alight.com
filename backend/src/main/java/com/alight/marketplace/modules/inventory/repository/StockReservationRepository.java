package com.alight.marketplace.modules.inventory.repository;

import com.alight.marketplace.modules.inventory.entity.ReservationStatus;
import com.alight.marketplace.modules.inventory.entity.StockReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockReservationRepository extends JpaRepository<StockReservation, UUID> {

    List<StockReservation> findByReservationToken(String reservationToken);

    Optional<StockReservation> findByIdAndReservationToken(UUID id, String reservationToken);

    @Query("SELECT sr FROM StockReservation sr WHERE sr.status = 'PENDING' AND sr.expiresAt < :now")
    List<StockReservation> findExpiredPendingReservations(@Param("now") Instant now);

    List<StockReservation> findByUserIdAndStatus(UUID userId, ReservationStatus status);
}
