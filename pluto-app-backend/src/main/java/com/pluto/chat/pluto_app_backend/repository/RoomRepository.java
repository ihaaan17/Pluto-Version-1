package com.pluto.chat.pluto_app_backend.repository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.pluto.chat.pluto_app_backend.entities.Room;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.List;
public interface RoomRepository extends MongoRepository<Room, String> {
    Optional<Room> findByRoomId(String roomId);
    List<Room> findAllByRoomIdIn(List<String> roomIds);
}