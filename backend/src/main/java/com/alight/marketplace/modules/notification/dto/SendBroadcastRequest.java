package com.alight.marketplace.modules.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendBroadcastRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    private String targetRole; // ALL, ROLE_CUSTOMER, ROLE_VENDOR

    private String actionUrl;
}
