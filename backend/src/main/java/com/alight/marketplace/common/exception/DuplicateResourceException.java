package com.alight.marketplace.common.exception;

import com.alight.marketplace.common.constants.ErrorCode;
import org.springframework.http.HttpStatus;

public class DuplicateResourceException extends CustomException {
    public DuplicateResourceException(String message) {
        super(message, HttpStatus.CONFLICT, ErrorCode.DUPLICATE_RESOURCE);
    }
}
