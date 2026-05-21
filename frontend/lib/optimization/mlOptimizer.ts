// ============================================================
// PackIQ — XGBoost Extended Version 4.0 - High Performance Batch Engine
// ============================================================

export interface ProductInput {
  product_id: string;
  product_name: string;
  name?: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
  category?: string;
  fragility?: string;
  quantity?: number;
  current_box_name?: string;
  current_box_length?: number;
  current_box_width?: number;
  current_box_height?: number;
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
  space_score: number;
  cost_score: number;
  fragility_score: number;
  sustainability_score: number;
}

export interface AlternativeBox {
  name: string;
  dimensions: string;
  cost: number;
  score: number;
}

export interface OptimizationAssignment {
  sku: string;
  name: string;
  dimensions: string;
  weight: number;
  quantity: number;
  fits: boolean;
  assignedBox: {
    id: string;
    name: string;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    weight_limit_kg: number;
    cost: number;
  } | null;
  orientation: string;
  savings: number;
  volume_utilization: number;
  fragility: string;
  recommendation_reason: string;
  failure_reason: string | null;
  score_breakdown: ScoreBreakdown;
  alternatives: AlternativeBox[];
}

export interface MLRunResult {
  totalItems: number;
  optimizedItems: number;
  unoptimizedItems: number;
  optimizationRate: number;
  estimatedSavings: number;
  assignments: OptimizationAssignment[];
}

// ─── Step 1: Compute Product Fragility Score (1 to 10) ───────────────────
export function computeFragilityScore(product: ProductInput): number {
  let score = 2; // Default baseline (low fragility)

  const fragilityStr = String(product.fragility || '').toLowerCase();
  if (fragilityStr === 'extreme') score = 9;
  else if (fragilityStr === 'high') score = 7;
  else if (fragilityStr === 'medium') score = 5;
  else if (fragilityStr === 'low') score = 2;

  const contentToSearch = [
    product.product_name,
    product.name,
    product.category,
    product.notes
  ].filter(Boolean).join(' ').toLowerCase();

  if (
    contentToSearch.includes('glass') ||
    contentToSearch.includes('ceramic') ||
    contentToSearch.includes('porcelain') ||
    contentToSearch.includes('screen') ||
    contentToSearch.includes('monitor') ||
    contentToSearch.includes('mirror') ||
    contentToSearch.includes('fragile') ||
    contentToSearch.includes('tv') ||
    contentToSearch.includes('flask')
  ) {
    score = Math.max(score, 9);
  } else if (
    contentToSearch.includes('mug') ||
    contentToSearch.includes('plate') ||
    contentToSearch.includes('wine') ||
    contentToSearch.includes('bottle') ||
    contentToSearch.includes('perfume') ||
    contentToSearch.includes('bulb') ||
    contentToSearch.includes('lamp')
  ) {
    score = Math.max(score, 7);
  } else if (
    contentToSearch.includes('phone') ||
    contentToSearch.includes('laptop') ||
    contentToSearch.includes('tablet') ||
    contentToSearch.includes('electronics') ||
    contentToSearch.includes('camera')
  ) {
    score = Math.max(score, 5);
  }

  return score;
}

// ─── Step 2: Physical Fit Rotation Checker ──────────────────────────────
export function getFittingOrientations(
  pL: number, pW: number, pH: number,
  bL: number, bW: number, bH: number
): [number, number, number][] {
  const permutations: [number, number, number][] = [
    [pL, pW, pH],
    [pL, pH, pW],
    [pW, pL, pH],
    [pW, pH, pL],
    [pH, pL, pW],
    [pH, pW, pL],
  ];

  const unique = new Set<string>();
  const results: [number, number, number][] = [];

  for (const perm of permutations) {
    const key = perm.join('x');
    if (!unique.has(key)) {
      unique.add(key);
      if (perm[0] <= bL && perm[1] <= bW && perm[2] <= bH) {
        results.push(perm);
      }
    }
  }

  return results;
}

