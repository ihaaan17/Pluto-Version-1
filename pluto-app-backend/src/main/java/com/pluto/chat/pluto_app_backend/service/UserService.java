package com.pluto.chat.pluto_app_backend.service;
import com.pluto.chat.pluto_app_backend.dto.ProfileResponse;
import com.pluto.chat.pluto_app_backend.dto.UpdateProfileRequest;
import com.pluto.chat.pluto_app_backend.dto.ChangePasswordRequest;

import com.pluto.chat.pluto_app_backend.dto.AuthResponse;
import com.pluto.chat.pluto_app_backend.dto.LoginRequest;
import com.pluto.chat.pluto_app_backend.dto.RegisterRequest;
import com.pluto.chat.pluto_app_backend.entities.User;                                                                                                                                                                                
import java.util.Optional;

public interface UserService {
    // New authentication methods
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    
    // Existing methods
    User loginOrCreateUser(String username);
    Optional<User> getUserByUsername(String username);
    User addRoomToUser(String username, String roomId);

        // Profile management methods
    ProfileResponse getProfile(String username);
    ProfileResponse updateProfile(String username, UpdateProfileRequest request);
    void changePassword(String username, ChangePasswordRequest request);
    void deleteAccount(String username, String password);

}