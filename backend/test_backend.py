import unittest
from fastapi.testclient import TestClient
from main import app

class TestPackVisionBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_optimization(self):
        payload = {
            "product_name": "Test Wine Bottle",
            "product_id": "test-sku-1",
            "length_cm": 30.0,
            "width_cm": 8.0,
            "height_cm": 8.0,
            "weight_kg": 1.2,
            "fragility": "high",
            "quantity": 1,
            "category": "fragile",
            "destination_zone": 2,
            "shipping_method": "standard",
            "available_boxes": [
                {
                    "id": "box-s",
                    "name": "Small Box",
                    "sku": "BX-S",
                    "length_cm": 15.0,
                    "width_cm": 15.0,
                    "height_cm": 15.0,
                    "cost_usd": 1.5,
                    "eco_certified": True
                },
                {
                    "id": "box-l",
                    "name": "Long Bottle Box",
                    "sku": "BX-L",
                    "length_cm": 35.0,
                    "width_cm": 12.0,
                    "height_cm": 12.0,
                    "cost_usd": 2.5,
                    "eco_certified": True,
                    "double_wall": True
                }
            ],
            "current_box_name": "Oversized Box",
            "current_box_length": 40.0,
            "current_box_width": 20.0,
            "current_box_height": 20.0,
            "current_box_cost_usd": 4.0
        }
        
        response = self.client.post("/optimize/", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Long Bottle Box should be selected because "Small Box" (15x15x15) doesn't fit a 30cm product.
        self.assertEqual(data["recommended_box_name"], "Long Bottle Box")
        self.assertTrue(data["savings"] > 0)
        self.assertTrue(data["volume_saved_cm3"] > 0)
        self.assertEqual(data["damage_risk"], "Medium") # Double wall box on high fragility product -> Medium risk

if __name__ == "__main__":
    unittest.main()
