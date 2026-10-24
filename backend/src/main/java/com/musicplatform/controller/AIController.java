package com.musicplatform.controller;

import com.musicplatform.config.RestTemplateConfig;
import com.musicplatform.dto.AIRequestDto;
import com.musicplatform.dto.AIResponseDTO;
import com.musicplatform.entity.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Scanner;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private RestTemplateConfig restTemplate;
    private final String AGENT_URL = "http://localhost:5000/api/agent/chat";

    @PostMapping("/response")
    public void receiveAIResponse(@RequestBody AIResponseDTO dto) {
        String content = dto.getContent();

        System.out.println("========== AI 回答开始 ==========");

        // 流式输出到控制台
        streamPrint(content);

        System.out.println("\n========== AI 回答结束 ==========");
        System.out.println("总长度: " + content.length() + " 字符");

//        return Result.success("已接收并流式输出");
    }

    @PostMapping("pushQuestion")
    public Result pushQuestion(@RequestBody AIRequestDto aiRequestDto){
        try {
            ResponseEntity<Result> resp = restTemplate.restTemplate().postForEntity(AGENT_URL,aiRequestDto,Result.class);
            Result result = resp.getBody();
            if (result != null && result.getCode() == 200) {
                return Result.success(result.getMessage(),result.getData());
            } else {
                return Result.error("Python Agent 调用失败");
            }
        }catch (Exception e){
            return Result.error(500,e.getMessage());
        }
    }

    /**
     * 流式打印：逐字/逐词输出，模拟打字效果
     */
    private void streamPrint(String content) {
        // 简单按字符逐字输出
        for (char c : content.toCharArray()) {
            System.out.print(c);
            System.out.flush();

            try {
                Thread.sleep(30); // 30ms 每字
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    /**
     * 更细粒度：逐字输出
     */
    private void streamPrintCharByChar(String content) {
        for (char c : content.toCharArray()) {
            System.out.print(c);
            System.out.flush();

            try {
                Thread.sleep(30); // 30ms 每字
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

}