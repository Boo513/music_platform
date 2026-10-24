package com.musicplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MusicPlatformApplication {
    public static void main(String[] args) {
        SpringApplication.run(MusicPlatformApplication.class, args);
    }
}
