package com.alight.marketplace.modules.support.repository;

import com.alight.marketplace.modules.support.entity.SupportTicket;
import com.alight.marketplace.modules.support.entity.TicketCategory;
import com.alight.marketplace.modules.support.entity.TicketPriority;
import com.alight.marketplace.modules.support.entity.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {

    Optional<SupportTicket> findByTicketNumber(String ticketNumber);

    Page<SupportTicket> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserIdAndStatusIn(UUID userId, java.util.List<TicketStatus> statuses);

    Page<SupportTicket> findByVendorIdOrderByCreatedAtDesc(UUID vendorId, Pageable pageable);

    Page<SupportTicket> findByStatusOrderByCreatedAtDesc(TicketStatus status, Pageable pageable);

    @Query("SELECT COUNT(t) FROM SupportTicket t WHERE t.status IN ('OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'WAITING_ON_VENDOR')")
    long countActiveTickets();

    @Query("SELECT COUNT(t) FROM SupportTicket t WHERE t.priority = 'URGENT' AND t.status NOT IN ('RESOLVED', 'CLOSED')")
    long countUrgentTickets();

    long countByVendorIdAndStatusNotIn(UUID vendorId, java.util.Collection<TicketStatus> statuses);

    long countByUserIdAndStatusNotIn(UUID userId, java.util.Collection<TicketStatus> statuses);
}
