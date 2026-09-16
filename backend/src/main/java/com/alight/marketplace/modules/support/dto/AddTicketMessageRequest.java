package com.alight.marketplace.modules.support.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddTicketMessageRequest {

    @NotBlank(message = "Message text is required")
    private String messageText;

    private boolean internalNote;

    private List<String> attachments;
}
