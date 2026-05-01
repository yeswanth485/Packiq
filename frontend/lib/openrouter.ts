import OpenAI from 'openai'

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_key_for_build',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'X-Title': 'PackIQ',
  },
})

export const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet'

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
}

export async function runOptimization(input: OptimizeInput): Promise<OptimizeOutput> {
  const systemPrompt = `You are PackIQ, an expert packaging optimization AI. 
Your job is to select the best-fit shipping box for a given product from a catalog.
Always respond with valid JSON matching the exact schema provided. No markdown, no explanation outside JSON.`

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

Respond ONLY with this JSON schema (fill all fields):
{
  "recommendedBoxId": "uuid string",
  "recommendedBoxName": "string",
  "efficiencyScore": 85,
  "spaceUtilization": 72.5,
  "costSavingsUsd": 0.35,
  "co2SavingsKg": 0.12,
  "reasoning": "explanation string",
  "packingTips": ["tip1", "tip2"],
  "alternativeBoxId": "uuid or null",
  "alternativeBoxName": "string or null"
}
`

  const completion = await openrouter.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 800,
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw) as OptimizeOutput
  return parsed
}
