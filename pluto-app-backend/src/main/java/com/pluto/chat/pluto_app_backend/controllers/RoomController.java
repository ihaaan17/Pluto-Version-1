package com.pluto.chat.pluto_app_backend.controller;

import com.pluto.chat.pluto_app_backend.dto.CreateRoomRequest;
import com.pluto.chat.pluto_app_backend.dto.MessageRequest;
import com.pluto.chat.pluto_app_backend.entities.Message;
import com.pluto.chat.pluto_app_backend.entities.Room;
import com.pluto.chat.pluto_app_backend.service.RoomService;
import com.pluto.chat.pluto_app_backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rooms")
@CrossOrigin(origins = "*")
public class RoomController {
    
    private final RoomService roomService;
    private final UserService userService;

    public RoomController(RoomService roomService, UserService userService) {
        this.roomService = roomService;
        this.userService = userService;
    }

    // Existing endpoint - Create or Join (for backward compatibility)
    @PostMapping
    public ResponseEntity<Room> createOrJoinRoom(@RequestBody CreateRoomRequest request) {
        // Create or join the room
        Room room = roomService.createOrJoinRoom(request.getRoomId(), request.getUsername());
        
        // Add room to user's joined rooms
        userService.addRoomToUser(request.getUsername(), request.getRoomId());
        
        return ResponseEntity.ok(room);
    }

    // NEW: Create Room Only (fails if exists)
    @PostMapping("/create")
    public ResponseEntity<?> createRoom(@RequestBody CreateRoomRequest request) {
        try {
            System.out.println("🆕 Create room request: " + request.getRoomId() + " by " + request.getUsername());
            
            // Check if room already exists
            if (roomService.getRoomByRoomId(request.getRoomId()).isPresent()) {
                System.out.println("❌ Room already exists: " + request.getRoomId());
                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Room name already exists. Please choose a different name."));
            }
            
            // Create new room
            Room room = roomService.createOrJoinRoom(request.getRoomId(), request.getUsername());
            userService.addRoomToUser(request.getUsername(), request.getRoomId());
            
            System.out.println("✅ Room created successfully: " + request.getRoomId());
            return ResponseEntity.ok(room);
            
        } catch (RuntimeException e) {
            System.err.println("❌ Create room failed: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // NEW: Join Room Only (fails if doesn't exist)
    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(@RequestBody CreateRoomRequest request) {
        try {
            System.out.println("🚪 Join room request: " + request.getRoomId() + " by " + request.getUsername());
            
            // Check if room exists
            Room room = roomService.getRoomByRoomId(request.getRoomId())
                    .orElseThrow(() -> new RuntimeException("Room not found. Please check the room code."));
            
            // Add user to room if not already a member
            if (!room.getMembers().contains(request.getUsername())) {
                room.getMembers().add(request.getUsername());
                roomService.saveRoom(room);
                System.out.println("✅ User added to room: " + request.getUsername());
            } else {
                System.out.println("ℹ️ User already in room: " + request.getUsername());
            }
            
            // Add room to user's joined rooms
            userService.addRoomToUser(request.getUsername(), request.getRoomId());
            
            System.out.println("✅ User joined room successfully: " + request.getRoomId());
            return ResponseEntity.ok(room);
            
        } catch (RuntimeException e) {
            System.err.println("❌ Join room failed: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<Room> getRoom(@PathVariable String roomId) {
        return roomService.getRoomByRoomId(roomId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Room>> getUserRooms(@PathVariable String username) {
        return userService.getUserByUsername(username)
                .map(user -> {
                    List<Room> rooms = roomService.getRoomsByIds(user.getJoinedRooms());
                    return ResponseEntity.ok(rooms);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{roomId}/messages")
    public ResponseEntity<Room> addMessage(
            @PathVariable String roomId,
            @RequestBody MessageRequest request) {
        
        Message message = Message.builder()
                .sender(request.getSender())
                .content(request.getContent())
                .build();
        
        Room updatedRoom = roomService.addMessage(roomId, message);
        return ResponseEntity.ok(updatedRoom);
    }
}