package com.alight.marketplace.modules.support.dto;

import com.alight.marketplace.modules.support.entity.SenderType;
import com.alight.marketplace.modules.support.entity.TicketMessage;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketMessageResponse {

    private UUID id;
    private UUID ticketId;
    private UUID senderId;
    private SenderType senderType;
    private String senderName;
    private String messageText;
    private boolean internalNote;
    private List<String> attachments;
    private Instant createdAt;

    public static TicketMessageResponse fromEntity(TicketMessage message) {
        return TicketMessageResponse.builder()
                .id(message.getId())
                .ticketId(message.getTicket() != null ? message.getTicket().getId() : null)
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderType(message.getSenderType())
                .senderName(message.getSenderName())
                .messageText(message.getMessageText())
                .internalNote(message.isInternalNote())
                .attachments(message.getAttachments())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