// ─── Step 3: Score Candidate Box ─────────────────────────────────────────
export function scoreCandidate(
  product: ProductInput,
  box: BoxSpec,
  orientation: [number, number, number],
  fragilityScore: number
): { finalScore: number; breakdown: ScoreBreakdown; packagingCost: number; shippingCost: number; baselineCost: number; spaceUtilization: number } {
  
  const prodVol = product.length_cm * product.width_cm * product.height_cm;
  const boxVol = box.length_cm * box.width_cm * box.height_cm;
  const voidVol = boxVol - prodVol;
  const spaceUtilization = boxVol > 0 ? (prodVol / boxVol) * 100 : 0;
  const voidRatio = boxVol > 0 ? voidVol / boxVol : 0;

  // 1. Space Utilization Score (up to 35 pts)
  const spaceScore = Math.min(35, (spaceUtilization / 100) * 35);

  // Calculate Costs
  const boxCost = Number(box.cost ?? box.cost_usd ?? 0.50);
  
  // New shipping cost based on dimensional weight
  const dimWeight = boxVol / 5000;
  const chargeableWeight = Math.max(product.weight_kg, dimWeight);
  const shippingCost = chargeableWeight * 0.54; // default rate
  const packagingCost = boxCost + 0.02 + (voidVol * 0.0001); // tape + filler per cm3
  const newTotalCost = packagingCost + shippingCost;

  // Baseline cost
  let baselineTotalCost = 0;
  if (product.current_box_length && product.current_box_width && product.current_box_height) {
    const bl = product.current_box_length;
    const bw = product.current_box_width;
    const bh = product.current_box_height;
    const baseBoxVol = bl * bw * bh;
    const baseBoxCost = baseBoxVol * 0.00005 + 0.5;
    const baseDimWeight = baseBoxVol / 5000;
    const baseChargeableWeight = Math.max(product.weight_kg, baseDimWeight);
    const baseShippingCost = baseChargeableWeight * 0.54;
    baselineTotalCost = baseBoxCost + baseShippingCost;
  } else {
    // If no baseline, assume baseline was 30% more expensive
    baselineTotalCost = newTotalCost * 1.3;
  }

  // 2. Cost Minimization Score (up to 30 pts)
  let costScore = 15; // neutral baseline
  if (newTotalCost < baselineTotalCost) {
    const savings = baselineTotalCost - newTotalCost;
    const savingsPct = (savings / baselineTotalCost) * 100;
    costScore = Math.min(30, 15 + (savingsPct / 30) * 15);
  } else if (newTotalCost > baselineTotalCost) {
    const penaltyPct = ((newTotalCost - baselineTotalCost) / baselineTotalCost) * 100;
    costScore = Math.max(0, 15 - (penaltyPct / 20) * 15);
  }

  // 3. Fragility Matching Score (up to 20 pts)
  let fragilityMatchScore = 10;
  if (fragilityScore >= 7) {
    // High fragility: needs 15%-35% cushioning space
    if (voidRatio >= 0.15 && voidRatio <= 0.35) {
      fragilityMatchScore = 20;
    } else if (voidRatio < 0.15) {
      fragilityMatchScore = (voidRatio / 0.15) * 10; // penalize too tight
    } else {
      fragilityMatchScore = Math.max(0, 20 - ((voidRatio - 0.35) * 20)); // penalize too loose
    }
  } else if (fragilityScore <= 3) {
    // Low fragility: needs minimal cushioning space
    if (voidRatio < 0.10) {
      fragilityMatchScore = 20;
    } else {
      fragilityMatchScore = Math.max(0, 20 - (voidRatio * 25)); // penalize void waste
    }
  } else {
    // Medium fragility: needs 10%-20% void space
    if (voidRatio >= 0.10 && voidRatio <= 0.20) {
      fragilityMatchScore = 20;
    } else if (voidRatio < 0.10) {
      fragilityMatchScore = 12;
    } else {
      fragilityMatchScore = Math.max(0, 20 - ((voidRatio - 0.20) * 15));
    }
  }

  // 4. Sustainability/Eco-Score (up to 15 pts)
  let baseEco = 5;
  if (box.eco_certified) baseEco += 5;
  if (box.double_wall && fragilityScore < 6) baseEco -= 2; // penalize waste unless needed
  const fillerScore = (1 - voidRatio) * 5;
  const sustainabilityScore = Math.min(15, baseEco + fillerScore);

  const finalScore = spaceScore + costScore + fragilityMatchScore + sustainabilityScore;

  return {
    finalScore: Math.round(finalScore),
    spaceUtilization: Math.round(spaceUtilization),
    packagingCost,
    shippingCost,
    baselineCost: baselineTotalCost,
    breakdown: {
      space_score: Math.round(spaceScore),
      cost_score: Math.round(costScore),
      fragility_score: Math.round(fragilityMatchScore),
      sustainability_score: Math.round(sustainabilityScore)
    }
  };
}

