package com.alight.marketplace.modules.settlement.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ForbiddenException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.modules.order.entity.FulfillmentStatus;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.order.repository.VendorOrderRepository;
import com.alight.marketplace.modules.settlement.dto.*;
import com.alight.marketplace.modules.settlement.entity.*;
import com.alight.marketplace.modules.settlement.repository.*;
import com.alight.marketplace.modules.settlement.service.SettlementEligibilityService;
import com.alight.marketplace.modules.settlement.service.SettlementService;
import com.alight.marketplace.modules.settlement.service.payout.BankTransferProvider;
import com.alight.marketplace.modules.settlement.service.payout.PayoutResult;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.user.repository.UserRepository;
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
import java.time.Year;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementServiceImpl implements SettlementService {

    private final VendorWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final VendorPayoutRepository payoutRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final VendorOrderRepository vendorOrderRepository;
    private final SettlementRepository settlementRepository;
    private final SettlementPolicyRepository policyRepository;
    private final SettlementRateCardRepository rateCardRepository;
    private final SettlementTaxRuleRepository taxRuleRepository;
    private final SettlementEligibilityService eligibilityService;
    private final BankTransferProvider bankTransferProvider;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.alight.marketplace.modules.audit.service.AuditLogService auditLogService;

    @Override
    @Transactional
    public void holdInEscrow(VendorOrder vendorOrder) {
        Vendor vendor = vendorOrder.getVendor();
        VendorWallet wallet = getOrCreateWallet(vendor);

        BigDecimal grossAmount = vendorOrder.getGrandTotal();
        wallet.setPendingBalance(wallet.getPendingBalance().add(grossAmount));
        wallet.setTotalEarnings(wallet.getTotalEarnings().add(grossAmount));
        walletRepository.save(wallet);

        String idempKey = "ESCROW_HOLD_" + vendorOrder.getId();
        if (!transactionRepository.existsByIdempotencyKey(idempKey)) {
            WalletTransaction tx = WalletTransaction.builder()
                    .wallet(wallet)
                    .vendor(vendor)
                    .vendorOrder(vendorOrder)
                    .transactionType(WalletTransactionType.ESCROW_HOLD)
                    .amount(grossAmount)
                    .creditAmount(grossAmount)
                    .debitAmount(BigDecimal.ZERO)
                    .currencyCode(wallet.getCurrencyCode())
                    .idempotencyKey(idempKey)
                    .balanceType("PENDING")
                    .balanceAfter(wallet.getPendingBalance())
                    .description("Escrow hold for Sub-Order " + vendorOrder.getSubOrderNumber())
                    .referenceId(vendorOrder.getSubOrderNumber())
                    .build();
            transactionRepository.save(tx);
        }

        log.info("Held {} in escrow for vendor {} sub-order {}", grossAmount, vendor.getStoreName(), vendorOrder.getSubOrderNumber());
    }

    @Override
    @Transactional
    public void releaseEscrow(UUID vendorOrderId) {
        VendorOrder vendorOrder = vendorOrderRepository.findById(vendorOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor sub-order not found"));

        // Evaluate return policy and schedule or execute settlement
        eligibilityService.evaluateAndScheduleSettlement(vendorOrder);
    }

    @Override
    @Transactional
    public void refundEscrow(VendorOrder vendorOrder, BigDecimal refundAmount) {
        Vendor vendor = vendorOrder.getVendor();
        VendorWallet wallet = getOrCreateWallet(vendor);

        BigDecimal pendingDeduct = wallet.getPendingBalance().min(refundAmount);
        wallet.setPendingBalance(wallet.getPendingBalance().subtract(pendingDeduct));
        walletRepository.save(wallet);

        String idempKey = "REFUND_ESCROW_" + vendorOrder.getId() + "_" + Instant.now().toEpochMilli();
        WalletTransaction refundTx = WalletTransaction.builder()
                .wallet(wallet)
                .vendor(vendor)
                .vendorOrder(vendorOrder)
                .transactionType(WalletTransactionType.REFUND_REVERSAL)
                .amount(pendingDeduct)
                .creditAmount(BigDecimal.ZERO)
                .debitAmount(pendingDeduct)
                .currencyCode(wallet.getCurrencyCode())
                .idempotencyKey(idempKey)
                .balanceType("PENDING")
                .balanceAfter(wallet.getPendingBalance())
                .description("Escrow reversal due to refund/cancellation of " + vendorOrder.getSubOrderNumber())
                .referenceId(vendorOrder.getSubOrderNumber())
                .build();
        transactionRepository.save(refundTx);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorWalletDto getWalletForCurrentUser(String email) {
        Vendor vendor = getVendorByUserEmail(email);
        VendorWallet wallet = getOrCreateWallet(vendor);
        return mapToWalletDto(wallet);
    }

    @Override
    @Transactional
    public VendorWalletDto updateBankDetails(String email, BankDetailsDto dto) {
        Vendor vendor = getVendorByUserEmail(email);
        VendorWallet wallet = getOrCreateWallet(vendor);

        wallet.setBankAccountNumber(dto.getBankAccountNumber());
        wallet.setBankAccountHolderName(dto.getBankAccountHolderName());
        wallet.setBankIfscCode(dto.getBankIfscCode());
        wallet.setBankName(dto.getBankName());
        wallet.setBankBranch(dto.getBankBranch());

        VendorWallet saved = walletRepository.save(wallet);
        return mapToWalletDto(saved);
    }

    @Override
    @Transactional
    public VendorPayoutDto requestPayout(String email, PayoutRequestDto dto) {
        Vendor vendor = getVendorByUserEmail(email);

        // Pessimistic write lock to prevent race conditions during concurrent payout requests
        VendorWallet wallet = walletRepository.findByVendorIdForUpdate(vendor.getId())
                .orElseGet(() -> getOrCreateWallet(vendor));

        if (!wallet.getIsPayoutEnabled()) {
            throw new BadRequestException("Payouts are currently disabled for this account. Contact support.");
        }

        if (wallet.getBankAccountNumber() == null || wallet.getBankIfscCode() == null) {
            throw new BadRequestException("Please configure your bank account details before requesting a payout.");
        }

        if (dto.getAmount().compareTo(BigDecimal.valueOf(100)) < 0) {
            throw new BadRequestException("Minimum payout withdrawal request is ₹100.00");
        }

        if (dto.getAmount().compareTo(wallet.getAvailableBalance()) > 0) {
            throw new BadRequestException("Requested payout amount exceeds available balance of " + wallet.getAvailableBalance());
        }

        // Move funds from available to reserved balance
        wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(dto.getAmount()));
        wallet.setReservedBalance(wallet.getReservedBalance().add(dto.getAmount()));
        walletRepository.save(wallet);

        String payoutRef = "PAY-" + Year.now().getValue() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String idempKey = "PAYOUT_REQ_" + payoutRef;

        VendorPayout payout = VendorPayout.builder()
                .payoutReference(payoutRef)
                .idempotencyKey(idempKey)
                .vendor(vendor)
                .wallet(wallet)
                .amount(dto.getAmount())
                .currencyCode(wallet.getCurrencyCode())
                .status(PayoutStatus.PENDING)
                .providerType("BANK_TRANSFER")
                .bankAccountNumber(wallet.getBankAccountNumber())
                .bankAccountHolderName(wallet.getBankAccountHolderName())
                .bankIfscCode(wallet.getBankIfscCode())
                .bankName(wallet.getBankName())
                .adminNotes(dto.getNotes())
                .build();

        VendorPayout saved = payoutRepository.save(payout);

        // Ledger entry for reserving funds for payout
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .vendor(vendor)
                .payoutId(saved.getId())
                .transactionType(WalletTransactionType.PAYOUT_DEBIT)
                .amount(dto.getAmount())
                .creditAmount(BigDecimal.ZERO)
                .debitAmount(dto.getAmount())
                .currencyCode(wallet.getCurrencyCode())
                .idempotencyKey(idempKey)
                .balanceType("AVAILABLE")
                .balanceAfter(wallet.getAvailableBalance())
                .description("Withdrawal request created (Reserved for transfer): " + payoutRef)
                .referenceId(payoutRef)
                .build();
        transactionRepository.save(tx);

        return mapToPayoutDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WalletTransactionDto> getVendorTransactions(String email, Pageable pageable) {
        Vendor vendor = getVendorByUserEmail(email);
        return transactionRepository.findByVendorIdOrderByCreatedAtDesc(vendor.getId(), pageable)
                .map(this::mapToTxDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorPayoutDto> getVendorPayouts(String email, Pageable pageable) {
        Vendor vendor = getVendorByUserEmail(email);
        return payoutRepository.findByVendorIdOrderByRequestedAtDesc(vendor.getId(), pageable)
                .map(this::mapToPayoutDto);
    }

    @Override
    @Transactional(readOnly = true)
    public SettlementOverviewDto getAdminOverview() {
        var wallets = walletRepository.findAll();
        BigDecimal totalEscrow = wallets.stream().map(VendorWallet::getPendingBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAvailable = wallets.stream().map(VendorWallet::getAvailableBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalReserved = wallets.stream().map(VendorWallet::getReservedBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRecovery = wallets.stream().map(VendorWallet::getRecoveryDueBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCommission = wallets.stream().map(VendorWallet::getTotalCommissionPaid).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTcs = wallets.stream().map(VendorWallet::getTotalTcsPaid).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalWithdrawn = wallets.stream().map(VendorWallet::getTotalWithdrawn).reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingPayouts = payoutRepository.findAll().stream().filter(p -> p.getStatus() == PayoutStatus.PENDING).count();
        long pendingEligibility = settlementRepository.count();

        return SettlementOverviewDto.builder()
                .totalPlatformEscrowHold(totalEscrow)
                .totalAvailableForPayout(totalAvailable)
                .totalReservedInPayouts(totalReserved)
                .totalRecoveryDue(totalRecovery)
                .totalCommissionsCollected(totalCommission)
                .totalTcsDeducted(totalTcs)
                .totalPayoutsDisbursed(totalWithdrawn)
                .pendingPayoutRequestsCount(pendingPayouts)
                .pendingEligibilityCount(pendingEligibility)
                .totalVendorsCount(wallets.size())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeliveredSettlementDto> getDeliveredSettlements() {
        List<VendorOrder> deliveredOrders = vendorOrderRepository.findByFulfillmentStatus(FulfillmentStatus.DELIVERED);
        return deliveredOrders.stream().map(vo -> {
            boolean isSettled = transactionRepository.existsByVendorOrderIdAndTransactionType(vo.getId(), WalletTransactionType.ESCROW_RELEASE);
            BigDecimal gross = vo.getGrandTotal() != null ? vo.getGrandTotal() : (vo.getSubtotal() != null ? vo.getSubtotal() : BigDecimal.ZERO);
            BigDecimal subtotal = vo.getSubtotal() != null && vo.getSubtotal().compareTo(BigDecimal.ZERO) > 0 ? vo.getSubtotal() : gross;
            BigDecimal commRate = vo.getVendor() != null && vo.getVendor().getCommissionPercentage() != null
                    ? vo.getVendor().getCommissionPercentage() : new BigDecimal("10.00");
            BigDecimal comm = subtotal.multiply(commRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal tcs = subtotal.multiply(new BigDecimal("0.01")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal net = gross.subtract(comm).subtract(tcs);
            if (net.compareTo(BigDecimal.ZERO) < 0) net = BigDecimal.ZERO;

            return DeliveredSettlementDto.builder()
                    .vendorOrderId(vo.getId())
                    .subOrderNumber(vo.getSubOrderNumber())
                    .masterOrderNumber(vo.getMasterOrder() != null ? vo.getMasterOrder().getOrderNumber() : "")
                    .vendorId(vo.getVendor() != null ? vo.getVendor().getId() : null)
                    .vendorStoreName(vo.getVendor() != null ? vo.getVendor().getStoreName() : "Marketplace Seller")
                    .grossAmount(gross)
                    .commissionRate(commRate)
                    .commissionAmount(comm)
                    .tcsAmount(tcs)
                    .netSettlementAmount(net)
                    .isSettled(isSettled)
                    .deliveredAt(vo.getDeliveredAt())
                    .createdAt(vo.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorWalletDto> getAllVendorWallets() {
        return walletRepository.findAll().stream()
                .map(this::mapToWalletDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WalletTransactionDto> getAllTransactionsAdmin(Pageable pageable) {
        return transactionRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToTxDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorPayoutDto> getAdminPayouts(PayoutStatus status, Pageable pageable) {
        if (status != null) {
            return payoutRepository.findByStatusOrderByRequestedAtDesc(status, pageable).map(this::mapToPayoutDto);
        }
        return payoutRepository.findAllByOrderByRequestedAtDesc(pageable).map(this::mapToPayoutDto);
    }

    @Override
    @Transactional
    public VendorPayoutDto approvePayout(UUID payoutId, String utrNumber, String adminNotes) {
        VendorPayout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout record not found"));

        if (payout.getStatus() == PayoutStatus.PAID || payout.getStatus() == PayoutStatus.PAYOUT_COMPLETED) {
            throw new BadRequestException("Payout has already been settled and marked paid");
        }

        if (utrNumber != null && !utrNumber.trim().isEmpty()) {
            payout.setUtrNumber(utrNumber.trim());
        }

        // Delegate to Bank Transfer Provider abstraction
        PayoutResult result = bankTransferProvider.disbursePayout(payout);

        payout.setStatus(PayoutStatus.PAID);
        payout.setProviderTransactionId(result.getProviderTransactionId());
        payout.setUtrNumber(result.getUtrNumber());
        payout.setAdminNotes(adminNotes != null ? adminNotes : result.getMessage());
        payout.setApprovedAt(Instant.now());
        payout.setProcessedAt(result.getCompletedAt() != null ? result.getCompletedAt() : Instant.now());

        VendorWallet wallet = payout.getWallet();
        // Clear reserved balance
        wallet.setReservedBalance(wallet.getReservedBalance().subtract(payout.getAmount()).max(BigDecimal.ZERO));
        wallet.setTotalWithdrawn(wallet.getTotalWithdrawn().add(payout.getAmount()));
        walletRepository.save(wallet);

        VendorPayout saved = payoutRepository.save(payout);

        // Record confirmed payout ledger entry
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .vendor(payout.getVendor())
                .payoutId(saved.getId())
                .transactionType(WalletTransactionType.PAYOUT)
                .amount(payout.getAmount())
                .creditAmount(BigDecimal.ZERO)
                .debitAmount(payout.getAmount())
                .currencyCode(wallet.getCurrencyCode())
                .idempotencyKey("PAYOUT_DISBURSE_" + saved.getId())
                .balanceType("AVAILABLE")
                .balanceAfter(wallet.getAvailableBalance())
                .description("Payout disbursed via Bank Transfer. UTR: " + saved.getUtrNumber())
                .referenceId(saved.getPayoutReference())
                .build();
        transactionRepository.save(tx);

        log.info("Approved and disbursed payout {} for vendor {}", payout.getPayoutReference(), payout.getVendor().getStoreName());
        return mapToPayoutDto(saved);
    }

    @Override
    @Transactional
    public VendorPayoutDto rejectPayout(UUID payoutId, String rejectionReason, String adminNotes) {
        VendorPayout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout record not found"));

        if (payout.getStatus() == PayoutStatus.PAID || payout.getStatus() == PayoutStatus.PAYOUT_COMPLETED) {
            throw new BadRequestException("Cannot reject a payout that has already been paid");
        }

        payout.setStatus(PayoutStatus.REJECTED);
        payout.setRejectionReason(rejectionReason != null ? rejectionReason : "Rejected by Admin compliance check");
        payout.setAdminNotes(adminNotes);

        // Restore reserved balance back to available balance
        VendorWallet wallet = payout.getWallet();
        wallet.setReservedBalance(wallet.getReservedBalance().subtract(payout.getAmount()).max(BigDecimal.ZERO));
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(payout.getAmount()));
        walletRepository.save(wallet);

        // Ledger entry for refund of rejected payout
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .vendor(payout.getVendor())
                .payoutId(payout.getId())
                .transactionType(WalletTransactionType.PAYOUT_REVERSAL)
                .amount(payout.getAmount())
                .creditAmount(payout.getAmount())
                .debitAmount(BigDecimal.ZERO)
                .currencyCode(wallet.getCurrencyCode())
                .idempotencyKey("PAYOUT_REJECT_" + payout.getId())
                .balanceType("AVAILABLE")
                .balanceAfter(wallet.getAvailableBalance())
                .description("Reversal of rejected payout " + payout.getPayoutReference() + ": " + payout.getRejectionReason())
                .referenceId(payout.getPayoutReference())
                .build();
        transactionRepository.save(tx);

        VendorPayout saved = payoutRepository.save(payout);
        return mapToPayoutDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SettlementResponseDto> getSettlementsQueue(SettlementStatus status, Pageable pageable) {
        if (status != null) {
            return settlementRepository.findByStatusOrderByCreatedAtDesc(status, pageable).map(this::mapToSettlementDto);
        }
        return settlementRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::mapToSettlementDto);
    }

    @Override
    @Transactional(readOnly = true)
    public SettlementResponseDto getSettlementById(UUID id) {
        Settlement s = settlementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found"));
        return mapToSettlementDto(s);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SettlementResponseDto> getVendorSettlements(String email, Pageable pageable) {
        Vendor vendor = getVendorByUserEmail(email);
        return settlementRepository.findByVendorIdOrderByCreatedAtDesc(vendor.getId(), pageable)
                .map(this::mapToSettlementDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettlementPolicyDto> getAllPolicies() {
        return policyRepository.findAll().stream().map(p -> SettlementPolicyDto.builder()
                .id(p.getId())
                .policyName(p.getPolicyName())
                .scope(p.getScope())
                .scopeId(p.getScopeId())
                .returnWindowDays(p.getReturnWindowDays())
                .autoApprovalEnabled(p.getAutoApprovalEnabled())
                .holdDisputedOrders(p.getHoldDisputedOrders())
                .coolingPeriodHours(p.getCoolingPeriodHours())
                .isActive(p.getIsActive())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SettlementPolicyDto updatePolicy(UUID id, SettlementPolicyDto dto) {
        SettlementPolicy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found"));
        if (dto.getPolicyName() != null) policy.setPolicyName(dto.getPolicyName());
        if (dto.getReturnWindowDays() != null) policy.setReturnWindowDays(dto.getReturnWindowDays());
        if (dto.getAutoApprovalEnabled() != null) policy.setAutoApprovalEnabled(dto.getAutoApprovalEnabled());
        if (dto.getHoldDisputedOrders() != null) policy.setHoldDisputedOrders(dto.getHoldDisputedOrders());
        if (dto.getIsActive() != null) policy.setIsActive(dto.getIsActive());

        policy = policyRepository.save(policy);
        return SettlementPolicyDto.builder()
                .id(policy.getId())
                .policyName(policy.getPolicyName())
                .scope(policy.getScope())
                .scopeId(policy.getScopeId())
                .returnWindowDays(policy.getReturnWindowDays())
                .autoApprovalEnabled(policy.getAutoApprovalEnabled())
                .holdDisputedOrders(policy.getHoldDisputedOrders())
                .coolingPeriodHours(policy.getCoolingPeriodHours())
                .isActive(policy.getIsActive())
                .createdAt(policy.getCreatedAt())
                .updatedAt(policy.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettlementRateCardDto> getAllRateCards() {
        return rateCardRepository.findAll().stream().map(rc -> SettlementRateCardDto.builder()
                .id(rc.getId())
                .rateCardCode(rc.getRateCardCode())
                .name(rc.getName())
                .categoryId(rc.getCategory() != null ? rc.getCategory().getId() : null)
                .categoryName(rc.getCategory() != null ? rc.getCategory().getName() : null)
                .vendorId(rc.getVendor() != null ? rc.getVendor().getId() : null)
                .vendorStoreName(rc.getVendor() != null ? rc.getVendor().getStoreName() : null)
                .commissionRate(rc.getCommissionRate())
                .logisticsFeeFixed(rc.getLogisticsFeeFixed())
                .paymentGatewayFeePercent(rc.getPaymentGatewayFeePercent())
                .marketplaceFixedFee(rc.getMarketplaceFixedFee())
                .version(rc.getVersion())
                .isActive(rc.getIsActive())
                .effectiveFrom(rc.getEffectiveFrom())
                .effectiveUntil(rc.getEffectiveUntil())
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettlementTaxRuleDto> getAllTaxRules() {
        return taxRuleRepository.findAll().stream().map(tr -> SettlementTaxRuleDto.builder()
                .id(tr.getId())
                .taxRuleCode(tr.getTaxRuleCode())
                .name(tr.getName())
                .jurisdiction(tr.getJurisdiction())
                .taxType(tr.getTaxType())
                .ratePercentage(tr.getRatePercentage())
                .calculationBase(tr.getCalculationBase())
                .version(tr.getVersion())
                .isActive(tr.getIsActive())
                .effectiveFrom(tr.getEffectiveFrom())
                .effectiveUntil(tr.getEffectiveUntil())
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SettlementResponseDto approveSettlement(UUID settlementId, String adminEmail) {
        Settlement s = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found"));
        s.setStatus(SettlementStatus.ELIGIBLE);
        s.setApprovedAt(Instant.now());
        settlementRepository.save(s);

        // Finalize settlement and credit vendor wallet
        settlementRepository.flush();
        eligibilityService.releaseHold(settlementId, adminEmail);
        return mapToSettlementDto(settlementRepository.findById(settlementId).orElse(s));
    }

    @Override
    @Transactional
    public SettlementResponseDto holdSettlement(UUID settlementId, String reason, String adminEmail) {
        Settlement s = eligibilityService.holdSettlement(settlementId, reason, adminEmail);
        return mapToSettlementDto(s);
    }

    @Override
    @Transactional
    public SettlementResponseDto releaseSettlementHold(UUID settlementId, String adminEmail) {
        Settlement s = eligibilityService.releaseHold(settlementId, adminEmail);
        return mapToSettlementDto(s);
    }

    private VendorWallet getOrCreateWallet(Vendor vendor) {
        return walletRepository.findByVendorId(vendor.getId())
                .orElseGet(() -> walletRepository.save(VendorWallet.builder()
                        .vendor(vendor)
                        .pendingBalance(BigDecimal.ZERO)
                        .availableBalance(BigDecimal.ZERO)
                        .reservedBalance(BigDecimal.ZERO)
                        .onHoldBalance(BigDecimal.ZERO)
                        .recoveryDueBalance(BigDecimal.ZERO)
                        .totalEarnings(BigDecimal.ZERO)
                        .totalWithdrawn(BigDecimal.ZERO)
                        .totalCommissionPaid(BigDecimal.ZERO)
                        .totalTcsPaid(BigDecimal.ZERO)
                        .currencyCode("INR")
                        .isPayoutEnabled(true)
                        .build()));
    }

    private Vendor getVendorByUserEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return vendorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ForbiddenException("Vendor profile not found for user: " + email));
    }

    private VendorWalletDto mapToWalletDto(VendorWallet w) {
        return VendorWalletDto.builder()
                .id(w.getId())
                .vendorId(w.getVendor().getId())
                .vendorStoreName(w.getVendor().getStoreName())
                .pendingBalance(w.getPendingBalance())
                .availableBalance(w.getAvailableBalance())
                .reservedBalance(w.getReservedBalance())
                .onHoldBalance(w.getOnHoldBalance())
                .recoveryDueBalance(w.getRecoveryDueBalance())
                .totalEarnings(w.getTotalEarnings())
                .totalWithdrawn(w.getTotalWithdrawn())
                .totalCommissionPaid(w.getTotalCommissionPaid())
                .totalTcsPaid(w.getTotalTcsPaid())
                .currencyCode(w.getCurrencyCode())
                .bankAccountNumber(w.getBankAccountNumber())
                .bankAccountHolderName(w.getBankAccountHolderName())
                .bankIfscCode(w.getBankIfscCode())
                .bankName(w.getBankName())
                .bankBranch(w.getBankBranch())
                .isPayoutEnabled(w.getIsPayoutEnabled())
                .updatedAt(w.getUpdatedAt())
                .build();
    }

    private WalletTransactionDto mapToTxDto(WalletTransaction t) {
        return WalletTransactionDto.builder()
                .id(t.getId())
                .walletId(t.getWallet().getId())
                .vendorId(t.getVendor().getId())
                .vendorOrderId(t.getVendorOrder() != null ? t.getVendorOrder().getId() : null)
                .subOrderNumber(t.getVendorOrder() != null ? t.getVendorOrder().getSubOrderNumber() : null)
                .payoutId(t.getPayoutId())
                .transactionType(t.getTransactionType())
                .amount(t.getAmount())
                .balanceType(t.getBalanceType())
                .balanceAfter(t.getBalanceAfter())
                .description(t.getDescription())
                .referenceId(t.getReferenceId())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private VendorPayoutDto mapToPayoutDto(VendorPayout p) {
        return VendorPayoutDto.builder()
                .id(p.getId())
                .payoutReference(p.getPayoutReference())
                .vendorId(p.getVendor().getId())
                .vendorStoreName(p.getVendor().getStoreName())
                .amount(p.getAmount())
                .currencyCode(p.getCurrencyCode())
                .status(p.getStatus())
                .bankAccountNumber(p.getBankAccountNumber())
                .bankAccountHolderName(p.getBankAccountHolderName())
                .bankIfscCode(p.getBankIfscCode())
                .bankName(p.getBankName())
                .utrNumber(p.getUtrNumber())
                .adminNotes(p.getAdminNotes())
                .rejectionReason(p.getRejectionReason())
                .requestedAt(p.getRequestedAt())
                .approvedAt(p.getApprovedAt())
                .processedAt(p.getProcessedAt())
                .build();
    }

    private SettlementResponseDto mapToSettlementDto(Settlement s) {
        return SettlementResponseDto.builder()
                .id(s.getId())
                .settlementNumber(s.getSettlementNumber())
                .vendorId(s.getVendor().getId())
                .vendorStoreName(s.getVendor().getStoreName())
                .masterOrderId(s.getMasterOrder() != null ? s.getMasterOrder().getId() : null)
                .masterOrderNumber(s.getMasterOrder() != null ? s.getMasterOrder().getOrderNumber() : "")
                .vendorOrderId(s.getVendorOrder().getId())
                .subOrderNumber(s.getVendorOrder().getSubOrderNumber())
                .status(s.getStatus())
                .holdReason(s.getHoldReason())
                .grossAmount(s.getGrossAmount())
                .shippingCredit(s.getShippingCredit())
                .sellerCredits(s.getSellerCredits())
                .platformCommission(s.getPlatformCommission())
                .logisticsDeduction(s.getLogisticsDeduction())
                .paymentFeeDeduction(s.getPaymentFeeDeduction())
                .marketplaceFee(s.getMarketplaceFee())
                .taxWithholdingAmount(s.getTaxWithholdingAmount())
                .refundDeduction(s.getRefundDeduction())
                .adjustmentAmount(s.getAdjustmentAmount())
                .netPayableAmount(s.getNetPayableAmount())
                .currencyCode(s.getCurrencyCode())
                .rateCardVersion(s.getRateCardVersion())
                .taxRuleVersion(s.getTaxRuleVersion())
                .eligibleAt(s.getEligibleAt())
                .approvedAt(s.getApprovedAt())
                .settledAt(s.getSettledAt())
                .calculationSnapshot(s.getCalculationSnapshot())
                .items(s.getItems() != null ? s.getItems().stream().map(i -> SettlementItemDto.builder()
                        .id(i.getId())
                        .orderItemId(i.getOrderItem().getId())
                        .productTitle(i.getOrderItem().getProductTitle())
                        .sku(i.getOrderItem().getSku())
                        .quantity(i.getQuantity())
                        .grossAmount(i.getGrossAmount())
                        .commissionAmount(i.getCommissionAmount())
                        .taxAmount(i.getTaxAmount())
                        .netAmount(i.getNetAmount())
                        .status(i.getStatus())
                        .build()).collect(Collectors.toList()) : List.of())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
