package com.pluto.chat.pluto_app_backend.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "rooms")
public class Room {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String roomId;
    
    @Builder.Default
    private List<Message> messages = new ArrayList<>();
    
    @Builder.Default
    private List<String> members = new ArrayList<>();
}