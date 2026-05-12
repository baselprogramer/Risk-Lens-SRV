package com.sdn.blacklist.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class OpenApiConfig {

    @Value("${app.server-url:http://localhost:8080}")
    private String serverUrl;

    @Bean
    public OpenAPI blacklistOpenAPI() {
        return new OpenAPI()
            .info(buildInfo())
            .servers(buildServers())
            .components(buildComponents())
            .security(buildGlobalSecurity());
    }

    private Info buildInfo() {
        return new Info()
            .title("Blacklist API / SRLS")
            .version("1.0.0")
            .description("Sanctions & Risk Level Screening API")
            .contact(new Contact()
                .name("SRLS Support")
                .email("support@srls.io"));
    }

    private List<Server> buildServers() {
        return List.of(
            new Server()
                .url(serverUrl)
                .description("Current environment")
        );
    }

    private Components buildComponents() {
        return new Components()
            .addSecuritySchemes("bearerAuth",
                new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT من POST /auth/authenticate"))
            .addSecuritySchemes("apiKeyAuth",
                new SecurityScheme()
                    .type(SecurityScheme.Type.APIKEY)
                    .in(SecurityScheme.In.HEADER)
                    .name("X-API-Key")
                    .description("API Key"));
    }

    private List<SecurityRequirement> buildGlobalSecurity() {
        return List.of(
            new SecurityRequirement().addList("bearerAuth"),
            new SecurityRequirement().addList("apiKeyAuth")
        );
    }
}
