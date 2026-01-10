// src/main/java/com/pluto/chat/pluto_app_backend/controllers/UserController.java
package com.pluto.chat.pluto_app_backend.controllers;

import com.pluto.chat.pluto_app_backend.entities.Room;
import com.pluto.chat.pluto_app_backend.entities.User;
import com.pluto.chat.pluto_app_backend.service.RoomService;
import com.pluto.chat.pluto_app_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final RoomService roomService;

    public UserController(UserService userService, RoomService roomService) {
        this.userService = userService;
        this.roomService = roomService;
    }

    // POST /api/v1/users/login → body: "Ishan"
    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody String username) {
        User user = userService.registerOrLogin(username.trim());
        return ResponseEntity.ok(user);
    }

    // GET /api/v1/users/Ishan/rooms → list of joined rooms
    @GetMapping("/{username}/rooms")
    public ResponseEntity<List<Room>> getJoinedRooms(@PathVariable String username) {
        User user = userService.getUserByUsername(username);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        List<Room> rooms = roomService.getRoomsByIds(user.getJoinedRooms());
        return ResponseEntity.ok(rooms);
    }
}