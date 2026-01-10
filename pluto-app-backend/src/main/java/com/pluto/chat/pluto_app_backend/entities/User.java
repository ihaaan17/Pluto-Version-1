// src/main/java/com/pluto/chat/pluto_app_backend/entities/User.java
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
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String username;  // Unique

    @Builder.Default
    private List<String> joinedRooms = new ArrayList<>();  // List of roomIds
}