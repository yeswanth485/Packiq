import OpenAI from 'openai'
import type { FragilityLevel, ShippingMethod, BoxSpec, OptimizationRecommendation } from '@/lib/optimization/engine'

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key_for_build',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'X-Title': 'PackIQ',
  },
})

export const DEFAULT_MODEL = 'anthropic/claude-3.7-sonnet'
export const LIGHTWEIGHT_MODEL = 'anthropic/claude-3.5-haiku'
export const FREE_MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free'

// ─── Extended Input Interface ──────────────────────────────────────────────

export interface OptimizeInput {
  productName: string
  productId: string
  productPriceUsd?: number
  weightKg: number
  lengthCm: number
  widthCm: number
  heightCm: number
  fragility: FragilityLevel
  quantity: number
  category: string
  destinationZone: number        // 1–6
  shippingMethod: ShippingMethod
  currentBoxName?: string
  currentBoxCostUsd?: number
  currentShippingCostUsd?: number
  availableBoxes: BoxSpec[]
}

// Re-export the canonical output type from the engine
export type { OptimizationRecommendation as OptimizeOutput }

// ─── Retry helper ────────────────────────────────────────────────────────

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callOpenRouterWithRetry(params: any, retries = 2) {
  const start = Date.now()
  let lastError: any = null
  let attempt = 0

  while (attempt <= retries) {
    try {
      const completion = await openrouter.chat.completions.create(params)
      const duration = Date.now() - start
      if (duration > 5000) console.warn(`[AI] Slow response (${duration}ms) from ${params.model}`)

      const content = completion.choices[0]?.message?.content
      if (!content) throw new Error('Empty response from AI')

      try {
        return JSON.parse(content)
      } catch {
        throw new Error('Malformed JSON response from AI')
      }
    } catch (err: any) {
      lastError = err
      attempt++
      if (attempt <= retries) {
        const backoff = Math.pow(2, attempt - 1) * 1000
        console.log(`[AI] Error: ${err.message}. Retrying in ${backoff}ms... (Attempt ${attempt}/${retries})`)
        await wait(backoff)
      }
    }
  }

  throw lastError
}

// ─── Main AI Optimization Call ────────────────────────────────────────────

export async function runOptimization(input: OptimizeInput, modelOverride?: string): Promise<OptimizationRecommendation> {
  const model = modelOverride || DEFAULT_MODEL

  const systemPrompt = `You are PackIQ's packaging optimization engine. Your ONLY goal is to recommend a box that is SMALLER than the customer's currently used box, while still fitting the product dimensions.

CRITICAL RULES:
1. The recommended box MUST have a smaller volume than the "currently used box".
2. The recommended box MUST still fit the product (product L × W × H must fit inside box L × W × H with at least 1cm clearance on each side for padding).
3. NEVER recommend a box that is equal to or larger than the currently used box.
4. If no smaller standard box fits, return: { "status": "no_smaller_box_available", "reason": "..." }
5. Always show the volume saved (in cm³) and the estimated DIM weight reduction.

Your output is a packaging recommendation, not a general suggestion. Be precise and data-driven.
Return ONLY valid JSON. No explanation text.`

  const currentVol = (input.currentBoxLength && input.currentBoxWidth && input.currentBoxHeight)
    ? input.currentBoxLength * input.currentBoxWidth * input.currentBoxHeight
    : 999999999

  const userPrompt = `TASK:
1. Find the SMALLEST box from the catalog that fits this product with at least 1cm padding on all sides.
2. The chosen box volume MUST be strictly less than the currently used box volume (${currentVol} cm³).
3. If no smaller box fits, return: { "status": "no_smaller_box_available", "reason": "..." }

Product SKU: ${input.productId}
Product Dimensions: ${input.lengthCm} cm (L) × ${input.widthCm} cm (W) × ${input.heightCm} cm (H)
Product Weight: ${input.weightKg} kg
Currently Used Box: ${input.currentBoxName || 'Unknown'} (${input.currentBoxLength}x${input.currentBoxWidth}x${input.currentBoxHeight})
Currently Used Box Volume: ${currentVol} cm³

Available Box Catalog:
${JSON.stringify(input.availableBoxes, null, 2)}

Return ONLY this JSON format:
{
  "recommended_box": { "id": "id", "name": "name", "sku": "sku", "length": 0, "width": 0, "height": 0 },
  "recommended_volume": 0,
  "current_volume": ${currentVol},
  "volume_saved_cm3": 0,
  "volume_saved_percent": 0,
  "dim_weight_reduction_kg": 0,
  "estimated_cost_saving_usd": 0,
  "confidence": "high/medium/low",
  "reasoning": "...",
  "damageRisk": "Low/Medium/High",
  "packagingCost": 0,
  "shippingCost": 0,
  "totalCost": 0,
  "fitScore": 0,
  "voidScore": 0,
  "costScore": 0,
  "sustainabilityScore": 0,
  "finalScore": 0,
  "packingTips": ["..."]
}`

  const result = await callOpenRouterWithRetry({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
  })

  return { ...result, model }
}

export async function runLightweightTask(prompt: string, data: any): Promise<any> {
  return await callOpenRouterWithRetry({
    model: LIGHTWEIGHT_MODEL,
    messages: [
      { role: 'system', content: 'You are a helpful logistics assistant. Always respond in valid JSON.' },
      { role: 'user', content: `${prompt}\n\nData: ${JSON.stringify(data)}` }
    ],
    temperature: 0.1,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  })
}

export async function runQCReview(optimizationResult: any): Promise<{ valid: boolean; error?: string; action?: string }> {
  const prompt = `You are a quality control agent for PackIQ.

Review this optimization result and flag any errors:
{{optimization_result_json}}

Rules to check:
- recommended_box volume MUST be < current_box volume
- product dimensions + 1cm padding MUST fit inside recommended_box on all sides
- volume_saved_percent must be > 0
- dim_weight_reduction_kg must be > 0

If any rule is violated, return:
{ "valid": false, "error": "describe what went wrong", "action": "reject_and_use_no_smaller_box_available" }

If all rules pass, return:
{ "valid": true }`

  return await runLightweightTask(prompt, optimizationResult)
}

export async function runBusinessSummary(results: any[], shipmentsPerMonth: number): Promise<any> {
  const prompt = `Generate a business summary report with:
1. Total SKUs analyzed
2. SKUs where a smaller box was found (count + percentage)
3. SKUs where no smaller box was available (count + reason patterns)
4. Total estimated volume reduction (cm³ and %)
5. Total estimated DIM weight saved (kg)
6. Estimated monthly cost savings (USD) based on ${shipmentsPerMonth} shipments/month
7. Top 3 SKUs with the biggest optimization opportunity
8. Carbon footprint reduction estimate (use 0.0006 kg CO₂ per cm³ saved as baseline)

Format as structured JSON for dashboard display.`

  return await runLightweightTask(prompt, { total_skus: results.length, optimization_results_json: results, shipments_per_month: shipmentsPerMonth })
}
