-- ============================================================================
-- SharePlate AI: PostgreSQL 16 Enterprise DDL Schema
-- Compatible with PostGIS extension for Geospatial queries
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE org_type_enum AS ENUM (
    'RESTAURANT', 'HOTEL', 'HOSTEL', 'CATERING', 'EVENT_ORGANIZER',
    'NGO', 'CHARITY', 'COMMUNITY_KITCHEN', 'SHELTER'
);

CREATE TYPE user_role_enum AS ENUM ('DONOR', 'RECIPIENT', 'ADMIN');

CREATE TYPE food_category_enum AS ENUM ('COOKED_MEAL', 'BAKERY', 'PRODUCE', 'PACKAGED_GOODS');

CREATE TYPE dietary_type_enum AS ENUM ('VEG', 'NON_VEG', 'VEGAN', 'JAIN');

CREATE TYPE quantity_unit_enum AS ENUM ('KG', 'SERVINGS', 'PACKETS', 'TRAYS');

CREATE TYPE storage_condition_enum AS ENUM ('ROOM_TEMP', 'REFRIGERATED', 'FROZEN');

CREATE TYPE listing_status_enum AS ENUM ('AVAILABLE', 'CLAIMED', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED', 'CANCELLED');

CREATE TYPE claim_status_enum AS ENUM ('REQUESTED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'COMPLETED', 'CANCELLED');

CREATE TABLE organizations (
    org_id VARCHAR(64) PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    org_type org_type_enum NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Bangalore',
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    fssai_or_reg_number VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES organizations(org_id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipient_profiles (
    profile_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) NOT NULL UNIQUE REFERENCES organizations(org_id) ON DELETE CASCADE,
    daily_meal_deficit INTEGER NOT NULL DEFAULT 60 CHECK(daily_meal_deficit >= 0),
    beneficiary_count INTEGER NOT NULL DEFAULT 60 CHECK(beneficiary_count >= 0),
    preferred_categories TEXT NOT NULL DEFAULT 'COOKED_MEAL,BAKERY,PRODUCE,PACKAGED_GOODS',
    dietary_preference VARCHAR(50) NOT NULL DEFAULT 'ANY',
    has_refrigeration BOOLEAN NOT NULL DEFAULT TRUE,
    has_deep_freeze BOOLEAN NOT NULL DEFAULT FALSE,
    transport_available BOOLEAN NOT NULL DEFAULT TRUE,
    max_distance_km NUMERIC(5, 2) NOT NULL DEFAULT 20.0 CHECK(max_distance_km > 0),
    operating_hours VARCHAR(100) NOT NULL DEFAULT '08:00 - 22:00',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE food_listings (
    listing_id VARCHAR(64) PRIMARY KEY,
    donor_org_id VARCHAR(64) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    food_name VARCHAR(255) NOT NULL,
    category food_category_enum NOT NULL,
    dietary_type dietary_type_enum NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK(quantity > 0),
    quantity_unit quantity_unit_enum NOT NULL,
    approx_servings INTEGER NOT NULL CHECK(approx_servings > 0),
    preparation_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_latitude NUMERIC(9, 6) NOT NULL,
    pickup_longitude NUMERIC(9, 6) NOT NULL,
    allergens VARCHAR(255) DEFAULT 'None',
    storage_condition storage_condition_enum NOT NULL DEFAULT 'ROOM_TEMP',
    status listing_status_enum NOT NULL DEFAULT 'AVAILABLE',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donation_claims (
    claim_id VARCHAR(64) PRIMARY KEY,
    listing_id VARCHAR(64) NOT NULL REFERENCES food_listings(listing_id) ON DELETE CASCADE,
    recipient_org_id VARCHAR(64) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    requested_quantity NUMERIC(10, 2) NOT NULL CHECK(requested_quantity > 0),
    status claim_status_enum NOT NULL DEFAULT 'REQUESTED',
    verification_otp VARCHAR(10) NOT NULL,
    pickup_time TIMESTAMP WITH TIME ZONE,
    completion_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE impact_audit_logs (
    audit_id VARCHAR(64) PRIMARY KEY,
    claim_id VARCHAR(64) REFERENCES donation_claims(claim_id) ON DELETE SET NULL,
    listing_id VARCHAR(64) REFERENCES food_listings(listing_id) ON DELETE SET NULL,
    actor_user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pg_listings_status ON food_listings(status);
CREATE INDEX idx_pg_listings_category ON food_listings(category);
CREATE INDEX idx_pg_listings_donor ON food_listings(donor_org_id);
CREATE INDEX idx_pg_claims_listing ON donation_claims(listing_id);
CREATE INDEX idx_pg_claims_recipient ON donation_claims(recipient_org_id);
CREATE INDEX idx_pg_audit_timestamp ON impact_audit_logs(timestamp);
