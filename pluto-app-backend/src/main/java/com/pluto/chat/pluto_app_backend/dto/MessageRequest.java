package com.pluto.chat.pluto_app_backend.dto;

import lombok.Data;

@Data
public class MessageRequest {
    private String sender;
    private String content;
}