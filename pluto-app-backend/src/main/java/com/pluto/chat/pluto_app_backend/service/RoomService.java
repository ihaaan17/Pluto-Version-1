package com.pluto.chat.pluto_app_backend.service;

import java.util.List;

import com.pluto.chat.pluto_app_backend.entities.Message;
import com.pluto.chat.pluto_app_backend.entities.Room;

public interface RoomService {
    Room getRoomByRoomId(String roomId);
    Room createRoom(String roomId);
    Room addMessage(String roomId, Message message);
    List<Room> getRoomsByIds(List<String> roomIds);
    Room saveRoom(Room room);
    
}