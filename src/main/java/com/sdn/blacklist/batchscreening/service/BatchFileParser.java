package com.sdn.blacklist.batchscreening.service;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

import com.sdn.blacklist.batchscreening.dto.BatchRecordInput;

/**
 * يقرا ملف .xlsx مرفوع ويطلّع List&lt;BatchRecordInput&gt;.
 *
 * قواعد:
 *  - أول صف = العناوين. مطابقة case-insensitive + aliases (عربي/إنجليزي).
 *  - عمود الاسم إلزامي؛ إذا مش موجود → نرمي BatchParseException (الملف كله مرفوض).
 *  - كل سطر بايظ (بلا اسم / خطأ خلية) بينحفظ بـ rowError وما بيوقف الباقي.
 */
@Slf4j
@Component
public class BatchFileParser {

    /** استثناء على مستوى الملف — العناوين غلط أو الملف فاضي. */
    public static class BatchParseException extends RuntimeException {
        public BatchParseException(String msg) { super(msg); }
    }

    // ── aliases لكل حقل (كلها منطبّعة قبل المقارنة) ──
    private static final Map<String, String[]> ALIASES = new HashMap<>();
    static {
        ALIASES.put("name",        new String[]{"الاسم", "الاسم الكامل", "الاسم الرباعي", "name", "full name", "fullname"});
        ALIASES.put("dob",         new String[]{"تاريخ الميلاد", "الميلاد", "dob", "date of birth", "birth date", "birthdate"});
        ALIASES.put("nationality", new String[]{"الجنسية", "nationality"});
        ALIASES.put("idType",      new String[]{"نوع الهوية", "id type", "idtype", "document type"});
        ALIASES.put("idNumber",    new String[]{"رقم الهوية", "الرقم الوطني", "id number", "idnumber", "id", "national id"});
        ALIASES.put("country",     new String[]{"البلد", "الدولة", "country"});
        ALIASES.put("motherName",  new String[]{"اسم الأم", "الأم", "mother name", "mothers name", "mother's name", "mothername"});
    }

    // normalized-alias -> canonical field
    private static final Map<String, String> LOOKUP = new HashMap<>();
    static {
        for (Map.Entry<String, String[]> e : ALIASES.entrySet())
            for (String a : e.getValue())
                LOOKUP.put(normalizeHeader(a), e.getKey());
    }

    private static final DataFormatter FORMATTER = new DataFormatter();
    private static final Pattern YEAR = Pattern.compile("\\b(19|20)\\d{2}\\b");

    public List<BatchRecordInput> parse(MultipartFile file) {
        try (InputStream in = file.getInputStream();
             Workbook wb = WorkbookFactory.create(in)) {

            Sheet sheet = wb.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0)
                throw new BatchParseException("الملف فاضي — ما في أي صفوف.");

            // ── صف العناوين ──
            Row header = sheet.getRow(sheet.getFirstRowNum());
            if (header == null)
                throw new BatchParseException("ما في صف عناوين بالملف.");

            Map<String, Integer> colOf = new HashMap<>();   // field -> columnIndex
            for (int c = header.getFirstCellNum(); c < header.getLastCellNum(); c++) {
                Cell cell = header.getCell(c);
                if (cell == null) continue;
                String field = LOOKUP.get(normalizeHeader(FORMATTER.formatCellValue(cell)));
                if (field != null) colOf.putIfAbsent(field, c);   // أول تطابق بيربح
            }

            if (!colOf.containsKey("name"))
                throw new BatchParseException(
                    "ما لقيت عمود الاسم. لازم يكون في عمود عنوانه: الاسم / الاسم الكامل / name.");

            log.info("📄 Batch parse: sheet='{}' | resolved columns={}",
                sheet.getSheetName(), colOf.keySet());

            // ── الصفوف ──
            List<BatchRecordInput> out = new ArrayList<>();
            int firstData = sheet.getFirstRowNum() + 1;
            int lastRow   = sheet.getLastRowNum();

            for (int r = firstData; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowBlank(row)) continue;   // سطر فاضي كلياً → نتجاهلو بصمت

                BatchRecordInput rec = new BatchRecordInput();
                rec.setRowNumber(r + 1);   // 1-based زي ما بيشوفو المستخدم بإكسل

                try {
                    String name = str(row, colOf.get("name"));
                    if (name == null || name.isBlank()) {
                        rec.setRowError("سطر بلا اسم — تم تخطّيه.");
                        out.add(rec);
                        continue;
                    }
                    rec.setFullName(name.trim());
                    rec.setNationality(str(row, colOf.get("nationality")));
                    rec.setIdType(str(row, colOf.get("idType")));
                    rec.setIdNumber(str(row, colOf.get("idNumber")));
                    rec.setCountry(str(row, colOf.get("country")));
                    rec.setMotherName(str(row, colOf.get("motherName")));

                    Integer dobCol = colOf.get("dob");
                    if (dobCol != null) {
                        rec.setRawDob(str(row, dobCol));
                        rec.setDob(parseDob(row.getCell(dobCol), rec.getRawDob()));
                    }

                    out.add(rec);

                } catch (Exception ex) {
                    rec.setRowError("خطأ بقراءة السطر: " + ex.getMessage());
                    out.add(rec);
                    log.warn("⚠️ Batch row {} parse error: {}", r + 1, ex.getMessage());
                }
            }

