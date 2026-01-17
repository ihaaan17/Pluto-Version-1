// src/main/java/com/pluto/chat/pluto_app_backend/repository/UserRepository.java
package com.pluto.chat.pluto_app_backend.repository;

import com.pluto.chat.pluto_app_backend.entities.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
}