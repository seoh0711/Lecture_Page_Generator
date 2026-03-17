import { NextRequest, NextResponse } from 'next/server'
import { buildAnalyzePrompt } from '@/lib/prompts'
import { analyzeWithAI } from '@/lib/ai'
import type { ModelConfig } from '@/lib/types'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const { files, modelConfig } = await request.json() as {
      files: { name: string; content: string }[]
      modelConfig?: ModelConfig
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    const config: ModelConfig = modelConfig ?? { provider: 'claude', modelId: 'claude-sonnet-4-6' }

    const combined = files
      .map((f) => `=== ${f.name} ===\n${f.content}`)
      .join('\n\n---\n\n')

    const text = await analyzeWithAI(buildAnalyzePrompt(combined), config)

    // Strip markdown fences if present
    let jsonText = text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const analysis = JSON.parse(jsonText)
    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('[analyze]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '분석 실패' },
      { status: 500 }
    )
  }
}
