package com.musicplatform.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicplatform.annotation.RequestLog;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.lang.reflect.Method;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 自动记录 Controller 包下所有请求方法的入参和返回值。
 * 可选：在方法上加 {@link RequestLog} 自定义描述。
 */
@Aspect
@Component
public class RequestLogAspect {

    private static final Logger log = LoggerFactory.getLogger("REQUEST_LOG");
    private static final int MAX_PARAM_LENGTH = 2000;

    private final ObjectMapper objectMapper;

    public RequestLogAspect(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Around("within(com.musicplatform.controller..*) && execution(public * *(..))")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        if (method.getDeclaringClass() == Object.class) {
            return joinPoint.proceed();
        }

        String controller = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = method.getName();
        String desc = resolveDesc(method);
        Map<String, Object> params = buildParams(signature, joinPoint.getArgs());
        long start = System.currentTimeMillis();

        log.info("[请求] {}.{}{} 入参: {}", controller, methodName, desc, toJson(params));

        try {
            Object result = joinPoint.proceed();
            long cost = System.currentTimeMillis() - start;
            log.info("[响应] {}.{}{} 耗时: {}ms 返回: {}", controller, methodName, desc, cost, toJson(result));
            return result;
        } catch (Throwable e) {
            long cost = System.currentTimeMillis() - start;
            log.error("[异常] {}.{}{} 耗时: {}ms 异常: {}", controller, methodName, desc, cost, e.toString());
            throw e;
        }
    }

    private String resolveDesc(Method method) {
        RequestLog anno = method.getAnnotation(RequestLog.class);
        if (anno == null) anno = method.getDeclaringClass().getAnnotation(RequestLog.class);
        return (anno != null && !anno.value().isEmpty()) ? "(" + anno.value() + ")" : "";
    }

    private Map<String, Object> buildParams(MethodSignature signature, Object[] args) {
        String[] names = signature.getParameterNames();
        Map<String, Object> params = new LinkedHashMap<>();
        if (names == null) {
            for (int i = 0; i < args.length; i++) {
                params.put("arg" + i, args[i]);
            }
        } else {
            for (int i = 0; i < names.length; i++) {
                params.put(names[i], args[i]);
            }
        }
        return params;
    }

    private String toJson(Object obj) {
        if (obj == null) return "null";
        Object safe = sanitize(obj);
        try {
            String json = objectMapper.writeValueAsString(safe);
            return json.length() > MAX_PARAM_LENGTH ? json.substring(0, MAX_PARAM_LENGTH) + "...(截断)" : json;
        } catch (Exception e) {
            return String.valueOf(safe);
        }
    }

    /** MultipartFile / Resource 不可 JSON 序列化，转为摘要信息 */
    private Object sanitize(Object obj) {
        if (obj instanceof MultipartFile file) {
            return Map.of("filename", file.getOriginalFilename() == null ? "" : file.getOriginalFilename(),
                    "size", file.getSize(),
                    "contentType", file.getContentType() == null ? "" : file.getContentType());
        }
        if (obj instanceof Resource resource) {
            return "Resource:" + (resource.getFilename() != null ? resource.getFilename() : resource.getDescription());
        }
        return obj;
    }
}
