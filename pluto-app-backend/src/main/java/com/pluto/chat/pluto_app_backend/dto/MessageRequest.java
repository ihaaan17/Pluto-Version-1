// You already have this in payload package — keep it or move to dto
package com.pluto.chat.pluto_app_backend.dto;

public record MessageRequest(String roomId, String sender, String content) {}