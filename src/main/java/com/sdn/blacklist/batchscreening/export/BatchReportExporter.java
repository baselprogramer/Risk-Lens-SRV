package com.sdn.blacklist.batchscreening.export;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import com.sdn.blacklist.batchscreening.entity.BatchScreeningJob;
import com.sdn.blacklist.batchscreening.entity.BatchScreeningResult;

/**
 * يبني تقرير Excel (.xlsx) لكامل نتائج الـ batch job.
 * يبدأ بملخّص (اسم الملف/المجموع/المطابقات/التاريخ)، ثم جدول: صف لكل اسم
 * (مطابقة + سليم + أخطاء الأسطر) — تقرير كامل للـ audit.
 */
@Component
public class BatchReportExporter {

    private static final String[] HEADERS = {
        "رقم السطر", "الاسم", "النتيجة", "مستوى الخطر",
        "الاسم المطابق", "المصدر", "أعلى تطابق %", "عامل التأكيد",
        "عدد المطابقات", "ملاحظة الخطأ"
    };

    private static final DateTimeFormatter TS =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public byte[] export(BatchScreeningJob job, List<BatchScreeningResult> rows) {
        try (Workbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("تقرير الفحص");
            sheet.setRightToLeft(true);   // RTL للعربي

            CellStyle titleStyle  = titleStyle(wb);
            CellStyle metaKey      = metaKeyStyle(wb);
            CellStyle headerStyle = headerStyle(wb);
            CellStyle matchStyle  = tintStyle(wb, IndexedColors.ROSE);          // مطابقة
            CellStyle cleanStyle  = tintStyle(wb, IndexedColors.LIGHT_GREEN);   // سليم
            CellStyle errorStyle  = tintStyle(wb, IndexedColors.LEMON_CHIFFON); // خطأ

            int r = 0;

            // ── ملخّص علوي (من الـ job) ──
            Row title = sheet.createRow(r++);
            setCell(title, 0, "تقرير الفحص الجماعي", titleStyle);

            r = metaRow(sheet, r, "الملف",       nz(job.getFileName()),                metaKey);
            r = metaRow(sheet, r, "الإجمالي",    String.valueOf(job.getTotalRecords()), metaKey);
            r = metaRow(sheet, r, "المطابقات",   String.valueOf(job.getMatchedRecords()), metaKey);
            r = metaRow(sheet, r, "الحالة",      job.getStatus() != null ? job.getStatus().name() : "—", metaKey);
            r = metaRow(sheet, r, "تاريخ الإنشاء",
                    job.getCreatedAt() != null
                        ? TS.format(job.getCreatedAt().atZone(java.time.ZoneId.systemDefault())) : "—",
                    metaKey);

            r++; // سطر فاصل

            // ── صف العناوين ──
            Row header = sheet.createRow(r++);
            for (int c = 0; c < HEADERS.length; c++) {
                Cell cell = header.createCell(c);
                cell.setCellValue(HEADERS[c]);
                cell.setCellStyle(headerStyle);
            }

            // ── الصفوف ──
            for (BatchScreeningResult row : rows) {
                Row excelRow = sheet.createRow(r++);

                boolean hasError = row.getRowError() != null && !row.getRowError().isBlank();
                CellStyle rowStyle = hasError ? errorStyle : (row.isMatch() ? matchStyle : cleanStyle);

                String verdict = hasError ? "خطأ" : (row.isMatch() ? "مطابَقة" : "سليم");

                setCell(excelRow, 0, String.valueOf(row.getRowNumber()), rowStyle);
                setCell(excelRow, 1, nz(row.getInputName()),             rowStyle);
                setCell(excelRow, 2, verdict,                            rowStyle);
                setCell(excelRow, 3, hasError ? "—" : nz(row.getRiskLevel()),  rowStyle);
                setCell(excelRow, 4, nz(row.getMatchedName()),           rowStyle);
                setCell(excelRow, 5, nz(row.getMatchedSource()),         rowStyle);
                setCell(excelRow, 6, row.getBestScore() != null
                    ? String.format("%.1f", row.getBestScore()) : "—",   rowStyle);
                setCell(excelRow, 7, nz(row.getConfirmingFactor()),      rowStyle);
                setCell(excelRow, 8, String.valueOf(row.getMatchCount()),rowStyle);
                setCell(excelRow, 9, nz(row.getRowError()),              rowStyle);
            }

            for (int c = 0; c < HEADERS.length; c++) sheet.autoSizeColumn(c);

            wb.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("فشل توليد تقرير الإكسل: " + e.getMessage(), e);
        }
    }

    private int metaRow(Sheet sheet, int r, String key, String val, CellStyle keyStyle) {
        Row row = sheet.createRow(r);
        setCell(row, 0, key, keyStyle);
        setCell(row, 1, val, null);
        return r + 1;
    }

    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        if (style != null) cell.setCellStyle(style);
    }

    private String nz(String s) { return s == null || s.isBlank() ? "—" : s; }

    private CellStyle titleStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true);
        f.setFontHeightInPoints((short) 14);
        s.setFont(f);
        return s;
    }

    private CellStyle metaKeyStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true);
        s.setFont(f);
        return s;
    }

    private CellStyle headerStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true);
        f.setColor(IndexedColors.WHITE.getIndex());
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.CENTER);
        border(s);
        return s;
    }

    private CellStyle tintStyle(Workbook wb, IndexedColors color) {
        CellStyle s = wb.createCellStyle();
        s.setFillForegroundColor(color.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        border(s);
        return s;
    }

    private void border(CellStyle s) {
        s.setBorderBottom(BorderStyle.THIN);
        s.setBorderTop(BorderStyle.THIN);
        s.setBorderLeft(BorderStyle.THIN);
        s.setBorderRight(BorderStyle.THIN);
    }
}