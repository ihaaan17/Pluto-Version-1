package com.pluto.chat.pluto_app_backend.controller;

import com.pluto.chat.pluto_app_backend.entities.Room;
import com.pluto.chat.pluto_app_backend.entities.User;
import com.pluto.chat.pluto_app_backend.service.RoomService;
import com.pluto.chat.pluto_app_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")  // Change to specific origins in production
public class UserController {

    private final UserService userService;
    private final RoomService roomService;  // Inject RoomService for joined rooms

    public UserController(UserService userService, RoomService roomService) {
        this.userService = userService;
        this.roomService = roomService;
    }

    // Get single user (profile/info)
    @GetMapping("/{username}")
    public ResponseEntity<User> getUser(@PathVariable String username) {
        String normalized = username.trim().toLowerCase();
        System.out.println("Fetching user profile: " + normalized);

        return userService.getUserByUsername(normalized)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    System.out.println("User not found: " + normalized);
                    return ResponseEntity.notFound().build();
                });
    }

    // IMPORTANT: This is the MISSING endpoint your ChatList needs!
    @GetMapping("/{username}/rooms")
    public ResponseEntity<List<Room>> getJoinedRooms(@PathVariable String username) {
        String normalized = username.trim().toLowerCase();
        System.out.println("Fetching joined rooms for user: " + normalized);

        Optional<User> userOpt = userService.getUserByUsername(normalized);

        if (userOpt.isEmpty()) {
            System.out.println("User not found: " + normalized);
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        // Null-safe: prevent NPE if joinedRooms is somehow null
        List<String> joinedRoomIds = user.getJoinedRooms() != null 
            ? user.getJoinedRooms() 
            : new ArrayList<>();

        System.out.println("User has " + joinedRoomIds.size() + " joined rooms");

        List<Room> rooms = roomService.getRoomsByIds(joinedRoomIds);

        return ResponseEntity.ok(rooms);
    }
}