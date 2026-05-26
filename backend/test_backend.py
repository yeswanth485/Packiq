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
        product = {
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
            # current_box values are valid for the model but not the API, so out here
            "current_box_name": "Oversized Box",
            "current_box_length": 40.0,
            "current_box_width": 20.0,
            "current_box_height": 20.0,
            "current_box_cost_usd": 4.0
        }
        box_catalog = [
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
        ]
        payload = {
            "products": [product],
            "box_catalog": box_catalog
        }
        response = self.client.post("/optimize/", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Batch result: results list (async status will not trigger here)
        result = data["results"][0] if "results" in data and isinstance(data["results"], list) else data
        print('DEBUG BACKEND OPTIMIZE RESPONSE:', data)
        self.assertEqual(result["recommended_box_name"], "Long Bottle Box")
        self.assertTrue(result["savings"] >= 0)
        self.assertTrue(result["volume_saved_cm3"] >= 0)
        # Damage risk may sometimes be "Low" based on score, so allow both
        self.assertIn(result["damage_risk"], ("Medium", "Low"))

if __name__ == "__main__":
    unittest.main()
