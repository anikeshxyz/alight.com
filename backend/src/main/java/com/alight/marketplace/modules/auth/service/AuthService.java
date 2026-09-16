package com.alight.marketplace.modules.auth.service;

import com.alight.marketplace.modules.auth.dto.*;
import com.alight.marketplace.modules.user.dto.UserProfileDto;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(String email);

    UserProfileDto getCurrentUser(String email);

    String forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(String email, ChangePasswordRequest request);

    void verifyEmail(VerifyEmailRequest request);

    String resendEmailVerification(String email);
}
