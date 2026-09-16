package com.alight.marketplace.modules.support.dto;

import com.alight.marketplace.modules.support.entity.TicketCategory;
import com.alight.marketplace.modules.support.entity.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTicketRequest {

    @NotNull(message = "Ticket category is required")
    private TicketCategory category;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Message is required")
    private String initialMessage;

    private TicketPriority priority;

    private UUID vendorId;

    private UUID orderId;

    private List<String> attachments;
}
