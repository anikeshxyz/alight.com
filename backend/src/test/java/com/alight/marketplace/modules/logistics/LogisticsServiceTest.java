package com.alight.marketplace.modules.logistics;

import com.alight.marketplace.modules.logistics.carrier.ShippingCarrierAdapter;
import com.alight.marketplace.modules.logistics.carrier.ShippingCarrierFactory;
import com.alight.marketplace.modules.logistics.dto.*;
import com.alight.marketplace.modules.logistics.entity.*;
import com.alight.marketplace.modules.logistics.repository.*;
import com.alight.marketplace.modules.logistics.service.impl.LogisticsServiceImpl;
import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LogisticsServiceTest {

    @Mock
    private ShippingCarrierRepository carrierRepository;
    @Mock
    private ShippingPincodeZoneRepository pincodeZoneRepository;
    @Mock
    private ShippingRateRuleRepository rateRuleRepository;
    @Mock
    private ShipmentPackageRepository shipmentRepository;
    @Mock
    private ShipmentTrackingEventRepository trackingEventRepository;
    @Mock
    private VendorOrderRepository vendorOrderRepository;
    @Mock
    private VendorRepository vendorRepository;
    @Mock
    private ShippingCarrierFactory carrierFactory;

    private LogisticsServiceImpl logisticsService;

    private ShippingPincodeZone originZone;
    private ShippingPincodeZone destZone;
    private ShippingCarrier carrier;
    private ShippingRateRule rateRule;

    @BeforeEach
    void setUp() {
        logisticsService = new LogisticsServiceImpl(
                carrierRepository,
                pincodeZoneRepository,
                rateRuleRepository,
                shipmentRepository,
                trackingEventRepository,
                vendorOrderRepository,
                vendorRepository,
                carrierFactory
        );
        originZone = ShippingPincodeZone.builder()
                .pincode("400001")
                .city("Mumbai")
                .state("Maharashtra")
                .zoneTier("METRO")
                .prepaidServiceable(true)
                .codServiceable(true)
                .build();

        destZone = ShippingPincodeZone.builder()
                .pincode("110001")
                .city("New Delhi")
                .state("Delhi")
                .zoneTier("METRO")
                .prepaidServiceable(true)
                .codServiceable(true)
                .build();

        carrier = ShippingCarrier.builder()
                .carrierCode("DELHIVERY")
                .carrierName("Delhivery Logistics")
                .active(true)
                .build();

        rateRule = ShippingRateRule.builder()
                .zoneTier("METRO")
                .shippingMode("STANDARD")
                .baseWeightKg(new BigDecimal("0.50"))
                .baseRate(new BigDecimal("50.00"))
                .incrementalWeightKg(new BigDecimal("0.50"))
                .incrementalRate(new BigDecimal("35.00"))
                .fuelSurchargePercent(new BigDecimal("5.00"))
                .insuranceFeePercent(new BigDecimal("0.50"))
                .build();
    }

    @Test
    @DisplayName("Check Pincode Serviceability - Returns zone details and serviceable status")
    void testCheckPincodeServiceability() {
        when(pincodeZoneRepository.findByPincode("110001")).thenReturn(Optional.of(destZone));

        ServiceabilityResponseDto result = logisticsService.checkServiceability("110001", "400001");

        assertThat(result).isNotNull();
        assertThat(result.isServiceable()).isTrue();
        assertThat(result.getCity()).isEqualTo("New Delhi");
    }

    @Test
    @DisplayName("Calculate Shipping Rates - Returns active carrier quotes")
    void testCalculateShippingRates() {
        when(carrierRepository.findByActiveTrueOrderByPriorityAsc()).thenReturn(List.of(carrier));
        
        ShippingCarrierAdapter mockAdapter = mock(ShippingCarrierAdapter.class);
        ShippingRateDto rateDto = ShippingRateDto.builder()
                .carrierCode("DELHIVERY")
                .carrierName("Delhivery Logistics")
                .shippingMode("STANDARD")
                .billedWeightKg(new BigDecimal("2.00"))
                .totalShippingCost(new BigDecimal("120.00"))
                .build();
        when(mockAdapter.calculateRate(any())).thenReturn(rateDto);
        when(carrierFactory.getAdapter("DELHIVERY")).thenReturn(mockAdapter);

        RateCalculationRequest req = RateCalculationRequest.builder()
                .originPincode("400001")
                .destinationPincode("110001")
                .weightKg(new BigDecimal("0.50"))
                .lengthCm(new BigDecimal("20.00"))
                .widthCm(new BigDecimal("20.00"))
                .heightCm(new BigDecimal("25.00")) // Volumetric: 20*20*25/5000 = 2.0 kg
                .build();

        List<ShippingRateDto> rates = logisticsService.calculateRates(req);

        assertThat(rates).isNotEmpty();
        ShippingRateDto standardRate = rates.get(0);
        assertThat(standardRate.getBilledWeightKg()).isEqualByComparingTo(new BigDecimal("2.00"));
        assertThat(standardRate.getCarrierCode()).isEqualTo("DELHIVERY");
    }

    @Test
    @DisplayName("Get Shipment by AWB - Returns package details")
    void testGetShipmentByAwb() {
        Order masterOrder = Order.builder().orderNumber("ORD-9999").build();
        masterOrder.setId(UUID.randomUUID());

        VendorOrder vendorOrder = VendorOrder.builder().subOrderNumber("VORD-9999-1").build();
        vendorOrder.setId(UUID.randomUUID());

        Vendor vendor = Vendor.builder().storeName("Tech Store").build();
        vendor.setId(UUID.randomUUID());

        ShipmentPackage pkg = ShipmentPackage.builder()
                .awbNumber("AWB-TEST-12345")
                .carrierCode("DELHIVERY")
                .carrierName("Delhivery Logistics")
                .status(ShipmentStatus.IN_TRANSIT)
                .destinationCity("New Delhi")
                .destinationPincode("110001")
                .originCity("Mumbai")
                .originPincode("400001")
                .masterOrder(masterOrder)
                .vendorOrder(vendorOrder)
                .vendor(vendor)
                .build();

        when(shipmentRepository.findByAwbNumber("AWB-TEST-12345")).thenReturn(Optional.of(pkg));

        ShipmentPackageDto result = logisticsService.getShipmentByAwb("AWB-TEST-12345");

        assertThat(result).isNotNull();
        assertThat(result.getAwbNumber()).isEqualTo("AWB-TEST-12345");
        assertThat(result.getStatus()).isEqualTo(ShipmentStatus.IN_TRANSIT);
    }
}
