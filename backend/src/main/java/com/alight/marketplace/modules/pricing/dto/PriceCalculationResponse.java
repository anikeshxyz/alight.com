package com.alight.marketplace.modules.pricing.dto;

import com.alight.marketplace.modules.tax.dto.TaxCalculationResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceCalculationResponse {
    private UUID productId;
    private UUID variantId;
    private Integer quantity;
    private String currency;
    private String currencySymbol;

    // Unit prices in Target Currency
    private BigDecimal regularUnitPrice;
    private BigDecimal effectiveUnitPrice;
    private BigDecimal discountPercentage;
    private Boolean isTierPriceApplied;

    // Totals in Target Currency
    private BigDecimal subtotal;
    private BigDecimal totalDiscountAmount;
    private BigDecimal totalTaxAmount;
    private BigDecimal grandTotal;
    private String formattedGrandTotal;

    private TaxCalculationResponse taxDetails;
    private List<ProductTierPriceDto> availableTiers;
}
