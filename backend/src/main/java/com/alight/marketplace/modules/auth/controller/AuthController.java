package com.alight.marketplace.modules.auth.controller;

import com.alight.marketplace.common.exception.UnauthorizedException;
import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.auth.dto.*;
import com.alight.marketplace.modules.auth.service.AuthService;
import com.alight.marketplace.modules.user.dto.UserProfileDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user registration, authentication, token refresh, lockout protection, password management, and email verification")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user account (Customer or Vendor)", description = "Creates a new user profile with password encryption and assigns default role")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(ApiResponse.success(response, "Account registered successfully"), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials", description = "Verifies email and password with automated account lockout protection after 5 consecutive failed attempts")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh expired access token", description = "Validates refresh token and issues a rotated new access/refresh token pair")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Log out user", description = "Revokes active refresh tokens for the authenticated user")
    public ResponseEntity<ApiResponse<Void>> logout(Principal principal) {
        if (principal != null && principal.getName() != null) {
            authService.logout(principal.getName());
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile", description = "Retrieves profile and permissions of the currently authenticated JWT bearer")
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentUser(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new UnauthorizedException("Authentication required to retrieve current user profile");
        }
        UserProfileDto profile = authService.getCurrentUser(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset token", description = "Generates a secure, 1-hour single-use password reset token for the specified email")
    public ResponseEntity<ApiResponse<Map<String, String>>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String tokenOrMsg = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Password reset instructions processed", "token", tokenOrMsg)));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using token", description = "Resets user password given a valid single-use reset token and revokes all active user sessions")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password has been reset successfully. Please log in with your new password."));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password for authenticated user", description = "Validates current password and updates to new password, revoking active sessions")
    public ResponseEntity<ApiResponse<Void>> changePassword(Principal principal, @Valid @RequestBody ChangePasswordRequest request) {
        if (principal == null || principal.getName() == null) {
            throw new UnauthorizedException("Authentication required to change password");
        }
        authService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully. Active sessions have been invalidated."));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify user email address", description = "Confirms ownership of email address using a single-use verification token")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.success("Email address verified successfully."));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend email verification token", description = "Generates and sends a new 24-hour single-use email verification token")
    public ResponseEntity<ApiResponse<Map<String, String>>> resendVerification(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new UnauthorizedException("Authentication required to request email verification resend");
        }
        String token = authService.resendEmailVerification(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Verification token generated successfully", "token", token)));
    }
}
