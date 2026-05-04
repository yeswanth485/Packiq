import OpenAI from 'openai'

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key_for_build',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'X-Title': 'PackIQ',
  },
})

export const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-20250514'
export const LIGHTWEIGHT_MODEL = 'anthropic/claude-haiku-4-5-20251001'
export const FREE_MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free'

export interface OptimizeInput {
  productName: string
  weightKg: number
  lengthCm: number
  widthCm: number
  heightCm: number
  fragile: boolean
  category?: string
  notes?: string
  availableBoxes: Array<{
    id: string
    name: string
    sku: string
    lengthCm: number
    widthCm: number
    heightCm: number
    maxWeightKg: number
    costUsd: number
    material: string
    ecoCertified: boolean
  }>
}

export interface OptimizeOutput {
  recommendedBoxId: string
  recommendedBoxName: string
  efficiencyScore: number      // 0–100
  spaceUtilization: number     // 0–100 %
  costSavingsUsd: number
  co2SavingsKg: number
  reasoning: string
  packingTips: string[]
  alternativeBoxId?: string
  alternativeBoxName?: string
  model?: string
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callOpenRouterWithRetry(params: any, retries = 3) {
  const start = Date.now()
  let lastError: any = null
  let attempt = 0

  while (attempt <= retries) {
    try {
      const completion = await openrouter.chat.completions.create(params)
      const duration = Date.now() - start
      
      if (duration > 5000) {
        console.warn(`[AI] Slow response (${duration}ms) from ${params.model}`)
      }

      const content = completion.choices[0]?.message?.content
      if (!content) throw new Error('Empty response from AI')

      // Basic JSON validation
      try {
        return JSON.parse(content)
      } catch (e) {
        throw new Error('Malformed JSON response from AI')
      }
    } catch (err: any) {
      lastError = err
      attempt++
      
      // Handle rate limits (429) specifically if needed, but SDK might handle some
      // The user wants exponential backoff: 1s, 2s, 4s
      if (attempt <= retries) {
        const backoff = Math.pow(2, attempt - 1) * 1000
        console.log(`[AI] Error: ${err.message}. Retrying in ${backoff}ms... (Attempt ${attempt}/${retries})`)
        await wait(backoff)
      }
    }
  }

  throw lastError
}

export async function runOptimization(input: OptimizeInput, modelOverride?: string): Promise<OptimizeOutput> {
  const systemPrompt = `You are an expert logistics and packaging engineer specializing in 3D spatial geometry and load optimization.
Your task is to select the most efficient shipping box for a product from the provided catalog.

Core Principles:
1. Spatial Logic: Evaluate all 6 possible orientations of the product (LWH, LHW, WLH, WHL, HLW, HWL) to find the tightest fit.
2. Volume Efficiency: Prioritize boxes that minimize "void space" (box volume - product volume).
3. Protection: For products marked as fragile, ensure at least 1cm of clearance on all sides for protective dunnage.
4. Material Cost: If two boxes offer similar protection, choose the one with the lower cost.
5. Sustainability: Prefer boxes with 'ecoCertified: true' when efficiency scores are within 5% of each other.

Operational Constraint:
Respond ONLY in valid, minified JSON matching the requested schema. No markdown, no preamble, no post-explanation.`

  const userPrompt = `
Optimize packaging for this product:
- Name: ${input.productName}
- Weight: ${input.weightKg} kg
- Dimensions: ${input.lengthCm} × ${input.widthCm} × ${input.heightCm} cm (L×W×H)
- Fragile: ${input.fragile}
- Category: ${input.category ?? 'general'}
- Notes: ${input.notes ?? 'none'}

Available boxes:
${JSON.stringify(input.availableBoxes, null, 2)}

Respond ONLY with this JSON schema:
{
  "recommendedBoxId": "uuid string",
  "recommendedBoxName": "string",
  "efficiencyScore": 85,
  "spaceUtilization": 72.5,
  "costSavingsUsd": 0.35,
  "co2SavingsKg": 0.12,
  "reasoning": "string",
  "packingTips": ["string"],
  "alternativeBoxId": "string or null",
  "alternativeBoxName": "string or null"
}
`

  const model = modelOverride || DEFAULT_MODEL
  const result = await callOpenRouterWithRetry({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 2048,
    response_format: { type: "json_object" }
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
    response_format: { type: "json_object" }
  })
}
