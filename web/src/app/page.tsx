'use client'

import { useState, useRef } from 'react'
import {
  Sparkles,
  Download,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react'
import FileDropzone from '@/components/FileDropzone'
import ColorPicker from '@/components/ColorPicker'
import ModelSelector from '@/components/ModelSelector'
import type { FileItem, LectureAnalysis, AppStep, ModelConfig } from '@/lib/types'

/* ------------------------------------------------------------------ */
/* Step indicator                                                        */
/* ------------------------------------------------------------------ */
const STEPS = [
  { id: 'idle', label: '파일 업로드' },
  { id: 'analyzing', label: '강의 분석' },
  { id: 'generating', label: '페이지 생성' },
  { id: 'done', label: '완료' },
]

function StepBar({ step }: { step: AppStep }) {
  const currentIdx = STEPS.findIndex((s) => s.id === step)
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done = currentIdx > i
        const active = currentIdx === i
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-400'}`}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`mt-1 text-xs font-medium whitespace-nowrap
                  ${done ? 'text-green-600' : active ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${done ? 'bg-green-400' : 'bg-gray-200'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main page                                                            */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [primaryColor, setPrimaryColor] = useState('#166EC0')
  const [modelConfig, setModelConfig] = useState<ModelConfig>({ provider: 'claude', modelId: 'claude-sonnet-4-6' })
  const [step, setStep] = useState<AppStep>('idle')
  const [analysis, setAnalysis] = useState<LectureAnalysis | null>(null)
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [error, setError] = useState('')
  const [progressMsg, setProgressMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const isProcessing = step === 'analyzing' || step === 'generating'

  /* ---- Reset ---- */
  const handleReset = () => {
    setFiles([])
    setStep('idle')
    setAnalysis(null)
    setGeneratedHtml('')
    setError('')
    setProgressMsg('')
    setCopied(false)
    setModelConfig({ provider: 'claude', modelId: 'claude-sonnet-4-6' })
  }

  /* ---- Main flow ---- */
  const handleGenerate = async () => {
    if (files.length === 0 || isProcessing) return
    setError('')
    setGeneratedHtml('')

    // Step 1: Analyze
    setStep('analyzing')
    setProgressMsg('강의 내용을 분석하는 중...')
    try {
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map((f) => ({ name: f.name, content: f.content })),
          modelConfig,
        }),
      })

      if (!analyzeRes.ok) {
        const body = await analyzeRes.json().catch(() => ({ error: analyzeRes.statusText }))
        throw new Error(body.error || '분석 API 오류')
      }

      const { analysis: data } = await analyzeRes.json()
      setAnalysis(data)

      // Step 2: Generate
      setStep('generating')
      setProgressMsg('HTML 페이지를 생성하는 중...')

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: data, primaryColor, modelConfig }),
      })

      if (!genRes.ok) {
        const body = await genRes.json().catch(() => ({ error: genRes.statusText }))
        throw new Error(body.error || '생성 API 오류')
      }

      // Stream the HTML
      const reader = genRes.body!.getReader()
      const decoder = new TextDecoder()
      let html = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        html += decoder.decode(value, { stream: true })
        setGeneratedHtml(html)
        setProgressMsg(
          `HTML 생성 중... (${Math.round(html.length / 1024)}KB)`
        )
      }

      setStep('done')
      setProgressMsg('')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      setStep('error' as AppStep)
    }
  }

  /* ---- Download ---- */
  const handleDownload = () => {
    const title = analysis?.title?.replace(/[/\\?%*:|"<>]/g, '-') || 'lecture'
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ---- Copy HTML ---- */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedHtml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayStep: AppStep =
    step === ('error' as AppStep) ? 'idle' : step

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
      {/* ======= Header ======= */}
      <header className="bg-[#002345] text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none tracking-tight">
                Lecture Page Generator
              </h1>
              <p className="text-[#BDD9F4] text-xs mt-0.5">
                AI 강의 분석 → 상세 페이지 자동 생성
              </p>
            </div>
          </div>
          {(step === 'done' || (step as string) === 'error') && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-[#BDD9F4] hover:text-white text-sm transition-colors"
            >
              <RefreshCw size={15} />
              새로 시작
            </button>
          )}
        </div>
      </header>

      {/* ======= Main ======= */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* Step bar */}
        <StepBar step={displayStep} />

        {/* ---- Card 1: Upload ---- */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <SectionTitle
            num={1}
            color={primaryColor}
            title="강의 스크립트 업로드"
            sub="분석할 .txt 파일을 업로드하세요 (여러 파일 가능)"
          />
          <FileDropzone
            files={files}
            onChange={setFiles}
            disabled={isProcessing}
          />
        </section>

        {/* ---- Card 2: Color ---- */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <SectionTitle
            num={2}
            color={primaryColor}
            title="메인 컬러 선택"
            sub="생성될 상세 페이지의 테마 색상을 고르세요"
          />
          <ColorPicker
            value={primaryColor}
            onChange={setPrimaryColor}
            disabled={isProcessing}
          />
        </section>

        {/* ---- Card 3: Model ---- */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <SectionTitle
            num={3}
            color={primaryColor}
            title="AI 모델 선택"
            sub="분석 및 생성에 사용할 AI 모델을 선택하세요"
          />
          <ModelSelector
            value={modelConfig}
            onChange={setModelConfig}
            disabled={isProcessing}
          />
        </section>

        {/* ---- Generate button ---- */}
        {step !== 'done' && (
          <button
            onClick={handleGenerate}
            disabled={files.length === 0 || isProcessing}
            className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:brightness-90 active:scale-[0.99]
              flex items-center justify-center gap-3 shadow-md"
            style={{
              backgroundColor: files.length === 0 || isProcessing ? '#94a3b8' : primaryColor,
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>{progressMsg}</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                {files.length === 0 ? '파일을 먼저 업로드하세요' : '상세 페이지 생성하기'}
              </>
            )}
          </button>
        )}

        {/* ---- Error ---- */}
        {(step as string) === 'error' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium text-sm">오류 발생</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ---- Live preview while generating ---- */}
        {step === 'generating' && generatedHtml && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Loader2 size={14} className="text-blue-500 animate-spin" />
              <span className="text-sm text-gray-500 font-medium">실시간 생성 미리보기</span>
              <span className="ml-auto text-xs text-gray-400">
                {Math.round(generatedHtml.length / 1024)}KB
              </span>
            </div>
            <LivePreview html={generatedHtml} height={350} />
          </section>
        )}

        {/* ---- Analysis summary card ---- */}
        {analysis && step === 'done' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={18} className="text-green-500" />
              <h2 className="font-semibold text-gray-800">분석 결과</h2>
              <DifficultyBadge level={analysis.difficulty} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="제목" value={analysis.title} />
              <InfoRow label="강사" value={analysis.instructor || '—'} />
              <InfoRow label="분량" value={analysis.duration} />
              <InfoRow label="섹션 수" value={`${analysis.sections.length}개`} />
            </div>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed border-t pt-3">
              {analysis.summary}
            </p>
          </section>
        )}

        {/* ---- Result panel ---- */}
        {step === 'done' && generatedHtml && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-500" />
                <span className="font-semibold text-gray-800">생성 완료</span>
                <span className="text-xs text-gray-400">
                  ({Math.round(generatedHtml.length / 1024)}KB)
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowPreview((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
                >
                  {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
                  {showPreview ? '미리보기 닫기' : '미리보기'}
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
                >
                  {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                  {copied ? '복사됨!' : 'HTML 복사'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:brightness-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Download size={15} />
                  다운로드
                </button>
              </div>
            </div>

            {/* Preview iframe */}
            {showPreview && (
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500 border-b flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="ml-1 truncate">{analysis?.title ?? '생성된 페이지'}</span>
                </div>
                <LivePreview html={generatedHtml} height={580} />
              </div>
            )}
          </section>
        )}
      </main>

      {/* ======= Footer ======= */}
      <footer className="text-center py-8 text-xs text-gray-400 pb-16">
        Powered by Claude &amp; Gemini AI · 생성된 HTML은 다운로드하여 직접 사용하세요
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sub components                                                        */
/* ------------------------------------------------------------------ */
function SectionTitle({
  num,
  color,
  title,
  sub,
}: {
  num: number
  color: string
  title: string
  sub: string
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div
        className="w-7 h-7 rounded-full text-white text-sm flex items-center justify-center font-bold flex-shrink-0 mt-0.5"
        style={{ backgroundColor: color }}
      >
        {num}
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-800 leading-tight">{title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function LivePreview({ html, height }: { html: string; height: number }) {
  return (
    <iframe
      srcDoc={html}
      style={{ width: '100%', height, border: 'none', display: 'block' }}
      title="미리보기"
      sandbox="allow-same-origin"
    />
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-700 mt-0.5 truncate">{value}</p>
    </div>
  )
}

function DifficultyBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; className: string }> = {
    beginner: { label: '입문', className: 'bg-green-100 text-green-700' },
    intermediate: { label: '중급', className: 'bg-blue-100 text-blue-700' },
    advanced: { label: '고급', className: 'bg-purple-100 text-purple-700' },
  }
  const { label, className } = map[level] ?? { label: level, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
