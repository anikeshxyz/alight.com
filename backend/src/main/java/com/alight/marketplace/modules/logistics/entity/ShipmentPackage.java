package com.alight.marketplace.modules.logistics.entity;

import com.alight.marketplace.modules.order.entity.Order;
import com.alight.marketplace.modules.order.entity.VendorOrder;
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
@Table(name = "shipment_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "awb_number", nullable = false, unique = true, length = 100)
    private String awbNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_order_id", nullable = false)
    private VendorOrder vendorOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_order_id", nullable = false)
    private Order masterOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "carrier_code", nullable = false, length = 50)
    private String carrierCode;

    @Column(name = "carrier_name", nullable = false, length = 100)
    private String carrierName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ShipmentStatus status = ShipmentStatus.MANIFESTED;

    @Column(name = "shipping_mode", nullable = false, length = 50)
    @Builder.Default
    private String shippingMode = "STANDARD";

    @Column(name = "package_length_cm", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal packageLengthCm = new BigDecimal("15.00");

    @Column(name = "package_width_cm", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal packageWidthCm = new BigDecimal("10.00");

    @Column(name = "package_height_cm", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal packageHeightCm = new BigDecimal("5.00");

    @Column(name = "dead_weight_kg", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal deadWeightKg = new BigDecimal("0.50");

    @Column(name = "volumetric_weight_kg", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal volumetricWeightKg = new BigDecimal("0.15");

    @Column(name = "billed_weight_kg", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal billedWeightKg = new BigDecimal("0.50");

    @Column(name = "shipping_cost", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal shippingCost = BigDecimal.ZERO;

    @Column(name = "origin_pincode", nullable = false, length = 10)
    private String originPincode;

    @Column(name = "origin_city", nullable = false, length = 100)
    private String originCity;

    @Column(name = "origin_state", nullable = false, length = 100)
    private String originState;

    @Column(name = "destination_pincode", nullable = false, length = 10)
    private String destinationPincode;

    @Column(name = "destination_city", nullable = false, length = 100)
    private String destinationCity;

    @Column(name = "destination_state", nullable = false, length = 100)
    private String destinationState;

    @Column(name = "shipping_label_url", length = 500)
    private String shippingLabelUrl;

    @Column(name = "manifest_id", length = 100)
    private String manifestId;

    @Column(name = "pickup_scheduled_at")
    private Instant pickupScheduledAt;

    @Column(name = "picked_up_at")
    private Instant pickedUpAt;

    @Column(name = "estimated_delivery_at")
    private Instant estimatedDeliveryAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "delivery_confirmation_code", length = 20)
    private String deliveryConfirmationCode;

    @Column(name = "return_awb_number", length = 100)
    private String returnAwbNumber;

    @Column(name = "rto_reason", length = 255)
    private String rtoReason;

    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("eventTimestamp ASC")
    @Builder.Default
    private List<ShipmentTrackingEvent> trackingEvents = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
