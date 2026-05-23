package com.sdn.blacklist.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.sdn.blacklist.apikey.filter.ApiKeyAuthFilter;
import com.sdn.blacklist.security.CustomUserDetailsService;
import com.sdn.blacklist.security.JwtAuthenticationFilter;
import com.sdn.blacklist.tenant.filter.TenantFilter;

@EnableMethodSecurity
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter  jwtAuthFilter;
    private final ApiKeyAuthFilter         apiKeyAuthFilter;
    private final CustomUserDetailsService userDetailsService;
    private final TenantFilter             tenantFilter;

    public SecurityConfig(
        JwtAuthenticationFilter jwtAuthFilter,
        ApiKeyAuthFilter apiKeyAuthFilter,
        CustomUserDetailsService userDetailsService,
        TenantFilter tenantFilter
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.apiKeyAuthFilter = apiKeyAuthFilter;
        this.userDetailsService = userDetailsService;
        this.tenantFilter = tenantFilter;
    }
    



    private static final String V1 = ApiVersion.V1;

    // ── Role shortcuts ──
    private static final String[] SUPER_ONLY  = {"SUPER_ADMIN"};
    private static final String[] ADMINS      = {"SUPER_ADMIN", "COMPANY_ADMIN"};
    private static final String[] ALL_ROLES   = {"SUPER_ADMIN", "COMPANY_ADMIN", "SUBSCRIBER"};

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        
        authProvider.setUserDetailsService(userDetailsService); // تأكد أن اسم المتغير صحيح
        authProvider.setPasswordEncoder(passwordEncoder()); // هنا يجب تمرير الـ Encoder وليس الـ Service
        
        return authProvider;
    }


    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Configuration
    public class WebConfig implements WebMvcConfigurer {
        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
            registry.addResourceHandler("/assets/**")
                    .addResourceLocations("classpath:/static/assets/");
            registry.addResourceHandler("/logo.svg")
                    .addResourceLocations("classpath:/static/");
            registry.addResourceHandler("/index.html")
                    .addResourceLocations("classpath:/static/");
        }
    }

    @Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000", // test server IP origin
        "http://api.risk-lens.net",
        "https://api.risk-lens.net",
        "https://risk-lens.net"
    ));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth

                 .requestMatchers(
                "/swagger-ui.html",
                "/swagger-ui/**",
                "/v3/api-docs",
                "/v3/api-docs/**",
                "/webjars/**"
                 ).permitAll()

                // ── Static / SPA ──
                .requestMatchers("/", "/login", "/dashboard", "/screen",
                    "/search", "/transfer", "/local", "/list", "/audit",
                    "/users", "/cases", "/api-keys", "/companies",
                    "/assets/**", "/logo.svg", "/favicon.ico", "/index.html").permitAll()

                // ── Public ──
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(V1 + "/auth/authenticate").permitAll()

                

                // ── SUPER_ADMIN فقط ──
                .requestMatchers(V1 + "/super/**").hasAnyRole(SUPER_ONLY)

                // ── SUPER_ADMIN + COMPANY_ADMIN ──
                .requestMatchers(V1 + "/auth/register").hasAnyRole(ADMINS)
                .requestMatchers(V1 + "/admin/users").hasAnyRole(ADMINS)
                .requestMatchers(V1 + "/admin/api-keys").hasAnyRole(SUPER_ONLY)
                .requestMatchers(V1 + "/elastic/**").hasAnyRole(ADMINS)
                .requestMatchers(V1 + "/local/**").hasAnyRole(SUPER_ONLY)
                .requestMatchers(V1 + "/local-sanctions/**").hasAnyRole(SUPER_ONLY)
                .requestMatchers(V1 + "/ofac/**").hasAnyRole(ADMINS)
                .requestMatchers(V1 + "/sync/**").hasAnyRole(ADMINS)
                .requestMatchers(V1 + "/admin/sync/**").hasAnyRole(ADMINS)
                .requestMatchers(V1 + "/webhooks/**").hasAnyRole(ADMINS)
                .requestMatchers(V1 + "/monitoring/**").hasAnyRole(ADMINS)



                // ── كل الـ Roles ──
                .requestMatchers(V1 + "/search/**").hasAnyRole(ALL_ROLES)
                .requestMatchers(V1 + "/screening/**").hasAnyRole(ALL_ROLES)
                .requestMatchers(V1 + "/transfer/**").hasAnyRole(ALL_ROLES)
                .requestMatchers(V1 + "/decisions/**").hasAnyRole(ALL_ROLES)
                .requestMatchers(V1 + "/dashboard/**").hasAnyRole(ALL_ROLES)
                .requestMatchers(V1 + "/cases/**").hasAnyRole(ALL_ROLES)
                .requestMatchers(V1 + "/loan/**").hasAnyRole(ALL_ROLES)

                .anyRequest().authenticated()
            )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(apiKeyAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter,    UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(tenantFilter,      UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
