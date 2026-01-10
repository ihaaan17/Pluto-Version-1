// src/main/java/com/pluto/chat/pluto_app_backend/service/UserService.java
package com.pluto.chat.pluto_app_backend.service;

import com.pluto.chat.pluto_app_backend.entities.User;

public interface UserService {
    User registerOrLogin(String username);
    User addRoomToUser(String username, String roomId);
    User getUserByUsername(String username);
}