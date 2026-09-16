package com.alight.marketplace.modules.tax.service;

import com.alight.marketplace.modules.tax.dto.TaxCalculationRequest;
import com.alight.marketplace.modules.tax.dto.TaxCalculationResponse;
import com.alight.marketplace.modules.tax.entity.*;
import com.alight.marketplace.modules.tax.repository.TaxCategoryRepository;
import com.alight.marketplace.modules.tax.repository.TaxRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaxCalculationServiceTest {

    @Mock
    private TaxCategoryRepository taxCategoryRepository;

    @Mock
    private TaxRuleRepository taxRuleRepository;

    @InjectMocks
    private TaxCalculationServiceImpl taxCalculationService;

    private TaxCategory category18;
    private TaxRule intraRule18;
    private TaxRule interRule18;

    @BeforeEach
    void setUp() {
        category18 = TaxCategory.builder()
                .id(UUID.randomUUID())
                .code("GST_18_HW")
                .name("Architectural Hardware 18%")
                .hsnSacCode("8302")
                .isActive(true)
                .build();

        intraRule18 = TaxRule.builder()
                .id(UUID.randomUUID())
                .taxCategory(category18)
                .name("Hardware Intra-State GST")
                .isInterState(false)
                .totalRate(new BigDecimal("18.0000"))
                .isActive(true)
                .components(List.of(
                        TaxRateComponent.builder().componentType(TaxType.CGST).ratePercent(new BigDecimal("9.0000")).build(),
                        TaxRateComponent.builder().componentType(TaxType.SGST).ratePercent(new BigDecimal("9.0000")).build()
                ))
                .build();

        interRule18 = TaxRule.builder()
                .id(UUID.randomUUID())
                .taxCategory(category18)
                .name("Hardware Inter-State GST")
                .isInterState(true)
                .totalRate(new BigDecimal("18.0000"))
                .isActive(true)
                .components(List.of(
                        TaxRateComponent.builder().componentType(TaxType.IGST).ratePercent(new BigDecimal("18.0000")).build()
                ))
                .build();
    }

    @Test
    @DisplayName("Should calculate intra-state GST 18% (9% CGST + 9% SGST) for inclusive price")
    void testIntraStateGstInclusive() {
        when(taxCategoryRepository.findByCodeIgnoreCase("GST_18_HW")).thenReturn(Optional.of(category18));
        when(taxRuleRepository.findMatchingRules(eq(category18), eq(false))).thenReturn(List.of(intraRule18));

        TaxCalculationRequest req = TaxCalculationRequest.builder()
                .unitPrice(new BigDecimal("1180.00"))
                .quantity(1)
                .taxCategoryCode("GST_18_HW")
                .originCountry("IN")
                .originState("MH")
                .destinationCountry("IN")
                .destinationState("MH")
                .isTaxInclusive(true)
                .build();

        TaxCalculationResponse res = taxCalculationService.calculateTax(req);

        assertThat(res.getTaxableSubtotal()).isEqualByComparingTo("1000.00");
        assertThat(res.getTotalTaxAmount()).isEqualByComparingTo("180.00");
        assertThat(res.getGrandTotal()).isEqualByComparingTo("1180.00");
        assertThat(res.getIsInterState()).isFalse();
        assertThat(res.getComponents()).hasSize(2);
        assertThat(res.getComponents().get(0).getTaxAmount()).isEqualByComparingTo("90.00");
        assertThat(res.getComponents().get(1).getTaxAmount()).isEqualByComparingTo("90.00");
    }

    @Test
    @DisplayName("Should calculate inter-state GST 18% (18% IGST) for exclusive price")
    void testInterStateGstExclusive() {
        when(taxCategoryRepository.findByCodeIgnoreCase("GST_18_HW")).thenReturn(Optional.of(category18));
        when(taxRuleRepository.findMatchingRules(eq(category18), eq(true))).thenReturn(List.of(interRule18));

        TaxCalculationRequest req = TaxCalculationRequest.builder()
                .unitPrice(new BigDecimal("1000.00"))
                .quantity(2)
                .taxCategoryCode("GST_18_HW")
                .originCountry("IN")
                .originState("DL")
                .destinationCountry("IN")
                .destinationState("KA")
                .isTaxInclusive(false)
                .build();

        TaxCalculationResponse res = taxCalculationService.calculateTax(req);

        assertThat(res.getTaxableSubtotal()).isEqualByComparingTo("2000.00");
        assertThat(res.getTotalTaxAmount()).isEqualByComparingTo("360.00");
        assertThat(res.getGrandTotal()).isEqualByComparingTo("2360.00");
        assertThat(res.getIsInterState()).isTrue();
        assertThat(res.getComponents()).hasSize(1);
        assertThat(res.getComponents().get(0).getComponentType()).isEqualTo(TaxType.IGST);
        assertThat(res.getComponents().get(0).getTaxAmount()).isEqualByComparingTo("360.00");
    }
}
