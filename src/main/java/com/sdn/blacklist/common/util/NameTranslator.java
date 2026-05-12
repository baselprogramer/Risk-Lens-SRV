package com.sdn.blacklist.common.util;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class NameTranslator {

    private static final Map<String, String> CACHE = new ConcurrentHashMap<>();

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final String GOOGLE_URL =
        "https://translate.googleapis.com/translate_a/single" +
        "?client=gtx&sl=%s&tl=%s&dt=t&q=%s";

    // ══════════════════════════════════════════
    //  عربي → إنجليزي
    // ══════════════════════════════════════════
    public static String translateName(String name) {
        return translateNameViaApi(name);
    }

    public static String translateNameViaApi(String name) {
        if (name == null || name.isBlank()) return "";
        if (!isArabic(name)) return name;

        String cached = CACHE.get(name);
        if (cached != null && !cached.isBlank()) return cached;

        String result = translateViaGoogle(name, "ar", "en");

        if (result != null && !result.isBlank()) {
            CACHE.put(name, result);
            return result;
        }

        return name;
    }

    // ══════════════════════════════════════════
    //  إنجليزي → عربي
    // ══════════════════════════════════════════
    public static String translateToArabic(String name) {
        if (name == null || name.isBlank()) return "";
        if (isArabic(name)) return name;

        String cacheKey = "ar_" + name;
        String cached = CACHE.get(cacheKey);
        if (cached != null && !cached.isBlank()) return cached;

        String result = translateViaGoogle(name, "en", "ar");

        if (result != null && !result.isBlank()) {
            CACHE.put(cacheKey, result);
            return result;
        }

        return name;
    }

    // ══════════════════════════════════════════
    //  Google Translate
    // ══════════════════════════════════════════
    private static String translateViaGoogle(String text, String from, String to) {
        try {
            String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8)
                                       .replace("+", "%20");
            String url = String.format(GOOGLE_URL, from, to, encoded);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(2))
                    .header("User-Agent", "Mozilla/5.0")
                    .GET()
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(
                    request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() == 200) {
                JsonNode root  = MAPPER.readTree(response.body());
                JsonNode parts = root.path(0);
                StringBuilder sb = new StringBuilder();
                for (JsonNode part : parts) {
                    JsonNode translated = part.path(0);
                    if (!translated.isMissingNode() && !translated.asText().isBlank()) {
                        sb.append(translated.asText());
                    }
                }
                String result = sb.toString().trim();
                if (!result.isBlank()) return result;
            }
        } catch (Exception e) {
            System.err.println("Google Translate failed for [" + text + "]: " + e.getMessage());
        }
        return null;
    }

    private static boolean isArabic(String name) {
        return name.chars().anyMatch(c -> c >= 0x0600 && c <= 0x06FF);
    }

    public static void clearCache() { CACHE.clear(); }
    public static int getCacheSize() { return CACHE.size(); }
}