package com.alight.marketplace.modules.returns.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.common.exception.ResourceNotFoundException;
import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.modules.inventory.dto.StockAdjustmentRequest;
import com.alight.marketplace.modules.inventory.entity.TransactionType;
import com.alight.marketplace.modules.inventory.entity.Warehouse;
import com.alight.marketplace.modules.inventory.repository.WarehouseRepository;
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
import com.alight.marketplace.modules.returns.service.RmaService;
import com.alight.marketplace.modules.settlement.service.SettlementService;
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
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RmaServiceImpl implements RmaService {

    private final RmaRequestRepository rmaRepository;
    private final RmaItemRepository rmaItemRepository;
    private final RmaEventRepository rmaEventRepository;
    private final RmaPolicyService rmaPolicyService;
    private final OrderRepository orderRepository;
    private final VendorOrderRepository vendorOrderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryService inventoryService;
    private final SettlementService settlementService;
    private final com.alight.marketplace.modules.settlement.service.VendorRecoveryService vendorRecoveryService;
    private final com.alight.marketplace.modules.settlement.repository.SettlementRepository settlementRepository;

    @Override
    @Transactional
    public RmaResponseDto createRmaRequest(String userEmail, CreateRmaRequestDto dto) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Order order = orderRepository.findById(dto.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(user.getId()) && !user.getEmail().equalsIgnoreCase(order.getCustomerEmail())) {
            throw new UnauthorizedException("You are not authorized to initiate returns on this order");
        }

        VendorOrder vendorOrder = vendorOrderRepository.findById(dto.getVendorOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor sub-order not found"));

        if (!vendorOrder.getMasterOrder().getId().equals(order.getId())) {
            throw new BadRequestException("Vendor sub-order does not belong to specified order");
        }

        Vendor vendor = vendorOrder.getVendor();
        List<OrderItem> orderItems = orderItemRepository.findByVendorOrderId(vendorOrder.getId());
        Map<UUID, OrderItem> orderItemMap = orderItems.stream()
                .collect(Collectors.toMap(OrderItem::getId, oi -> oi));

        BigDecimal totalRefundAmount = BigDecimal.ZERO;
        List<RmaItem> rmaItems = new ArrayList<>();

        for (RmaItemInputDto itemInput : dto.getItems()) {
            OrderItem oi = orderItemMap.get(itemInput.getOrderItemId());
            if (oi == null) {
                throw new BadRequestException("Invalid order item ID for this sub-order: " + itemInput.getOrderItemId());
            }

            if (itemInput.getQuantity() > oi.getQuantity()) {
                throw new BadRequestException("Return quantity cannot exceed purchased quantity for item: " + oi.getProductTitle());
            }

            // Check Policy
            UUID categoryId = oi.getProduct() != null && oi.getProduct().getCategory() != null 
                    ? oi.getProduct().getCategory().getId() 
                    : null;
            RmaPolicyDto policy = rmaPolicyService.getEffectivePolicy(categoryId, vendor.getId());
            if (Boolean.FALSE.equals(policy.getIsReturnable())) {
                throw new BadRequestException("Item " + oi.getProductTitle() + " is non-returnable per policy");
            }

            // Calculate item refund amount
            BigDecimal itemUnitPrice = oi.getUnitPrice();
            BigDecimal itemTax = oi.getTaxAmount().divide(new BigDecimal(oi.getQuantity()), 2, RoundingMode.HALF_UP);
            BigDecimal itemRefund = itemUnitPrice.add(itemTax).multiply(new BigDecimal(itemInput.getQuantity()));
            totalRefundAmount = totalRefundAmount.add(itemRefund);

            RmaItem rmaItem = RmaItem.builder()
                    .orderItem(oi)
                    .product(oi.getProduct())
                    .variant(oi.getVariant())
                    .quantity(itemInput.getQuantity())
                    .unitPrice(itemUnitPrice)
                    .taxAmount(itemTax.multiply(new BigDecimal(itemInput.getQuantity())))
                    .refundAmount(itemRefund)
                    .build();

            rmaItems.add(rmaItem);
        }

        String rmaNumber = "RMA-" + Year.now().getValue() + "-" + (100000 + new Random().nextInt(900000));

        RmaRequest rma = RmaRequest.builder()
                .rmaNumber(rmaNumber)
                .order(order)
                .vendorOrder(vendorOrder)
                .user(user)
                .vendor(vendor)
                .status(RmaStatus.REQUESTED)
                .returnType(dto.getReturnType())
                .reason(dto.getReason())
                .customerComments(dto.getCustomerComments())
                .proofImages(dto.getProofImages())
                .refundAmount(totalRefundAmount)
                .restockFee(BigDecimal.ZERO)
                .netRefundAmount(totalRefundAmount)
                .build();

        for (RmaItem item : rmaItems) {
            item.setRma(rma);
        }
        rma.setItems(rmaItems);

        RmaEvent event = RmaEvent.builder()
                .rma(rma)
                .status(RmaStatus.REQUESTED)
                .actorType(ActorType.CUSTOMER)
                .actorId(user.getEmail())
                .title("Return Requested")
                .description("Customer initiated return request for " + rmaItems.size() + " line items. Reason: " + dto.getReason())
                .build();
        rma.getEvents().add(event);

        RmaRequest saved = rmaRepository.save(rma);
        log.info("Created RMA request {} for order {}", rmaNumber, order.getOrderNumber());
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RmaResponseDto> getMyReturns(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return rmaRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public RmaResponseDto getRmaByNumber(String rmaNumber, String userEmail) {
        RmaRequest rma = rmaRepository.findByRmaNumber(rmaNumber)
                .orElseThrow(() -> new ResourceNotFoundException("RMA request not found with number: " + rmaNumber));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!rma.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Not authorized to view this RMA");
        }

        return mapToDto(rma);
    }

    @Override
    @Transactional
    public RmaResponseDto cancelRmaRequest(String rmaNumber, String userEmail) {
        RmaRequest rma = rmaRepository.findByRmaNumber(rmaNumber)
                .orElseThrow(() -> new ResourceNotFoundException("RMA request not found with number: " + rmaNumber));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!rma.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Not authorized to cancel this RMA");
        }

        if (rma.getStatus() != RmaStatus.REQUESTED && rma.getStatus() != RmaStatus.APPROVED) {
            throw new BadRequestException("Cannot cancel return request in current status: " + rma.getStatus());
        }

        rma.setStatus(RmaStatus.CANCELLED);
        RmaEvent event = RmaEvent.builder()
                .rma(rma)
                .status(RmaStatus.CANCELLED)
                .actorType(ActorType.CUSTOMER)
                .actorId(user.getEmail())
                .title("Return Cancelled")
                .description("Customer cancelled the return request.")
                .build();
        rma.getEvents().add(event);

        return mapToDto(rmaRepository.save(rma));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RmaResponseDto> getVendorReturns(String vendorEmail, RmaStatus status, Pageable pageable) {
        Vendor vendor = getVendorForEmail(vendorEmail);
        if (status != null) {
            return rmaRepository.findByVendorIdAndStatusOrderByCreatedAtDesc(vendor.getId(), status, pageable)
                    .map(this::mapToDto);
        }
        return rmaRepository.findByVendorIdOrderByCreatedAtDesc(vendor.getId(), pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public RmaResponseDto getVendorRmaById(UUID rmaId, String vendorEmail) {
        Vendor vendor = getVendorForEmail(vendorEmail);
        RmaRequest rma = rmaRepository.findById(rmaId)
                .orElseThrow(() -> new ResourceNotFoundException("RMA request not found with id: " + rmaId));

        if (!rma.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("Not authorized to view this vendor RMA");
        }

        return mapToDto(rma);
    }

    @Override
    @Transactional
    public RmaResponseDto reviewRmaByVendor(UUID rmaId, String vendorEmail, RmaReviewRequestDto dto) {
        Vendor vendor = getVendorForEmail(vendorEmail);
        RmaRequest rma = rmaRepository.findById(rmaId)
                .orElseThrow(() -> new ResourceNotFoundException("RMA request not found"));

        if (!rma.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("Not authorized to review this RMA");
        }

        if (rma.getStatus() != RmaStatus.REQUESTED) {
            throw new BadRequestException("RMA is not in REQUESTED status");
        }

        if (Boolean.TRUE.equals(dto.getApproved())) {
            rma.setStatus(RmaStatus.APPROVED);
            rma.setVendorNotes(dto.getReviewNotes());

            RmaEvent event = RmaEvent.builder()
                    .rma(rma)
                    .status(RmaStatus.APPROVED)
                    .actorType(ActorType.VENDOR)
                    .actorId(vendorEmail)
                    .title("Return Approved by Vendor")
                    .description(dto.getReviewNotes() != null ? dto.getReviewNotes() : "Return request approved for pickup scheduling.")
                    .build();
            rma.getEvents().add(event);
        } else {
            rma.setStatus(RmaStatus.REJECTED);
            rma.setVendorNotes(dto.getReviewNotes());

            RmaEvent event = RmaEvent.builder()
                    .rma(rma)
                    .status(RmaStatus.REJECTED)
                    .actorType(ActorType.VENDOR)
                    .actorId(vendorEmail)
                    .title("Return Rejected by Vendor")
                    .description(dto.getReviewNotes() != null ? dto.getReviewNotes() : "Return request rejected.")
                    .build();
            rma.getEvents().add(event);
        }

        return mapToDto(rmaRepository.save(rma));
    }

    @Override
    @Transactional
    public RmaResponseDto scheduleReversePickup(UUID rmaId, String vendorEmail, RmaSchedulePickupDto dto) {
        Vendor vendor = getVendorForEmail(vendorEmail);
        RmaRequest rma = rmaRepository.findById(rmaId)
                .orElseThrow(() -> new ResourceNotFoundException("RMA request not found"));

        if (!rma.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("Not authorized to schedule pickup for this RMA");
        }

        if (rma.getStatus() != RmaStatus.APPROVED && rma.getStatus() != RmaStatus.PICKUP_SCHEDULED) {
            throw new BadRequestException("RMA must be in APPROVED status to schedule reverse pickup");
        }

        String reverseCarrier = dto.getCarrierCode().toUpperCase();
        String reverseAwb = "REV-" + reverseCarrier.substring(0, Math.min(3, reverseCarrier.length())) + "-" + (100000 + new Random().nextInt(900000)) + "IN";
        Instant pickupDate = dto.getScheduledDate() != null ? dto.getScheduledDate() : Instant.now().plus(1, ChronoUnit.DAYS);

        rma.setStatus(RmaStatus.PICKUP_SCHEDULED);
        rma.setReverseCarrierCode(reverseCarrier);
        rma.setReverseAwbNumber(reverseAwb);
        rma.setPickupScheduledDate(pickupDate);

        RmaEvent event = RmaEvent.builder()
                .rma(rma)
                .status(RmaStatus.PICKUP_SCHEDULED)
                .actorType(ActorType.VENDOR)
                .actorId(vendorEmail)
                .title("Reverse Pickup Scheduled (" + reverseCarrier + ")")
                .description("Reverse waybill " + reverseAwb + " created. Scheduled pickup: " + pickupDate + ". " + (dto.getNotes() != null ? dto.getNotes() : ""))
                .build();
        rma.getEvents().add(event);

        return mapToDto(rmaRepository.save(rma));
    }

    @Override
    @Transactional
    public RmaResponseDto inspectRmaItems(UUID rmaId, String vendorEmail, RmaInspectionRequestDto dto) {
        Vendor vendor = getVendorForEmail(vendorEmail);
        RmaRequest rma = rmaRepository.findById(rmaId)
                .orElseThrow(() -> new ResourceNotFoundException("RMA request not found"));

        if (!rma.getVendor().getId().equals(vendor.getId())) {
            throw new UnauthorizedException("Not authorized to inspect this RMA");
        }

        return executeInspection(rma, vendorEmail, ActorType.VENDOR, dto);
    }

    @Override
    @Transactional
    public RmaResponseDto adminOverrideRma(UUID rmaId, String adminEmail, RmaInspectionRequestDto dto) {
        RmaRequest rma = rmaRepository.findById(rmaId)
                .orElseThrow(() -> new ResourceNotFoundException("RMA request not found"));

        return executeInspection(rma, adminEmail, ActorType.ADMIN, dto);
    }

    private RmaResponseDto executeInspection(RmaRequest rma, String actorEmail, ActorType actorType, RmaInspectionRequestDto dto) {
        Map<UUID, RmaItem> itemMap = rma.getItems().stream()
                .collect(Collectors.toMap(RmaItem::getId, i -> i));

        for (RmaInspectionItemDto inspItem : dto.getItems()) {
            RmaItem item = itemMap.get(inspItem.getRmaItemId());
            if (item != null) {
                item.setConditionOnReturn(inspItem.getCondition());
                item.setRestockAction(inspItem.getRestockAction());
                item.setInspectedBy(actorEmail);
                item.setInspectionNotes(inspItem.getNotes());
                item.setInspectedAt(Instant.now());

                Warehouse warehouse = null;
                if (inspItem.getWarehouseId() != null) {
                    warehouse = warehouseRepository.findById(inspItem.getWarehouseId()).orElse(null);
                }
                if (warehouse == null) {
                    warehouse = warehouseRepository.findByVendorIdAndPrimaryTrue(rma.getVendor().getId())
                            .orElse(warehouseRepository.findByVendorIsNullAndActiveTrue().stream().findFirst().orElse(null));
                }
                item.setWarehouse(warehouse);

                // Inventory Restock Action
                if (inspItem.getRestockAction() == RestockAction.RESTOCK_AVAILABLE && warehouse != null) {
                    try {
                        inventoryService.adjustStock(
                                StockAdjustmentRequest.builder()
                                        .warehouseId(warehouse.getId())
                                        .productId(item.getProduct().getId())
                                        .variantId(item.getVariant() != null ? item.getVariant().getId() : null)
                                        .transactionType(TransactionType.ADJUSTMENT_ADD)
                                        .quantity(item.getQuantity())
                                        .referenceType("RMA_RESTOCK")
                                        .referenceId(rma.getRmaNumber())
                                        .notes("Restocked " + item.getQuantity() + " units from RMA " + rma.getRmaNumber())
                                        .build(),
                                actorEmail
                        );
                        log.info("Restocked {} units of product {} to warehouse {}", item.getQuantity(), item.getProduct().getId(), warehouse.getCode());
                    } catch (Exception e) {
                        log.error("Failed to automatically adjust inventory on RMA inspection: {}", e.getMessage());
                    }
                }
            }
        }

        if (Boolean.TRUE.equals(dto.getInspectionPassed())) {
            BigDecimal refundAmt = dto.getCustomRefundAmount() != null ? dto.getCustomRefundAmount() : rma.getRefundAmount();
            BigDecimal restockFee = dto.getRestockFee() != null ? dto.getRestockFee() : BigDecimal.ZERO;
            BigDecimal netRefund = refundAmt.subtract(restockFee);
            if (netRefund.compareTo(BigDecimal.ZERO) < 0) netRefund = BigDecimal.ZERO;

            rma.setRefundAmount(refundAmt);
            rma.setRestockFee(restockFee);
            rma.setNetRefundAmount(netRefund);

            if (rma.getReturnType() == ReturnType.REFUND) {
                rma.setStatus(RmaStatus.REFUND_PROCESSED);
                // Trigger Settlement Service Escrow Refund or Post-Settlement Debt Recovery
                try {
                    var optSettlement = settlementRepository.findByVendorOrderId(rma.getVendorOrder().getId());
                    if (optSettlement.isPresent() && optSettlement.get().getStatus() == com.alight.marketplace.modules.settlement.entity.SettlementStatus.SETTLED) {
                        vendorRecoveryService.applyPostSettlementReturnDebit(rma, netRefund, actorEmail);
                        log.info("Post-settlement return debit applied for RMA {} on settled sub-order {}", rma.getRmaNumber(), rma.getVendorOrder().getSubOrderNumber());
                    } else {
                        settlementService.refundEscrow(rma.getVendorOrder(), netRefund);
                        log.info("Escrow refund of {} executed on sub-order {}", netRefund, rma.getVendorOrder().getSubOrderNumber());
                    }
                } catch (Exception e) {
                    log.warn("Escrow refund / recovery warning on RMA {}: {}", rma.getRmaNumber(), e.getMessage());
                }
            } else if (rma.getReturnType() == ReturnType.REPLACEMENT) {
                rma.setStatus(RmaStatus.REPLACEMENT_DISPATCHED);
            } else {
                rma.setStatus(RmaStatus.REFUND_PROCESSED);
            }

            rma.setCompletedAt(Instant.now());

            RmaEvent event = RmaEvent.builder()
                    .rma(rma)
                    .status(rma.getStatus())
                    .actorType(actorType)
                    .actorId(actorEmail)
                    .title("QA Inspection Passed & Resolution Completed")
                    .description("Inspection passed. Net refund ₹" + netRefund + " processed. " + (dto.getInspectionNotes() != null ? dto.getInspectionNotes() : ""))
                    .build();
            rma.getEvents().add(event);

        } else {
            rma.setStatus(RmaStatus.INSPECTED_FAIL);
            rma.setCompletedAt(Instant.now());

            RmaEvent event = RmaEvent.builder()
                    .rma(rma)
                    .status(RmaStatus.INSPECTED_FAIL)
                    .actorType(actorType)
                    .actorId(actorEmail)
                    .title("QA Inspection Failed")
                    .description("Item failed return inspection criteria: " + (dto.getInspectionNotes() != null ? dto.getInspectionNotes() : "Non-compliant condition."))
                    .build();
            rma.getEvents().add(event);
        }

        return mapToDto(rmaRepository.save(rma));
    }

    @Override
    @Transactional(readOnly = true)
    public RmaStatsSummaryDto getVendorRmaStats(String vendorEmail) {
        Vendor vendor = getVendorForEmail(vendorEmail);
        return RmaStatsSummaryDto.builder()
                .totalRequests(rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.REQUESTED)
                        + rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.APPROVED)
                        + rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.PICKUP_SCHEDULED)
                        + rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.IN_REVERSE_TRANSIT)
                        + rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.RECEIVED_AT_WAREHOUSE)
                        + rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.REFUND_PROCESSED)
                        + rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.REJECTED))
                .pendingReview(rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.REQUESTED))
                .inTransit(rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.PICKUP_SCHEDULED)
                        + rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.IN_REVERSE_TRANSIT))
                .awaitingInspection(rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.RECEIVED_AT_WAREHOUSE))
                .completedRefunded(rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.REFUND_PROCESSED)
                        + rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.REPLACEMENT_DISPATCHED))
                .rejected(rmaRepository.countByVendorIdAndStatus(vendor.getId(), RmaStatus.REJECTED))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RmaResponseDto> searchAllRmasAdmin(RmaStatus status, String searchTerm, Pageable pageable) {
        return rmaRepository.searchAllAdmin(status, (searchTerm != null && !searchTerm.isBlank()) ? searchTerm : null, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public RmaResponseDto getRmaByIdAdmin(UUID rmaId) {
        RmaRequest rma = rmaRepository.findById(rmaId)
                .orElseThrow(() -> new ResourceNotFoundException("RMA request not found with id: " + rmaId));
        return mapToDto(rma);
    }

    @Override
    @Transactional(readOnly = true)
    public RmaStatsSummaryDto getAdminRmaStats() {
        return RmaStatsSummaryDto.builder()
                .totalRequests(rmaRepository.count())
                .pendingReview(rmaRepository.countByStatus(RmaStatus.REQUESTED))
                .inTransit(rmaRepository.countByStatus(RmaStatus.PICKUP_SCHEDULED) + rmaRepository.countByStatus(RmaStatus.IN_REVERSE_TRANSIT))
                .awaitingInspection(rmaRepository.countByStatus(RmaStatus.RECEIVED_AT_WAREHOUSE))
                .completedRefunded(rmaRepository.countByStatus(RmaStatus.REFUND_PROCESSED) + rmaRepository.countByStatus(RmaStatus.REPLACEMENT_DISPATCHED))
                .rejected(rmaRepository.countByStatus(RmaStatus.REJECTED))
                .build();
    }

    private Vendor getVendorForEmail(String email) {
        return vendorRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor profile not found for authenticated user"));
    }

    private RmaResponseDto mapToDto(RmaRequest r) {
        List<RmaItemDto> itemDtos = r.getItems() != null ? r.getItems().stream()
                .map(i -> RmaItemDto.builder()
                        .id(i.getId())
                        .orderItemId(i.getOrderItem() != null ? i.getOrderItem().getId() : null)
                        .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                        .productTitle(i.getProduct() != null ? i.getProduct().getTitle() : (i.getOrderItem() != null ? i.getOrderItem().getProductTitle() : "Product"))
                        .sku(i.getProduct() != null ? i.getProduct().getSku() : (i.getOrderItem() != null ? i.getOrderItem().getSku() : ""))
                        .imageUrl(i.getProduct() != null && !i.getProduct().getImages().isEmpty() ? i.getProduct().getImages().get(0).getImageUrl() : (i.getOrderItem() != null ? i.getOrderItem().getImageUrl() : null))
                        .variantId(i.getVariant() != null ? i.getVariant().getId() : null)
                        .variantName(i.getVariant() != null ? i.getVariant().getVariantName() : (i.getOrderItem() != null ? i.getOrderItem().getVariantName() : null))
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .taxAmount(i.getTaxAmount())
                        .refundAmount(i.getRefundAmount())
                        .conditionOnReturn(i.getConditionOnReturn())
                        .restockAction(i.getRestockAction())
                        .warehouseId(i.getWarehouse() != null ? i.getWarehouse().getId() : null)
                        .warehouseName(i.getWarehouse() != null ? i.getWarehouse().getName() : null)
                        .inspectedBy(i.getInspectedBy())
                        .inspectionNotes(i.getInspectionNotes())
                        .inspectedAt(i.getInspectedAt())
                        .build())
                .collect(Collectors.toList()) : Collections.emptyList();

        List<RmaEventDto> eventDtos = r.getEvents() != null ? r.getEvents().stream()
                .map(e -> RmaEventDto.builder()
                        .id(e.getId())
                        .status(e.getStatus())
                        .actorType(e.getActorType())
                        .actorId(e.getActorId())
                        .title(e.getTitle())
                        .description(e.getDescription())
                        .createdAt(e.getCreatedAt())
                        .build())
                .collect(Collectors.toList()) : Collections.emptyList();

        return RmaResponseDto.builder()
                .id(r.getId())
                .rmaNumber(r.getRmaNumber())
                .orderId(r.getOrder().getId())
                .orderNumber(r.getOrder().getOrderNumber())
                .vendorOrderId(r.getVendorOrder().getId())
                .subOrderNumber(r.getVendorOrder().getSubOrderNumber())
                .userId(r.getUser().getId())
                .customerEmail(r.getUser().getEmail())
                .customerName(r.getUser().getFirstName() + " " + r.getUser().getLastName())
                .vendorId(r.getVendor().getId())
                .vendorStoreName(r.getVendor().getStoreName())
                .status(r.getStatus())
                .returnType(r.getReturnType())
                .reason(r.getReason())
                .customerComments(r.getCustomerComments())
                .proofImages(r.getProofImages())
                .vendorNotes(r.getVendorNotes())
                .adminNotes(r.getAdminNotes())
                .refundAmount(r.getRefundAmount())
                .restockFee(r.getRestockFee())
                .netRefundAmount(r.getNetRefundAmount())
                .reverseAwbNumber(r.getReverseAwbNumber())
                .reverseCarrierCode(r.getReverseCarrierCode())
                .pickupScheduledDate(r.getPickupScheduledDate())
                .receivedAt(r.getReceivedAt())
                .completedAt(r.getCompletedAt())
                .items(itemDtos)
                .events(eventDtos)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
