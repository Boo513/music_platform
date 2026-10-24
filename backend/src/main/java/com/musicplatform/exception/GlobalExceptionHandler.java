package com.musicplatform.exception;

import com.musicplatform.dto.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException e, HttpServletResponse response) {
        prepareJsonResponse(response);
        return ResponseEntity.status(e.getCode())
                .contentType(MediaType.APPLICATION_JSON)
                .body(ApiResponse.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e, HttpServletResponse response) {
        prepareJsonResponse(response);
        FieldError field = e.getBindingResult().getFieldError();
        String msg = field != null ? field.getDefaultMessage() : "参数校验失败";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body(ApiResponse.error(400, msg));
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingPart(MissingServletRequestPartException e, HttpServletResponse response) {
        prepareJsonResponse(response);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body(ApiResponse.error(400, "缺少必填参数: " + e.getRequestPartName()));
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ApiResponse<Void>> handleMultipart(MultipartException e, HttpServletResponse response) {
        prepareJsonResponse(response);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body(ApiResponse.error(400, "文件上传参数错误"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleOther(Exception e, HttpServletResponse response) {
        if (isClientDisconnect(e)) {
            log.debug("客户端断开连接: {}", e.getMessage());
            return null;
        }
        log.error("未处理异常", e);
        if (!prepareJsonResponse(response)) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(ApiResponse.error(500, "服务器内部错误"));
    }

    /**
     * 重置响应并强制 JSON Content-Type，避免流媒体端点已预设的 audio/mpeg 导致
     * HttpMessageNotWritableException（No converter for ApiResponse with preset Content-Type）。
     * 返回 false 表示响应已提交，无法再写入错误体。
     */
    private boolean prepareJsonResponse(HttpServletResponse response) {
        if (response.isCommitted()) {
            return false;
        }
        response.reset();
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        return true;
    }

    private boolean isClientDisconnect(Exception e) {
        Throwable cause = e;
        while (cause != null) {
            String name = cause.getClass().getName();
            String msg = String.valueOf(cause.getMessage()).toLowerCase();
            if (name.contains("ClientAbort")
                    || msg.contains("broken pipe")
                    || msg.contains("connection reset")
                    || msg.contains("connection abort")
                    || msg.contains("connection closed")) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }
}
