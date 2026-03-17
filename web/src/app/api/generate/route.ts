import { NextRequest } from 'next/server'
import { buildGeneratePrompt } from '@/lib/prompts'
import { buildPalette } from '@/lib/colors'
import { generateStreamWithAI } from '@/lib/ai'
import type { LectureAnalysis, ModelConfig } from '@/lib/types'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { analysis, primaryColor, modelConfig } = await request.json() as {
      analysis: LectureAnalysis
      primaryColor: string
      modelConfig?: ModelConfig
    }

    const config: ModelConfig = modelConfig ?? { provider: 'claude', modelId: 'claude-sonnet-4-6' }
    const palette = buildPalette(primaryColor)
    const readable = await generateStreamWithAI(buildGeneratePrompt(analysis, palette), config)

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[generate]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : '생성 실패' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
