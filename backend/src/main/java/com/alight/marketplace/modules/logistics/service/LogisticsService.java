package com.alight.marketplace.modules.logistics.service;

import com.alight.marketplace.modules.logistics.dto.*;
import com.alight.marketplace.modules.logistics.entity.ShipmentStatus;
import com.alight.marketplace.modules.logistics.entity.ShippingCarrier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface LogisticsService {

    ServiceabilityResponseDto checkServiceability(String destinationPincode, String originPincode);

    List<ShippingRateDto> calculateRates(RateCalculationRequest request);

    ShipmentPackageDto createShipment(CreateShipmentRequest request, UUID vendorId);

    ShipmentPackageDto getShipmentById(UUID shipmentId);

    ShipmentPackageDto getShipmentByAwb(String awbNumber);

    List<ShipmentPackageDto> getShipmentsByMasterOrder(UUID masterOrderId);

    ShipmentPackageDto getShipmentByVendorOrder(UUID vendorOrderId);

    Page<ShipmentPackageDto> getVendorShipments(UUID vendorId, Pageable pageable);

    Page<ShipmentPackageDto> getAllShipments(ShipmentStatus status, Pageable pageable);

    ShippingLabelDto generateShippingLabel(UUID shipmentId);

    ShipmentPackageDto scheduleDoorstepPickup(UUID shipmentId, String notes);

    LogisticsOverviewDto getLogisticsOverview();

    List<ShippingCarrier> getAllCarriers();
}
