package com.sdn.blacklist.transfer.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TransferScreeningRequest {

    // ══════════════════════════════════════════
    //  SENDER — بيانات المرسل
    // ══════════════════════════════════════════

    @NotBlank(message = "Sender name is required")
    private String senderName;              // الاسم الكامل بالإنجليزي

    private String senderNameAr;            // الاسم الكامل بالعربي

    private String senderNationality;       // كود الجنسية: SY, IQ, JO...

    private LocalDate senderDob;            // تاريخ الميلاد

    private String senderIdType;            // NATIONAL_ID | PASSPORT | RESIDENCE

    private String senderIdNumber;          // رقم الوثيقة

    private LocalDate senderIdExpiry;       // تاريخ انتهاء الوثيقة

    private String senderMotherName;        // اسم الأم — مهم للتمييز بالأسماء العربية

    private String senderPhone;             // رقم الهاتف

    private String senderAddress;           // العنوان الكامل

    private String senderResidenceStatus;   // RESIDENT | NON_RESIDENT

    // ══════════════════════════════════════════
    //  RECEIVER — بيانات المستفيد
    // ══════════════════════════════════════════

    @NotBlank(message = "Receiver name is required")
    private String receiverName;            // الاسم الكامل بالإنجليزي

    private String receiverNameAr;          // الاسم الكامل بالعربي

    private String receiverNationality;     // جنسية المستفيد

    private LocalDate receiverDob;          // تاريخ ميلاد المستفيد

    private String receiverIdType;          // نوع وثيقة المستفيد

    private String receiverIdNumber;        // رقم وثيقة المستفيد

    private String receiverPhone;           // هاتف المستفيد

    private String receiverBankName;        // اسم البنك المستفيد

    private String receiverAccountNumber;   // رقم الحساب / IBAN

    private String receiverRelationship;    // علاقة المرسل بالمستفيد: FAMILY, BUSINESS...

    // ══════════════════════════════════════════
    //  TRANSFER — بيانات الحوالة
    // ══════════════════════════════════════════

    private String country;                 // بلد الوصول: SY, IQ, TR...

    private String city;                    // مدينة الوصول

    private BigDecimal amount;              // المبلغ

    private String currency;               // العملة: USD, EUR, SYP...

    private BigDecimal amountInUsd;         // المكافئ بالدولار — للـ threshold monitoring

    private String transferPurpose;         // سبب التحويل: FAMILY_SUPPORT, TRADE, OTHER...

    private String purposeDetails;         // تفاصيل السبب لو OTHER

    private String agentName;              // اسم الوكيل في بلد الوصول

    private String commissionType;         // نوع العمولة: WITH | WITHOUT

    private String deliveryMethod;         // CASH | BANK_DEPOSIT | MOBILE_WALLET

    // ══════════════════════════════════════════
    //  OPERATOR — بيانات موظف الصرافة
    // ══════════════════════════════════════════

    private String operatorId;             // معرف الموظف في البرنامج
    private String operatorName;           // اسم الموظف
    private String branchId;              // كود الفرع
    private String branchName;            // اسم الفرع

    // ══════════════════════════════════════════
    //  SYSTEM
    // ══════════════════════════════════════════

    private String createdBy;             // username من JWT أو API Key

    private String externalReference;    // رقم الحوالة في برنامج الصرافة

    // ══════════════════════════════════════════
    //  HELPER — هل البيانات كافية للـ confirming factors
    // ══════════════════════════════════════════

    public boolean hasSenderConfirmingData() {
        return senderDob != null
            || (senderIdNumber != null && !senderIdNumber.isBlank())
            || (senderNationality != null && !senderNationality.isBlank());
    }

    public boolean hasReceiverConfirmingData() {
        return receiverDob != null
            || (receiverIdNumber != null && !receiverIdNumber.isBlank())
            || (receiverNationality != null && !receiverNationality.isBlank());
    }
}