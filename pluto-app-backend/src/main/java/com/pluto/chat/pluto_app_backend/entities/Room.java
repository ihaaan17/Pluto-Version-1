// src/main/java/com/pluto/chat/pluto_app_backend/entities/Room.java

package com.pluto.chat.pluto_app_backend.entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "rooms")
public class Room {

    @Id
    private String id;

    private String roomId;

    private List<Message> messages = new ArrayList<>();

    // ← ADD THIS FIELD
    @Builder.Default  // Important for Lombok when initializing
    private List<String> members = new ArrayList<>();
}