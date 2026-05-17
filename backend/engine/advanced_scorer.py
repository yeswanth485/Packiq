import math
from typing import List, Dict, Any, Tuple
from models.schemas import OptimizationInput, BoxSpec, OptimizationResponse, ScoreBreakdown, AlternativeBox

DIM_DIVISOR = 5000
ZONE_RATES = {1: 0.42, 2: 0.54, 3: 0.66, 4: 0.84, 5: 1.08, 6: 1.44}

def check_all_orientations(pl: float, pw: float, ph: float, bl: float, bw: float, bh: float, clearance: float = 1.0) -> bool:
    # 6 possible rotations
    rotations = [
        (pl, pw, ph), (pl, ph, pw),
        (pw, pl, ph), (pw, ph, pl),
        (ph, pl, pw), (ph, pw, pl)
    ]
    for rl, rw, rh in rotations:
        if (rl + clearance * 2 <= bl) and (rw + clearance * 2 <= bw) and (rh + clearance * 2 <= bh):
            return True
    return False

def calculate_empty_space_ratio(product_vol: float, box_vol: float) -> float:
    if box_vol == 0:
        return 1.0
    return max(0.0, (box_vol - product_vol) / box_vol)

def calculate_dimensional_weight(bl: float, bw: float, bh: float) -> float:
    return (bl * bw * bh) / DIM_DIVISOR

def calculate_billable_weight(actual_weight: float, dim_weight: float) -> float:
    return max(actual_weight, dim_weight)

def get_base_rate(method: str) -> float:
    if method == 'express': return 15.0
    if method == 'overnight': return 25.0
    return 8.5

def calculate_shipping_cost_estimate(billable_weight: float, zone: int, method: str) -> float:
    base = get_base_rate(method)
    zone_mult = ZONE_RATES.get(zone, 1.0)
    return base + (billable_weight * 1.5 * zone_mult)

def calculate_damage_risk_penalty(fragility: str, clearance_ratio: float, double_wall: bool) -> float:
    # Lower penalty is better
    penalty = 0.0
    
    if fragility in ['high', 'extreme']:
        if not double_wall:
            penalty += 40.0
        if clearance_ratio < 1.0:
            penalty += 40.0 * (1.0 - clearance_ratio)
    elif fragility == 'medium':
        if clearance_ratio < 1.0:
            penalty += 20.0 * (1.0 - clearance_ratio)
    
    # If it's very loose, it also has a risk
    if clearance_ratio > 3.0:
        penalty += 10.0
        
    return min(100.0, penalty)

def calculate_material_cost_penalty(box_cost: float, void_vol: float, max_box_cost: float, max_void_vol: float) -> float:
    # Normalize box cost penalty
    cost_penalty = (box_cost / max_box_cost) * 50.0 if max_box_cost > 0 else 0.0
    # Normalize void fill penalty
    void_penalty = (void_vol / max_void_vol) * 50.0 if max_void_vol > 0 else 0.0
    return min(100.0, cost_penalty + void_penalty)

def calculate_sustainability_score(box: BoxSpec, empty_ratio: float) -> float:
    score = 100 - (empty_ratio * 100 * 0.5)
    if box.eco_certified:
        score += 15
    if box.material and box.material.lower() == 'kraft':
        score += 10
    return min(100.0, max(0.0, score))

