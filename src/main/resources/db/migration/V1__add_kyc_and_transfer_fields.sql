-- ══════════════════════════════════════════════════════
-- V1__add_kyc_and_transfer_fields.sql
-- ══════════════════════════════════════════════════════

-- ──────────────────────────────────────────
-- 1. screening_request — حقول KYC
-- ──────────────────────────────────────────
ALTER TABLE screening_request
    ADD COLUMN IF NOT EXISTS full_name_ar      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nationality       VARCHAR(10),
    ADD COLUMN IF NOT EXISTS dob               DATE,
    ADD COLUMN IF NOT EXISTS id_type           VARCHAR(30),
    ADD COLUMN IF NOT EXISTS id_number         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS id_expiry         DATE,
    ADD COLUMN IF NOT EXISTS mother_name       VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone             VARCHAR(50),
    ADD COLUMN IF NOT EXISTS address           VARCHAR(500);

-- ──────────────────────────────────────────
-- 2. transfer_screening — حقول الصرافة
-- ──────────────────────────────────────────
ALTER TABLE transfer_screening
    ADD COLUMN IF NOT EXISTS sender_nationality      VARCHAR(10),
    ADD COLUMN IF NOT EXISTS sender_dob              DATE,
    ADD COLUMN IF NOT EXISTS sender_id_type          VARCHAR(30),
    ADD COLUMN IF NOT EXISTS sender_id_number        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS sender_id_expiry        DATE,
    ADD COLUMN IF NOT EXISTS sender_mother_name      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS sender_phone            VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sender_address          VARCHAR(500),
    ADD COLUMN IF NOT EXISTS sender_residence_status VARCHAR(20),
    ADD COLUMN IF NOT EXISTS receiver_nationality    VARCHAR(10),
    ADD COLUMN IF NOT EXISTS receiver_dob            DATE,
    ADD COLUMN IF NOT EXISTS receiver_id_type        VARCHAR(30),
    ADD COLUMN IF NOT EXISTS receiver_id_number      VARCHAR(100),
    ADD COLUMN IF NOT EXISTS receiver_phone          VARCHAR(50),
    ADD COLUMN IF NOT EXISTS receiver_bank_name      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS receiver_account_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS receiver_relationship   VARCHAR(50),
    ADD COLUMN IF NOT EXISTS city                    VARCHAR(100),
    ADD COLUMN IF NOT EXISTS amount_in_usd           NUMERIC(19,4),
    ADD COLUMN IF NOT EXISTS transfer_purpose        VARCHAR(50),
    ADD COLUMN IF NOT EXISTS purpose_details         VARCHAR(500),
    ADD COLUMN IF NOT EXISTS agent_name              VARCHAR(255),
    ADD COLUMN IF NOT EXISTS commission_type         VARCHAR(20),
    ADD COLUMN IF NOT EXISTS delivery_method         VARCHAR(30),
    ADD COLUMN IF NOT EXISTS branch_id               VARCHAR(50),
    ADD COLUMN IF NOT EXISTS branch_name             VARCHAR(255),
    ADD COLUMN IF NOT EXISTS external_reference      VARCHAR(100);

-- ──────────────────────────────────────────
-- 3. indexes
-- ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_screening_request_nationality
    ON screening_request(nationality);

CREATE INDEX IF NOT EXISTS idx_screening_request_id_number
    ON screening_request(id_number);

CREATE INDEX IF NOT EXISTS idx_transfer_sender_nationality
    ON transfer_screening(sender_nationality);

CREATE INDEX IF NOT EXISTS idx_transfer_external_ref
    ON transfer_screening(external_reference);

CREATE INDEX IF NOT EXISTS idx_transfer_amount_usd
    ON transfer_screening(amount_in_usd);