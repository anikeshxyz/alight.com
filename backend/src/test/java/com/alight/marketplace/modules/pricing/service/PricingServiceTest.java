package com.alight.marketplace.modules.pricing.service;

import com.alight.marketplace.modules.currency.dto.CurrencyDto;
import com.alight.marketplace.modules.currency.service.CurrencyService;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationRequest;
import com.alight.marketplace.modules.pricing.dto.PriceCalculationResponse;
import com.alight.marketplace.modules.pricing.entity.ProductTierPrice;
import com.alight.marketplace.modules.pricing.repository.ProductTierPriceRepository;
import com.alight.marketplace.modules.product.entity.Product;
import com.alight.marketplace.modules.product.repository.ProductRepository;
import com.alight.marketplace.modules.product.repository.ProductVariantRepository;
import com.alight.marketplace.modules.tax.dto.TaxCalculationRequest;
import com.alight.marketplace.modules.tax.dto.TaxCalculationResponse;
import com.alight.marketplace.modules.tax.service.TaxCalculationService;
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
class PricingServiceTest {

    @Mock
    private ProductTierPriceRepository productTierPriceRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private CurrencyService currencyService;

    @Mock
    private TaxCalculationService taxCalculationService;

    @InjectMocks
    private PricingServiceImpl pricingService;

    private Product product;
    private ProductTierPrice tier10Plus;
    private CurrencyDto inrCurrency;
    private CurrencyDto usdCurrency;

    @BeforeEach
    void setUp() {
        UUID productId = UUID.randomUUID();
        product = Product.builder()
                .id(productId)
                .title("Modular SS304 Basket")
                .basePrice(new BigDecimal("4899.00"))
                .discountPrice(new BigDecimal("3999.00"))
                .build();

        tier10Plus = ProductTierPrice.builder()
                .id(UUID.randomUUID())
                .product(product)
                .minQuantity(10)
                .maxQuantity(49)
                .tierPrice(new BigDecimal("3599.00"))
                .discountPercent(new BigDecimal("10.00"))
                .build();

        inrCurrency = CurrencyDto.builder()
                .code("INR")
                .symbol("₹")
                .decimalPlaces(2)
                .exchangeRateToBase(BigDecimal.ONE)
                .build();

        usdCurrency = CurrencyDto.builder()
                .code("USD")
                .symbol("$")
                .decimalPlaces(2)
                .exchangeRateToBase(new BigDecimal("0.012000"))
                .build();
    }

    @Test
    @DisplayName("Should apply volume tier discount for quantity 15")
    void testTierPriceApplication() {
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(currencyService.getCurrencyByCode("INR")).thenReturn(inrCurrency);
        when(productTierPriceRepository.findMatchingTiers(eq(product.getId()), isNull(), eq(15)))
                .thenReturn(List.of(tier10Plus));
        when(currencyService.convertAmount(eq(new BigDecimal("3999.00")), eq("INR"), eq("INR")))
                .thenReturn(new BigDecimal("3999.00"));
        when(currencyService.convertAmount(eq(new BigDecimal("3599.00")), eq("INR"), eq("INR")))
                .thenReturn(new BigDecimal("3599.00"));

        TaxCalculationResponse dummyTax = TaxCalculationResponse.builder()
                .totalTaxAmount(new BigDecimal("8239.32"))
                .build();
        when(taxCalculationService.calculateTax(any(TaxCalculationRequest.class))).thenReturn(dummyTax);

        PriceCalculationRequest req = PriceCalculationRequest.builder()
                .productId(product.getId())
                .quantity(15)
                .targetCurrency("INR")
                .build();

        PriceCalculationResponse res = pricingService.calculatePrice(req);

        assertThat(res.getIsTierPriceApplied()).isTrue();
        assertThat(res.getEffectiveUnitPrice()).isEqualByComparingTo("3599.00");
        assertThat(res.getDiscountPercentage()).isEqualByComparingTo("10.00");
        assertThat(res.getSubtotal()).isEqualByComparingTo("53985.00"); // 15 * 3599
    }
}
