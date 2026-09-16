package com.alight.marketplace.common.exception;

import com.alight.marketplace.common.constants.ErrorCode;
import org.springframework.http.HttpStatus;

public class BadRequestException extends CustomException {
    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ErrorCode.BUSINESS_RULE_VIOLATION);
    }
}
