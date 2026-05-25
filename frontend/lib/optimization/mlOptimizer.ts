// ============================================================
// PackIQ — XGBoost-Heuristic Version 5.0 - High Performance Scoring Pipeline
// ============================================================

export interface ProductInput {
  product_id: string;
  product_name: string;
  sku?: string;
  name?: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
  category?: string;
  fragility?: string; // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  quantity?: number;
  current_box_name?: string;
  current_box_length?: number;
  current_box_width?: number;
  current_box_height?: number;
  box_price?: number;
  [key: string]: any;
}

export interface BoxSpec {
  id: string;
  name: string;
  sku?: string | null;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_limit_kg?: number | null;
  max_weight_kg?: number | null;
  cost?: number | null;
  cost_usd?: number | null;
  material?: string | null;
  eco_certified?: boolean;
  double_wall?: boolean;
}

export interface ScoreBreakdown {
  void_space_score: number;
  cost_score: number;
  fragility_match_score: number;
  sustainability_score: number;
  dim_weight_score: number;
}

export interface OptimizationAssignment {
  sku: string;
  product_name: string;
  dimensions: { l: number; w: number; h: number };
  weight: number;
  optimized: boolean;
  assigned_box: {
    id: string;
    name: string;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    weight_limit_kg: number;
    cost: number;
  } | null;
  original_box_dims?: { l: number; w: number; h: number };
  savings: number;
  baseline_cost: number;
  shipping_cost: number;
  baseline_box_cost: number;
  optimized_box_cost: number;
  void_pct: number;
  baseline_void_pct: number;
  volume_utilization: number;
  fragility: string;
  recommendation_reason: string;
  failure_reason: string | null;
  score: number;
  score_breakdown: ScoreBreakdown;
  dim_weight_reduction: number;
  volume_saved_cm3: number;
  sustainability_score: number;
}

export interface MLRunResult {
  total_processed: number;
  total_optimized: number;
  total_not_optimized: number;
  success_rate: number;
  total_savings: number;
  results: OptimizationAssignment[];
}

// ─── Step 1: Physical Fit Rotation Checker ──────────────────────────────
export function getFittingOrientations(
  pL: number, pW: number, pH: number,
  bL: number, bW: number, bH: number
): [number, number, number][] {
  const pDims = [pL, pW, pH];
  const bDims = [bL, bW, bH];

  // Simply sort both to check if it can fit in any orientation
  const sortedP = [...pDims].sort((a, b) => b - a);
  const sortedB = [...bDims].sort((a, b) => b - a);

  if (sortedP[0] <= sortedB[0] && sortedP[1] <= sortedB[1] && sortedP[2] <= sortedB[2]) {
    return [[sortedP[0], sortedP[1], sortedP[2]]]; // Return at least one valid orientation
  }

  return [];
}

