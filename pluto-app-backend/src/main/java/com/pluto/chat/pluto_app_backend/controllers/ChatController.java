package com.pluto.chat.pluto_app_backend.controllers;

import com.pluto.chat.pluto_app_backend.entities.Message;
import com.pluto.chat.pluto_app_backend.payload.MessageRequest;
import com.pluto.chat.pluto_app_backend.service.RoomService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final RoomService roomService;

    public ChatController(RoomService roomService) {
        this.roomService = roomService;
    }

    /**
     * Client sends to: /app/chat/{roomId}
     * All subscribers to /topic/room/{roomId} receive the message
     */
    @MessageMapping("/chat/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public Message sendMessage(
            @DestinationVariable String roomId,
            MessageRequest request) {

        if (!roomId.equals(request.getRoomId())) {
            throw new IllegalArgumentException("Room ID mismatch");
        }

        // Create message
        Message message = new Message();
        message.setSender(request.getSender());
        message.setContent(request.getContent());
        message.setTimestamp(java.time.LocalDateTime.now());

        roomService.addMessage(roomId, message);

        return message;
    }
}