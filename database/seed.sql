-- ============================================================================
-- SharePlate AI: Seed Dataset
-- Includes realistic Donors, Recipients, Profiles, Listings, Claims & Audit Logs
-- ============================================================================

-- Organizations
INSERT OR IGNORE INTO organizations (org_id, org_name, org_type, contact_person, contact_phone, contact_email, address, city, latitude, longitude, fssai_or_reg_number, is_verified)
VALUES
('org-donor-001', 'Grand Orchid Hotel & Convention', 'HOTEL', 'Chef Rajesh Nair', '+91 98450 11223', 'culinary@grandorchid.com', '124 Old Airport Road, Indiranagar', 'Bangalore', 12.9602, 77.6434, 'FSSAI-11220334000189', 1),
('org-donor-002', 'Spice Valley Banquet Hall', 'EVENT_ORGANIZER', 'Mr. Arvind Rao', '+91 98451 22334', 'events@spicevalley.in', '45 100ft Road, Koramangala 4th Block', 'Bangalore', 12.9345, 77.6250, 'FSSAI-11220334000210', 1),
('org-donor-003', 'Apex Tech Executive Cafeteria', 'CATERING', 'Ms. Sneha Iyer', '+91 98452 33445', 'cafeteria@apextech.com', 'Embassy Tech Village, Bellandur', 'Bangalore', 12.9260, 77.6830, 'FSSAI-11220334000305', 1),
('org-donor-004', 'Artisan Crust Bakeries', 'RESTAURANT', 'David Fernandez', '+91 98453 44556', 'orders@artisancrust.com', '78 12th Main, HAL 2nd Stage', 'Bangalore', 12.9719, 77.6412, 'FSSAI-11220334000412', 1),
('org-donor-005', 'Christ University Central Hostel', 'HOSTEL', 'Warden Fr. Thomas', '+91 98454 55667', 'hostelmess@christ.edu', 'Hosur Road, Bhavani Nagar', 'Bangalore', 12.9340, 77.6060, 'FSSAI-11220334000551', 1),

('org-recip-001', 'Hope Children Foundation & Shelter', 'SHELTER', 'Sister Mary Paul', '+91 97420 11990', 'director@hopechildren.org', '18 Wheeler Road, Frazer Town', 'Bangalore', 12.9980, 77.6140, 'NGO-TRUST-KA-2015-884', 1),
('org-recip-002', 'Karuna Senior Citizen Care Trust', 'CHARITY', 'Dr. Sundaram Murthy', '+91 97421 22881', 'care@karunatrust.org', '89 5th Cross, Malleshwaram', 'Bangalore', 13.0035, 77.5710, 'NGO-TRUST-KA-2012-421', 1),
('org-recip-003', 'Akshaya Community Hunger Kitchen', 'COMMUNITY_KITCHEN', 'Mr. Ramesh Babu', '+91 97422 33772', 'kitchen@akshayafoundation.org', '32 Victoria Road, Austin Town', 'Bangalore', 12.9642, 77.6189, 'NGO-TRUST-KA-2018-912', 1),
('org-recip-004', 'Seva Mandir Slum Welfare Society', 'NGO', 'Mrs. Rekha Varma', '+91 97423 44663', 'contact@sevamandirblr.org', '56 Neelasandra Main Road', 'Bangalore', 12.9510, 77.6200, 'NGO-TRUST-KA-2019-331', 1),
('org-recip-005', 'Bengaluru Youth Mission Food Bank', 'COMMUNITY_KITCHEN', 'Rohit Hegde', '+91 97424 55554', 'distribute@byfoodbank.org', '102 Domlur 2nd Stage', 'Bangalore', 12.9610, 77.6380, 'NGO-TRUST-KA-2021-105', 1);

