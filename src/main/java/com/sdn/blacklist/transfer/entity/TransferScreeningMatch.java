package com.sdn.blacklist.transfer.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "transfer_screening_match")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferScreeningMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screening_id", nullable = false)
    private TransferScreeningRecord screening;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Party party;                // SENDER / RECEIVER

    @Column(nullable = false)
    private String matchedName;

    @Column
    private String matchedNameAr;

    @Column(nullable = false)
    private String source;              // OFAC / UN / EU / UK

    @Column(nullable = false)
    private Double score;               // 0-100

    @Column
    private String entityType;          // INDIVIDUAL / ENTITY / VESSEL

    @Column
    private String country;

    @Column
    private String sanctionId;          // OFAC UID أو ما يعادله

    public enum Party { SENDER, RECEIVER }
}