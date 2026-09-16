package com.alight.marketplace.modules.returns;

import com.alight.marketplace.modules.inventory.service.InventoryService;
import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.OrderItem;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.OrderItemRepository;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.returns.dto.*;
import com.alight.marketplace.modules.returns.entity.*;
import com.alight.marketplace.modules.returns.repository.RmaEventRepository;
import com.alight.marketplace.modules.returns.repository.RmaItemRepository;
import com.alight.marketplace.modules.returns.repository.RmaRequestRepository;
import com.alight.marketplace.modules.returns.service.RmaPolicyService;
import com.alight.marketplace.modules.returns.service.impl.RmaServiceImpl;
import com.alight.marketplace.modules.settlement.service.SettlementService;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import com.alight.marketplace.modules.vendor.repository.VendorRepository;
import com.alight.marketplace.modules.inventory.repository.WarehouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RmaServiceTest {

    @Mock
    private RmaRequestRepository rmaRepository;
    @Mock
    private RmaItemRepository rmaItemRepository;
    @Mock
    private RmaEventRepository rmaEventRepository;
    @Mock
    private RmaPolicyService rmaPolicyService;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private VendorOrderRepository vendorOrderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VendorRepository vendorRepository;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private InventoryService inventoryService;
    @Mock
    private SettlementService settlementService;

    @InjectMocks
    private RmaServiceImpl rmaService;

    private User mockUser;
    private Vendor mockVendor;
    private Order mockOrder;
    private VendorOrder mockVendorOrder;
    private OrderItem mockOrderItem;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(UUID.randomUUID())
                .email("customer@alight.com")
                .firstName("Rahul")
                .lastName("Verma")
                .build();

        mockVendor = Vendor.builder()
                .id(UUID.randomUUID())
                .storeName("Alight Atelier")
                .build();

        mockOrder = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-2026-9041")
                .user(mockUser)
                .customerEmail("customer@alight.com")
                .build();

        mockVendorOrder = VendorOrder.builder()
                .id(UUID.randomUUID())
                .masterOrder(mockOrder)
                .vendor(mockVendor)
                .subOrderNumber("ORD-2026-9041-V1")
                .build();

        mockOrderItem = OrderItem.builder()
                .id(UUID.randomUUID())
                .vendorOrder(mockVendorOrder)
                .productTitle("Knurled Brass Handle")
                .sku("ALT-HND-002")
                .quantity(2)
                .unitPrice(new BigDecimal("899.00"))
                .taxAmount(new BigDecimal("323.64"))
                .build();
    }

    @Test
    void testCreateRmaRequest_Success() {
        CreateRmaRequestDto requestDto = CreateRmaRequestDto.builder()
                .orderId(mockOrder.getId())
                .vendorOrderId(mockVendorOrder.getId())
                .returnType(ReturnType.REFUND)
                .reason(ReturnReason.SIZE_FIT_ISSUE)
                .customerComments("Hole pitch incompatible")
                .items(List.of(RmaItemInputDto.builder()
                        .orderItemId(mockOrderItem.getId())
                        .productId(UUID.randomUUID())
                        .quantity(2)
                        .build()))
                .build();

        when(userRepository.findByEmail("customer@alight.com")).thenReturn(Optional.of(mockUser));
        when(orderRepository.findById(mockOrder.getId())).thenReturn(Optional.of(mockOrder));
        when(vendorOrderRepository.findById(mockVendorOrder.getId())).thenReturn(Optional.of(mockVendorOrder));
        when(orderItemRepository.findByVendorOrderId(mockVendorOrder.getId())).thenReturn(List.of(mockOrderItem));
        when(rmaPolicyService.getEffectivePolicy(any(), any())).thenReturn(RmaPolicyDto.builder().isReturnable(true).build());
        when(rmaRepository.save(any(RmaRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RmaResponseDto response = rmaService.createRmaRequest("customer@alight.com", requestDto);

        assertNotNull(response);
        assertTrue(response.getRmaNumber().startsWith("RMA-"));
        assertEquals(RmaStatus.REQUESTED, response.getStatus());
        assertEquals(ReturnType.REFUND, response.getReturnType());
        assertEquals(ReturnReason.SIZE_FIT_ISSUE, response.getReason());
        verify(rmaRepository, times(1)).save(any(RmaRequest.class));
    }

    @Test
    void testReviewRmaByVendor_Approve() {
        UUID rmaId = UUID.randomUUID();
        RmaRequest existingRma = RmaRequest.builder()
                .id(rmaId)
                .rmaNumber("RMA-2026-7001")
                .order(mockOrder)
                .vendorOrder(mockVendorOrder)
                .user(mockUser)
                .vendor(mockVendor)
                .status(RmaStatus.REQUESTED)
                .returnType(ReturnType.REFUND)
                .reason(ReturnReason.DEFECTIVE)
                .refundAmount(new BigDecimal("1798.00"))
                .netRefundAmount(new BigDecimal("1798.00"))
                .events(new ArrayList<>())
                .build();

        when(vendorRepository.findByUserEmail("seller@alight.com")).thenReturn(Optional.of(mockVendor));
        when(rmaRepository.findById(rmaId)).thenReturn(Optional.of(existingRma));
        when(rmaRepository.save(any(RmaRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RmaReviewRequestDto reviewDto = RmaReviewRequestDto.builder()
                .approved(true)
                .reviewNotes("Approved for pickup")
                .build();

        RmaResponseDto response = rmaService.reviewRmaByVendor(rmaId, "seller@alight.com", reviewDto);

        assertNotNull(response);
        assertEquals(RmaStatus.APPROVED, response.getStatus());
        assertEquals("Approved for pickup", response.getVendorNotes());
    }

    @Test
    void testScheduleReversePickup_Success() {
        UUID rmaId = UUID.randomUUID();
        RmaRequest approvedRma = RmaRequest.builder()
                .id(rmaId)
                .rmaNumber("RMA-2026-7001")
                .order(mockOrder)
                .vendorOrder(mockVendorOrder)
                .user(mockUser)
                .vendor(mockVendor)
                .status(RmaStatus.APPROVED)
                .returnType(ReturnType.REFUND)
                .reason(ReturnReason.DEFECTIVE)
                .refundAmount(new BigDecimal("1798.00"))
                .netRefundAmount(new BigDecimal("1798.00"))
                .events(new ArrayList<>())
                .build();

        when(vendorRepository.findByUserEmail("seller@alight.com")).thenReturn(Optional.of(mockVendor));
        when(rmaRepository.findById(rmaId)).thenReturn(Optional.of(approvedRma));
        when(rmaRepository.save(any(RmaRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RmaSchedulePickupDto pickupDto = RmaSchedulePickupDto.builder()
                .carrierCode("BLUEDART")
                .notes("Express courier pickup booked")
                .build();

        RmaResponseDto response = rmaService.scheduleReversePickup(rmaId, "seller@alight.com", pickupDto);

        assertNotNull(response);
        assertEquals(RmaStatus.PICKUP_SCHEDULED, response.getStatus());
        assertEquals("BLUEDART", response.getReverseCarrierCode());
        assertTrue(response.getReverseAwbNumber().startsWith("REV-BLU-"));
    }
}
