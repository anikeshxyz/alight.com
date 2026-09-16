package com.alight.marketplace.modules.payment.service;

import com.alight.marketplace.modules.payment.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface PaymentService {

    InitiatePaymentResponse initiatePayment(InitiatePaymentRequest request, String currentUserEmail);

    PaymentTransactionDto verifyPayment(VerifyPaymentRequest request, String currentUserEmail);

    List<PaymentTransactionDto> getTransactionsForOrder(UUID orderId);

    Page<PaymentTransactionDto> getAdminTransactions(Pageable pageable);

    Page<PaymentTransactionDto> getCustomerPayments(String currentUserEmail, Pageable pageable);

    PaymentTransactionDto approveBankTransferPayment(UUID transactionId, String adminNotes);

    PaymentTransactionDto processRefund(RefundRequestDto request);
}