def run_advanced_optimization(input_data: OptimizationInput) -> OptimizationResponse:
    pl = input_data.length_cm
    pw = input_data.width_cm
    ph = input_data.height_cm
    product_vol = pl * pw * ph
    
    # Clearances based on fragility
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

    max_box_cost = max([b.cost_usd for b in input_data.available_boxes]) if input_data.available_boxes else 0.0
    # Find max possible void vol to normalize material cost penalty
    max_void_vol = 0.0
    for box in input_data.available_boxes:
        vol = box.length_cm * box.width_cm * box.height_cm
        max_void_vol = max(max_void_vol, vol - product_vol)
    
    # Evaluate valid candidates
    valid_candidates = []
    
    for box in input_data.available_boxes:
        if not check_all_orientations(pl, pw, ph, box.length_cm, box.width_cm, box.height_cm, clearance):
            continue
            
        if box.max_weight_kg and input_data.weight_kg > box.max_weight_kg:
            continue
            
        box_vol = box.length_cm * box.width_cm * box.height_cm
        void_vol = max(0, box_vol - product_vol)
        empty_space_ratio = calculate_empty_space_ratio(product_vol, box_vol)
        
        dim_weight = calculate_dimensional_weight(box.length_cm, box.width_cm, box.height_cm)
        billable_weight = calculate_billable_weight(input_data.weight_kg, dim_weight)
        shipping_cost = calculate_shipping_cost_estimate(billable_weight, input_data.destination_zone, input_data.shipping_method)
        total_cost = shipping_cost + box.cost_usd
        
        # Calculate Penalties (Lower is better)
        # Empty space penalty: 0 to 100
        empty_space_penalty = empty_space_ratio * 100.0
        
        # Shipping cost penalty: normalize against a theoretical max shipping cost
        max_theoretical_shipping = calculate_shipping_cost_estimate(max(input_data.weight_kg, calculate_dimensional_weight(100, 100, 100)), input_data.destination_zone, input_data.shipping_method)
        shipping_cost_penalty = min(100.0, (shipping_cost / max_theoretical_shipping) * 100.0) if max_theoretical_shipping > 0 else 0
        
        # Damage risk penalty
        min_box_dim = min(box.length_cm, box.width_cm, box.height_cm)
        min_prod_dim = min(pl, pw, ph)
        actual_clearance = max(0, min_box_dim - min_prod_dim) / 2.0
        clearance_ratio = actual_clearance / clearance if clearance > 0 else 1.0
        damage_risk_penalty = calculate_damage_risk_penalty(input_data.fragility, clearance_ratio, box.double_wall)
        
        # Material cost penalty
        material_cost_penalty = calculate_material_cost_penalty(box.cost_usd, void_vol, max_box_cost, max_void_vol)
        
        # Final Score Formula (Minimization)
        # score = (empty_space_ratio * w1) + (shipping_cost * w2) + (damage_risk * w3) + (material_cost * w4)
        w1, w2, w3, w4 = 0.25, 0.35, 0.25, 0.15
        total_score = (empty_space_penalty * w1) + (shipping_cost_penalty * w2) + (damage_risk_penalty * w3) + (material_cost_penalty * w4)
        
        damage_risk_label = "Low"
        if damage_risk_penalty > 60:
            damage_risk_label = "High"
        elif damage_risk_penalty > 20:
            damage_risk_label = "Medium"
            
        valid_candidates.append({
            'box': box,
            'score': total_score,
            'breakdown': ScoreBreakdown(
                empty_space_penalty=empty_space_penalty,
                shipping_cost_penalty=shipping_cost_penalty,
                damage_risk_penalty=damage_risk_penalty,
                material_cost_penalty=material_cost_penalty,
                total_score=total_score
            ),
            'metrics': {
                'shipping_cost': shipping_cost,
                'total_cost': total_cost,
                'empty_space_ratio': empty_space_ratio,
                'box_vol': box_vol,
                'damage_risk': damage_risk_label,
            }
        })
        
    if not valid_candidates:
        # Fallback if none fit
        return OptimizationResponse(
            recommended_box_name="No Smaller Box Fits",
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
            reasoning="No available box in the catalog fits this product safely.",
            dim_weight_reduction=0,
            volume_saved_cm3=0,
            sustainability_score=0,
            engine_version="ML-Scorer v1.0",
            fit_check_passed=False,
            clearance_used=clearance
        )
        
    # Sort ascending (lower score is better)
    valid_candidates.sort(key=lambda x: x['score'])
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
        
    sus_score = calculate_sustainability_score(w_box, w_metrics['empty_space_ratio'])
    
    top_alternatives = []
    for i in range(1, min(4, len(valid_candidates))):
        alt = valid_candidates[i]
        top_alternatives.append(AlternativeBox(
            box_name=alt['box'].name,
            box_sku=alt['box'].sku,
            box_dims=f"{alt['box'].length_cm}x{alt['box'].width_cm}x{alt['box'].height_cm}",
            score=alt['score'],
            total_cost=alt['metrics']['total_cost'],
            reasoning="Alternative choice with slightly higher overall score."
        ))
        
    confidence = max(0.0, 100.0 - winner['score'])
    
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
        space_utilization=(1.0 - w_metrics['empty_space_ratio']) * 100.0,
        confidence_score=confidence,
        reasoning=f"Selected {w_box.name} because it minimized the total optimization score (cost + waste).",
        dim_weight_reduction=dim_reduction,
        volume_saved_cm3=vol_saved,
        sustainability_score=sus_score,
        top_alternatives=top_alternatives,
        score_breakdown=winner['breakdown'],
        engine_version="ML-Scorer v1.0",
        fit_check_passed=True,
        clearance_used=clearance
    )
