package com.sdn.blacklist.common.util;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class NameTranslator {

    private static final Map<String, String> CACHE = new ConcurrentHashMap<>();

    // بادئة مفتاح الترجمة الدلالية بالـ cache (للشركات) — منفصلة عن الرومنة
    private static final String SEMANTIC_PREFIX = "sem_";

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(800))
            .build();

    private static final ObjectMapper MAPPER = new ObjectMapper();

    // %s(1)=sl  %s(2)=tl  %s(3)=dt segment  %s(4)=encoded query
    private static final String GOOGLE_URL =
            "https://translate.googleapis.com/translate_a/single" +
            "?client=gtx&sl=%s&tl=%s%s&q=%s";

    // ══════════════════════════════════════════
    // عربي → إنجليزي  (romanization / transliteration — مش ترجمة دلالية)
    // ══════════════════════════════════════════
    public static String translateName(String name) {
        return translateNameViaApi(name);
    }

    public static String translateNameViaApi(String name) {
        if (name == null || name.isBlank())
            return "";
        if (!isArabic(name))
            return name;

        String cached = CACHE.get(name);
        if (cached != null && !cached.isBlank())
            return cached;

        JsonNode root = callGoogleRaw(name, "ar", "en", "&dt=t&dt=rm");

        // نفس المكالمة بترجّع الاثنين (dt=rm رومنة + dt=t ترجمة). منخزّن الترجمة
        // الدلالية بالـ cache (تحت بادئة sem_) حتى translateNameSemantic تقرأها
        // مجاناً بلا مكالمة Google تانية — بتفيد مطابقة الشركات (شركة→company).
        String sem = extractTranslation(root);
        if (sem != null && !sem.isBlank())
            CACHE.put(SEMANTIC_PREFIX + name, stripDiacritics(sem));
        else
            CACHE.put(SEMANTIC_PREFIX + name, "");   // كاش سلبي — ما نعيد المكالمة

        // 1) الأساس للأسماء: النطق الصوتي (romanization) — "وسيم أسد" → "wasim asad"
        String rom = extractRomanization(root);
        if (rom != null && !rom.isBlank()) {
            CACHE.put(name, rom);
            return rom;
        }

        // 2) فشل الـ romanization → رجّع الاسم العربي الأصلي حتى الـ caller
        //    يوقع على الـ local transliterate fallback (ما منرجع الترجمة الدلالية أبداً)
        return name;
    }

    // ══════════════════════════════════════════
    // الترجمة الدلالية عربي → إنجليزي  (للشركات/المنظّمات)
    //   "شركة الادهم للصرافة" → "al-adham exchange company"
    //   "وسيم أسد" (شخص)       → "handsome lion"  (غلط للأشخاص)
    // مهم: هاي تُستعمل كـ query بحث **منفصل** عن الرومنة، مش مدموجة معها. المطابق
    // بياخد أعلى تطابق لكل مرشّح → الشخص بيمسك بالرومنة، الشركة بتمسك بالترجمة.
    // لهيك ترجمة الشخص الغلط ("handsome lion") بتمسك صفر وما بتأذي — بينما رومنته
    // بتمسكه صح. صفر مخاطرة على الأشخاص.
    // بترجّع "" لو ما في اسم عربي أو ما في ترجمة (والـ caller بيتخطّى البحث).
    // ══════════════════════════════════════════
    public static String translateNameSemantic(String name) {
        if (name == null || name.isBlank() || !isArabic(name))
            return "";

        // 1) الأغلب: translateNameViaApi انحكت قبل (بحث الرومنة) فالترجمة مكاشة
        String cached = CACHE.get(SEMANTIC_PREFIX + name);
        if (cached != null)              // ملاحظة: "" قيمة صالحة (كاش سلبي) → لا مكالمة
            return cached;

        // 2) ما انكاشت (استُدعيت مباشرة) → مكالمة dt=t وحدة، مع كاش
        JsonNode root = callGoogleRaw(name, "ar", "en", "&dt=t");
        String sem = extractTranslation(root);
        String result = (sem == null || sem.isBlank()) ? "" : stripDiacritics(sem);
        CACHE.put(SEMANTIC_PREFIX + name, result);
        return result;
    }

    // ══════════════════════════════════════════
    // إنجليزي → عربي  (لهالاتجاه منظل على الترجمة — الـ romanization بيطلّع لاتيني)
    // ══════════════════════════════════════════
    public static String translateToArabic(String name) {
        if (name == null || name.isBlank())
            return "";
        if (isArabic(name))
            return name;

        String cacheKey = "ar_" + name;
        String cached = CACHE.get(cacheKey);
        if (cached != null && !cached.isBlank())
            return cached;

        JsonNode root = callGoogleRaw(name, "en", "ar", "&dt=t");
        String result = extractTranslation(root);

        if (result != null && !result.isBlank()) {
            CACHE.put(cacheKey, result);
            return result;
        }

        return name;
    }

    // ══════════════════════════════════════════
    // Google call — بيرجع الـ JSON root الخام
    // ══════════════════════════════════════════
    private static JsonNode callGoogleRaw(String text, String from, String to, String dtSegment) {
        try {
            String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8)
                    .replace("+", "%20");
            String url = String.format(GOOGLE_URL, from, to, dtSegment, encoded);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMillis(800))
                    .header("User-Agent", "Mozilla/5.0")
                    .GET()
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(
                    request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() == 200) {
                return MAPPER.readTree(response.body());
            }
        } catch (Exception e) {
            System.err.println("Google call failed for [" + text + "]: " + e.getMessage());
        }
        return null;
    }

    // ══════════════════════════════════════════
    // استخراج الترجمة الدلالية من root[0][i][0]
    // ══════════════════════════════════════════
    private static String extractTranslation(JsonNode root) {
        if (root == null)
            return null;
        JsonNode parts = root.path(0);
        StringBuilder sb = new StringBuilder();
        for (JsonNode part : parts) {
            JsonNode translated = part.path(0);
            if (!translated.isNull() && !translated.isMissingNode()
                    && !translated.asText().isBlank()) {
                sb.append(translated.asText());
            }
        }
        String result = sb.toString().trim();
        return result.isBlank() ? null : result;
    }

    // ══════════════════════════════════════════
    // استخراج النطق الصوتي (romanization) من الـ chunk اللي أول عنصرين null
    // البنية:  [null, null, targetRom, sourceRom]  → النطق بالموقع [3] (fallback [2])
    // ══════════════════════════════════════════
    private static String extractRomanization(JsonNode root) {
        if (root == null)
            return null;

        JsonNode parts = root.path(0);
        StringBuilder sb = new StringBuilder();

        for (JsonNode part : parts) {
            JsonNode first = part.path(0);
            boolean isRomChunk = first.isNull() || first.isMissingNode();
            if (!isRomChunk)
                continue;

            // source romanization — عادةً بالموقع [3]، وأحياناً [2] لمّا الـ target بدون رومنة
            String src = part.path(3).asText("");
            if (src == null || src.isBlank())
                src = part.path(2).asText("");

            if (src != null && !src.isBlank()) {
                if (sb.length() > 0)
                    sb.append(' ');
                sb.append(src.trim());
            }
        }

        String raw = sb.toString().trim();
        if (raw.isBlank())
            return null;

        return stripDiacritics(raw);
    }

    // ══════════════════════════════════════════
    // تنظيف الـ diacritics و الهمزات المعدّلة لـ ASCII نظيف
    //   ḥ → h   ā → a   ʾ/ʿ → (حذف)
    // ══════════════════════════════════════════
    private static String stripDiacritics(String s) {
        if (s == null || s.isBlank())
            return "";
        String norm = Normalizer.normalize(s, Normalizer.Form.NFD);
        norm = norm.replaceAll("\\p{M}+", "");              // combining marks (macron, dot-below...)
        norm = norm.replaceAll("[\u02BE\u02BF\u02B9\u02C8\u2019\u2018'`]", ""); // ʾ ʿ ʹ ˈ ' ' ' `
        norm = norm.replaceAll("\\s+", " ").trim();
        return norm;
    }

    private static boolean isArabic(String name) {
        return name.chars().anyMatch(c -> c >= 0x0600 && c <= 0x06FF);
    }

    public static void clearCache() {
        CACHE.clear();
    }

    public static int getCacheSize() {
        return CACHE.size();
    }
}