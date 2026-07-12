package com.sdn.blacklist.batchscreening.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "batch_screening_results")
@Getter
@Setter
public class BatchScreeningResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "row_number")
    private int rowNumber;

    // ---- الإدخال (echo من الملف، متطابق مع بارامترات screenPersonFull) ----
    @Column(name = "input_name", length = 1000)
    private String inputName;

    @Column(name = "input_dob", length = 100)          // ممكن يجي تاريخ إكسل كامل "1957-01-01 00:00:00"
    private String inputDob;

    @Column(name = "input_nationality", length = 500)
    private String inputNationality;

    @Column(name = "input_id_type", length = 200)
    private String inputIdType;

    @Column(name = "input_id_number", length = 200)
    private String inputIdNumber;

    @Column(name = "input_country", length = 500)
    private String inputCountry;

    @Column(name = "input_mother_name", length = 1000)
    private String inputMotherName;

    // ---- الربط بنتيجة الـ screening الكاملة (drill-down، بدون تكرار) ----
    @Column(name = "screening_result_id")
    private Long screeningResultId;

    // ---- ملخّص denormalized للتقرير والعرض السريع ----
    @Column(name = "is_match")
    private boolean match;

    @Column(name = "risk_level", length = 20)
    private String riskLevel;                 // VERY_LOW ... CRITICAL

    @Column(name = "best_score")
    private Double bestScore;

    @Column(name = "matched_name", length = 1000)
    private String matchedName;

    @Column(name = "matched_source", length = 255)
    private String matchedSource;             // OFAC | UK | EU | INTERPOL ... مدموج

    @Column(name = "confirming_factor", length = 50)
    private String confirmingFactor;          // CONFIRMED / PROBABLE / ... UNCONFIRMED

    @Column(name = "match_count")
    private int matchCount;

    // ---- خطأ على مستوى السطر (سطر بايظ ما يوقّف الـ batch كلو) ----
    @Column(name = "row_error", length = 1000)
    private String rowError;
}