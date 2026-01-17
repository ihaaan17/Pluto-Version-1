package com.pluto.chat.pluto_app_backend.entities;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {
    private String sender;
    private String content;
    
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    @Builder.Default
    private MessageType type = MessageType.TEXT;
    
    private String mediaUrl;
    private String fileName;
    private Long fileSize;
    private String mimeType; // Add this field
}