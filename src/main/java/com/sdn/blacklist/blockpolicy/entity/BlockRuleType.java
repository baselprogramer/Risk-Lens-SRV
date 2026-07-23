package com.sdn.blacklist.blockpolicy.entity;

public enum BlockRuleType {
    COUNTRY,        // دولة — مثلاً منع التعامل مع دولة معينة (دولة التحويل أو الوجهة)
    NATIONALITY     // جنسية — منع التعامل مع جنسية معينة (المرسل أو المستلم)
}