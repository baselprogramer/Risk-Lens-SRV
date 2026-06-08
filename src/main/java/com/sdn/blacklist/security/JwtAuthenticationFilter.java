package com.sdn.blacklist.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sdn.blacklist.apikey.repository.ApiKeyRepository;
import com.sdn.blacklist.user.entity.User;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final ApiKeyRepository apiKeyRepository; 

    public JwtAuthenticationFilter(JwtService jwtService,
                                   UserDetailsService userDetailsService,
                                   ApiKeyRepository apiKeyRepository) { 
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.apiKeyRepository = apiKeyRepository; 
    }
 
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Skip JWT processing for non-API requests (static resources, SPA routes)
        if (!request.getRequestURI().startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt      = authHeader.substring(7);
        final String username = jwtService.extractUsername(jwt);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        var userDetails = userDetailsService.loadUserByUsername(username);

        if (jwtService.isTokenValid(jwt, userDetails)) {

            boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

            if (!isSuperAdmin) {
                // ✅ نجيب الـ user عشان نعرف الـ tenantId
                User user = (User) userDetails;
                Long tenantId = user.getTenantId();

                // ✅ نتحقق من API Key على مستوى الـ tenant مش الـ user
                    if (tenantId != null) {
                var keyOpt = apiKeyRepository.findActiveByTenantId(tenantId);
                if (keyOpt.isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("""
                        {"error":"Subscription disabled","status":401,
                        "message":"Your subscription has been disabled. Contact your administrator."}
                        """);
                    return;
                }
                boolean isCompanyAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_COMPANY_ADMIN") || 
                                a.getAuthority().equals("ROLE_SUBSCRIBER"));

                String uri = request.getRequestURI();
                if (isCompanyAdmin && (uri.contains("/screening") || uri.contains("/transfer") || uri.contains("/search"))) {
                    apiKeyRepository.updateLastUsed(keyOpt.get().getId());
                }     }
            } 

            var authToken = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
    }

        filterChain.doFilter(request, response);
    }
}