-- Recipient Profiles
INSERT OR IGNORE INTO recipient_profiles (profile_id, org_id, daily_meal_deficit, beneficiary_count, preferred_categories, dietary_preference, has_refrigeration, has_deep_freeze, transport_available, max_distance_km, operating_hours)
VALUES
('prof-001', 'org-recip-001', 80, 85, 'COOKED_MEAL,BAKERY,PRODUCE', 'ANY', 1, 0, 1, 15.0, '07:30 - 21:30'),
('prof-002', 'org-recip-002', 50, 50, 'COOKED_MEAL,PRODUCE', 'VEG_ONLY', 1, 1, 0, 12.0, '08:00 - 20:00'),
('prof-003', 'org-recip-003', 180, 200, 'COOKED_MEAL,BAKERY,PRODUCE,PACKAGED_GOODS', 'ANY', 1, 1, 1, 25.0, '06:00 - 23:00'),
('prof-004', 'org-recip-004', 120, 140, 'COOKED_MEAL,PACKAGED_GOODS', 'ANY', 0, 0, 1, 10.0, '09:00 - 21:00'),
('prof-005', 'org-recip-005', 90, 100, 'COOKED_MEAL,BAKERY,PRODUCE,PACKAGED_GOODS', 'ANY', 1, 0, 1, 18.0, '08:00 - 22:00');

