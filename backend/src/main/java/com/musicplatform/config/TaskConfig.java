package com.musicplatform.config;


import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Component
public class TaskConfig {

    private final LocalDateTime time = LocalDateTime.now();

//    @Scheduled(fixedRate = 5000)
//    public void getTime(){
//      log.info("现在的时间是{}",time);
//    }

}
