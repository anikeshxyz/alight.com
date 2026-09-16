package com.alight.marketplace.modules.settlement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankDetailsDto {

    @NotBlank(message = "Account number is required")
    private String bankAccountNumber;

    @NotBlank(message = "Account holder name is required")
    private String bankAccountHolderName;

    @NotBlank(message = "IFSC code is required")
    private String bankIfscCode;

    @NotBlank(message = "Bank name is required")
    private String bankName;

    private String bankBranch;
}
