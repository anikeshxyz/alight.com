package com.alight.marketplace.modules.logistics.carrier;

import com.alight.marketplace.modules.logistics.dto.RateCalculationRequest;
import com.alight.marketplace.modules.logistics.dto.ShippingRateDto;
import com.alight.marketplace.modules.logistics.entity.ShipmentPackage;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
public class ShiprocketAdapter implements ShippingCarrierAdapter {

    public static final String CARRIER_CODE = "SHIPROCKET";

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

        BigDecimal volWeight = length.multiply(width).multiply(height)
                .divide(new BigDecimal("5000.00"), 2, RoundingMode.HALF_UP);
        BigDecimal billedWeight = deadWeight.max(volWeight);

        boolean isExpress = "EXPRESS".equalsIgnoreCase(request.getShippingMode());
        BigDecimal baseRate = isExpress ? new BigDecimal("85.00") : new BigDecimal("42.00");
        BigDecimal incrementalRate = isExpress ? new BigDecimal("45.00") : new BigDecimal("26.00");

        BigDecimal extraWeight = billedWeight.subtract(new BigDecimal("0.50")).max(BigDecimal.ZERO);
        BigDecimal extraUnits = extraWeight.divide(new BigDecimal("0.50"), 0, RoundingMode.CEILING);
        BigDecimal freight = baseRate.add(extraUnits.multiply(incrementalRate));

        BigDecimal fuelSurcharge = freight.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal insurance = new BigDecimal("5.00");
        BigDecimal gst = freight.add(fuelSurcharge).add(insurance).multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = freight.add(fuelSurcharge).add(insurance).add(gst).setScale(2, RoundingMode.HALF_UP);

        int days = isExpress ? 2 : 4;
        LocalDate eta = LocalDate.now().plusDays(days);

        return ShippingRateDto.builder()
                .carrierCode(CARRIER_CODE)
                .carrierName("Shiprocket Smart Aggregator")
                .shippingMode(isExpress ? "EXPRESS" : "STANDARD")
                .zoneTier("TIER_1")
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
        String num = String.valueOf(System.currentTimeMillis()).substring(2) + (int)(Math.random() * 90 + 10);
        return "SR-" + num;
    }

    @Override
    public String generateShippingLabelUrl(ShipmentPackage shipment) {
        return "/api/v1/logistics/shipments/" + shipment.getId() + "/label";
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