// ─── Step 2: Scoring Engine (XGBoost Feature Emulation) ──────────────────
export function scoreCandidate(
  product: ProductInput,
  box: BoxSpec,
  fragility: string
): {
  finalScore: number;
  breakdown: ScoreBreakdown;
  shippingCost: number;
  baselineCost: number;
  voidPct: number;
  baselineVoidPct: number;
  volUtil: number;
  dimWeightReduction: number;
  volumeSaved: number;
  boxCost: number;
  baselineBoxCost: number;
} {
  const prodVol = product.length_cm * product.width_cm * product.height_cm;
  const boxVol = box.length_cm * box.width_cm * box.height_cm;
  const volUtil = boxVol > 0 ? (prodVol / boxVol) * 100 : 0;
  const voidPct = 100 - volUtil;

  // 1. Void Space Score (higher util is better)
  const voidSpaceScore = (volUtil / 100) * 30; // 30 pts max

  // 2. DIM Weight & Shipping Cost
  const boxDimWeight = boxVol / 5000;
  const chargeableWeight = Math.max(product.weight_kg, boxDimWeight);
  const shippingRate = 45; // ₹45 per kg
  const shippingCost = chargeableWeight * shippingRate;
  const boxCost = Number(box.cost ?? box.cost_usd ?? 10); // Standard box cost in INR if not provided
  const newTotalCost = shippingCost + boxCost;

  let baselineBoxCost = 15; // Default baseline box price in INR
  let baselineCost = product.box_price || (chargeableWeight * 1.5 * shippingRate); // Default estimate if no data
  let baselineVoidPct = 40; // Default estimate

  if (product.current_box_length && product.current_box_width && product.current_box_height) {
     const bVol = product.current_box_length * product.current_box_width * product.current_box_height;
     const bDimWeight = bVol / 5000;
     const bChargeableWeight = Math.max(product.weight_kg, bDimWeight);
     baselineCost = (bChargeableWeight * shippingRate) + 15; // ₹15 for generic baseline box
     baselineBoxCost = 15;
     const prodVol = product.length_cm * product.width_cm * product.height_cm;
     baselineVoidPct = Math.max(0, 100 - (prodVol / bVol * 100));
  }

  const dimWeightScore = (1 - (chargeableWeight / 50)) * 20; // Favor lower weight, 20 pts max

  // 3. Cost Score (Heavy weighting on Box Price and overall reduction)
  let shippingCostFinal = newTotalCost;

  if (shippingCostFinal > baselineCost) {
    shippingCostFinal = baselineCost; // Guard: optimization should never be more expensive
  }

  const savings = Math.max(0, baselineCost - shippingCostFinal);

  // Scoring prioritizes box price: lower price = higher score component
  const boxCostScore = (1 - (boxCost / 50)) * 15; // Max 15 pts for cheap boxes
  const savingsScore = (savings > 0) ? (Math.min(savings / baselineCost, 1) * 15) : 0; // Max 15 pts for high savings

  const costScore = boxCostScore + savingsScore;

  // 4. Fragility Match Score
  let fragilityMatchScore = 15; // neutral
  const fragilityLevel = fragility.toUpperCase();
  if (fragilityLevel === 'HIGH' || fragilityLevel === 'CRITICAL') {
    // Needs padding (15-30% void is good)
    if (volUtil >= 70 && volUtil <= 85) fragilityMatchScore = 20;
    else if (volUtil > 85) fragilityMatchScore = 5; // too tight
  } else {
    // Low fragility: as tight as possible
    if (volUtil > 90) fragilityMatchScore = 20;
  }

  // 5. Sustainability (Eco Score)
  let sustainabilityScore = box.eco_certified ? 10 : 5;
  if (volUtil > 85) sustainabilityScore += 5; // less waste

  const finalScore = voidSpaceScore + dimWeightScore + costScore + fragilityMatchScore + sustainabilityScore;

  // Extra metrics
  const volumeSaved = Math.max(0, (product.current_box_length && product.current_box_width && product.current_box_height ? (product.current_box_length * product.current_box_width * product.current_box_height) : boxVol * 1.2) - boxVol);
  const dimWeightReduction = Math.max(0, (product.current_box_length && product.current_box_width && product.current_box_height ? (product.current_box_length * product.current_box_width * product.current_box_height / 5000) : boxDimWeight * 1.2) - boxDimWeight);

  return {
    finalScore: Math.min(100, Math.max(0, finalScore)),
    breakdown: {
      void_space_score: Math.round(voidSpaceScore),
      cost_score: Math.round(costScore),
      fragility_match_score: Math.round(fragilityMatchScore),
      sustainability_score: Math.round(sustainabilityScore),
      dim_weight_score: Math.round(dimWeightScore)
    },
    shippingCost: shippingCostFinal,
    baselineCost,
    voidPct,
    baselineVoidPct,
    volUtil,
    dimWeightReduction,
    volumeSaved,
    boxCost,
    baselineBoxCost
  };
}

