import { NextRequest } from 'next/server'
import { buildGeneratePrompt, buildTemplateAnalyzePrompt, buildGenerateWithTemplatePrompt } from '@/lib/prompts'
import { buildPalette } from '@/lib/colors'
import { analyzeWithAI, generateStreamWithAI } from '@/lib/ai'
import type { LectureAnalysis, ModelConfig } from '@/lib/types'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const { analysis, primaryColor, modelConfig, templateHtml, keepTemplateColor } = await request.json() as {
      analysis: LectureAnalysis
      primaryColor: string
      modelConfig?: ModelConfig
      templateHtml?: string
      keepTemplateColor?: boolean
    }

    const config: ModelConfig = modelConfig ?? { provider: 'claude', modelId: 'claude-sonnet-4-6' }
    const palette = buildPalette(primaryColor)

    let prompt: string
    if (templateHtml && templateHtml.trim().length > 0) {
      const templateAnalysis = await analyzeWithAI(buildTemplateAnalyzePrompt(templateHtml), config)
      prompt = buildGenerateWithTemplatePrompt(analysis, palette, templateAnalysis, templateHtml, !!keepTemplateColor)
    } else {
      prompt = buildGeneratePrompt(analysis, palette)
    }

    const readable = await generateStreamWithAI(prompt, config)

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
