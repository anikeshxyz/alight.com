package com.alight.marketplace.common.exception;

import com.alight.marketplace.common.constants.ErrorCode;
import org.springframework.http.HttpStatus;

public class BusinessRuleException extends CustomException {
    public BusinessRuleException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ErrorCode.BUSINESS_RULE_VIOLATION);
    }
}
