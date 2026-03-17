import { NextRequest } from 'next/server'
import { buildReviewPrompt } from '@/lib/prompts'
import { generateStreamWithAI } from '@/lib/ai'
import type { ModelConfig } from '@/lib/types'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const { html, title, modelConfig } = await request.json() as {
      html: string
      title: string
      modelConfig?: ModelConfig
    }

    if (!html) {
      return new Response(JSON.stringify({ error: 'HTML이 없습니다.' }), { status: 400 })
    }

    const config: ModelConfig = modelConfig ?? { provider: 'claude', modelId: 'claude-sonnet-4-6' }
    const prompt = buildReviewPrompt(html, title || '강의 상세페이지')
    const stream = await generateStreamWithAI(prompt, config)

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[review]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : '리뷰 실패' }),
      { status: 500 }
    )
  }
}
