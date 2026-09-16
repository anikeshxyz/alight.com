package com.alight.marketplace.modules.currency.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrencyDto {
    private UUID id;
    private String code;
    private String name;
    private String symbol;
    private Integer decimalPlaces;
    private Boolean isBase;
    private Boolean isActive;
    private BigDecimal exchangeRateToBase;
    private Instant updatedAt;
}
