package com.sdn.blacklist.common.util;

import org.apache.commons.codec.language.DoubleMetaphone;

public class PhoneticUtil {

    private static final DoubleMetaphone dm = new DoubleMetaphone();

    //  كلمة وحدة فقط
    public static String encode(String name) {
        if (name == null || name.isBlank()) return "";
        String clean = name.toLowerCase().trim()
                           .replaceAll("[^a-zA-Z]", ""); //  حذف أرقام ورموز
        return clean.isEmpty() ? "" : dm.doubleMetaphone(clean);
    }

    //  اسم كامل — كل كلمة لوحدها
    public static String encodeFullName(String name) {
        if (name == null || name.isBlank()) return "";
        String[] words = name.toLowerCase().trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            String clean = word.replaceAll("[^a-zA-Z]", ""); 
            if (!clean.isEmpty()) {
                String code = dm.doubleMetaphone(clean);
                if (code != null && !code.isEmpty()) {
                    sb.append(code).append(" ");
                }
            }
        }
        return sb.toString().trim();
    }
}