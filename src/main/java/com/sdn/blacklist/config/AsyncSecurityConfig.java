package com.sdn.blacklist.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.task.DelegatingSecurityContextAsyncTaskExecutor;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


@Configuration
public class AsyncSecurityConfig implements WebMvcConfigurer {

    @Bean
    public AsyncTaskExecutor asyncTaskExecutor() {
        // يغلّف الـ executor بـ DelegatingSecurityContext
        // عشان الـ authentication يتنقل مع كل async task
        return new DelegatingSecurityContextAsyncTaskExecutor(
            new SimpleAsyncTaskExecutor("sse-async-")
        );
    }

    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        configurer.setTaskExecutor(asyncTaskExecutor());
        configurer.setDefaultTimeout(25 * 60 * 1000L); // 25 دقيقة
    }
}