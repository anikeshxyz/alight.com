package com.alight.marketplace.modules.logistics.carrier;

import com.alight.marketplace.modules.logistics.dto.RateCalculationRequest;
import com.alight.marketplace.modules.logistics.dto.ShippingRateDto;
import com.alight.marketplace.modules.logistics.entity.ShipmentPackage;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
public class MockLogisticsAdapter implements ShippingCarrierAdapter {

    public static final String CARRIER_CODE = "MOCK_LOGISTICS";

    @Override
    public String getCarrierCode() {
        return CARRIER_CODE;
    }

    @Override
    public ShippingRateDto calculateRate(RateCalculationRequest request) {
        BigDecimal deadWeight = request.getWeightKg() != null ? request.getWeightKg() : new BigDecimal("0.50");
        BigDecimal length = request.getLengthCm() != null ? request.getLengthCm() : new BigDecimal("15.00");
        BigDecimal width = request.getWidthCm() != null ? request.getWidthCm() : new BigDecimal("10.00");
        BigDecimal height = request.getHeightCm() != null ? request.getHeightCm() : new BigDecimal("5.00");

        // Volumetric weight = (L * W * H) / 5000
        BigDecimal volWeight = length.multiply(width).multiply(height)
                .divide(new BigDecimal("5000.00"), 2, RoundingMode.HALF_UP);
        BigDecimal billedWeight = deadWeight.max(volWeight);

        boolean isExpress = "EXPRESS".equalsIgnoreCase(request.getShippingMode());
        BigDecimal baseRate = isExpress ? new BigDecimal("80.00") : new BigDecimal("45.00");
        BigDecimal incrementalRate = isExpress ? new BigDecimal("40.00") : new BigDecimal("25.00");

        // Calculate rate for weight increments beyond 0.5kg
        BigDecimal extraWeight = billedWeight.subtract(new BigDecimal("0.50")).max(BigDecimal.ZERO);
        BigDecimal extraUnits = extraWeight.divide(new BigDecimal("0.50"), 0, RoundingMode.CEILING);
        BigDecimal freight = baseRate.add(extraUnits.multiply(incrementalRate));

        BigDecimal fuelSurcharge = freight.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal insurance = new BigDecimal("5.00");
        BigDecimal gst = freight.add(fuelSurcharge).add(insurance).multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = freight.add(fuelSurcharge).add(insurance).add(gst).setScale(2, RoundingMode.HALF_UP);

        int days = isExpress ? 1 : 3;
        LocalDate eta = LocalDate.now().plusDays(days);

        return ShippingRateDto.builder()
                .carrierCode(CARRIER_CODE)
                .carrierName("Alight HyperLocal Fleet (Sandbox)")
                .shippingMode(isExpress ? "EXPRESS" : "STANDARD")
                .zoneTier("METRO")
                .deadWeightKg(deadWeight)
                .volumetricWeightKg(volWeight)
                .billedWeightKg(billedWeight)
                .baseFreightRate(freight)
                .fuelSurchargeAmount(fuelSurcharge)
                .remoteSurchargeAmount(BigDecimal.ZERO)
                .insuranceFee(insurance)
                .gstAmount(gst)
                .totalShippingCost(total)
                .estimatedTransitDays(days)
                .estimatedDeliveryDate(eta.format(DateTimeFormatter.ISO_LOCAL_DATE))
                .build();
    }

    @Override
    public String generateAwbNumber(ShipmentPackage shipment) {
        String cleanUuid = UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        return "ALIGHT-MOCK-" + cleanUuid;
    }

    @Override
    public String generateShippingLabelUrl(ShipmentPackage shipment) {
        return "/api/v1/logistics/shipments/" + (shipment.getId() != null ? shipment.getId() : "mock") + "/label";
    }

    @Override
    public boolean schedulePickup(ShipmentPackage shipment, String notes) {
        return true;
    }

    @Override
    public boolean cancelShipment(ShipmentPackage shipment, String reason) {
        return true;
    }
}
