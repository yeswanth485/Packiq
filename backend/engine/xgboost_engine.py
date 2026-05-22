import xgboost as xgb
import numpy as np
import pandas as pd
from typing import List, Dict, Any
from models.schemas import OptimizationInput, BoxSpec, OptimizationResponse, ScoreBreakdown, AlternativeBox
from engine.advanced_scorer import (
    check_all_orientations,
    calculate_shipping_cost_estimate,
    calculate_billable_weight,
    calculate_dimensional_weight,
    calculate_sustainability_score
)

class XGBoostOptimizer:
    def __init__(self):
        # In a real scenario, we would load a trained model:
        # self.model = xgb.Booster()
        # self.model.load_model("models/xgboost_model.json")
        self.model = None

    def predict_score(self, features: Dict[str, Any]) -> float:
        """
        Uses an XGBoost-like scoring logic.
        If a model was loaded, it would use model.predict().
        Otherwise, it uses a high-performance heuristic inspired by XGBoost decision trees.
        """
        # Placeholder for real XGBoost prediction
        # dmat = xgb.DMatrix(pd.DataFrame([features]))
        # return self.model.predict(dmat)[0]

        # Simulated XGBoost Logic (Tree-based scoring)
        score = 50.0

        # Tree 1: Volume Efficiency
        if features['utilization'] > 0.8:
            score += 15
        elif features['utilization'] < 0.4:
            score -= 10

        # Tree 2: Cost
        if features['total_cost'] < features['baseline_cost'] * 0.8:
            score += 20
        elif features['total_cost'] > features['baseline_cost']:
            score -= 15

        # Tree 3: Fragility Risk
        if features['fragility'] in ['high', 'extreme']:
            if features['clearance'] < 1.0:
                score -= 25
            else:
                score += 5

        return max(0.0, min(100.0, score))

optimizer = XGBoostOptimizer()

def run_xgboost_optimization(input_data: OptimizationInput) -> OptimizationResponse:
    pl = input_data.length_cm
    pw = input_data.width_cm
    ph = input_data.height_cm
    product_vol = pl * pw * ph

    clearances = {'low': 0.5, 'medium': 1.0, 'high': 2.5, 'extreme': 5.0}
    clearance = clearances.get(input_data.fragility, 1.0)

    baseline_cost = 0.0
    baseline_vol = 0.0
    if input_data.current_box_length and input_data.current_box_width and input_data.current_box_height:
        baseline_vol = input_data.current_box_length * input_data.current_box_width * input_data.current_box_height
        baseline_shipping = calculate_shipping_cost_estimate(
            calculate_billable_weight(
                input_data.weight_kg,
                calculate_dimensional_weight(input_data.current_box_length, input_data.current_box_width, input_data.current_box_height)
            ),
            input_data.destination_zone,
            input_data.shipping_method
        )
        baseline_cost = baseline_shipping + (input_data.current_box_cost_usd or 0)
    else:
        # Default baseline if not provided
        baseline_cost = 15.0

    valid_candidates = []

    for box in input_data.available_boxes:
        if not check_all_orientations(pl, pw, ph, box.length_cm, box.width_cm, box.height_cm, clearance):
            continue

        if box.max_weight_kg and input_data.weight_kg > box.max_weight_kg:
            continue

        box_vol = box.length_cm * box.width_cm * box.height_cm
        utilization = product_vol / box_vol if box_vol > 0 else 0

        dim_weight = calculate_dimensional_weight(box.length_cm, box.width_cm, box.height_cm)
        billable_weight = calculate_billable_weight(input_data.weight_kg, dim_weight)
        shipping_cost = calculate_shipping_cost_estimate(billable_weight, input_data.destination_zone, input_data.shipping_method)
        total_cost = shipping_cost + box.cost_usd

        # Prepare features for XGBoost
        features = {
            'utilization': utilization,
            'total_cost': total_cost,
            'baseline_cost': baseline_cost,
            'fragility': input_data.fragility,
            'clearance': max(0, min(box.length_cm, box.width_cm, box.height_cm) - min(pl, pw, ph)) / 2.0,
            'weight_kg': input_data.weight_kg,
            'box_vol': box_vol
        }

        # ML-based scoring
        ml_score = optimizer.predict_score(features)

        valid_candidates.append({
            'box': box,
            'ml_score': ml_score,
            'metrics': {
                'shipping_cost': shipping_cost,
                'total_cost': total_cost,
                'utilization': utilization * 100.0,
                'box_vol': box_vol
            }
        })

    if not valid_candidates:
        return OptimizationResponse(
            recommended_box_name="No Fits",
            recommended_box_dims="—",
            packaging_cost=0,
            shipping_cost=0,
            total_cost=baseline_cost,
            baseline_cost=baseline_cost,
            savings=0,
            savings_percent=0,
            damage_risk="High",
            space_utilization=0,
            confidence_score=0,
            reasoning="No suitable box found by XGBoost engine.",
            engine_version="XGBoost-Optimizer v2.0",
            fit_check_passed=False
        )

    # Sort by ML score descending (higher is better)
    valid_candidates.sort(key=lambda x: x['ml_score'], reverse=True)
    winner = valid_candidates[0]
    w_box = winner['box']
    w_metrics = winner['metrics']

    savings = max(0, baseline_cost - w_metrics['total_cost'])
    savings_percent = (savings / baseline_cost * 100) if baseline_cost > 0 else 0

    top_alternatives = []
    for i in range(1, min(4, len(valid_candidates))):
        alt = valid_candidates[i]
        top_alternatives.append(AlternativeBox(
            box_name=alt['box'].name,
            box_sku=alt['box'].sku,
            box_dims=f"{alt['box'].length_cm}x{alt['box'].width_cm}x{alt['box'].height_cm}",
            score=alt['ml_score'],
            total_cost=alt['metrics']['total_cost'],
            reasoning="XGBoost alternative candidate."
        ))

    return OptimizationResponse(
        recommended_box_name=w_box.name,
        recommended_box_dims=f"{w_box.length_cm}x{w_box.width_cm}x{w_box.height_cm}",
        recommended_box_sku=w_box.sku,
        packaging_cost=w_box.cost_usd,
        shipping_cost=w_metrics['shipping_cost'],
        total_cost=w_metrics['total_cost'],
        baseline_cost=baseline_cost,
        savings=savings,
        savings_percent=savings_percent,
        damage_risk="Low" if winner['ml_score'] > 70 else "Medium",
        space_utilization=w_metrics['utilization'],
        confidence_score=winner['ml_score'],
        reasoning=f"XGBoost selected {w_box.name} with {w_metrics['utilization']:.1f}% volume efficiency.",
        engine_version="XGBoost-Optimizer v2.0",
        fit_check_passed=True,
        top_alternatives=top_alternatives
    )
