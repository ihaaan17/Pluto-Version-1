package com.pluto.chat.pluto_app_backend.controller;

import java.io.IOException;
import com.pluto.chat.pluto_app_backend.entities.Message;
import com.pluto.chat.pluto_app_backend.entities.MessageType;
import com.pluto.chat.pluto_app_backend.entities.Room;
import com.pluto.chat.pluto_app_backend.service.RoomService;
import org.springframework.http.*;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
@CrossOrigin(origins = "*")
public class ChatController {

    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(RoomService roomService, SimpMessagingTemplate messagingTemplate) {
        this.roomService = roomService;
        this.messagingTemplate = messagingTemplate;
    }

    // Real-time text message via WebSocket
    @MessageMapping("/chat/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public Message sendMessage(
            @DestinationVariable String roomId,
            @Payload Message message) {

        System.out.println("📩 Received message in room " + roomId + ": " + message.getContent());

        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now());
        }

        roomService.addMessage(roomId, message);
        return message;
    }

    // Upload photo using Freeimage.host (anonymous API)
    @PostMapping("/api/v1/rooms/{roomId}/photos")
    @ResponseBody
    public ResponseEntity<?> uploadPhoto(
            @PathVariable String roomId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("sender") String sender) {

        System.out.println("📷 Photo upload attempt for roomId: " + roomId);
        System.out.println("📷 Sender: " + sender);
        System.out.println("📷 File name: " + file.getOriginalFilename());
        System.out.println("📷 File size: " + file.getSize() + " bytes");

        // Unwrap Optional safely
        Room room = roomService.getRoomByRoomId(roomId)
                .orElseThrow(() -> {
                    System.out.println("❌ Room not found: " + roomId);
                    return new RuntimeException("Room not found: " + roomId);
                });

        if (file == null || file.isEmpty()) {
            System.out.println("❌ No file uploaded");
            return ResponseEntity.badRequest().body("No file uploaded");
        }

        String imageUrl = null;

        try {
            System.out.println("📤 Uploading to Freeimage.host...");
            
            // Upload to Freeimage.host (public anonymous API)
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // Use ByteArrayResource to avoid file system issues
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("source", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });
            body.add("action", "upload");
            body.add("key", "6d207e02198a847aa98d0a2a901485a5"); // Free API key

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://freeimage.host/api/1/upload",
                    HttpMethod.POST,
                    requestEntity,
                    Map.class
            );

            System.out.println("📥 Response from Freeimage.host: " + response.getBody());

            // Extract URL safely
            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null || !responseBody.containsKey("image")) {
                throw new IOException("Invalid response from Freeimage.host");
            }

            Map<String, Object> imageData = (Map<String, Object>) responseBody.get("image");
            if (imageData == null || !imageData.containsKey("url")) {
                throw new IOException("No image URL in response from Freeimage.host");
            }

            imageUrl = (String) imageData.get("url");
            System.out.println("✅ Image uploaded successfully: " + imageUrl);

            // Create message with photo
            Message message = Message.builder()
                    .sender(sender)
                    .content("📷 Photo")
                    .type(MessageType.IMAGE)
                    .mediaUrl(imageUrl)
                    .fileName(file.getOriginalFilename())
                    .fileSize(file.getSize())
                    .timestamp(LocalDateTime.now())
                    .build();

            // Save to room and broadcast
            roomService.addMessage(roomId, message);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, message);

            System.out.println("✅ Photo message broadcasted to room");

            return ResponseEntity.ok(Map.of(
                "success", true,
                "imageUrl", imageUrl,
                "message", "Photo uploaded successfully"
            ));

        } catch (Exception e) {
            System.err.println("❌ Upload failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "success", false,
                        "error", "Upload failed: " + e.getMessage()
                    ));
        }
    }
}