CREATE TABLE IF NOT EXISTS guide_profiles (
    user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    profile_photo_path VARCHAR(500) NULL,
    contact_number VARCHAR(20) NOT NULL,
    location VARCHAR(150) NOT NULL,
    years_experience INT UNSIGNED NOT NULL DEFAULT 0,
    daily_charge_lkr DECIMAL(10,2) UNSIGNED NOT NULL,
    sltda_license_number VARCHAR(100) NOT NULL UNIQUE,
    short_bio VARCHAR(500) NOT NULL,
    languages JSON NULL,
    verification_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    verification_notes VARCHAR(1000) NULL,
    verified_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_guide_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
