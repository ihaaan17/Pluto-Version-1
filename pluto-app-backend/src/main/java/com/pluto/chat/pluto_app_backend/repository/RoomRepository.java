package com.pluto.chat.pluto_app_backend.repository;

import com.pluto.chat.pluto_app_backend.entities.Room;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface RoomRepository extends MongoRepository<Room, String> {
    Optional<Room> findByRoomId(String roomId);
}