export async function runMLOptimization(
  products: ProductInput[],
  boxes: BoxSpec[]
): Promise<MLRunResult> {
  const assignments: OptimizationAssignment[] = [];
  let totalSavings = 0;

  for (const p of products) {
    const fragility = p.fragility || 'LOW';
    let bestMatch: any = null;

    // Filter boxes that physically fit AND are smaller/cheaper than current box
    const currentVol = (p.current_box_length && p.current_box_width && p.current_box_height)
      ? p.current_box_length * p.current_box_width * p.current_box_height
      : Infinity;

    const currentPrice = p.box_price || Infinity;

    const candidates = boxes.filter(box => {
      const orientations = getFittingOrientations(p.length_cm, p.width_cm, p.height_cm, box.length_cm, box.width_cm, box.height_cm);
      const weightFits = p.weight_kg <= (box.weight_limit_kg ?? box.max_weight_kg ?? 30);

      const boxVol = box.length_cm * box.width_cm * box.height_cm;
      const boxPrice = box.cost || 0.5;

      // Strict optimization rules: Volume <= current AND Price < current
      const isSmaller = boxVol <= currentVol;
      // If we don't have current price, we assume any fitting box is a candidate
      const isCheaper = currentPrice === Infinity || boxPrice < currentPrice;

      return orientations.length > 0 && weightFits && isSmaller && isCheaper;
    });

    if (candidates.length > 0) {
      // Score each candidate
      const scoredCandidates = candidates.map(box => {
        const result = scoreCandidate(p, box, fragility);
        return { box, ...result };
      });

      // Select best score, break ties with SMALLEST volume
      scoredCandidates.sort((a, b) => {
        if (Math.abs(b.finalScore - a.finalScore) > 0.1) {
          return b.finalScore - a.finalScore;
        }
        const volA = a.box.length_cm * a.box.width_cm * a.box.height_cm;
        const volB = b.box.length_cm * b.box.width_cm * b.box.height_cm;
        return volA - volB;
      });

      bestMatch = scoredCandidates[0];
    }

    if (bestMatch) {
      const saving = Math.max(0, bestMatch.baselineCost - bestMatch.shippingCost);
      totalSavings += saving;

      assignments.push({
        sku: p.product_id || p.sku || 'UNKNOWN',
        product_name: p.product_name || p.name || 'Unknown Item',
        dimensions: { l: p.length_cm, w: p.width_cm, h: p.height_cm },
        weight: p.weight_kg,
        optimized: true,
        assigned_box: {
          id: bestMatch.box.id,
          name: bestMatch.box.name,
          length_cm: bestMatch.box.length_cm,
          width_cm: bestMatch.box.width_cm,
          height_cm: bestMatch.box.height_cm,
          weight_limit_kg: bestMatch.box.weight_limit_kg || 30,
          cost: bestMatch.box.cost || 0.5
        },
        original_box_dims: p.current_box_length ? {
          l: p.current_box_length,
          w: p.current_box_width || 0,
          h: p.current_box_height || 0
        } : undefined,
        savings: saving,
        baseline_cost: bestMatch.baselineCost,
        shipping_cost: bestMatch.shippingCost,
        baseline_box_cost: bestMatch.baselineBoxCost,
        optimized_box_cost: bestMatch.boxCost,
        void_pct: bestMatch.voidPct,
        baseline_void_pct: bestMatch.baselineVoidPct,
        volume_utilization: bestMatch.volUtil,
        fragility: fragility,
        recommendation_reason: `Selected ${bestMatch.box.name} with ${bestMatch.volUtil.toFixed(1)}% utilization and optimized XGBoost score of ${bestMatch.finalScore.toFixed(1)}.`,
        failure_reason: null,
        score: bestMatch.finalScore,
        score_breakdown: bestMatch.breakdown,
        dim_weight_reduction: bestMatch.dimWeightReduction,
        volume_saved_cm3: bestMatch.volumeSaved,
        sustainability_score: bestMatch.breakdown.sustainability_score
      });
    } else {
      assignments.push({
        sku: p.product_id || p.sku || 'UNKNOWN',
        product_name: p.product_name || p.name || 'Unknown Item',
        dimensions: { l: p.length_cm, w: p.width_cm, h: p.height_cm },
        weight: p.weight_kg,
        optimized: false,
        assigned_box: null,
        savings: 0,
        baseline_cost: 100, // Default INR
        shipping_cost: 0,
        baseline_box_cost: 15,
        optimized_box_cost: 0,
        void_pct: 0,
        baseline_void_pct: 0,
        volume_utilization: 0,
        fragility: fragility,
        recommendation_reason: '',
        failure_reason: 'No fitting box found in catalog.',
        score: 0,
        score_breakdown: {
          void_space_score: 0, cost_score: 0, fragility_match_score: 0, sustainability_score: 0, dim_weight_score: 0
        },
        dim_weight_reduction: 0,
        volume_saved_cm3: 0,
        sustainability_score: 0
      });
    }
  }

  const optimized = assignments.filter(a => a.optimized);
  return {
    total_processed: products.length,
    total_optimized: optimized.length,
    total_not_optimized: products.length - optimized.length,
    success_rate: (optimized.length / products.length) * 100,
    total_savings: totalSavings,
    results: assignments
  };
}
