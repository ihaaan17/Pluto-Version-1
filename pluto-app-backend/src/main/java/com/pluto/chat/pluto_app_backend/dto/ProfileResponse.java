package com.pluto.chat.pluto_app_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private String id;
    private String username;
    private String email;
    private LocalDateTime createdAt;
    private List<String> joinedRooms;
    private int totalRooms;
}