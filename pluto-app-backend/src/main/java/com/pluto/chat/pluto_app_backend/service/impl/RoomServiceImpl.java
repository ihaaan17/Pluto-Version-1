package com.pluto.chat.pluto_app_backend.service.impl;

import com.pluto.chat.pluto_app_backend.entities.Message;
import com.pluto.chat.pluto_app_backend.entities.Room;
import com.pluto.chat.pluto_app_backend.repository.RoomRepository;
import com.pluto.chat.pluto_app_backend.service.RoomService;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class RoomServiceImpl implements RoomService {
    
    private final RoomRepository roomRepository;

    public RoomServiceImpl(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Override
    public Room createOrJoinRoom(String roomId, String username) {
        String normalized = roomId.toLowerCase().trim();
        
        // Try to find existing room
        Optional<Room> existingRoom = roomRepository.findByRoomId(normalized);
        
        if (existingRoom.isPresent()) {
            // Room exists, add user if not already a member
            Room room = existingRoom.get();
            if (!room.getMembers().contains(username)) {
                room.getMembers().add(username);
                return roomRepository.save(room);
            }
            return room;
        }
        
        // Create new room
        Room newRoom = Room.builder()
                .roomId(normalized)
                .members(new ArrayList<>(List.of(username)))
                .messages(new ArrayList<>())
                .build();
        
        return roomRepository.save(newRoom);
    }

    @Override
    public Optional<Room> getRoomByRoomId(String roomId) {
        return roomRepository.findByRoomId(roomId.toLowerCase().trim());
    }

    @Override
    public Room saveRoom(Room room) {
        return roomRepository.save(room);
    }

    @Override
    public List<Room> getRoomsByIds(List<String> roomIds) {
        if (roomIds == null || roomIds.isEmpty()) {
            return Collections.emptyList();
        }
        // Normalize all room IDs
        List<String> normalizedIds = roomIds.stream()
                .map(id -> id.toLowerCase().trim())
                .toList();
        return roomRepository.findAllByRoomIdIn(normalizedIds);
    }

    @Override
    public Room addMessage(String roomId, Message message) {
        Room room = getRoomByRoomId(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));
        room.getMessages().add(message);
        return roomRepository.save(room);
    }
}