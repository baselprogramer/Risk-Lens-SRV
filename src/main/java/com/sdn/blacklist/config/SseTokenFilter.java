package com.sdn.blacklist.config;

import java.io.IOException;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(1)
public class SseTokenFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilterAsyncDispatch() {
        return false;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // شتغل بس على الـ SSE endpoint
        return !request.getRequestURI().contains("/notifications/subscribe");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        // ✅ الـ token بيجي في الـ Authorization header مباشرة من fetch
        // هاد الـ filter بيضمن إن الـ async dispatch يشتغل بنفس الـ auth context
        chain.doFilter(request, response);
    }
}