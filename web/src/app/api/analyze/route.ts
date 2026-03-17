import { NextRequest, NextResponse } from 'next/server'
import { buildAnalyzePrompt, buildAnalyzeWithTemplatePrompt, buildTemplateAnalyzePrompt } from '@/lib/prompts'
import { analyzeWithAI } from '@/lib/ai'
import type { ModelConfig } from '@/lib/types'

export const maxDuration = 120

function stripFences(text: string): string {
  let s = text.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  return s
}

export async function POST(request: NextRequest) {
  try {
    const { files, modelConfig, templateHtml } = await request.json() as {
      files: { name: string; content: string }[]
      modelConfig?: ModelConfig
      templateHtml?: string
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    const config: ModelConfig = modelConfig ?? { provider: 'claude', modelId: 'claude-sonnet-4-6' }

    const combined = files
      .map((f) => `=== ${f.name} ===\n${f.content}`)
      .join('\n\n---\n\n')

    let text: string

    if (templateHtml && templateHtml.trim().length > 0) {
      // Step 1: analyze template to understand what content it needs
      const contentMapping = await analyzeWithAI(buildTemplateAnalyzePrompt(templateHtml), config)
      // Step 2: extract content from TXT guided by template requirements
      text = await analyzeWithAI(buildAnalyzeWithTemplatePrompt(combined, contentMapping), config)
    } else {
      text = await analyzeWithAI(buildAnalyzePrompt(combined), config)
    }

    const analysis = JSON.parse(stripFences(text))
    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('[analyze]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '분석 실패' },
      { status: 500 }
    )
  }
}
