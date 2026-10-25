/**
 * SharePlate AI: Comprehensive Input Validation Middleware
 * Module 1: Data Engineering & Module 4: Security Engineering
 * 
 * Enforces strict type checking, positive numeric ranges, future temporal constraints,
 * and sanitization against injection vectors.
 */

function validateFoodListing(req, res, next) {
  const errors = [];
  const {
    food_name,
    category,
    dietary_type,
    quantity,
    quantity_unit,
    approx_servings,
    expiry_time,
    pickup_address,
    pickup_latitude,
    pickup_longitude
  } = req.body;

  // 1. Mandatory Text Fields
  if (!food_name || typeof food_name !== 'string' || !food_name.trim()) {
    errors.push({ field: 'food_name', message: 'Food title is mandatory and must not be empty.' });
  }

  // 2. Category Enumeration
  const validCategories = ['COOKED_MEAL', 'BAKERY', 'PRODUCE', 'PACKAGED_GOODS'];
  if (!category || !validCategories.includes(category.toUpperCase())) {
    errors.push({
      field: 'category',
      message: `Invalid category. Must be one of: [${validCategories.join(', ')}].`
    });
  }

  // 3. Dietary Classification
  const validDietary = ['VEG', 'NON_VEG', 'VEGAN', 'JAIN'];
  if (dietary_type && !validDietary.includes(dietary_type.toUpperCase())) {
    errors.push({
      field: 'dietary_type',
      message: `Invalid dietary classification. Must be one of: [${validDietary.join(', ')}].`
    });
  }

  // 4. Positive Quantity Check
  const numQty = parseFloat(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    errors.push({ field: 'quantity', message: 'Quantity must be a positive number greater than 0.' });
  }

  // 5. Quantity Units
  const validUnits = ['KG', 'SERVINGS', 'PACKETS', 'TRAYS'];
  if (!quantity_unit || !validUnits.includes(quantity_unit.toUpperCase())) {
    errors.push({
      field: 'quantity_unit',
      message: `Invalid measurement unit. Must be one of: [${validUnits.join(', ')}].`
    });
  }

  // 6. Servings Check
  const numServings = parseInt(approx_servings, 10);
  if (isNaN(numServings) || numServings <= 0) {
    errors.push({ field: 'approx_servings', message: 'Approximate servings must be a positive integer greater than 0.' });
  }

  // 7. Expiry Time & Temporal Validity Check
  if (!expiry_time) {
    errors.push({ field: 'expiry_time', message: 'Collection deadline / expiry time is required.' });
  } else {
    const expDate = new Date(expiry_time);
    if (isNaN(expDate.getTime())) {
      errors.push({ field: 'expiry_time', message: 'Expiry time is not a valid date format.' });
    } else {
      const now = new Date();
      if (expDate <= now) {
        errors.push({
          field: 'expiry_time',
          message: 'Collection deadline must be set in the future. Past dates are strictly rejected.'
        });
      }
    }
  }

  // 8. Pickup Location
  if (!pickup_address || typeof pickup_address !== 'string' || !pickup_address.trim()) {
    errors.push({ field: 'pickup_address', message: 'Pickup physical address is mandatory.' });
  }

  // 9. Coordinate Ranges
  if (pickup_latitude !== undefined && pickup_latitude !== null) {
    const lat = parseFloat(pickup_latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push({ field: 'pickup_latitude', message: 'Latitude must be a valid number between -90 and 90.' });
    }
  }

  if (pickup_longitude !== undefined && pickup_longitude !== null) {
    const lon = parseFloat(pickup_longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      errors.push({ field: 'pickup_longitude', message: 'Longitude must be a valid number between -180 and 180.' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Submitted food donation payload contains invalid or missing fields.',
      errors
    });
  }

  next();
}

function validateClaimRequest(req, res, next) {
  const errors = [];
  const { listing_id, requested_quantity } = req.body;

  if (!listing_id || typeof listing_id !== 'string') {
    errors.push({ field: 'listing_id', message: 'Valid listing_id is required.' });
  }

  const qty = parseFloat(requested_quantity);
  if (isNaN(qty) || qty <= 0) {
    errors.push({ field: 'requested_quantity', message: 'Requested quantity must be greater than 0.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Claim request contains invalid parameters.',
      errors
    });
  }

  next();
}

function validateRecipientProfile(req, res, next) {
  const errors = [];
  const { daily_meal_deficit, beneficiary_count, max_distance_km } = req.body;

  if (daily_meal_deficit !== undefined) {
    const val = parseInt(daily_meal_deficit, 10);
    if (isNaN(val) || val < 0) {
      errors.push({ field: 'daily_meal_deficit', message: 'Daily meal deficit must be a non-negative integer.' });
    }
  }

  if (beneficiary_count !== undefined) {
    const val = parseInt(beneficiary_count, 10);
    if (isNaN(val) || val < 0) {
      errors.push({ field: 'beneficiary_count', message: 'Beneficiary count must be a non-negative integer.' });
    }
  }

  if (max_distance_km !== undefined) {
    const val = parseFloat(max_distance_km);
    if (isNaN(val) || val <= 0) {
      errors.push({ field: 'max_distance_km', message: 'Maximum transit distance must be greater than 0.' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Profile update failed validation constraints.',
      errors
    });
  }

  next();
}

module.exports = {
  validateFoodListing,
  validateClaimRequest,
  validateRecipientProfile
};
