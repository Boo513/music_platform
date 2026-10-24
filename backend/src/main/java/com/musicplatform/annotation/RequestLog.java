package com.musicplatform.annotation;

import java.lang.annotation.*;

/**
 * 请求日志描述。Controller 包下所有方法默认已自动记录入参/返回值，
 * 在类或方法上加此注解可补充接口用途说明。
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequestLog {

    /** 日志描述，便于识别接口用途 */
    String value() default "";
}
