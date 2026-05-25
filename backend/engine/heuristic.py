import math
from typing import List, Dict, Any, Tuple
from models.schemas import OptimizationInput, BoxSpec, OptimizationResponse

# Constants
DIM_DIVISOR = 5000
ZONE_RATES = {1: 0.42, 2: 0.54, 3: 0.66, 4: 0.84, 5: 1.08, 6: 1.44}

def get_base_rate(method: str) -> float:
    if method == 'express': return 15.0
    if method == 'overnight': return 25.0
    return 8.5

def calculate_dim_weight(l: float, w: float, h: float) -> float:
    return (l * w * h) / DIM_DIVISOR

def calculate_shipping_cost(weight_kg: float, l: float, w: float, h: float, zone: int, method: str) -> float:
    dim_weight = calculate_dim_weight(l, w, h)
    billable_weight = max(weight_kg, dim_weight)
    
    base = get_base_rate(method)
    zone_mult = ZONE_RATES.get(zone, 1.0)
    
    return base + (billable_weight * 1.5 * zone_mult)

def product_fits(pl: float, pw: float, ph: float, bl: float, bw: float, bh: float, padding: float = 1.0) -> bool:
    # 6 possible rotations
    rotations = [
        (pl, pw, ph), (pl, ph, pw),
        (pw, pl, ph), (pw, ph, pl),
        (ph, pl, pw), (ph, pw, pl)
    ]
    
    for rl, rw, rh in rotations:
        if (rl + padding*2 <= bl) and (rw + padding*2 <= bw) and (rh + padding*2 <= bh):
            return True
    return False

def calculate_sustainability_score(box: BoxSpec, void_percent: float) -> float:
    score = 100 - (void_percent * 0.5)
    if box.eco_certified:
        score += 15
    if box.material.lower() == 'kraft':
        score += 10
    return min(100.0, max(0.0, score))

def run_heuristic_optimization(input_data: OptimizationInput) -> OptimizationResponse:
    pl = input_data.length_cm
    pw = input_data.width_cm
    ph = input_data.height_cm
    product_vol = pl * pw * ph
    
    best_box = None
    best_score = -99999
    best_metrics = {}
    
    # 1. Calculate baseline
    baseline_shipping = 0.0
    baseline_cost = 0.0
    baseline_vol = 0.0
    
    if input_data.current_box_length and input_data.current_box_width and input_data.current_box_height:
        baseline_vol = input_data.current_box_length * input_data.current_box_width * input_data.current_box_height
        baseline_shipping = calculate_shipping_cost(
            input_data.weight_kg, 
            input_data.current_box_length, 
            input_data.current_box_width, 
            input_data.current_box_height, 
            input_data.destination_zone, 
            input_data.shipping_method
        )
        baseline_cost = baseline_shipping + (input_data.current_box_cost_usd or 0)
    
    # 2. Evaluate candidates
    valid_candidates = []
    
    for box in input_data.available_boxes:
        padding = 2.0 if input_data.fragility in ['high', 'extreme'] else 1.0
        
        if not product_fits(pl, pw, ph, box.length_cm, box.width_cm, box.height_cm, padding):
            continue
            
        if box.max_weight_kg and input_data.weight_kg > box.max_weight_kg:
            continue
            
        box_vol = box.length_cm * box.width_cm * box.height_cm
        void_vol = box_vol - product_vol
        void_percent = (void_vol / box_vol) * 100
        
        # We don't want boxes that are more than 70% empty
        if void_percent > 70:
            continue
            
        shipping_cost = calculate_shipping_cost(
            input_data.weight_kg,
            box.length_cm, box.width_cm, box.height_cm,
            input_data.destination_zone, input_data.shipping_method
        )
        total_cost = shipping_cost + box.cost_usd
        
        # Scoring components
        fit_score = 100 - (void_percent * 0.8)
        cost_score = 100 if baseline_cost == 0 else min(100, max(0, ((baseline_cost - total_cost) / baseline_cost) * 100 + 50))
        
        # Fragility penalty
        risk_penalty = 0
        damage_risk = "Low"
        if input_data.fragility in ['high', 'extreme']:
            if not box.double_wall:
                risk_penalty = 30
                damage_risk = "High"
            else:
                damage_risk = "Medium"
        elif void_percent > 40:
            damage_risk = "Medium"
            
        final_score = (fit_score * 0.4) + (cost_score * 0.6) - risk_penalty
        
        valid_candidates.append({
            'box': box,
            'score': final_score,
            'metrics': {
                'shipping_cost': shipping_cost,
                'total_cost': total_cost,
                'void_percent': void_percent,
                'box_vol': box_vol,
                'damage_risk': damage_risk,
                'fit_score': fit_score
            }
        })
        
    if not valid_candidates:
        # Fallback to a safe minimum generic box
        return OptimizationResponse(
            recommended_box_name="Custom Box Needed",
            recommended_box_dims=f"{pl+2}x{pw+2}x{ph+2}",
            packaging_cost=0,
            shipping_cost=0,
            total_cost=0,
            baseline_cost=baseline_cost,
            savings=0,
            savings_percent=0,
            damage_risk="High",
            space_utilization=0,
            confidence_score=0,
            reasoning="No available box fits this product safely.",
            dim_weight_reduction=0,
            volume_saved_cm3=0,
            sustainability_score=0
        )
        
    # Sort by score descending
    valid_candidates.sort(key=lambda x: x['score'], reverse=True)
    winner = valid_candidates[0]
    w_box = winner['box']
    w_metrics = winner['metrics']
    
    savings = max(0, baseline_cost - w_metrics['total_cost']) if baseline_cost > 0 else 0
    savings_percent = (savings / baseline_cost * 100) if baseline_cost > 0 else 0
    
    dim_reduction = 0
    vol_saved = 0
    if baseline_vol > 0:
        vol_saved = baseline_vol - w_metrics['box_vol']
        old_dim = baseline_vol / DIM_DIVISOR
        new_dim = w_metrics['box_vol'] / DIM_DIVISOR
        dim_reduction = max(0, old_dim - new_dim)
        
    sus_score = calculate_sustainability_score(w_box, w_metrics['void_percent'])
    
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
        damage_risk=w_metrics['damage_risk'],
        space_utilization=100 - w_metrics['void_percent'],
        confidence_score=min(99, winner['score']),
        reasoning=f"Selected {w_box.name} for optimal balance of DIM weight reduction and fit.",
        dim_weight_reduction=dim_reduction,
        volume_saved_cm3=vol_saved,
        sustainability_score=sus_score
    )
