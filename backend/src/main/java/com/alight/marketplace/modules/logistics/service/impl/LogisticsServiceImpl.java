package com.alight.marketplace.modules.logistics.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.logistics.carrier.ShippingCarrierAdapter;
import com.alight.marketplace.modules.logistics.carrier.ShippingCarrierFactory;
import com.alight.marketplace.modules.logistics.dto.*;
import com.alight.marketplace.modules.logistics.entity.*;
import com.alight.marketplace.modules.logistics.repository.*;
import com.alight.marketplace.modules.logistics.service.LogisticsService;
import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.entity.OrderItem;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogisticsServiceImpl implements LogisticsService {

    private final ShippingCarrierRepository carrierRepository;
    private final ShippingPincodeZoneRepository pincodeZoneRepository;
    private final ShippingRateRuleRepository rateRuleRepository;
    private final ShipmentPackageRepository shipmentRepository;
    private final ShipmentTrackingEventRepository trackingEventRepository;
    private final VendorOrderRepository vendorOrderRepository;
    private final VendorRepository vendorRepository;
    private final ShippingCarrierFactory carrierFactory;

    @Override
    @Transactional(readOnly = true)
    public ServiceabilityResponseDto checkServiceability(String destinationPincode, String originPincode) {
        if (destinationPincode == null || destinationPincode.isBlank()) {
            throw new BadRequestException("Destination pincode is required");
        }

        Optional<ShippingPincodeZone> zoneOpt = pincodeZoneRepository.findByPincode(destinationPincode.trim());
        if (zoneOpt.isPresent()) {
            ShippingPincodeZone zone = zoneOpt.get();
            LocalDate eta = LocalDate.now().plusDays(zone.getEstimatedTransitDays());
            return ServiceabilityResponseDto.builder()
                    .pincode(zone.getPincode())
                    .city(zone.getCity())
                    .state(zone.getState())
                    .zoneTier(zone.getZoneTier())
                    .isServiceable(true)
                    .isPrepaidServiceable(zone.isPrepaidServiceable())
                    .isCodServiceable(zone.isCodServiceable())
                    .isExpressServiceable(zone.isExpressServiceable())
                    .estimatedTransitDays(zone.getEstimatedTransitDays())
                    .estimatedDeliveryDate(eta.format(DateTimeFormatter.ISO_LOCAL_DATE))
                    .remoteSurcharge(zone.getRemoteSurcharge())
                    .primaryCourierPartner("Delhivery Express")
                    .build();
        }

        // Generic fallback for unlisted domestic pincodes
        LocalDate fallbackEta = LocalDate.now().plusDays(4);
        return ServiceabilityResponseDto.builder()
                .pincode(destinationPincode.trim())
                .city("Domestic Location")
                .state("India")
                .zoneTier("TIER_2")
                .isServiceable(true)
                .isPrepaidServiceable(true)
                .isCodServiceable(true)
                .isExpressServiceable(false)
                .estimatedTransitDays(4)
                .estimatedDeliveryDate(fallbackEta.format(DateTimeFormatter.ISO_LOCAL_DATE))
                .remoteSurcharge(BigDecimal.ZERO)
                .primaryCourierPartner("Delhivery Express")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShippingRateDto> calculateRates(RateCalculationRequest request) {
        List<ShippingCarrier> activeCarriers = carrierRepository.findByActiveTrueOrderByPriorityAsc();
        if (activeCarriers.isEmpty()) {
            ShippingCarrierAdapter mockAdapter = carrierFactory.getAdapter("MOCK_LOGISTICS");
            return List.of(mockAdapter.calculateRate(request));
        }

        List<ShippingRateDto> rates = new ArrayList<>();
        for (ShippingCarrier carrier : activeCarriers) {
            ShippingCarrierAdapter adapter = carrierFactory.getAdapter(carrier.getCarrierCode());
            ShippingRateDto rate = adapter.calculateRate(request);
            rates.add(rate);
        }
        return rates;
    }

    @Override
    @Transactional
    public ShipmentPackageDto createShipment(CreateShipmentRequest request, UUID vendorId) {
        VendorOrder vendorOrder = vendorOrderRepository.findById(request.getVendorOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor sub-order not found with ID: " + request.getVendorOrderId()));

        // Check if shipment already created
        Optional<ShipmentPackage> existing = shipmentRepository.findByVendorOrderId(vendorOrder.getId());
        if (existing.isPresent()) {
            return mapToDto(existing.get());
        }

        Vendor vendor = vendorOrder.getVendor();
        String carrierCode = request.getCarrierCode() != null && !request.getCarrierCode().isBlank()
                ? request.getCarrierCode().toUpperCase()
                : "DELHIVERY";

        ShippingCarrier carrier = carrierRepository.findByCarrierCode(carrierCode)
                .orElse(null);
        String carrierName = carrier != null ? carrier.getCarrierName() : "Delhivery Express";

        ShippingCarrierAdapter adapter = carrierFactory.getAdapter(carrierCode);

        // Calculate weights
        BigDecimal length = request.getPackageLengthCm() != null ? request.getPackageLengthCm() : new BigDecimal("15.00");
        BigDecimal width = request.getPackageWidthCm() != null ? request.getPackageWidthCm() : new BigDecimal("10.00");
        BigDecimal height = request.getPackageHeightCm() != null ? request.getPackageHeightCm() : new BigDecimal("5.00");
        BigDecimal deadWeight = request.getDeadWeightKg() != null ? request.getDeadWeightKg() : new BigDecimal("0.50");

        BigDecimal volWeight = length.multiply(width).multiply(height)
                .divide(new BigDecimal("5000.00"), 2, RoundingMode.HALF_UP);
        BigDecimal billedWeight = deadWeight.max(volWeight);

        // Addresses
        String originPin = "400001";
        String originCity = "Mumbai";
        String originState = "Maharashtra";

        String destPin = vendorOrder.getMasterOrder().getShippingAddress() != null
                ? vendorOrder.getMasterOrder().getShippingAddress().getPostalCode()
                : "110001";
        String destCity = vendorOrder.getMasterOrder().getShippingAddress() != null
                ? vendorOrder.getMasterOrder().getShippingAddress().getCity()
                : "New Delhi";
        String destState = vendorOrder.getMasterOrder().getShippingAddress() != null
                ? vendorOrder.getMasterOrder().getShippingAddress().getState()
                : "Delhi";

        ShipmentPackage shipment = ShipmentPackage.builder()
                .vendorOrder(vendorOrder)
                .masterOrder(vendorOrder.getMasterOrder())
                .vendor(vendor)
                .carrierCode(carrierCode)
                .carrierName(carrierName)
                .status(ShipmentStatus.MANIFESTED)
                .shippingMode(request.getShippingMode() != null ? request.getShippingMode() : "STANDARD")
                .packageLengthCm(length)
                .packageWidthCm(width)
                .packageHeightCm(height)
                .deadWeightKg(deadWeight)
                .volumetricWeightKg(volWeight)
                .billedWeightKg(billedWeight)
                .shippingCost(vendorOrder.getShippingAmount())
                .originPincode(originPin)
                .originCity(originCity)
                .originState(originState)
                .destinationPincode(destPin)
                .destinationCity(destCity)
                .destinationState(destState)
                .manifestId("MNF-" + originPin + "-" + System.currentTimeMillis() % 10000)
                .estimatedDeliveryAt(Instant.now().plusSeconds(3 * 24 * 3600))
                .deliveryConfirmationCode(String.valueOf((int)(Math.random() * 9000 + 1000)))
                .build();

        // Assign AWB
        String awb = adapter.generateAwbNumber(shipment);
        shipment.setAwbNumber(awb);
        shipment.setShippingLabelUrl("/api/v1/logistics/shipments/" + awb + "/label");

        ShipmentPackage saved = shipmentRepository.save(shipment);

        // Update Vendor Order
        vendorOrder.setTrackingNumber(awb);
        vendorOrder.setCourierName(carrierName);
        vendorOrder.setFulfillmentStatus(FulfillmentStatus.PROCESSING);
        vendorOrderRepository.save(vendorOrder);

        // Initial Manifest Checkpoint Event
        ShipmentTrackingEvent initialEvent = ShipmentTrackingEvent.builder()
                .shipment(saved)
                .eventStatus("MANIFESTED")
                .locationHub(originCity + " Dispatch Center")
                .city(originCity)
                .state(originState)
                .remarks("Shipment booked and AWB " + awb + " generated")
                .scannedBy("System Auto-Manifest")
                .eventTimestamp(Instant.now())
                .build();
        trackingEventRepository.save(initialEvent);

        log.info("Created shipment {} with AWB {} for sub-order {}", saved.getId(), awb, vendorOrder.getSubOrderNumber());
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentPackageDto getShipmentById(UUID shipmentId) {
        ShipmentPackage shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with ID: " + shipmentId));
        return mapToDto(shipment);
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentPackageDto getShipmentByAwb(String awbNumber) {
        ShipmentPackage shipment = shipmentRepository.findByAwbNumber(awbNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with AWB: " + awbNumber));
        return mapToDto(shipment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShipmentPackageDto> getShipmentsByMasterOrder(UUID masterOrderId) {
        return shipmentRepository.findByMasterOrderId(masterOrderId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentPackageDto getShipmentByVendorOrder(UUID vendorOrderId) {
        ShipmentPackage shipment = shipmentRepository.findByVendorOrderId(vendorOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found for vendor order: " + vendorOrderId));
        return mapToDto(shipment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShipmentPackageDto> getVendorShipments(UUID vendorId, Pageable pageable) {
        return shipmentRepository.findByVendorId(vendorId, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShipmentPackageDto> getAllShipments(ShipmentStatus status, Pageable pageable) {
        if (status != null) {
            return shipmentRepository.findByStatus(status, pageable).map(this::mapToDto);
        }
        return shipmentRepository.findAll(pageable).map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ShippingLabelDto generateShippingLabel(UUID shipmentId) {
        ShipmentPackage shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with ID: " + shipmentId));

        Vendor vendor = shipment.getVendor();
        VendorOrder vo = shipment.getVendorOrder();

        List<ShippingLabelDto.LabelItemDto> itemDtos = vo.getItems().stream()
                .map(item -> ShippingLabelDto.LabelItemDto.builder()
                        .productTitle(item.getProductTitle())
                        .variantSku(item.getSku())
                        .quantity(item.getQuantity() != null ? item.getQuantity() : 1)
                        .build())
                .collect(Collectors.toList());

        boolean isCod = "CASH_ON_DELIVERY".equalsIgnoreCase(vo.getMasterOrder().getPaymentMethod());

        return ShippingLabelDto.builder()
                .awbNumber(shipment.getAwbNumber())
                .barcodeBase64("||| | |||| | ||||| ||| || " + shipment.getAwbNumber())
                .qrCodePayload("https://alight.com/track?awb=" + shipment.getAwbNumber())
                .carrierName(shipment.getCarrierName())
                .shippingMode(shipment.getShippingMode())
                .subOrderNumber(vo.getSubOrderNumber())
                .masterOrderNumber(vo.getMasterOrder().getOrderNumber())
                .orderDate(vo.getCreatedAt())
                .senderName(vendor != null ? vendor.getStoreName() : "Alight Vendor")
                .senderAddressLine("Fulfillment Hub, Sector 18")
                .senderCity(shipment.getOriginCity())
                .senderState(shipment.getOriginState())
                .senderPincode(shipment.getOriginPincode())
                .senderPhone(vendor != null && vendor.getSupportPhone() != null ? vendor.getSupportPhone() : "9876543210")
                .senderGstNumber("07AAAAA0000A1Z5")
                .recipientName(vo.getMasterOrder().getShippingAddress() != null ? vo.getMasterOrder().getShippingAddress().getFullName() : "Customer")
                .recipientAddressLine(vo.getMasterOrder().getShippingAddress() != null ? vo.getMasterOrder().getShippingAddress().getAddressLine1() : "Customer Address")
                .recipientCity(shipment.getDestinationCity())
                .recipientState(shipment.getDestinationState())
                .recipientPincode(shipment.getDestinationPincode())
                .recipientPhone(vo.getMasterOrder().getShippingAddress() != null ? vo.getMasterOrder().getShippingAddress().getPhone() : "")
                .billedWeightKg(shipment.getBilledWeightKg())
                .declaredValue(vo.getGrandTotal())
                .paymentMethod(vo.getMasterOrder().getPaymentMethod())
                .isCod(isCod)
                .codAmountToCollect(isCod ? vo.getGrandTotal() : BigDecimal.ZERO)
                .routingCode("RT-" + shipment.getDestinationPincode().substring(0, 3) + "-HUB")
                .items(itemDtos)
                .build();
    }

    @Override
    @Transactional
    public ShipmentPackageDto scheduleDoorstepPickup(UUID shipmentId, String notes) {
        ShipmentPackage shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with ID: " + shipmentId));

        shipment.setPickupScheduledAt(Instant.now().plusSeconds(2 * 3600));
        ShipmentPackage saved = shipmentRepository.save(shipment);

        ShipmentTrackingEvent event = ShipmentTrackingEvent.builder()
                .shipment(saved)
                .eventStatus("PICKUP_SCHEDULED")
                .locationHub(shipment.getOriginCity() + " Hub")
                .city(shipment.getOriginCity())
                .state(shipment.getOriginState())
                .remarks(notes != null && !notes.isBlank() ? notes : "Doorstep courier pickup scheduled for today")
                .scannedBy("Carrier Dispatch Desk")
                .eventTimestamp(Instant.now())
                .build();
        trackingEventRepository.save(event);

        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public LogisticsOverviewDto getLogisticsOverview() {
        long total = shipmentRepository.count();
        long inTransit = shipmentRepository.countByStatus(ShipmentStatus.IN_TRANSIT);
        long outForDelivery = shipmentRepository.countByStatus(ShipmentStatus.OUT_FOR_DELIVERY);
        long delivered = shipmentRepository.countByStatus(ShipmentStatus.DELIVERED);
        long rto = shipmentRepository.countByStatus(ShipmentStatus.RTO_INITIATED) + shipmentRepository.countByStatus(ShipmentStatus.RTO_DELIVERED);
        long activeCarriers = carrierRepository.count();

        BigDecimal onTimeRate = total > 0
                ? BigDecimal.valueOf(Math.max(94.5, 100.0 - (rto * 100.0 / total))).setScale(1, RoundingMode.HALF_UP)
                : new BigDecimal("98.5");

        return LogisticsOverviewDto.builder()
                .totalShipments(total)
                .inTransitCount(inTransit)
                .outForDeliveryCount(outForDelivery)
                .deliveredCount(delivered)
                .rtoCount(rto)
                .onTimeDeliveryPercentage(onTimeRate)
                .averageTransitDays(2.4)
                .activeCarriersCount(activeCarriers)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShippingCarrier> getAllCarriers() {
        return carrierRepository.findAll();
    }

    private ShipmentPackageDto mapToDto(ShipmentPackage s) {
        return ShipmentPackageDto.builder()
                .id(s.getId())
                .awbNumber(s.getAwbNumber())
                .vendorOrderId(s.getVendorOrder() != null ? s.getVendorOrder().getId() : null)
                .subOrderNumber(s.getVendorOrder() != null ? s.getVendorOrder().getSubOrderNumber() : null)
                .masterOrderId(s.getMasterOrder() != null ? s.getMasterOrder().getId() : null)
                .masterOrderNumber(s.getMasterOrder() != null ? s.getMasterOrder().getOrderNumber() : null)
                .vendorId(s.getVendor() != null ? s.getVendor().getId() : null)
                .vendorStoreName(s.getVendor() != null ? s.getVendor().getStoreName() : null)
                .carrierCode(s.getCarrierCode())
                .carrierName(s.getCarrierName())
                .status(s.getStatus())
                .shippingMode(s.getShippingMode())
                .packageLengthCm(s.getPackageLengthCm())
                .packageWidthCm(s.getPackageWidthCm())
                .packageHeightCm(s.getPackageHeightCm())
                .deadWeightKg(s.getDeadWeightKg())
                .volumetricWeightKg(s.getVolumetricWeightKg())
                .billedWeightKg(s.getBilledWeightKg())
                .shippingCost(s.getShippingCost())
                .originPincode(s.getOriginPincode())
                .originCity(s.getOriginCity())
                .originState(s.getOriginState())
                .destinationPincode(s.getDestinationPincode())
                .destinationCity(s.getDestinationCity())
                .destinationState(s.getDestinationState())
                .shippingLabelUrl(s.getShippingLabelUrl())
                .manifestId(s.getManifestId())
                .pickupScheduledAt(s.getPickupScheduledAt())
                .pickedUpAt(s.getPickedUpAt())
                .estimatedDeliveryAt(s.getEstimatedDeliveryAt())
                .deliveredAt(s.getDeliveredAt())
                .deliveryConfirmationCode(s.getDeliveryConfirmationCode())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
