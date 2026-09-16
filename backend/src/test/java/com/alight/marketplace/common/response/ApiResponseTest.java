package com.alight.marketplace.common.response;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ApiResponseTest {

    @Test
    @DisplayName("Should create successful ApiResponse with data and custom message")
    void testSuccessWithDataAndMessage() {
        ApiResponse<String> response = ApiResponse.success("sample_payload", "Custom success message");

        assertTrue(response.isSuccess());
        assertEquals("sample_payload", response.getData());
        assertEquals("Custom success message", response.getMessage());
    }

    @Test
    @DisplayName("Should create default successful ApiResponse with data")
    void testSuccessWithData() {
        ApiResponse<Integer> response = ApiResponse.success(42);

        assertTrue(response.isSuccess());
        assertEquals(42, response.getData());
        assertEquals("Request successful", response.getMessage());
    }

    @Test
    @DisplayName("Should bind traceId from MDC when present in response")
    void testTraceIdBindingFromMdc() {
        org.slf4j.MDC.put("traceId", "trace-abc-123");
        try {
            ApiResponse<String> successResp = ApiResponse.success("ok");
            assertEquals("trace-abc-123", successResp.getTraceId());

            ApiErrorResponse errResp = ApiErrorResponse.of("Error msg", "ERR_CODE", "/test");
            assertEquals("trace-abc-123", errResp.getTraceId());
        } finally {
            org.slf4j.MDC.clear();
        }
    }
}
