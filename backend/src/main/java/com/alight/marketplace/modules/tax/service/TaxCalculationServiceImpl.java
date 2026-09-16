package com.alight.marketplace.modules.tax.service;

import com.alight.marketplace.modules.tax.dto.TaxCalculationRequest;
import com.alight.marketplace.modules.tax.dto.TaxCalculationResponse;
import com.alight.marketplace.modules.tax.dto.TaxComponentBreakdownDto;
import com.alight.marketplace.modules.tax.entity.TaxCategory;
import com.alight.marketplace.modules.tax.entity.TaxRateComponent;
import com.alight.marketplace.modules.tax.entity.TaxRule;
import com.alight.marketplace.modules.tax.entity.TaxType;
import com.alight.marketplace.modules.tax.repository.TaxCategoryRepository;
import com.alight.marketplace.modules.tax.repository.TaxRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaxCalculationServiceImpl implements TaxCalculationService {

    private final TaxCategoryRepository taxCategoryRepository;
    private final TaxRuleRepository taxRuleRepository;

    @Override
    @Transactional(readOnly = true)
    public TaxCalculationResponse calculateTax(TaxCalculationRequest request) {
        int quantity = (request.getQuantity() != null && request.getQuantity() > 0) ? request.getQuantity() : 1;
        BigDecimal unitPrice = request.getUnitPrice() != null ? request.getUnitPrice() : BigDecimal.ZERO;
        boolean isTaxInclusive = request.getIsTaxInclusive() == null || request.getIsTaxInclusive();

        // 1. Resolve Tax Category
        TaxCategory taxCategory = resolveTaxCategory(request);

        // 2. Determine Intra-State vs Inter-State
        boolean isInterState = determineInterState(request);

        // 3. Find Matching Tax Rule
        List<TaxRule> rules = Collections.emptyList();
        if (taxCategory != null && taxCategory.getId() != null) {
            try {
                rules = taxRuleRepository.findMatchingRules(taxCategory, isInterState);
            } catch (Exception e) {
                log.debug("Could not query tax rules: {}", e.getMessage());
            }
        }
        TaxRule matchedRule = rules.isEmpty() ? null : rules.get(0);

        BigDecimal totalRatePercent = matchedRule != null ? matchedRule.getTotalRate() : new BigDecimal("18.0000");
        String ruleName = matchedRule != null ? matchedRule.getName() : "Standard GST 18%";

        // 4. Calculate Tax Amounts
        BigDecimal taxableSubtotal;
        BigDecimal totalTaxAmount;
        BigDecimal grandTotal;

        if (isTaxInclusive) {
            BigDecimal grossTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
            BigDecimal divisor = BigDecimal.ONE.add(totalRatePercent.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP));
            taxableSubtotal = grossTotal.divide(divisor, 2, RoundingMode.HALF_UP);
            totalTaxAmount = grossTotal.subtract(taxableSubtotal).setScale(2, RoundingMode.HALF_UP);
            grandTotal = grossTotal.setScale(2, RoundingMode.HALF_UP);
        } else {
            taxableSubtotal = unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
            totalTaxAmount = taxableSubtotal.multiply(totalRatePercent.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP))
                    .setScale(2, RoundingMode.HALF_UP);
            grandTotal = taxableSubtotal.add(totalTaxAmount).setScale(2, RoundingMode.HALF_UP);
        }

        // 5. Calculate Component Breakdown
        List<TaxComponentBreakdownDto> componentBreakdowns = new ArrayList<>();
        if (matchedRule != null && !matchedRule.getComponents().isEmpty()) {
            for (TaxRateComponent comp : matchedRule.getComponents()) {
                BigDecimal compAmount;
                if (totalRatePercent.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal ratio = comp.getRatePercent().divide(totalRatePercent, 6, RoundingMode.HALF_UP);
                    compAmount = totalTaxAmount.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
                } else {
                    compAmount = BigDecimal.ZERO;
                }
                componentBreakdowns.add(TaxComponentBreakdownDto.builder()
                        .componentType(comp.getComponentType())
                        .ratePercent(comp.getRatePercent())
                        .taxAmount(compAmount)
                        .build());
            }
        } else {
            // Fallback default breakdown
            if (isInterState) {
                componentBreakdowns.add(TaxComponentBreakdownDto.builder()
                        .componentType(TaxType.IGST)
                        .ratePercent(totalRatePercent)
                        .taxAmount(totalTaxAmount)
                        .build());
            } else {
                BigDecimal halfRate = totalRatePercent.divide(new BigDecimal("2"), 4, RoundingMode.HALF_UP);
                BigDecimal halfAmount = totalTaxAmount.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
                componentBreakdowns.add(TaxComponentBreakdownDto.builder()
                        .componentType(TaxType.CGST)
                        .ratePercent(halfRate)
                        .taxAmount(halfAmount)
                        .build());
                componentBreakdowns.add(TaxComponentBreakdownDto.builder()
                        .componentType(TaxType.SGST)
                        .ratePercent(halfRate)
                        .taxAmount(totalTaxAmount.subtract(halfAmount))
                        .build());
            }
        }

        return TaxCalculationResponse.builder()
                .baseUnitPrice(unitPrice)
                .quantity(quantity)
                .taxableSubtotal(taxableSubtotal)
                .totalTaxRatePercent(totalRatePercent)
                .totalTaxAmount(totalTaxAmount)
                .grandTotal(grandTotal)
                .isInterState(isInterState)
                .taxRegime("GST")
                .ruleName(ruleName)
                .isTaxInclusive(isTaxInclusive)
                .components(componentBreakdowns)
                .build();
    }

    private TaxCategory resolveTaxCategory(TaxCalculationRequest request) {
        if (request.getTaxCategoryCode() != null && !request.getTaxCategoryCode().isBlank()) {
            Optional<TaxCategory> opt = taxCategoryRepository.findByCodeIgnoreCase(request.getTaxCategoryCode());
            if (opt.isPresent()) return opt.get();
        }
        if (request.getHsnSacCode() != null && !request.getHsnSacCode().isBlank()) {
            Optional<TaxCategory> opt = taxCategoryRepository.findByHsnSacCode(request.getHsnSacCode());
            if (opt.isPresent()) return opt.get();
        }
        // Default to GST 18% Hardware
        return taxCategoryRepository.findByCodeIgnoreCase("GST_18_HW")
                .orElseGet(() -> taxCategoryRepository.findAll().stream().findFirst()
                        .orElse(TaxCategory.builder()
                                .code("GST_18_DEFAULT")
                                .name("Standard GST 18%")
                                .hsnSacCode("8302")
                                .isActive(true)
                                .build()));
    }

    private boolean determineInterState(TaxCalculationRequest request) {
        String originCountry = request.getOriginCountry() != null ? request.getOriginCountry().trim() : "IN";
        String destCountry = request.getDestinationCountry() != null ? request.getDestinationCountry().trim() : "IN";

        // Export/International
        if (!originCountry.equalsIgnoreCase(destCountry)) {
            return true;
        }

        String originState = request.getOriginState() != null ? request.getOriginState().trim().toLowerCase() : "";
        String destState = request.getDestinationState() != null ? request.getDestinationState().trim().toLowerCase() : "";

        if (originState.isEmpty() || destState.isEmpty()) {
            // Default to intra-state if states not specified
            return false;
        }

        // Compare state codes / names
        return !originState.equals(destState);
    }
}
