package com.pluto.chat.pluto_app_backend.service.impl;

import com.pluto.chat.pluto_app_backend.entities.Message;
import com.pluto.chat.pluto_app_backend.entities.Room;
import com.pluto.chat.pluto_app_backend.repository.RoomRepository;
import com.pluto.chat.pluto_app_backend.service.RoomService;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;

    public RoomServiceImpl(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Override
    public Room getRoomByRoomId(String roomId) {
        return roomRepository.findByRoomId(roomId).orElse(null);
    }

    @Override
    public Room createRoom(String roomId) {
        return roomRepository.findByRoomId(roomId)
                .orElseGet(() -> {
                    Room newRoom = new Room();
                    newRoom.setRoomId(roomId);
                    return roomRepository.save(newRoom);
                });
    }
    
    public Room saveRoom(Room room) {
        return roomRepository.save(room);
    }

    @Override
public List<Room> getRoomsByIds(List<String> roomIds) {
    return roomRepository.findAllById(roomIds);
}

    @Override
    public Room addMessage(String roomId, Message message) {
        Room room = getRoomByRoomId(roomId);
        if (room == null) {
            room = createRoom(roomId);
        }
        room.getMessages().add(message);
        return roomRepository.save(room);
    }
}