import { NextRequest, NextResponse } from 'next/server'
import { buildImprovePrompt } from '@/lib/prompts'
import { analyzeWithAI } from '@/lib/ai'
import type { LectureAnalysis, ModelConfig } from '@/lib/types'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const { analysis, evalReport, modelConfig } = await request.json() as {
      analysis: LectureAnalysis
      evalReport: string
      modelConfig?: ModelConfig
    }

    if (!analysis || !evalReport) {
      return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 })
    }

    const config: ModelConfig = modelConfig ?? { provider: 'claude', modelId: 'claude-sonnet-4-6' }
    const text = await analyzeWithAI(buildImprovePrompt(analysis, evalReport), config)

    let jsonText = text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const improved = JSON.parse(jsonText)

    // Merge improved copy fields back into the full analysis
    const improvedAnalysis: LectureAnalysis = {
      ...analysis,
      hero:             improved.hero             ?? analysis.hero,
      key_highlights:   improved.key_highlights   ?? analysis.key_highlights,
      pain_points:      improved.pain_points      ?? analysis.pain_points,
      target_audience:  improved.target_audience  ?? analysis.target_audience,
      before_after:     improved.before_after     ?? analysis.before_after,
      book_benefit:     improved.book_benefit     ?? analysis.book_benefit,
    }

    return NextResponse.json({ analysis: improvedAnalysis })
  } catch (err) {
    console.error('[improve]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '개선 실패' },
      { status: 500 }
    )
  }
}
