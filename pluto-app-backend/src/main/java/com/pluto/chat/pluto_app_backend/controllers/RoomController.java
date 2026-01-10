package com.pluto.chat.pluto_app_backend.controllers;

import com.pluto.chat.pluto_app_backend.dto.CreateRoomRequest;
import com.pluto.chat.pluto_app_backend.dto.JoinRoomRequest;
import com.pluto.chat.pluto_app_backend.entities.Message;
import com.pluto.chat.pluto_app_backend.entities.Room;
import com.pluto.chat.pluto_app_backend.repository.RoomRepository;
import com.pluto.chat.pluto_app_backend.service.RoomService;
import com.pluto.chat.pluto_app_backend.service.UserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomService roomService;
    private final UserService userService;
    private final RoomRepository roomRepository;

    public RoomController(RoomService roomService, UserService userService, RoomRepository roomRepository) {
        this.roomService = roomService;
        this.userService = userService;
        this.roomRepository = roomRepository;
    }

    // POST /api/v1/rooms → Create room with username
    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody CreateRoomRequest request) {
        if (request.roomId() == null || request.roomId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Room ID cannot be empty");
        }
        if (request.username() == null || request.username().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Username cannot be empty");
        }

        String roomId = request.roomId().trim();
        String username = request.username().trim();

        // Check if room already exists
        if (roomService.getRoomByRoomId(roomId) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Room already exists");
        }

        // Create room
        Room room = roomService.createRoom(roomId);

        // Add creator as member
        room.getMembers().add(username);

        // Save updated room (with member)
        roomRepository.save(room);  // We'll fix this below

        // Add room to user's joined list
        userService.addRoomToUser(username, roomId);

        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    // GET /api/v1/rooms/{roomId}
    @GetMapping("/{roomId}")
    public ResponseEntity<Room> getRoom(@PathVariable String roomId) {
        Room room = roomService.getRoomByRoomId(roomId);
        if (room == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(room);
    }

    // GET /api/v1/rooms/{roomId}/messages
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Room room = roomService.getRoomByRoomId(roomId);
        if (room == null) {
            return ResponseEntity.notFound().build();
        }

        List<Message> messages = room.getMessages();
        if (messages.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        int total = messages.size();
        int start = Math.max(0, total - (page + 1) * size);
        int end = Math.max(start, total - page * size);

        if (start >= end) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Message> paginated = messages.subList(start, end);
        Collections.reverse(paginated); // newest first

        return ResponseEntity.ok(paginated);
    }

    // POST /api/v1/rooms/{roomId}/join
    @PostMapping("/{roomId}/join")
    public ResponseEntity<String> joinRoom(
            @PathVariable String roomId,
            @RequestBody JoinRoomRequest request) {

        Room room = roomService.getRoomByRoomId(roomId);
        if (room == null) {
            return ResponseEntity.notFound().build();
        }

        String username = request.username().trim();
        if (!room.getMembers().contains(username)) {
            room.getMembers().add(username);
            roomRepository.save(room);  // Save updated members
        }

        userService.addRoomToUser(username, roomId);

        return ResponseEntity.ok("Joined room successfully");
    }
}