"""
Automated Test Suite for SharePlate AI Matching Engine
Module 3: AI Engineering Verification
"""

import unittest
import math
import sys
import os

# Ensure parent directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from matcher import FoodMatchingEngine, DEFAULT_WEIGHTS

class TestFoodMatchingEngine(unittest.TestCase):
    def setUp(self):
        self.engine = FoodMatchingEngine()

    def test_weights_sum_to_one(self):
        """Verify feature weights adhere to unit sum invariant."""
        total = sum(self.engine.weights.values())
        self.assertTrue(math.isclose(total, 1.0, rel_tol=1e-4), f"Weights sum to {total}")

    def test_invalid_weights_raise_exception(self):
        """Engine should reject weight sets that don't sum to 1.0."""
        invalid_weights = {"category": 0.5, "quantity": 0.5, "distance": 0.5, "demand": 0.1, "collection_time": 0.1}
        with self.assertRaises(ValueError):
            FoodMatchingEngine(weights=invalid_weights)

    def test_haversine_distance_calculation(self):
        """Verify Haversine formula against known Bangalore coordinates."""
        # Indiranagar (12.9719, 77.6412) to Koramangala (12.9345, 77.6250) ~ 4.5 km
        dist = FoodMatchingEngine.haversine_distance(12.9719, 77.6412, 12.9345, 77.6250)
        self.assertGreater(dist, 4.0)
        self.assertLess(dist, 5.5)

    def test_dietary_restriction_strict_enforcement(self):
        """Non-vegetarian donations must be excluded from VEG_ONLY recipients."""
        non_veg_listing = {
            "listing_id": "nv-1",
            "category": "COOKED_MEAL",
            "dietary_type": "NON_VEG",
            "approx_servings": 50,
            "expiry_time": "2026-10-25 23:59:59",
            "status": "AVAILABLE"
        }
        veg_recipient = {
            "org_id": "r-veg",
            "org_name": "Karuna Veg Shelter",
            "preferred_categories": "COOKED_MEAL",
            "dietary_preference": "VEG_ONLY",
            "beneficiary_count": 50,
            "daily_meal_deficit": 50,
            "latitude": 12.9716, "longitude": 77.5946
        }
        ranked = self.engine.rank_recipients(non_veg_listing, [veg_recipient])
        self.assertEqual(len(ranked), 0, "Non-veg food should be strictly excluded for veg-only recipient")

    def test_expired_donation_exclusion(self):
        """Expired listings must yield 0 recommendations."""
        expired_listing = {
            "listing_id": "exp-1",
            "category": "COOKED_MEAL",
            "dietary_type": "VEG",
            "expiry_time": "2025-01-01 10:00:00", # Past date
            "status": "AVAILABLE"
        }
        recipient = {
            "org_id": "r-1", "org_name": "Shelter",
            "preferred_categories": "COOKED_MEAL", "dietary_preference": "ANY",
            "beneficiary_count": 50, "daily_meal_deficit": 50,
            "latitude": 12.9716, "longitude": 77.5946
        }
        ranked = self.engine.rank_recipients(expired_listing, [recipient])
        self.assertEqual(len(ranked), 0, "Expired listings must be excluded")

    def test_proximity_ranking_preference(self):
        """Closer recipient should receive a higher match score than distant one ceteris paribus."""
        listing = {
            "listing_id": "l-1",
            "category": "COOKED_MEAL",
            "dietary_type": "VEG",
            "approx_servings": 60,
            "pickup_latitude": 12.9600,
            "pickup_longitude": 77.6400,
            "expiry_time": "2026-10-25 23:59:59",
            "status": "AVAILABLE"
        }
        close_recipient = {
            "org_id": "r-close", "org_name": "Close Community Kitchen",
            "preferred_categories": "COOKED_MEAL", "dietary_preference": "ANY",
            "beneficiary_count": 60, "daily_meal_deficit": 60,
            "latitude": 12.9620, "longitude": 77.6420, # < 1 km
            "max_distance_km": 15.0, "transport_available": 1
        }
        far_recipient = {
            "org_id": "r-far", "org_name": "Far Away Shelter",
            "preferred_categories": "COOKED_MEAL", "dietary_preference": "ANY",
            "beneficiary_count": 60, "daily_meal_deficit": 60,
            "latitude": 13.0500, "longitude": 77.5000, # ~ 18 km
            "max_distance_km": 20.0, "transport_available": 0
        }
        ranked = self.engine.rank_recipients(listing, [close_recipient, far_recipient])
        self.assertEqual(len(ranked), 2)
        self.assertEqual(ranked[0]['recipient_org_id'], "r-close")
        self.assertGreater(ranked[0]['overall_score'], ranked[1]['overall_score'])

    def test_explainable_rationale_present(self):
        """Check that transparent human-readable explanation is generated."""
        listing = {
            "listing_id": "l-2", "category": "BAKERY", "dietary_type": "VEG",
            "approx_servings": 50, "pickup_latitude": 12.96, "pickup_longitude": 77.64,
            "expiry_time": "2026-10-25 22:00:00", "status": "AVAILABLE"
        }
        recipient = {
            "org_id": "r-exp", "org_name": "Hope Foundation",
            "preferred_categories": "BAKERY", "dietary_preference": "ANY",
            "beneficiary_count": 50, "daily_meal_deficit": 50,
            "latitude": 12.965, "longitude": 77.645, "max_distance_km": 10.0
        }
        ranked = self.engine.rank_recipients(listing, [recipient])
        self.assertEqual(len(ranked), 1)
        explanation = ranked[0]['explanation']
        self.assertIn("Hope Foundation is ranked", explanation)
        self.assertIn("match score", explanation)

if __name__ == "__main__":
    unittest.main()
