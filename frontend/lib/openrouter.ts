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

  const systemPrompt = `You are PackVision AI, an expert logistics and packaging optimization engine.

Your task is NOT to simply pick a box. You must run a full optimization pipeline:
1. Generate multiple box candidates from the catalog (smallest fit, safest fit, cheapest fit, most efficient, fragile-safe alternative)
2. Score each candidate on: fit efficiency, void space, damage risk, packaging cost, shipping cost, sustainability
3. Select the BEST box using weighted scoring: 35% cost + 25% fit + 20% safety + 10% sustainability + 10% speed
4. Calculate three cost layers: packaging cost (box + tape + filler + labor), shipping cost (dim weight + zone + courier rate), total cost
5. Calculate savings vs. the baseline the user provided
6. Assign a damage risk level (Low / Medium / High) and confidence score
7. Write a clear explanation of WHY this box was selected

Shipping cost formula:
- Dim weight = (L × W × H) / 5000
- Chargeable weight = max(actual weight, dim weight)
- Zone rates: Zone1=$0.42, Zone2=$0.54, Zone3=$0.66, Zone4=$0.84, Zone5=$1.08, Zone6=$1.44 per kg
- Express multiplier: 1.6x, Same-day: 2.5x, Standard: 1.0x

Packaging cost formula:
- Total = boxCost + $0.024 (tape) + voidVolume_cm3 × fillerCostPerCm3 + $0.18 (labor)
- Filler cost per cm3: low fragility=$0.000005, medium=$0.00001, high=$0.000015, extreme=$0.000018

Respond ONLY in valid JSON matching the exact schema provided. No markdown, no explanation outside JSON.`

  const productVol = input.lengthCm * input.widthCm * input.heightCm

  const userPrompt = `Optimize packaging for:
- Product: "${input.productName}" (ID: ${input.productId})
- Category: ${input.category}
- Price: $${input.productPriceUsd ?? 0}
- Dimensions: ${input.lengthCm} × ${input.widthCm} × ${input.heightCm} cm (volume: ${productVol} cm³)
- Weight: ${input.weightKg} kg
- Fragility: ${input.fragility}
- Quantity: ${input.quantity}
- Destination Zone: ${input.destinationZone}
- Shipping Method: ${input.shippingMethod}
- Current Box: ${input.currentBoxName || 'Not specified'} (Cost: $${input.currentBoxCostUsd || 0})
- Current Shipping Cost: $${input.currentShippingCostUsd || 'unknown'}

Available Box Catalog:
${JSON.stringify(input.availableBoxes, null, 2)}

Return ONLY this JSON schema (all numbers as floats, 2 decimal places):
{
  "productId": "${input.productId}",
  "productName": "${input.productName}",
  "recommendedBoxId": "box-id",
  "recommendedBoxName": "Box Name",
  "recommendedBoxDims": "LxWxH",
  "recommendedBoxSku": "SKU",
  "packagingMaterial": "material name",
  "fillMaterial": "filler type",
  "packagingCost": 0.00,
  "shippingCost": 0.00,
  "totalCost": 0.00,
  "baselineCost": 0.00,
  "savings": 0.00,
  "savingsPercent": 0.0,
  "damageRisk": "Low|Medium|High",
  "spaceUtilization": 0,
  "confidenceScore": 0,
  "fitScore": 0,
  "voidScore": 0,
  "costScore": 0,
  "sustainabilityScore": 0,
  "finalScore": 0,
  "alternativeBoxName": "name or null",
  "alternativeBoxDims": "LxWxH or null",
  "reasoning": "Clear explanation of why this box was selected",
  "packingTips": ["tip1", "tip2", "tip3"],
  "candidatesEvaluated": 0,
  "model": "${model}",
  "dataQuality": "complete|partial|estimated"
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
    temperature: 0.7,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
  })
}
