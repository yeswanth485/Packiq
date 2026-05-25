export interface ProductInput {
  sku: string;
  product_name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
  quantity: number;
}

export interface BoxSpec {
  id?: string;
  name: string;
  carrier: string;
  L: number;
  W: number;
  H: number;
  maxWeightKg: number;
  priceEstimateINR: number;
}

export interface OptimizationResult {
  sku: string;
  product_name: string;
  original_dims: { l: number; w: number; h: number };
  weight_kg: number;
  quantity: number;
  old_box_name: string;
  old_box_price: number;
  recommended_box_name: string;
  recommended_carrier: string;
  new_box_dims: { l: number; w: number; h: number };
  new_box_price: number;
  fit_score: number;
  savings_per_unit: number;
  total_savings: number;
}

export interface MLRunResult {
  total_processed: number;
  total_optimized: number;
  total_savings: number;
  results: OptimizationResult[];
}

function findBestBox(product: { length: number, width: number, height: number, weight: number }, boxes: BoxSpec[]) {
  const dims = [product.length, product.width, product.height].sort((a,b) => a - b);
  
  const eligible = boxes.filter(box => {
    const boxDims = [box.L, box.W, box.H].sort((a,b) => a - b);
    return (
      boxDims[0] >= dims[0] + 1 &&
      boxDims[1] >= dims[1] + 1 &&
      boxDims[2] >= dims[2] + 1 &&
      box.maxWeightKg >= product.weight
    );
  });

  if (eligible.length === 0) return null;

  const scored = eligible.map(box => ({
    box,
    volume: box.L * box.W * box.H,
    fitScore: Math.round(
      (1 - ((box.L * box.W * box.H - dims[0]*dims[1]*dims[2]) / (box.L * box.W * box.H))) * 100
    )
  }));

  scored.sort((a, b) => b.fitScore - a.fitScore || a.volume - b.volume);
  return scored[0];
}

export async function runMLOptimization(
  products: ProductInput[],
  boxes: BoxSpec[]
): Promise<MLRunResult> {
  const results: OptimizationResult[] = [];
  let totalSavings = 0;
  let totalOptimized = 0;

  for (const p of products) {
    const bestMatch = findBestBox({
      length: p.length_cm,
      width: p.width_cm,
      height: p.height_cm,
      weight: p.weight_kg
    }, boxes);

    const oldDimWeight = (p.length_cm * p.width_cm * p.height_cm) / 5000;
    const oldChargeableWeight = Math.max(p.weight_kg, oldDimWeight);
    const oldBoxPrice = oldChargeableWeight * 45;

    if (bestMatch) {
      const box = bestMatch.box;
      const newDimWeight = (box.L * box.W * box.H) / 5000;
      const newChargeableWeight = Math.max(p.weight_kg, newDimWeight);
      const newBoxPrice = (newChargeableWeight * 45) + box.priceEstimateINR;

      const savings = Math.max(0, oldBoxPrice - newBoxPrice);
      
      results.push({
        sku: p.sku,
        product_name: p.product_name,
        original_dims: { l: p.length_cm, w: p.width_cm, h: p.height_cm },
        weight_kg: p.weight_kg,
        quantity: p.quantity,
        old_box_name: "Original Dims",
        old_box_price: Math.round(oldBoxPrice),
        recommended_box_name: box.name,
        recommended_carrier: box.carrier,
        new_box_dims: { l: box.L, w: box.W, h: box.H },
        new_box_price: Math.round(newBoxPrice),
        fit_score: bestMatch.fitScore,
        savings_per_unit: Math.round(savings),
        total_savings: Math.round(savings * p.quantity)
      });
      
      totalSavings += Math.round(savings * p.quantity);
      totalOptimized++;
    } else {
      results.push({
        sku: p.sku,
        product_name: p.product_name,
        original_dims: { l: p.length_cm, w: p.width_cm, h: p.height_cm },
        weight_kg: p.weight_kg,
        quantity: p.quantity,
        old_box_name: "Original Dims",
        old_box_price: Math.round(oldBoxPrice),
        recommended_box_name: "No box found",
        recommended_carrier: "-",
        new_box_dims: { l: 0, w: 0, h: 0 },
        new_box_price: Math.round(oldBoxPrice),
        fit_score: 0,
        savings_per_unit: 0,
        total_savings: 0
      });
    }
  }

  return {
    total_processed: products.length,
    total_optimized: totalOptimized,
    total_savings: totalSavings,
    results
  };
}
