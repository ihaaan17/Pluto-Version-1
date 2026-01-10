package com.pluto.chat.pluto_app_backend.payload;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRequest {
    private String roomId;
    private String sender;
    private String content;
}