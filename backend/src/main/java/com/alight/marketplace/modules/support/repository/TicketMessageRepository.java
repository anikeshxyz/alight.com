package com.alight.marketplace.modules.support.repository;

import com.alight.marketplace.modules.support.entity.TicketMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketMessageRepository extends JpaRepository<TicketMessage, UUID> {

    List<TicketMessage> findByTicketIdOrderByCreatedAtAsc(UUID ticketId);

    List<TicketMessage> findByTicketIdAndInternalNoteFalseOrderByCreatedAtAsc(UUID ticketId);
}
