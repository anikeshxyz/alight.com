package com.alight.marketplace.modules.vendor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vendor_business_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorBusinessDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false, unique = true)
    private Vendor vendor;

    @Column(name = "legal_business_name", nullable = false, length = 200)
    private String legalBusinessName;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", nullable = false, length = 50)
    @Builder.Default
    private BusinessType businessType = BusinessType.INDIVIDUAL;

    @Column(name = "tax_id_gstin", length = 50)
    private String taxIdGstin;

    @Column(name = "pan_number", length = 20)
    private String panNumber;

    @Column(name = "bank_account_number", nullable = false, length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_ifsc_code", nullable = false, length = 20)
    private String bankIfscCode;

    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName;

    @Column(name = "bank_account_holder_name", nullable = false, length = 150)
    private String bankAccountHolderName;

    @Column(name = "business_license_url", length = 512)
    private String businessLicenseUrl;

    @Column(name = "tax_certificate_url", length = 512)
    private String taxCertificateUrl;

    @Column(name = "id_proof_url", length = 512)
    private String idProofUrl;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean verified = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
