package com.pluto.chat.pluto_app_backend.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String username;
    private String email;
}