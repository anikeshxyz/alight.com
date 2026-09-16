package com.alight.marketplace.modules.returns.entity;

import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.VendorOrder;
import com.alight.marketplace.modules.user.entity.User;
import com.alight.marketplace.modules.vendor.entity.Vendor;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "rma_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RmaRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rma_number", nullable = false, unique = true, length = 60)
    private String rmaNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_order_id", nullable = false)
    private VendorOrder vendorOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private RmaStatus status = RmaStatus.REQUESTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "return_type", nullable = false, length = 50)
    @Builder.Default
    private ReturnType returnType = ReturnType.REFUND;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private ReturnReason reason;

    @Column(name = "customer_comments", columnDefinition = "TEXT")
    private String customerComments;

    @Column(name = "proof_images", columnDefinition = "TEXT")
    private String proofImages;

    @Column(name = "vendor_notes", columnDefinition = "TEXT")
    private String vendorNotes;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "refund_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal refundAmount = BigDecimal.ZERO;

    @Column(name = "restock_fee", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal restockFee = BigDecimal.ZERO;

    @Column(name = "net_refund_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal netRefundAmount = BigDecimal.ZERO;

    @Column(name = "reverse_awb_number", length = 100)
    private String reverseAwbNumber;

    @Column(name = "reverse_carrier_code", length = 50)
    private String reverseCarrierCode;

    @Column(name = "customer_phone", length = 30)
    private String customerPhone;

    @Column(name = "pickup_address_line1", length = 255)
    private String pickupAddressLine1;

    @Column(name = "pickup_city", length = 100)
    private String pickupCity;

    @Column(name = "pickup_pincode", length = 20)
    private String pickupPincode;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "pickup_scheduled_date")
    private Instant pickupScheduledDate;

    @Column(name = "received_at")
    private Instant receivedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "rma", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RmaItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "rma", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<RmaEvent> events = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
