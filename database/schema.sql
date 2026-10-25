-- ============================================================================
-- SharePlate AI: Smart Food Waste Redistribution Platform
-- Relational Database Schema (ANSI SQL / SQLite / PostgreSQL Compatible)
-- Normalized to 3NF with foreign keys, constraints, and audit logging
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    org_id TEXT PRIMARY KEY,
    org_name TEXT NOT NULL,
    org_type TEXT NOT NULL CHECK(org_type IN (
        'RESTAURANT', 'HOTEL', 'HOSTEL', 'CATERING', 'EVENT_ORGANIZER',
        'NGO', 'CHARITY', 'COMMUNITY_KITCHEN', 'SHELTER'
    )),
    contact_person TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Bangalore',
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    fssai_or_reg_number TEXT,
    is_verified INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    org_id TEXT REFERENCES organizations(org_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('DONOR', 'RECIPIENT', 'ADMIN')),
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipient_profiles (
    profile_id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL UNIQUE REFERENCES organizations(org_id) ON DELETE CASCADE,
    daily_meal_deficit INTEGER NOT NULL DEFAULT 60 CHECK(daily_meal_deficit >= 0),
    beneficiary_count INTEGER NOT NULL DEFAULT 60 CHECK(beneficiary_count >= 0),
    preferred_categories TEXT NOT NULL DEFAULT 'COOKED_MEAL,BAKERY,PRODUCE,PACKAGED_GOODS',
    dietary_preference TEXT NOT NULL DEFAULT 'ANY' CHECK(dietary_preference IN ('ANY', 'VEG_ONLY', 'VEGAN_ONLY', 'HALAL_ONLY')),
    has_refrigeration INTEGER NOT NULL DEFAULT 1 CHECK(has_refrigeration IN (0, 1)),
    has_deep_freeze INTEGER NOT NULL DEFAULT 0 CHECK(has_deep_freeze IN (0, 1)),
    transport_available INTEGER NOT NULL DEFAULT 1 CHECK(transport_available IN (0, 1)),
    max_distance_km REAL NOT NULL DEFAULT 20.0 CHECK(max_distance_km > 0),
    operating_hours TEXT NOT NULL DEFAULT '08:00 - 22:00',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_listings (
    listing_id TEXT PRIMARY KEY,
    donor_org_id TEXT NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('COOKED_MEAL', 'BAKERY', 'PRODUCE', 'PACKAGED_GOODS')),
    dietary_type TEXT NOT NULL CHECK(dietary_type IN ('VEG', 'NON_VEG', 'VEGAN', 'JAIN')),
    quantity REAL NOT NULL CHECK(quantity > 0),
    quantity_unit TEXT NOT NULL CHECK(quantity_unit IN ('KG', 'SERVINGS', 'PACKETS', 'TRAYS')),
    approx_servings INTEGER NOT NULL CHECK(approx_servings > 0),
    preparation_time TEXT NOT NULL,
    expiry_time TEXT NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_latitude REAL NOT NULL,
    pickup_longitude REAL NOT NULL,
    allergens TEXT DEFAULT 'None',
    storage_condition TEXT NOT NULL DEFAULT 'ROOM_TEMP' CHECK(storage_condition IN ('ROOM_TEMP', 'REFRIGERATED', 'FROZEN')),
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'CLAIMED', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED', 'CANCELLED')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donation_claims (
    claim_id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL REFERENCES food_listings(listing_id) ON DELETE CASCADE,
    recipient_org_id TEXT NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    requested_quantity REAL NOT NULL CHECK(requested_quantity > 0),
    status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'COMPLETED', 'CANCELLED')),
    verification_otp TEXT NOT NULL,
    pickup_time TEXT,
    completion_time TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS impact_audit_logs (
    audit_id TEXT PRIMARY KEY,
    claim_id TEXT REFERENCES donation_claims(claim_id) ON DELETE SET NULL,
    listing_id TEXT REFERENCES food_listings(listing_id) ON DELETE SET NULL,
    actor_user_id TEXT REFERENCES users(user_id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    details TEXT,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance and indexing requirement
CREATE INDEX IF NOT EXISTS idx_listings_status ON food_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON food_listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_donor ON food_listings(donor_org_id);
CREATE INDEX IF NOT EXISTS idx_claims_listing ON donation_claims(listing_id);
CREATE INDEX IF NOT EXISTS idx_claims_recipient ON donation_claims(recipient_org_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON impact_audit_logs(timestamp);
