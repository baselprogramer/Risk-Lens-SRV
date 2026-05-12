package com.sdn.blacklist.user.entity;
 
public enum UserRole {
    SUPER_ADMIN,   // أنت — كل الشركات وكل البيانات
    COMPANY_ADMIN, // مدير الشركة — شركته فقط
    SUBSCRIBER     // موظف — بياناته فقط
}