package com.pluto.chat.pluto_app_backend.service;

import com.pluto.chat.pluto_app_backend.entities.Message;
import com.pluto.chat.pluto_app_backend.entities.Room;
import java.util.List;
import java.util.Optional;

public interface RoomService {
    Room createOrJoinRoom(String roomId, String username);
    Optional<Room> getRoomByRoomId(String roomId);
    Room saveRoom(Room room);
    List<Room> getRoomsByIds(List<String> roomIds);
    Room addMessage(String roomId, Message message);
}