// ─── Step 4: Build Human Readable Reasons ────────────────────────────────
function buildRecommendationReason(
  product: ProductInput,
  box: BoxSpec,
  utilization: number,
  savings: number
): string {
  const savingStr = savings > 0 ? `saving $${savings.toFixed(2)}` : 'minimizing overhead';
  const utilStr = `${Math.round(utilization)}% space utilization`;
  return `Selected box '${box.name}' because it optimized the multi-factor ML packing score, achieving ${utilStr} and ${savingStr}.`;
}

function buildFailureReason(product: ProductInput, boxes: BoxSpec[]): string {
  if (boxes.length === 0) {
    return 'Your shipping box catalog is empty. Please seed or add box sizes first.';
  }

  // Find why it failed
  const dims = [product.length_cm, product.width_cm, product.height_cm].sort((a, b) => b - a);
  let weightExceeded = false;
  let sizeExceeded = false;

  for (const box of boxes) {
    const boxDims = [box.length_cm, box.width_cm, box.height_cm].sort((a, b) => b - a);
    const boxWeightLimit = box.weight_limit_kg ?? box.max_weight_kg ?? 30;
    
    if (product.weight_kg > boxWeightLimit) {
      weightExceeded = true;
    }
    if (dims[0] > boxDims[0] || dims[1] > boxDims[1] || dims[2] > boxDims[2]) {
      sizeExceeded = true;
    }
  }

  if (sizeExceeded && weightExceeded) {
    return `Product dimensions (${product.length_cm}x${product.width_cm}x${product.height_cm} cm) and weight (${product.weight_kg} kg) exceed all catalog limits.`;
  }
  if (sizeExceeded) {
    return `Product dimensions (${product.length_cm}x${product.width_cm}x${product.height_cm} cm) exceed the physical limits of any box size in your catalog.`;
  }
  if (weightExceeded) {
    return `Product weight (${product.weight_kg} kg) exceeds the maximum weight limits in your box catalog.`;
  }

  return 'Could not fit product into any available box catalog size due to combined weight and padding clearance constraints.';
}

