package com.alight.marketplace.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    @Builder.Default
    private boolean success = false;
    private String message;
    private String code;
    private Instant timestamp;
    private String path;
    private String traceId;
    private Map<String, String> validationErrors;

    public static ApiErrorResponse of(String message, String code, String path) {
        return ApiErrorResponse.builder()
                .success(false)
                .message(message)
                .code(code)
                .timestamp(Instant.now())
                .path(path)
                .traceId(org.slf4j.MDC.get("traceId"))
                .build();
    }

    public static ApiErrorResponse of(String message, String code, String path, Map<String, String> validationErrors) {
        return ApiErrorResponse.builder()
                .success(false)
                .message(message)
                .code(code)
                .timestamp(Instant.now())
                .path(path)
                .validationErrors(validationErrors)
                .traceId(org.slf4j.MDC.get("traceId"))
                .build();
    }
}