-- Users (default passwords hashed: Admin@123, Donor@123, Recipient@123)
-- SHA-256 for test seed:
-- Admin@123: e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7
-- Donor@123: 13a30ecdfb003a7d7efbcf651917f4dc478ffdf77227dfeb1b0062a40731f242
-- Recipient@123: d96e95964722c1db6e75a5e7ec45b46b6dae1cbe4a0b4c2b9a7ec8f844a49c95
INSERT OR IGNORE INTO users (user_id, org_id, name, email, password_hash, role, phone)
VALUES
('usr-admin-01', NULL, 'Dr. Ananya Sharma (Admin)', 'admin@shareplate.org', 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', 'ADMIN', '+91 99000 00001'),
('usr-donor-01', 'org-donor-001', 'Chef Rajesh Nair (Donor)', 'donor@shareplate.org', '13a30ecdfb003a7d7efbcf651917f4dc478ffdf77227dfeb1b0062a40731f242', 'DONOR', '+91 98450 11223'),
('usr-donor-02', 'org-donor-002', 'Arvind Rao', 'arvind@spicevalley.in', '13a30ecdfb003a7d7efbcf651917f4dc478ffdf77227dfeb1b0062a40731f242', 'DONOR', '+91 98451 22334'),
('usr-recip-01', 'org-recip-001', 'Sister Mary Paul (Recipient)', 'recipient@shareplate.org', 'd96e95964722c1db6e75a5e7ec45b46b6dae1cbe4a0b4c2b9a7ec8f844a49c95', 'RECIPIENT', '+91 97420 11990'),
('usr-recip-02', 'org-recip-003', 'Ramesh Babu', 'ramesh@akshayafoundation.org', 'd96e95964722c1db6e75a5e7ec45b46b6dae1cbe4a0b4c2b9a7ec8f844a49c95', 'RECIPIENT', '+91 97422 33772');

-- Active Food Listings (Dynamic timestamps generated with future expiry for testing)
INSERT OR IGNORE INTO food_listings (listing_id, donor_org_id, food_name, category, dietary_type, quantity, quantity_unit, approx_servings, preparation_time, expiry_time, pickup_address, pickup_latitude, pickup_longitude, allergens, storage_condition, status, notes)
VALUES
('list-001', 'org-donor-001', 'Vegetable Pulao & Paneer Butter Masala', 'COOKED_MEAL', 'VEG', 25.0, 'KG', 75, datetime('now', '-2 hours'), datetime('now', '+5 hours'), '124 Old Airport Road, Indiranagar', 12.9602, 77.6434, 'Dairy', 'ROOM_TEMP', 'AVAILABLE', 'Buffet surplus, hot insulated containers, prepared for corporate luncheon'),
('list-002', 'org-donor-002', 'Steamed Rice, Sambar & Dal Fry', 'COOKED_MEAL', 'VEG', 40.0, 'KG', 120, datetime('now', '-3 hours'), datetime('now', '+4 hours'), '45 100ft Road, Koramangala 4th Block', 12.9345, 77.6250, 'None', 'ROOM_TEMP', 'AVAILABLE', 'Wedding reception surplus, hygienic food warmer containers'),
('list-003', 'org-donor-004', 'Whole Wheat Bread Loaves & Croissants', 'BAKERY', 'VEG', 50.0, 'PACKETS', 50, datetime('now', '-6 hours'), datetime('now', '+24 hours'), '78 12th Main, HAL 2nd Stage', 12.9719, 77.6412, 'Gluten', 'ROOM_TEMP', 'AVAILABLE', 'Freshly baked morning batch, securely packed in food-grade kraft bags'),
('list-004', 'org-donor-003', 'Assorted Seasonal Fruits (Apples, Oranges, Bananas)', 'PRODUCE', 'VEGAN', 30.0, 'KG', 60, datetime('now', '-1 hours'), datetime('now', '+48 hours'), 'Embassy Tech Village, Bellandur', 12.9260, 77.6830, 'None', 'REFRIGERATED', 'AVAILABLE', 'Surplus from tech park wellness day'),
('list-005', 'org-donor-005', 'South Indian Vegetable Upma & Chutney', 'COOKED_MEAL', 'VEG', 20.0, 'KG', 60, datetime('now', '-1 hours'), datetime('now', '+3 hours'), 'Hosur Road, Bhavani Nagar', 12.9340, 77.6060, 'Mustard seeds', 'ROOM_TEMP', 'AVAILABLE', 'Hostel breakfast surplus, sealed stainless steel vats'),
('list-006', 'org-donor-001', 'Chicken Biryani & Mirchi Ka Salan', 'COOKED_MEAL', 'NON_VEG', 35.0, 'KG', 85, datetime('now', '-18 hours'), datetime('now', '-10 hours'), '124 Old Airport Road, Indiranagar', 12.9602, 77.6434, 'Dairy', 'ROOM_TEMP', 'EXPIRED', 'Conference dinner surplus from previous evening - expired');

-- Completed Historical Claims (for impact statistics and dashboard charts)
INSERT OR IGNORE INTO donation_claims (claim_id, listing_id, recipient_org_id, requested_quantity, status, verification_otp, pickup_time, completion_time, notes, created_at)
VALUES
('clm-001', 'list-001', 'org-recip-005', 25.0, 'COMPLETED', '482910', datetime('now', '-1 days', '+2 hours'), datetime('now', '-1 days', '+3 hours'), 'Smooth pickup with insulated thermal crates', datetime('now', '-1 days')),
('clm-002', 'list-003', 'org-recip-001', 50.0, 'COMPLETED', '718293', datetime('now', '-2 days', '+1 hours'), datetime('now', '-2 days', '+2 hours'), 'Distributed to 45 resident children', datetime('now', '-2 days')),
('clm-003', 'list-002', 'org-recip-003', 40.0, 'COMPLETED', '901244', datetime('now', '-3 days', '+2 hours'), datetime('now', '-3 days', '+3 hours'), 'Served 120 meals at community center', datetime('now', '-3 days'));

-- Audit Logs
INSERT OR IGNORE INTO impact_audit_logs (audit_id, claim_id, listing_id, actor_user_id, action, previous_status, new_status, ip_address, details, timestamp)
VALUES
('aud-001', 'clm-001', 'list-001', 'usr-donor-01', 'CREATE_LISTING', NULL, 'AVAILABLE', '127.0.0.1', 'Food listing created: Vegetable Pulao (25 kg)', datetime('now', '-1 days', '-1 hours')),
('aud-002', 'clm-001', 'list-001', 'usr-recip-01', 'SUBMIT_CLAIM', 'AVAILABLE', 'REQUESTED', '127.0.0.1', 'Bengaluru Youth Mission requested listing', datetime('now', '-1 days')),
('aud-003', 'clm-001', 'list-001', 'usr-donor-01', 'ACCEPT_CLAIM', 'REQUESTED', 'ACCEPTED', '127.0.0.1', 'Donor accepted request, OTP generated', datetime('now', '-1 days', '+30 minutes')),
('aud-004', 'clm-001', 'list-001', 'usr-recip-01', 'COMPLETE_PICKUP', 'ACCEPTED', 'COMPLETED', '127.0.0.1', 'OTP verified, physical handover confirmed. 75 meals saved.', datetime('now', '-1 days', '+3 hours'));
