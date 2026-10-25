"""
SharePlate AI: Intelligent Food Donation Matching & Recommendation Engine
Module 3: AI Engineering

Implements multi-criteria weighted scoring algorithm:
Match Score = w1 * CategoryCompat + w2 * QuantityCompat + w3 * DistanceScore 
            + w4 * DemandCompat + w5 * CollectionTimeCompat

Utilizes:
- Haversine Geospatial Distance Formula
- Scikit-learn MinMaxScaler / standard scaling principles
- Temporal deadline & decay constraints
- Explainable AI (XAI) rationale generation
"""

import math
import json
import os
import sys
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

# Default Configurable Feature Weights (Must sum to 1.0)
DEFAULT_WEIGHTS = {
    "category": 0.25,     # Food category & dietary restriction compatibility
    "quantity": 0.20,     # Surplus quantity vs daily meal deficit suitability
    "distance": 0.25,     # Geospatial proximity (Haversine decay)
    "demand": 0.15,       # Recipient urgency, active beneficiaries & historical deficit
    "collection_time": 0.15 # Safe distribution buffer before expiry cutoff
}

class FoodMatchingEngine:
    def __init__(self, weights=None, max_distance_km=25.0):
        self.weights = weights or DEFAULT_WEIGHTS
        self.max_distance_km = max_distance_km
        self._validate_weights()

    def _validate_weights(self):
        total = sum(self.weights.values())
        if not math.isclose(total, 1.0, rel_tol=1e-3):
            raise ValueError(f"Feature weights must sum to 1.0. Current sum: {total:.4f}")

    @staticmethod
    def haversine_distance(lat1, lon1, lat2, lon2):
        """
        Calculates Great-Circle distance in kilometers between two GPS coordinates.
        Formula:
            a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
            c = 2 ⋅ atan2( √a, √(1−a) )
            d = R ⋅ c
        """
        R = 6371.0 # Earth's radius in kilometers
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def calculate_category_score(self, listing, recipient):
        """
        Evaluates food category and dietary preference alignment.
        Returns a score in [0.0, 1.0].
        """
        score = 0.0
        preferred = [c.strip().upper() for c in recipient.get('preferred_categories', '').split(',')]
        listing_cat = listing.get('category', '').upper()
        
        # Base category match
        if listing_cat in preferred or not preferred or preferred == ['']:
            score += 0.6
        else:
            score += 0.2 # partial compatibility

        # Dietary preference match
        recip_diet = recipient.get('dietary_preference', 'ANY').upper()
        list_diet = listing.get('dietary_type', 'VEG').upper()

        if recip_diet == 'ANY':
            score += 0.4
        elif recip_diet == 'VEG_ONLY':
            if list_diet in ['VEG', 'VEGAN', 'JAIN']:
                score += 0.4
            else:
                return 0.0 # Strict constraint: non-veg cannot go to veg-only shelter
        elif recip_diet == 'VEGAN_ONLY':
            if list_diet == 'VEGAN':
                score += 0.4
            else:
                return 0.0
        elif recip_diet == 'HALAL_ONLY':
            if list_diet in ['VEG', 'VEGAN', 'HALAL']:
                score += 0.4
            else:
                score += 0.1
        else:
            score += 0.3

        return min(1.0, score)

    def calculate_quantity_score(self, listing, recipient):
        """
        Assesses quantity suitability against recipient beneficiary capacity / deficit.
        Ideal ratio is between 0.5 and 1.2 of recipient's daily deficit.
        """
        servings = float(listing.get('approx_servings') or 50)
        deficit = float(recipient.get('daily_meal_deficit') or recipient.get('beneficiary_count') or 60)
        if deficit <= 0:
            return 0.5

        ratio = servings / deficit
        if 0.5 <= ratio <= 1.2:
            return 1.0
        elif ratio < 0.5:
            # Partial fulfillment: 0.1 to 0.5 maps to 0.4 to 0.95
            return max(0.2, ratio / 0.5 * 0.95)
        else:
            # Oversupply: slight penalty if excess cannot be stored
            has_cold_storage = bool(recipient.get('has_refrigeration') or recipient.get('has_deep_freeze'))
            if has_cold_storage:
                return max(0.7, 1.0 - (ratio - 1.2) * 0.15)
            else:
                return max(0.4, 1.0 - (ratio - 1.2) * 0.35)

    def calculate_distance_score(self, listing, recipient):
        """
        Evaluates geospatial proximity. Closer recipients receive higher scores.
        Returns (distance_score, distance_km).
        """
        lat1 = float(listing.get('pickup_latitude') or 12.9716)
        lon1 = float(listing.get('pickup_longitude') or 77.5946)
        lat2 = float(recipient.get('latitude') or 12.9716)
        lon2 = float(recipient.get('longitude') or 77.5946)

        dist_km = self.haversine_distance(lat1, lon1, lat2, lon2)
        recip_max_dist = float(recipient.get('max_distance_km') or self.max_distance_km)
        effective_max = min(recip_max_dist, self.max_distance_km)

        if dist_km > effective_max:
            # Beyond max acceptable transit radius
            return 0.05, dist_km

        # Linear decay normalized to [0, 1]
        score = max(0.0, 1.0 - (dist_km / effective_max))
        # Bonus for owned transport
        if recipient.get('transport_available'):
            score = min(1.0, score + 0.1)

        return score, dist_km

    def calculate_demand_score(self, recipient):
        """
        Measures recipient organization demand intensity based on beneficiary headcount.
        """
        beneficiaries = float(recipient.get('beneficiary_count') or 50)
        deficit = float(recipient.get('daily_meal_deficit') or 50)

        # Scale demand: Higher deficit and headcount yields higher priority
        demand_metric = (deficit * 0.6) + (beneficiaries * 0.4)
        # S-curve / sigmoid-like normalization
        normalized_demand = min(1.0, demand_metric / 150.0)
        return max(0.3, normalized_demand)

    def calculate_collection_time_score(self, listing, distance_km):
        """
        Assesses temporal feasibility.
        Calculates remaining hours before expiry cutoff minus estimated transit time.
        """
        expiry_str = listing.get('expiry_time')
        if not expiry_str:
            return 0.5, 0.0, "Standard availability window"

        try:
            # Parse ISO or SQLite datetime
            clean_str = expiry_str.replace('Z', '').split('.')[0]
            if 'T' in clean_str:
                exp_dt = datetime.fromisoformat(clean_str)
            else:
                exp_dt = datetime.strptime(clean_str, '%Y-%m-%d %H:%M:%S')
            
            now_dt = datetime.now()
            hours_left = (exp_dt - now_dt).total_seconds() / 3600.0
        except Exception:
            hours_left = 4.0 # default fallback

        if hours_left <= 0:
            return 0.0, hours_left, "Listing is expired"

        # Estimated travel time assuming urban city speed of 20 km/h
        transit_hours = distance_km / 20.0
        buffer_hours = hours_left - transit_hours

        if buffer_hours <= 0:
            return 0.1, hours_left, f"Insufficient time: {transit_hours:.1f}h transit vs {hours_left:.1f}h left"
        elif buffer_hours >= 3.0:
            return 1.0, hours_left, f"Optimal window: {hours_left:.1f}h available (>3h safety buffer)"
        else:
            score = max(0.2, buffer_hours / 3.0)
            return score, hours_left, f"Tight collection window: {buffer_hours:.1f}h safety buffer"

    def generate_explanation(self, recipient, cat_score, qty_score, dist_score, dist_km, demand_score, time_score, hours_left, final_score):
        """
        Generates Explainable AI (XAI) textual rationale for human transparency.
        """
        reasons = []
        name = recipient.get('org_name', 'Organization')
        
        # Distance rationale
        if dist_km <= 5.0:
            reasons.append(f"Convenient local pickup: only {dist_km:.1f} km away (~{int(dist_km*3)} mins transit)")
        elif dist_km <= 15.0:
            reasons.append(f"Manageable operational distance ({dist_km:.1f} km)")
        else:
            reasons.append(f"Extended pickup distance ({dist_km:.1f} km)")

        # Quantity rationale
        servings = recipient.get('beneficiary_count', 50)
        if qty_score >= 0.85:
            reasons.append(f"High capacity match for their daily count of {servings} beneficiaries")
        elif qty_score >= 0.6:
            reasons.append(f"Adequate portion size for recipient meal needs")

        # Category rationale
        if cat_score >= 0.9:
            reasons.append("Exact dietary & food category alignment")
        elif cat_score < 0.4:
            reasons.append("Partial category fit; check dietary restrictions")

        # Time rationale
        if time_score >= 0.8:
            reasons.append(f"Safe time margin ({hours_left:.1f}h before expiry)")
        elif time_score < 0.4:
            reasons.append("Urgent collection required")

        summary = f"{name} is ranked with a {final_score:.1f}% match score. " + "; ".join(reasons) + "."
        return summary

    def rank_recipients(self, listing, recipients_list):
        """
        Main algorithmic matching pipeline:
        1. Validate listing availability (exclude expired or cancelled)
        2. Evaluate each candidate recipient
        3. Compute normalized weighted match score
        4. Sort and return transparent explainable recommendations
        """
        # Exclusion of inactive or expired listing
        status = listing.get('status', 'AVAILABLE').upper()
        if status not in ['AVAILABLE', 'LISTED']:
            return []

        scored_candidates = []

        for recip in recipients_list:
            cat_score = self.calculate_category_score(listing, recip)
            if cat_score <= 0.0:
                continue # Incompatible dietary restriction (e.g. Non-veg to pure veg)

            qty_score = self.calculate_quantity_score(listing, recip)
            dist_score, dist_km = self.calculate_distance_score(listing, recip)
            demand_score = self.calculate_demand_score(recip)
            time_score, hours_left, time_desc = self.calculate_collection_time_score(listing, dist_km)

            if time_score <= 0.0:
                continue # Expired or physically impossible collection time

            # Weighted sum computation
            weighted_sum = (
                self.weights['category'] * cat_score +
                self.weights['quantity'] * qty_score +
                self.weights['distance'] * dist_score +
                self.weights['demand'] * demand_score +
                self.weights['collection_time'] * time_score
            )

            # Normalized to 100-point scale
            match_percentage = round(weighted_sum * 100.0, 1)

            explanation = self.generate_explanation(
                recip, cat_score, qty_score, dist_score, dist_km,
                demand_score, time_score, hours_left, match_percentage
            )

            scored_candidates.append({
                "recipient_org_id": recip.get('org_id'),
                "recipient_name": recip.get('org_name'),
                "org_type": recip.get('org_type'),
                "contact_person": recip.get('contact_person'),
                "contact_phone": recip.get('contact_phone'),
                "address": recip.get('address'),
                "overall_score": match_percentage,
                "scores_breakdown": {
                    "category_compatibility": round(cat_score * 100, 1),
                    "quantity_suitability": round(qty_score * 100, 1),
                    "distance_score": round(dist_score * 100, 1),
                    "demand_priority": round(demand_score * 100, 1),
                    "collection_time_score": round(time_score * 100, 1)
                },
                "metrics": {
                    "distance_km": round(dist_km, 2),
                    "hours_remaining": round(hours_left, 1),
                    "beneficiary_count": recip.get('beneficiary_count', 0),
                    "daily_meal_deficit": recip.get('daily_meal_deficit', 0),
                    "transport_available": bool(recip.get('transport_available')),
                    "cold_storage": bool(recip.get('has_refrigeration'))
                },
                "explanation": explanation
            })

        # Rank descending by overall match score
        scored_candidates.sort(key=lambda x: x['overall_score'], reverse=True)
        return scored_candidates


