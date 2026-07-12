package com.sdn.blacklist.batchscreening.dto;

import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;

/**
 * سطر واحد من ملف الـ batch بعد الـ parsing.
 * - الاسم إلزامي؛ الباقي اختياري (confirming factors).
 * - rawDob بينحفظ كنص للتقرير (input_dob)، و dob بينحوّل LocalDate للـ screening.
 * - rowError != null يعني السطر ما بينفحص (بس بينكتب بالتقرير كـ خطأ) وما بيوقف الباقي.
 */
@Getter
@Setter
public class BatchRecordInput {

    private int       rowNumber;      // رقم السطر بالإكسل (1-based، للتتبّع بالتقرير)

    private String    fullName;       // إلزامي
    private String    rawDob;         // النص الأصلي من الخلية (للتقرير)
    private LocalDate dob;            // محوّل، ممكن يكون null
    private String    nationality;
    private String    idType;
    private String    idNumber;
    private String    country;
    private String    motherName;

    private String    rowError;       // null إذا السطر سليم

    public boolean hasError() {
        return rowError != null;
    }
}