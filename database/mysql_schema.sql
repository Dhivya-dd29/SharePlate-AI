-- ============================================================================
-- SharePlate AI: MySQL 8.0 Enterprise DDL Schema
-- InnoDB engine with foreign keys, utf8mb4 charset
-- ============================================================================

CREATE DATABASE IF NOT EXISTS shareplate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shareplate_db;

CREATE TABLE IF NOT EXISTS organizations (
    org_id VARCHAR(64) PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    org_type ENUM('RESTAURANT', 'HOTEL', 'HOSTEL', 'CATERING', 'EVENT_ORGANIZER', 'NGO', 'CHARITY', 'COMMUNITY_KITCHEN', 'SHELTER') NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Bangalore',
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    fssai_or_reg_number VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('DONOR', 'RECIPIENT', 'ADMIN') NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recipient_profiles (
    profile_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) NOT NULL UNIQUE,
    daily_meal_deficit INT NOT NULL DEFAULT 60,
    beneficiary_count INT NOT NULL DEFAULT 60,
    preferred_categories VARCHAR(255) NOT NULL DEFAULT 'COOKED_MEAL,BAKERY,PRODUCE,PACKAGED_GOODS',
    dietary_preference VARCHAR(50) NOT NULL DEFAULT 'ANY',
    has_refrigeration BOOLEAN NOT NULL DEFAULT TRUE,
    has_deep_freeze BOOLEAN NOT NULL DEFAULT FALSE,
    transport_available BOOLEAN NOT NULL DEFAULT TRUE,
    max_distance_km DECIMAL(5, 2) NOT NULL DEFAULT 20.0,
    operating_hours VARCHAR(100) NOT NULL DEFAULT '08:00 - 22:00',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS food_listings (
    listing_id VARCHAR(64) PRIMARY KEY,
    donor_org_id VARCHAR(64) NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    category ENUM('COOKED_MEAL', 'BAKERY', 'PRODUCE', 'PACKAGED_GOODS') NOT NULL,
    dietary_type ENUM('VEG', 'NON_VEG', 'VEGAN', 'JAIN') NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    quantity_unit ENUM('KG', 'SERVINGS', 'PACKETS', 'TRAYS') NOT NULL,
    approx_servings INT NOT NULL,
    preparation_time TIMESTAMP NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_latitude DECIMAL(9, 6) NOT NULL,
    pickup_longitude DECIMAL(9, 6) NOT NULL,
    allergens VARCHAR(255) DEFAULT 'None',
    storage_condition ENUM('ROOM_TEMP', 'REFRIGERATED', 'FROZEN') NOT NULL DEFAULT 'ROOM_TEMP',
    status ENUM('AVAILABLE', 'CLAIMED', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'AVAILABLE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_org_id) REFERENCES organizations(org_id) ON DELETE CASCADE,
    INDEX idx_mysql_listings_status (status),
    INDEX idx_mysql_listings_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS donation_claims (
    claim_id VARCHAR(64) PRIMARY KEY,
    listing_id VARCHAR(64) NOT NULL,
    recipient_org_id VARCHAR(64) NOT NULL,
    requested_quantity DECIMAL(10, 2) NOT NULL,
    status ENUM('REQUESTED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'REQUESTED',
    verification_otp VARCHAR(10) NOT NULL,
    pickup_time TIMESTAMP NULL,
    completion_time TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES food_listings(listing_id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_org_id) REFERENCES organizations(org_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS impact_audit_logs (
    audit_id VARCHAR(64) PRIMARY KEY,
    claim_id VARCHAR(64),
    listing_id VARCHAR(64),
    actor_user_id VARCHAR(64),
    action VARCHAR(100) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (claim_id) REFERENCES donation_claims(claim_id) ON DELETE SET NULL,
    FOREIGN KEY (listing_id) REFERENCES food_listings(listing_id) ON DELETE SET NULL,
    FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_mysql_audit_timestamp (timestamp)
) ENGINE=InnoDB;