# CLI Runner & Direct Execution Helper
if __name__ == "__main__":
    if "--test" in sys.argv:
        print("[SharePlate AI] Running recommendation engine self-test...")
        engine = FoodMatchingEngine()
        sample_listing = {
            "listing_id": "test-001",
            "category": "COOKED_MEAL",
            "dietary_type": "VEG",
            "approx_servings": 80,
            "pickup_latitude": 12.9602,
            "pickup_longitude": 77.6434,
            "expiry_time": "2026-10-25 23:00:00",
            "status": "AVAILABLE"
        }
        sample_recipients = [
            {
                "org_id": "r1", "org_name": "Hope Children Shelter",
                "preferred_categories": "COOKED_MEAL,PRODUCE",
                "dietary_preference": "ANY", "beneficiary_count": 85,
                "daily_meal_deficit": 80, "latitude": 12.9642, "longitude": 77.6189,
                "max_distance_km": 15.0, "transport_available": 1, "has_refrigeration": 1
            },
            {
                "org_id": "r2", "org_name": "Karuna Senior Care",
                "preferred_categories": "COOKED_MEAL",
                "dietary_preference": "VEG_ONLY", "beneficiary_count": 50,
                "daily_meal_deficit": 50, "latitude": 13.0035, "longitude": 77.5710,
                "max_distance_km": 10.0, "transport_available": 0, "has_refrigeration": 1
            }
        ]
        results = engine.rank_recipients(sample_listing, sample_recipients)
        print(f"Algorithm executed successfully! Ranked {len(results)} recipients:")
        for r in results:
            print(f" -> {r['recipient_name']}: {r['overall_score']}% | {r['explanation']}")
    elif "--stdin" in sys.argv:
        input_data = json.loads(sys.stdin.read())
        engine = FoodMatchingEngine(weights=input_data.get('weights'))
        results = engine.rank_recipients(input_data['listing'], input_data['recipients'])
        print(json.dumps(results))
