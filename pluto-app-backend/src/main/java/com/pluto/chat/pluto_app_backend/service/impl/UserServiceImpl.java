// src/main/java/com/pluto/chat/pluto_app_backend/service/impl/UserServiceImpl.java
package com.pluto.chat.pluto_app_backend.service.impl;

import com.pluto.chat.pluto_app_backend.entities.User;
import com.pluto.chat.pluto_app_backend.repository.UserRepository;
import com.pluto.chat.pluto_app_backend.service.UserService;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User registerOrLogin(String username) {
        return userRepository.findByUsername(username)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setUsername(username);
                    return userRepository.save(newUser);
                });
    }

    @Override
    public User addRoomToUser(String username, String roomId) {
        User user = registerOrLogin(username);
        if (!user.getJoinedRooms().contains(roomId)) {
            user.getJoinedRooms().add(roomId);
            userRepository.save(user);
        }
        return user;
    }

    @Override
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }
}