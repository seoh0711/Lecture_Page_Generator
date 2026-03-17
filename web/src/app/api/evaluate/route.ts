import { NextRequest } from 'next/server'
import { buildEvaluatePrompt } from '@/lib/prompts'
import { generateStreamWithAI } from '@/lib/ai'
import type { LectureAnalysis, ModelConfig } from '@/lib/types'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const { analysis, modelConfig } = await request.json() as {
      analysis: LectureAnalysis
      modelConfig?: ModelConfig
    }

    if (!analysis) {
      return new Response(
        JSON.stringify({ error: '분석 데이터가 없습니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const config: ModelConfig = modelConfig ?? { provider: 'claude', modelId: 'claude-sonnet-4-6' }
    const stream = await generateStreamWithAI(buildEvaluatePrompt(analysis), config)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[evaluate]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : '평가 실패' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
