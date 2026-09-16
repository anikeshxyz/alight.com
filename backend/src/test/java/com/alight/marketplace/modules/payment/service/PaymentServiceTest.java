package com.alight.marketplace.modules.payment.service;

import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.OrderStatus;
import com.alight.marketplace.modules.order.entity.PaymentStatus;
import com.alight.marketplace.modules.order.repository.OrderRepository;
import com.alight.marketplace.modules.payment.dto.InitiatePaymentRequest;
import com.alight.marketplace.modules.payment.dto.InitiatePaymentResponse;
import com.alight.marketplace.modules.payment.dto.PaymentTransactionDto;
import com.alight.marketplace.modules.payment.dto.VerifyPaymentRequest;
import com.alight.marketplace.modules.payment.entity.PaymentGatewayType;
import com.alight.marketplace.modules.payment.entity.PaymentTransaction;
import com.alight.marketplace.modules.payment.entity.PaymentTransactionStatus;
import com.alight.marketplace.modules.payment.gateway.MockGatewayAdapter;
import com.alight.marketplace.modules.payment.gateway.PaymentGatewayFactory;
import com.alight.marketplace.modules.payment.repository.PaymentTransactionRepository;
import com.alight.marketplace.modules.payment.service.impl.PaymentServiceImpl;
import com.alight.marketplace.modules.settlement.service.SettlementService;
import com.alight.marketplace.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentTransactionRepository transactionRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PaymentGatewayFactory gatewayFactory;

    @Mock
    private SettlementService settlementService;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private Order testOrder;
    private PaymentTransaction testTx;
    private MockGatewayAdapter mockGatewayAdapter;

    @BeforeEach
    void setUp() {
        mockGatewayAdapter = new MockGatewayAdapter();

        testOrder = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-2026-TEST01")
                .grandTotal(new BigDecimal("12500.00"))
                .currencyCode("INR")
                .orderStatus(OrderStatus.PLACED)
                .paymentStatus(PaymentStatus.PENDING)
                .customerName("John Doe")
                .customerEmail("john@example.com")
                .customerPhone("+919876543210")
                .vendorOrders(new ArrayList<>())
                .build();

        testTx = PaymentTransaction.builder()
                .id(UUID.randomUUID())
                .transactionReference("TXN-2026-TEST01")
                .order(testOrder)
                .amount(testOrder.getGrandTotal())
                .currencyCode("INR")
                .gatewayType(PaymentGatewayType.MOCK)
                .transactionStatus(PaymentTransactionStatus.INITIATED)
                .build();
    }

    @Test
    void testInitiatePayment_Success() {
        when(orderRepository.findById(testOrder.getId())).thenReturn(Optional.of(testOrder));
        when(transactionRepository.save(any(PaymentTransaction.class))).thenReturn(testTx);
        when(gatewayFactory.getAdapter(PaymentGatewayType.MOCK)).thenReturn(mockGatewayAdapter);

        InitiatePaymentRequest request = InitiatePaymentRequest.builder()
                .orderId(testOrder.getId())
                .gatewayType(PaymentGatewayType.MOCK)
                .paymentMethod("MOCK_SIMULATOR")
                .build();

        InitiatePaymentResponse response = paymentService.initiatePayment(request, null);

        assertThat(response).isNotNull();
        assertThat(response.getGatewayType()).isEqualTo(PaymentGatewayType.MOCK);
        assertThat(response.getAmount()).isEqualTo(new BigDecimal("12500.00"));
        verify(transactionRepository, atLeastOnce()).save(any(PaymentTransaction.class));
    }

    @Test
    void testVerifyPayment_MockGateway_Success() {
        when(transactionRepository.findById(testTx.getId())).thenReturn(Optional.of(testTx));
        when(gatewayFactory.getAdapter(PaymentGatewayType.MOCK)).thenReturn(mockGatewayAdapter);
        when(transactionRepository.save(any(PaymentTransaction.class))).thenReturn(testTx);
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        VerifyPaymentRequest request = VerifyPaymentRequest.builder()
                .transactionId(testTx.getId())
                .gatewayType(PaymentGatewayType.MOCK)
                .build();

        PaymentTransactionDto dto = paymentService.verifyPayment(request, null);

        assertThat(dto).isNotNull();
        assertThat(testTx.getTransactionStatus()).isEqualTo(PaymentTransactionStatus.CAPTURED);
        assertThat(testOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(testOrder.getOrderStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }
}
