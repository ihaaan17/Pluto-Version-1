package com.pluto.chat.pluto_app_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // IMPORTANT: Explicit origins (no wildcard with credentials)
        config.addAllowedOrigin("https://pluto-chatgalaxy.vercel.app");  // ← Your live Vercel frontend
        config.addAllowedOrigin("http://localhost:5173");                // Local Vite dev
        config.addAllowedOrigin("http://localhost:3000");                // Optional: CRA dev
        config.addAllowedOrigin("http://127.0.0.1:5173");

        // Alternative: use patterns (still works with credentials in Spring Boot 3+)
        // config.addAllowedOriginPattern("https://*.vercel.app");
        // config.addAllowedOriginPattern("http://localhost:*");

        config.addAllowedMethod("*");          // GET, POST, OPTIONS, etc.
        config.addAllowedHeader("*");          // Authorization, Content-Type, etc.
        config.setAllowCredentials(true);      // Required for JWT/cookies
        config.setMaxAge(3600L);               // Cache preflight 1 hour

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}