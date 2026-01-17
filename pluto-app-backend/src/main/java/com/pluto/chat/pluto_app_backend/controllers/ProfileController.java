package com.pluto.chat.pluto_app_backend.controllers;

import com.pluto.chat.pluto_app_backend.dto.ChangePasswordRequest;
import com.pluto.chat.pluto_app_backend.dto.ProfileResponse;
import com.pluto.chat.pluto_app_backend.dto.UpdateProfileRequest;
import com.pluto.chat.pluto_app_backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    // Get user profile
    @GetMapping("/{username}")
    public ResponseEntity<?> getProfile(@PathVariable String username) {
        try {
            System.out.println("👤 Fetching profile for: " + username);
            ProfileResponse profile = userService.getProfile(username);
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            System.err.println("❌ Profile fetch failed: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Update profile (username/email)
    @PutMapping("/{username}")
    public ResponseEntity<?> updateProfile(
            @PathVariable String username,
            @RequestBody UpdateProfileRequest request) {
        try {
            System.out.println("✏️ Updating profile for: " + username);
            ProfileResponse updatedProfile = userService.updateProfile(username, request);
            System.out.println("✅ Profile updated successfully");
            return ResponseEntity.ok(updatedProfile);
        } catch (RuntimeException e) {
            System.err.println("❌ Profile update failed: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Change password
    @PutMapping("/{username}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable String username,
            @RequestBody ChangePasswordRequest request) {
        try {
            System.out.println("🔐 Password change attempt for: " + username);
            userService.changePassword(username, request);
            System.out.println("✅ Password changed successfully");
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Password changed successfully"
            ));
        } catch (RuntimeException e) {
            System.err.println("❌ Password change failed: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Delete account
    @DeleteMapping("/{username}")
    public ResponseEntity<?> deleteAccount(
            @PathVariable String username,
            @RequestBody Map<String, String> request) {
        try {
            String password = request.get("password");
            System.out.println("🗑️ Account deletion attempt for: " + username);
            userService.deleteAccount(username, password);
            System.out.println("✅ Account deleted successfully");
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Account deleted successfully"
            ));
        } catch (RuntimeException e) {
            System.err.println("❌ Account deletion failed: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}