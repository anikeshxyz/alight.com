package com.alight.marketplace.modules.user.controller;

import com.alight.marketplace.common.exception.GlobalExceptionHandler;
import com.alight.marketplace.modules.user.dto.AddressDto;
import com.alight.marketplace.modules.user.dto.UserProfileDto;
import com.alight.marketplace.modules.user.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest
@ContextConfiguration(classes = {UserController.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    private Principal createMockPrincipal(String email) {
        return new UsernamePasswordAuthenticationToken(email, "pass", List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
    }

    @Test
    @DisplayName("GET /api/v1/users/profile should return current user profile")
    void testGetProfile() throws Exception {
        UserProfileDto profile = UserProfileDto.builder()
                .id(UUID.randomUUID())
                .email("customer@alight.com")
                .firstName("Customer")
                .lastName("User")
                .roles(List.of("ROLE_CUSTOMER"))
                .build();

        when(userService.getCurrentUserProfile("customer@alight.com")).thenReturn(profile);

        mockMvc.perform(get("/api/v1/users/profile")
                        .principal(createMockPrincipal("customer@alight.com"))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("customer@alight.com"))
                .andExpect(jsonPath("$.data.firstName").value("Customer"));
    }

    @Test
    @DisplayName("GET /api/v1/users/addresses should return list of addresses")
    void testGetAddresses() throws Exception {
        AddressDto address = AddressDto.builder()
                .id(UUID.randomUUID())
                .recipientName("Customer User")
                .phone("+919876543210")
                .addressLine1("123 Market Street")
                .city("Mumbai")
                .state("Maharashtra")
                .postalCode("400001")
                .country("India")
                .isDefault(true)
                .build();

        when(userService.getUserAddresses("customer@alight.com")).thenReturn(List.of(address));

        mockMvc.perform(get("/api/v1/users/addresses")
                        .principal(createMockPrincipal("customer@alight.com"))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].city").value("Mumbai"));
    }
}
