package com.sdn.blacklist.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

        @RequestMapping(value = {
            "/", "/login", "/dashboard", "/screen",
            "/search", "/transfer", "/local", "/list",
            "/audit", "/users", "/cases" ,"/api-keys" , "/companies", "/tenants"
        })
        public String index() {
            return "forward:/index.html";
        }
}