            if (out.isEmpty())
                throw new BatchParseException("ما في أي سطر بيانات بعد صف العناوين.");

            long valid  = out.stream().filter(x -> !x.hasError()).count();
            log.info("📄 Batch parse done: {} rows total | {} valid | {} errors",
                out.size(), valid, out.size() - valid);
            return out;

        } catch (BatchParseException e) {
            throw e;
        } catch (Exception e) {
            throw new BatchParseException("فشل قراءة الملف: " + e.getMessage());
        }
    }

    // ── قراءة خلية كنص نظيف (بيشيل .0 اللي POI بتضيفها للأرقام) ──
    private String str(Row row, Integer col) {
        if (col == null) return null;
        Cell cell = row.getCell(col);
        if (cell == null) return null;

        String v;
        if (cell.getCellType() == CellType.NUMERIC && !DateUtil.isCellDateFormatted(cell)) {
            double d = cell.getNumericCellValue();
            v = (d == Math.floor(d) && !Double.isInfinite(d))
                ? String.valueOf((long) d)          // 12345.0 → "12345"
                : String.valueOf(d);
        } else {
            v = FORMATTER.formatCellValue(cell);
        }
        v = v == null ? null : v.trim();
        return (v == null || v.isEmpty()) ? null : v;
    }

    // ── DOB: بيتعامل مع خلية تاريخ حقيقية (numeric+date-format) أو نص ──
    private LocalDate parseDob(Cell cell, String raw) {
        if (cell != null
                && cell.getCellType() == CellType.NUMERIC
                && DateUtil.isCellDateFormatted(cell)) {
            try {
                return cell.getDateCellValue().toInstant()
                    .atZone(ZoneId.systemDefault()).toLocalDate();
            } catch (Exception ignored) { /* fall through to text */ }
        }
        if (raw == null || raw.isBlank()) return null;

        // ISO yyyy-MM-dd
        try {
            String t = raw.trim();
            if (t.length() >= 10 && t.charAt(4) == '-')
                return LocalDate.parse(t.substring(0, 10));
        } catch (Exception ignored) {}

        // fallback: أول سنة 19xx/20xx بالنص → 1 كانون الثاني
        Matcher m = YEAR.matcher(raw);
        if (m.find())
            return LocalDate.of(Integer.parseInt(m.group()), 1, 1);

        return null;   // ما قدرنا نفهم التاريخ — بيظل rawDob بالتقرير
    }

    private boolean isRowBlank(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String v = FORMATTER.formatCellValue(cell);
                if (v != null && !v.trim().isEmpty()) return false;
            }
        }
        return true;
    }

    // ── تطبيع عنوان: trim + lowercase + توحيد المسافات + تطبيع عربي بسيط ──
    private static String normalizeHeader(String s) {
        if (s == null) return "";
        s = s.trim().toLowerCase().replaceAll("\\s+", " ");
        s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا');
        s = s.replace('ى', 'ي').replace('ة', 'ه');
        return s;
    }
}