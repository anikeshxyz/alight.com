package com.alight.marketplace.modules.returns.dto;

import com.alight.marketplace.modules.returns.entity.ActorType;
import com.alight.marketplace.modules.returns.entity.RmaStatus;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmaEventDto {
    private UUID id;
    private RmaStatus status;
    private ActorType actorType;
    private String actorId;
    private String title;
    private String description;
    private Instant createdAt;
}
