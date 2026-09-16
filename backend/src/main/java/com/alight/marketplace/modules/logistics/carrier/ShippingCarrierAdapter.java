package com.alight.marketplace.modules.logistics.carrier;

import com.alight.marketplace.modules.logistics.dto.CreateShipmentRequest;
import com.alight.marketplace.modules.logistics.dto.RateCalculationRequest;
import com.alight.marketplace.modules.logistics.dto.ShippingRateDto;
import com.alight.marketplace.modules.logistics.entity.ShipmentPackage;

public interface ShippingCarrierAdapter {

    String getCarrierCode();

    ShippingRateDto calculateRate(RateCalculationRequest request);

    String generateAwbNumber(ShipmentPackage shipment);

    String generateShippingLabelUrl(ShipmentPackage shipment);

    boolean schedulePickup(ShipmentPackage shipment, String notes);

    boolean cancelShipment(ShipmentPackage shipment, String reason);
}