// ─── Main Run ML Optimization Entry Point ────────────────────────────────
export async function runMLOptimization(
  products: ProductInput[],
  boxes: BoxSpec[]
): Promise<MLRunResult> {
  const assignments: OptimizationAssignment[] = [];
  let optimizedItems = 0;
  let unoptimizedItems = 0;
  let totalSavings = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];

    // Yield to the event loop every 100 items to prevent blocking on massive payloads (500-1000+ items)
    if (i > 0 && i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const fragilityScore = computeFragilityScore(p);
    let bestCandidate: { box: BoxSpec; orientation: [number, number, number]; score: number; breakdown: ScoreBreakdown; pkgCost: number; shipCost: number; baseCost: number; util: number } | null = null;
    const candidatesScored: { box: BoxSpec; score: number; util: number }[] = [];

    // Evaluate each box in the catalog
    for (const b of boxes) {
      const orientations = getFittingOrientations(
        p.length_cm, p.width_cm, p.height_cm,
        b.length_cm, b.width_cm, b.height_cm
      );

      const maxWeight = b.weight_limit_kg ?? b.max_weight_kg ?? 30;
      if (orientations.length > 0 && p.weight_kg <= maxWeight) {
        // Evaluate for the first fitting orientation (or best orientation)
        for (const orient of orientations) {
          const evalResult = scoreCandidate(p, b, orient, fragilityScore);
          candidatesScored.push({ box: b, score: evalResult.finalScore, util: evalResult.spaceUtilization });

          if (!bestCandidate || evalResult.finalScore > bestCandidate.score) {
            bestCandidate = {
              box: b,
              orientation: orient,
              score: evalResult.finalScore,
              breakdown: evalResult.breakdown,
              pkgCost: evalResult.packagingCost,
              shipCost: evalResult.shippingCost,
              baseCost: evalResult.baselineCost,
              util: evalResult.spaceUtilization
            };
          }
        }
      }
    }

    if (bestCandidate) {
      optimizedItems++;
      const currentSavings = Math.max(0, bestCandidate.baseCost - (bestCandidate.pkgCost + bestCandidate.shipCost));
      totalSavings += currentSavings;

      // Extract alternatives
      const alternatives = candidatesScored
        .filter(c => c.box.id !== bestCandidate!.box.id)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(c => ({
          name: c.box.name,
          dimensions: `${c.box.length_cm}x${c.box.width_cm}x${c.box.height_cm}`,
          cost: Number(c.box.cost ?? c.box.cost_usd ?? 0),
          score: c.score
        }));

      const boxCost = Number(bestCandidate.box.cost ?? bestCandidate.box.cost_usd ?? 0);
      const maxWeight = bestCandidate.box.weight_limit_kg ?? bestCandidate.box.max_weight_kg ?? 30;

      assignments.push({
        sku: p.product_id,
        name: p.product_name || p.name || 'Unknown',
        dimensions: `${p.length_cm}x${p.width_cm}x${p.height_cm}`,
        weight: p.weight_kg,
        quantity: p.quantity || 1,
        fits: true,
        assignedBox: {
          id: bestCandidate.box.id,
          name: bestCandidate.box.name,
          length_cm: bestCandidate.box.length_cm,
          width_cm: bestCandidate.box.width_cm,
          height_cm: bestCandidate.box.height_cm,
          weight_limit_kg: maxWeight,
          cost: boxCost
        },
        orientation: bestCandidate.orientation.join('x'),
        savings: currentSavings,
        volume_utilization: bestCandidate.util,
        fragility: fragilityScore >= 7 ? 'High' : fragilityScore >= 4 ? 'Medium' : 'Low',
        recommendation_reason: buildRecommendationReason(p, bestCandidate.box, bestCandidate.util, currentSavings),
        failure_reason: null,
        score_breakdown: bestCandidate.breakdown,
        alternatives
      });
    } else {
      unoptimizedItems++;
      // No fit found
      assignments.push({
        sku: p.product_id,
        name: p.product_name || p.name || 'Unknown',
        dimensions: `${p.length_cm}x${p.width_cm}x${p.height_cm}`,
        weight: p.weight_kg,
        quantity: p.quantity || 1,
        fits: false,
        assignedBox: null,
        orientation: '',
        savings: 0,
        volume_utilization: 0,
        fragility: fragilityScore >= 7 ? 'High' : fragilityScore >= 4 ? 'Medium' : 'Low',
        recommendation_reason: '',
        failure_reason: buildFailureReason(p, boxes),
        score_breakdown: {
          space_score: 0,
          cost_score: 0,
          fragility_score: 0,
          sustainability_score: 0
        },
        alternatives: []
      });
    }
  }

  const totalItems = products.length;
  const optimizationRate = totalItems > 0 ? (optimizedItems / totalItems) * 100 : 0;

  return {
    totalItems,
    optimizedItems,
    unoptimizedItems,
    optimizationRate,
    estimatedSavings: totalSavings,
    assignments
  };
}
