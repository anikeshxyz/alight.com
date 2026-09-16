package com.alight.marketplace.modules.settlement.service.impl;

import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.settlement.entity.SettlementRateCard;
import com.alight.marketplace.modules.settlement.entity.SettlementTaxRule;
import com.alight.marketplace.modules.settlement.repository.SettlementRateCardRepository;
import com.alight.marketplace.modules.settlement.repository.SettlementTaxRuleRepository;
import com.alight.marketplace.modules.settlement.service.RateCardResolverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RateCardResolverServiceImpl implements RateCardResolverService {

    private final SettlementRateCardRepository rateCardRepository;
    private final SettlementTaxRuleRepository taxRuleRepository;

    @Override
    public SettlementRateCard resolveRateCard(VendorOrder vendorOrder) {
        if (vendorOrder.getVendor() != null) {
            UUID vendorId = vendorOrder.getVendor().getId();
            var vendorCard = rateCardRepository.findFirstByVendorIdAndIsActiveTrue(vendorId);
            if (vendorCard.isPresent()) {
                return vendorCard.get();
            }
        }

        // Check if order has items with categories
        if (vendorOrder.getItems() != null && !vendorOrder.getItems().isEmpty()) {
            var firstItem = vendorOrder.getItems().get(0);
            if (firstItem.getProduct() != null && firstItem.getProduct().getCategory() != null) {
                var catCard = rateCardRepository.findFirstByCategoryIdAndIsActiveTrue(firstItem.getProduct().getCategory().getId());
                if (catCard.isPresent()) {
                    return catCard.get();
                }
            }
        }

        // Fallback to default marketplace rate card or synthesized fallback
        return rateCardRepository.findFirstByRateCardCodeAndIsActiveTrue("RC-DEFAULT")
                .orElseGet(() -> SettlementRateCard.builder()
                        .rateCardCode("RC-DEFAULT")
                        .name("Standard Marketplace Rate Card")
                        .commissionRate(vendorOrder.getVendor() != null && vendorOrder.getVendor().getCommissionPercentage() != null
                                ? vendorOrder.getVendor().getCommissionPercentage()
                                : new BigDecimal("10.00"))
                        .logisticsFeeFixed(BigDecimal.ZERO)
                        .paymentGatewayFeePercent(BigDecimal.ZERO)
                        .marketplaceFixedFee(BigDecimal.ZERO)
                        .version("v1.0")
                        .build());
    }

    @Override
    public SettlementTaxRule resolveTaxRule(VendorOrder vendorOrder) {
        // Resolve GST TCS rule (or international equivalent)
        return taxRuleRepository.findFirstByTaxTypeAndJurisdictionAndIsActiveTrue("GST_TCS", "IN")
                .orElseGet(() -> SettlementTaxRule.builder()
                        .taxRuleCode("TAX-GST-TCS-01")
                        .name("Section 52 CGST Act - GST TCS (1%)")
                        .jurisdiction("IN")
                        .taxType("GST_TCS")
                        .ratePercentage(new BigDecimal("1.00"))
                        .calculationBase("NET_TAXABLE_SUPPLIES")
                        .version("v1.0")
                        .build());
    }
}
