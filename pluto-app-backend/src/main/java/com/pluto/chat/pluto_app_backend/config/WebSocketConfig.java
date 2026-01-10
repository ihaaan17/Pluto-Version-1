package com.pluto.chat.pluto_app_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");                    // Clients subscribe here
        config.setApplicationDestinationPrefixes("/app");       // Clients send here
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Allow your frontend origin (change if using different port)
        registry.addEndpoint("/chat")
                .setAllowedOriginPatterns("http://localhost:*")  // Allows 3000, 5173, etc.
                .withSockJS();  // Fallback for browsers without native WebSocket
    }
}