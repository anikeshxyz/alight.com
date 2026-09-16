package com.alight.marketplace.common.exception;

import com.alight.marketplace.common.constants.ErrorCode;
import com.alight.marketplace.common.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Data
class TestValidationDto {
    @NotBlank(message = "Field cannot be blank")
    private String name;
}

@RestController
@RequestMapping("/api/v1/test-exceptions")
class ExceptionTestController {

    @GetMapping("/not-found")
    public ApiResponse<Void> triggerNotFound() {
        throw new ResourceNotFoundException("Test entity not found");
    }

    @GetMapping("/business-rule")
    public ApiResponse<Void> triggerBusinessRule() {
        throw new BusinessRuleException("Violated testing rule");
    }

    @PostMapping("/validate")
    public ApiResponse<String> triggerValidation(@Valid @RequestBody TestValidationDto dto) {
        return ApiResponse.success(dto.getName());
    }
}

@WebMvcTest
@ContextConfiguration(classes = {ExceptionTestController.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("ResourceNotFoundException should return 404 with RESOURCE_NOT_FOUND code")
    void testHandleResourceNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/test-exceptions/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.RESOURCE_NOT_FOUND.name()))
                .andExpect(jsonPath("$.message").value("Test entity not found"))
                .andExpect(jsonPath("$.path").value("/api/v1/test-exceptions/not-found"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("BusinessRuleException should return 400 with BUSINESS_RULE_VIOLATION code")
    void testHandleBusinessRuleException() throws Exception {
        mockMvc.perform(get("/api/v1/test-exceptions/business-rule"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.BUSINESS_RULE_VIOLATION.name()))
                .andExpect(jsonPath("$.message").value("Violated testing rule"));
    }

    @Test
    @DisplayName("Validation failure should return 400 with VALIDATION_ERROR and field details")
    void testHandleValidationException() throws Exception {
        mockMvc.perform(post("/api/v1/test-exceptions/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()))
                .andExpect(jsonPath("$.validationErrors.name").value("Field cannot be blank"));
    }
}
