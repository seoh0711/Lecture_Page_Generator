'use client'

import { useState, useRef, useEffect } from 'react'
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
  ClipboardList,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldX,
  ArrowRight,
  Wand2,
  TrendingDown,
} from 'lucide-react'
import FileDropzone from '@/components/FileDropzone'
import ColorPicker from '@/components/ColorPicker'
import ModelSelector from '@/components/ModelSelector'
import type { FileItem, LectureAnalysis, AppStep, ModelConfig } from '@/lib/types'

/* ------------------------------------------------------------------ */
/* Constants                                                             */
/* ------------------------------------------------------------------ */
const MAX_IMPROVE_ITERATIONS  = 10
const STAGNATION_MIN_ATTEMPT  = 5   // start checking from this attempt number
const STAGNATION_THRESHOLD    = 5   // points — ≤ this change = stagnated
// Model escalation thresholds (improvement attempt index, 0-based)
const MODEL_ESCALATION: { from: number; config: ModelConfig; label: string }[] = [
  { from: 5, config: { provider: 'gemini', modelId: 'gemini-3.1-pro-preview' }, label: 'Gemini Pro' },
  { from: 3, config: { provider: 'gemini', modelId: 'gemini-3-flash-preview'  }, label: 'Gemini Flash' },
]

function getImproveModel(iterIdx: number, defaultConfig: ModelConfig): { config: ModelConfig; label: string } {
  for (const tier of MODEL_ESCALATION) {
    if (iterIdx >= tier.from) return tier
  }
  const label = defaultConfig.modelId.includes('claude')
    ? 'Claude'
    : defaultConfig.modelId.includes('flash-lite')
    ? 'Flash Lite'
    : defaultConfig.modelId.includes('flash')
    ? 'Gemini Flash'
    : 'Gemini Pro'
  return { config: defaultConfig, label }
}

/* ------------------------------------------------------------------ */
/* Step indicator                                                        */
/* ------------------------------------------------------------------ */
const STEPS = [
  { id: 'idle',       label: '파일 업로드' },
  { id: 'analyzing',  label: '강의 분석' },
  { id: 'evaluating', label: '품질 평가' },
  { id: 'generating', label: '페이지 생성' },
  { id: 'done',       label: '완료' },
]

function StepBar({ step }: { step: AppStep }) {
  const currentIdx = STEPS.findIndex((s) => s.id === step)
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done   = currentIdx > i
        const active = currentIdx === i
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-400'}`}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span className={`mt-1 text-xs font-medium whitespace-nowrap
                ${done ? 'text-green-600' : active ? 'text-blue-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Score helpers                                                         */
/* ------------------------------------------------------------------ */
function parseScore(text: string): number | null {
  const match = text.match(/\*\*총점:\s*(\d+)\/100점\*\*/)
  if (match) return parseInt(match[1], 10)
  return null
}

/* ------------------------------------------------------------------ */
/* Eval history types                                                    */
/* ------------------------------------------------------------------ */
interface EvalHistoryItem {
  attempt: number
  score: number
  report: string
  passed: boolean
  nextImproveLabel?: string   // model label used for the improvement after this eval
}

/* ------------------------------------------------------------------ */
/* Eval iteration timeline                                              */
/* ------------------------------------------------------------------ */
function EvalTimeline({
  history,
  isImproving,
  primaryColor,
}: {
  history: EvalHistoryItem[]
  isImproving: boolean
  primaryColor: string
}) {
  if (history.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-5 pt-4 pb-2">
      {history.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            item.passed
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'
          }`}>
            {item.passed ? <ShieldCheck size={11} /> : <ShieldX size={11} />}
            {item.attempt}차 {item.score}점
          </span>
          {(i < history.length - 1 || isImproving) && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <ArrowRight size={11} />
              {i < history.length - 1 ? (
                <span className="text-purple-500 font-medium flex items-center gap-0.5">
                  <Wand2 size={11} />
                  {item.nextImproveLabel ? item.nextImproveLabel : '개선'}
                </span>
              ) : (
                <span className="text-purple-500 font-medium flex items-center gap-0.5 animate-pulse">
                  <Loader2 size={11} className="animate-spin" />
                  {item.nextImproveLabel ? `${item.nextImproveLabel} 개선 중` : '개선 중'}
                </span>
              )}
              <ArrowRight size={11} />
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main page                                                            */
/* ------------------------------------------------------------------ */
export default function Home() {
  const [files,        setFiles]        = useState<FileItem[]>([])
  const [primaryColor, setPrimaryColor] = useState('#166EC0')
  const [modelConfig,  setModelConfig]  = useState<ModelConfig>({ provider: 'claude', modelId: 'claude-sonnet-4-6' })
  const [step,         setStep]         = useState<AppStep>('idle')
  const [analysis,     setAnalysis]     = useState<LectureAnalysis | null>(null)
  const [generatedHtml,setGeneratedHtml]= useState('')
  const [showPreview,  setShowPreview]  = useState(true)
  const [error,        setError]        = useState('')
  const [progressMsg,  setProgressMsg]  = useState('')
  const [copied,       setCopied]       = useState(false)
  const [reviewText,   setReviewText]   = useState('')
  const [isReviewing,  setIsReviewing]  = useState(false)
  const [showReview,   setShowReview]   = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(true)

  /* Evaluation + iteration states */
  const [evalReport,   setEvalReport]   = useState('')
  const [evalScore,    setEvalScore]    = useState<number | null>(null)
  const [evalPassed,   setEvalPassed]   = useState<boolean | null>(null)
  const [showEval,     setShowEval]     = useState(true)
  const [evalHistory,       setEvalHistory]       = useState<EvalHistoryItem[]>([])
  const [isImproving,       setIsImproving]       = useState(false)
  const [evalStagnated,     setEvalStagnated]     = useState(false)
  const [evalStagnationDelta, setEvalStagnationDelta] = useState<number | null>(null)

  const resultRef = useRef<HTMLElement>(null)
  const reviewRef = useRef<HTMLElement>(null)
  const evalRef   = useRef<HTMLElement>(null)

  const isProcessing = step === 'analyzing' || step === 'evaluating' || step === 'generating'

  useEffect(() => {
    if (step === 'evaluating' && evalRef.current) {
      setTimeout(() => evalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    }
  }, [step])

  useEffect(() => {
    if (step === 'done' && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    }
  }, [step])

  useEffect(() => {
    if (isReviewing && reviewRef.current) {
      setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [isReviewing])

  /* ---- Reset ---- */
  const handleReset = () => {
    setFiles([])
    setStep('idle')
    setAnalysis(null)
    setGeneratedHtml('')
    setError('')
    setProgressMsg('')
    setCopied(false)
    setReviewText('')
    setIsReviewing(false)
    setShowReview(false)
    setShowAnalysis(true)
    setEvalReport('')
    setEvalScore(null)
    setEvalPassed(null)
    setShowEval(true)
    setEvalHistory([])
    setIsImproving(false)
    setEvalStagnated(false)
    setEvalStagnationDelta(null)
    setModelConfig({ provider: 'claude', modelId: 'claude-sonnet-4-6' })
  }

  /* ---- Eval stream helper ---- */
  const streamEval = async (analysisData: LectureAnalysis): Promise<{ report: string; score: number | null }> => {
    setEvalReport('')
    setEvalScore(null)

    const evalRes = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis: analysisData, modelConfig }),
    })
    if (!evalRes.ok) {
      const body = await evalRes.json().catch(() => ({ error: evalRes.statusText }))
      throw new Error(body.error || '평가 API 오류')
    }

    const reader  = evalRes.body!.getReader()
    const decoder = new TextDecoder()
    let report = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      report += decoder.decode(value, { stream: true })
      setEvalReport(report)
    }
    const score = parseScore(report)
    setEvalScore(score)
    return { report, score }
  }

  /* ---- Improve helper ---- */
  const improveAnalysis = async (
    analysisData: LectureAnalysis,
    report: string,
    overrideModel?: ModelConfig,
  ): Promise<LectureAnalysis> => {
    const res = await fetch('/api/improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis: analysisData, evalReport: report, modelConfig: overrideModel ?? modelConfig }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(body.error || '개선 API 오류')
    }
    const { analysis: improved } = await res.json()
    return improved
  }

  /* ---- Main flow ---- */
  const handleGenerate = async () => {
    if (files.length === 0 || isProcessing) return
    setError('')
    setGeneratedHtml('')
    setAnalysis(null)
    setReviewText('')
    setShowReview(false)
    setEvalReport('')
    setEvalScore(null)
    setEvalPassed(null)
    setShowEval(true)
    setEvalHistory([])
    setIsImproving(false)
    setEvalStagnated(false)
    setEvalStagnationDelta(null)

    // ── Step 1: Analyze ──────────────────────────────────────────────
    setStep('analyzing')
    setProgressMsg('강의 내용을 분석하는 중...')
    let currentAnalysis: LectureAnalysis
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
      currentAnalysis = data
      setAnalysis(data)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      setStep('error' as AppStep)
      return
    }

    // ── Step 2: Evaluate → Improve loop ─────────────────────────────
    setStep('evaluating')
    const history: EvalHistoryItem[] = []
    let finalPassed = false

    try {
      for (let iter = 0; iter <= MAX_IMPROVE_ITERATIONS; iter++) {
        const attemptNum = iter + 1
        const isLastAttempt = iter === MAX_IMPROVE_ITERATIONS

        // Evaluate
        setIsImproving(false)
        setProgressMsg(`마케팅 카피 품질 평가 중... (${attemptNum}/${MAX_IMPROVE_ITERATIONS + 1}회)`)
        const { report, score } = await streamEval(currentAnalysis)

        const passed    = score !== null && score >= 90
        const currScore = score ?? 0

        // Stagnation check: from STAGNATION_MIN_ATTEMPT onwards, if score change ≤ threshold
        const prevScore = history.length > 0 ? history[history.length - 1].score : null
        const scoreDelta = prevScore !== null ? Math.abs(currScore - prevScore) : null
        const isStagnated =
          attemptNum >= STAGNATION_MIN_ATTEMPT &&
          scoreDelta !== null &&
          scoreDelta <= STAGNATION_THRESHOLD

        // Determine next improve model (only relevant if we'll actually improve)
        const willImprove = !passed && !isStagnated && !isLastAttempt
        const { config: nextImproveConfig, label: nextImproveLabel } = getImproveModel(iter, modelConfig)

        const item: EvalHistoryItem = {
          attempt: attemptNum,
          score: currScore,
          report,
          passed,
          nextImproveLabel: willImprove ? nextImproveLabel : undefined,
        }
        history.push(item)
        setEvalHistory([...history])

        if (passed) {
          setEvalPassed(true)
          finalPassed = true
          break
        }

        if (isStagnated) {
          // Score plateaued — generate with current best content
          setEvalStagnated(true)
          setEvalStagnationDelta(scoreDelta)
          finalPassed = true
          break
        }

        if (isLastAttempt) {
          // Max iterations exhausted — stop and let user fix manually
          setEvalPassed(false)
          setProgressMsg('')
          setStep('idle')
          return
        }

        // Improve copy based on report — use escalated model if threshold reached
        setIsImproving(true)
        setProgressMsg(`카피 개선 중... (${iter + 1}/${MAX_IMPROVE_ITERATIONS}회 · ${nextImproveLabel})`)
        currentAnalysis = await improveAnalysis(currentAnalysis, report, nextImproveConfig)
        setAnalysis(currentAnalysis)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      setStep('error' as AppStep)
      return
    }

    if (!finalPassed) return

    // ── Step 3: Generate ─────────────────────────────────────────────
    setIsImproving(false)
    setStep('generating')
    setProgressMsg('HTML 페이지를 생성하는 중...')
    try {
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: currentAnalysis, primaryColor, modelConfig }),
      })
      if (!genRes.ok) {
        const body = await genRes.json().catch(() => ({ error: genRes.statusText }))
        throw new Error(body.error || '생성 API 오류')
      }

      const reader  = genRes.body!.getReader()
      const decoder = new TextDecoder()
      let html = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        html += decoder.decode(value, { stream: true })
        setGeneratedHtml(html)
        setProgressMsg(`HTML 생성 중... (${Math.round(html.length / 1024)}KB)`)
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
    const blob  = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href = url
    a.download = `${title}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ---- Review ---- */
  const handleReview = async () => {
    if (!generatedHtml || isReviewing) return
    setIsReviewing(true)
    setReviewText('')
    setShowReview(true)
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: generatedHtml, title: analysis?.title ?? '', modelConfig }),
      })
      if (!res.ok) throw new Error('리뷰 API 오류')
      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setReviewText(text)
      }
    } catch (err) {
      setReviewText('리뷰 생성 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setIsReviewing(false)
    }
  }

  /* ---- Copy HTML ---- */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedHtml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayStep: AppStep = step === ('error' as AppStep) ? 'idle' : step
  const lastHistory = evalHistory[evalHistory.length - 1] ?? null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
      {/* ======= Header ======= */}
      <header className="bg-[#002345] text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow"
              style={{ backgroundColor: primaryColor }}>
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none tracking-tight">
                Lecture Page Generator
              </h1>
              <p className="text-[#BDD9F4] text-xs mt-0.5">
                AI 강의 분석 → 품질 평가·자동 개선 → 상세 페이지 생성
              </p>
            </div>
          </div>
          {(step === 'done' || (step as string) === 'error' || evalPassed === false) && (
            <button onClick={handleReset}
              className="flex items-center gap-1.5 text-[#BDD9F4] hover:text-white text-sm transition-colors">
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
          <SectionTitle num={1} color={primaryColor}
            title="강의 스크립트 업로드"
            sub="분석할 .txt 파일을 업로드하세요 (여러 파일 가능)" />
          <FileDropzone files={files} onChange={setFiles} disabled={isProcessing} />
        </section>

        {/* ---- Card 2: Color ---- */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <SectionTitle num={2} color={primaryColor}
            title="메인 컬러 선택"
            sub="생성될 상세 페이지의 테마 색상을 고르세요" />
          <ColorPicker value={primaryColor} onChange={setPrimaryColor} disabled={isProcessing} />
        </section>

        {/* ---- Card 3: Model ---- */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <SectionTitle num={3} color={primaryColor}
            title="AI 모델 선택"
            sub="분석 및 생성에 사용할 AI 모델을 선택하세요" />
          <ModelSelector value={modelConfig} onChange={setModelConfig} disabled={isProcessing} />
        </section>

        {/* ---- Generate / Re-analyze button ---- */}
        {step !== 'done' && (
          <button
            onClick={evalPassed === false ? handleReset : handleGenerate}
            disabled={files.length === 0 || isProcessing}
            className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:brightness-90 active:scale-[0.99]
              flex items-center justify-center gap-3 shadow-md"
            style={{
              backgroundColor:
                files.length === 0 || isProcessing
                  ? '#94a3b8'
                  : evalPassed === false
                  ? '#dc2626'
                  : primaryColor,
            }}
          >
            {isProcessing ? (
              <><Loader2 size={20} className="animate-spin" /><span>{progressMsg}</span></>
            ) : evalPassed === false ? (
              <><RefreshCw size={20} />내용 수정 후 재분석</>
            ) : (
              <><Sparkles size={20} />{files.length === 0 ? '파일을 먼저 업로드하세요' : '상세 페이지 생성하기'}</>
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

        {/* ---- Evaluation + Improvement card ---- */}
        {(evalReport || evalHistory.length > 0) && (
          <section
            ref={evalRef}
            className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
              evalStagnated
                ? 'border-amber-200'
                : evalPassed === false
                ? 'border-red-200'
                : evalPassed === true
                ? 'border-green-200'
                : 'border-gray-100'
            }`}
          >
            {/* Header */}
            <button
              className="w-full flex items-center gap-2 px-5 pt-5 pb-3 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setShowEval(v => !v)}
            >
              {isImproving ? (
                <Wand2 size={18} className="text-purple-500 flex-shrink-0" />
              ) : evalStagnated ? (
                <TrendingDown size={18} className="text-amber-500 flex-shrink-0" />
              ) : step === 'evaluating' && !lastHistory ? (
                <Loader2 size={18} className="text-blue-500 animate-spin flex-shrink-0" />
              ) : evalPassed === false ? (
                <ShieldX size={18} className="text-red-500 flex-shrink-0" />
              ) : evalPassed === true ? (
                <ShieldCheck size={18} className="text-green-500 flex-shrink-0" />
              ) : (
                <Loader2 size={18} className="text-blue-500 animate-spin flex-shrink-0" />
              )}

              <span className="font-semibold text-gray-800 flex-1">
                {isImproving ? '마케팅 카피 자동 개선 중' : '마케팅 카피 품질 평가'}
              </span>

              {/* Attempt counter */}
              {evalHistory.length > 0 && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {evalHistory.length}회 시도
                </span>
              )}

              {/* Latest score badge */}
              {lastHistory && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  lastHistory.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {lastHistory.passed ? <ShieldCheck size={11} /> : <ShieldX size={11} />}
                  {lastHistory.score}점
                </span>
              )}

              {showEval ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {showEval && (
              <div className="border-t border-gray-50">
                {/* Iteration timeline */}
                <EvalTimeline
                  history={evalHistory}
                  isImproving={isImproving}
                  primaryColor={primaryColor}
                />

                {/* Improving indicator */}
                {isImproving && evalHistory.length > 0 && (() => {
                  const last = evalHistory[evalHistory.length - 1]
                  return (
                    <div className="mx-5 mt-2 mb-1 flex items-center gap-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
                      <Wand2 size={13} className="animate-pulse" />
                      {last.nextImproveLabel
                        ? `${last.nextImproveLabel} 모델로 카피 재작성 중...`
                        : '평가 리포트의 개선 제안을 반영해 카피를 재작성하는 중...'}
                      {last.nextImproveLabel !== evalHistory[0]?.nextImproveLabel && (
                        <span className="ml-auto bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                          모델 업그레이드
                        </span>
                      )}
                    </div>
                  )
                })()}

                {/* Pass / fail status banner */}
                {evalPassed === false && lastHistory && !isImproving && (
                  <div className="mx-5 mt-3 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                    <ShieldX size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-700 font-semibold text-sm">
                        {MAX_IMPROVE_ITERATIONS}회 자동 개선 후에도 기준 미달 — 페이지 생성 불가
                      </p>
                      <p className="text-red-600 text-sm mt-0.5">
                        Claude → Gemini Flash → Gemini Pro 순으로 모델을 교체하며 {MAX_IMPROVE_ITERATIONS}회 개선했으나,
                        최종 점수 <strong>{lastHistory.score}점</strong>으로 기준(90점)에 미달합니다.
                        아래 진단 리포트를 참고해 강의 스크립트를 직접 보완하고 재분석하세요.
                      </p>
                    </div>
                  </div>
                )}

                {evalPassed === true && lastHistory && (
                  <div className="mx-5 mt-3 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                    <ShieldCheck size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-700 font-semibold text-sm">품질 기준 통과 — 페이지 생성 진행</p>
                      <p className="text-green-600 text-sm mt-0.5">
                        {evalHistory.length > 1
                          ? `${evalHistory.length}번의 평가 끝에 ${lastHistory.score}점으로 기준을 충족했습니다.`
                          : `${lastHistory.score}점으로 기준을 충족했습니다.`}
                      </p>
                    </div>
                  </div>
                )}

                {evalStagnated && lastHistory && (
                  <div className="mx-5 mt-3 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <TrendingDown size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-700 font-semibold text-sm">점수 정체 감지 — 현재 내용으로 페이지 생성</p>
                      <p className="text-amber-600 text-sm mt-0.5">
                        {evalHistory.length}차 평가에서 점수 변화가{' '}
                        <strong>{evalStagnationDelta}점</strong>({STAGNATION_THRESHOLD}점 이하)으로
                        추가 개선 효과가 미미하다고 판단했습니다.
                        최고 점수 <strong>{Math.max(...evalHistory.map(h => h.score))}점</strong>
                        으로 달성된 현재 내용으로 페이지를 생성합니다.
                      </p>
                    </div>
                  </div>
                )}

                {/* Streaming indicator */}
                {step === 'evaluating' && !isImproving && (
                  <div className="flex items-center gap-1.5 mx-5 mt-3 text-xs text-blue-500">
                    <Loader2 size={12} className="animate-spin" />
                    {evalHistory.length > 0 ? `${evalHistory.length + 1}차 평가 중...` : '평가 중...'}
                  </div>
                )}

                {/* Latest eval report */}
                {evalReport && (
                  <div className="px-5 pb-5 mt-3">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                      <ReviewResult text={evalReport} accentColor={primaryColor} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ---- Live preview while generating ---- */}
        {step === 'generating' && generatedHtml && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Loader2 size={14} className="text-blue-500 animate-spin" />
              <span className="text-sm text-gray-500 font-medium">실시간 생성 미리보기</span>
              <span className="ml-auto text-xs text-gray-400">{Math.round(generatedHtml.length / 1024)}KB</span>
            </div>
            <LivePreview html={generatedHtml} height={350} />
          </section>
        )}

        {/* ---- Analysis summary card ---- */}
        {analysis && step === 'done' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              className="w-full flex items-center gap-2 px-5 pt-5 pb-4 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setShowAnalysis(v => !v)}
            >
              <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
              <span className="font-semibold text-gray-800 flex-1">분석 결과</span>
              <DifficultyBadge level={analysis.difficulty} />
              {showAnalysis ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {showAnalysis && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-50">
                <div className="mt-4 rounded-xl p-4 space-y-1" style={{ backgroundColor: `${primaryColor}12` }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>Hero 카피</p>
                  <p className="text-base font-bold text-gray-900 leading-snug">{analysis.hero?.title_line1}</p>
                  <p className="text-base font-bold text-gray-900 leading-snug">{analysis.hero?.title_line2}</p>
                  {analysis.hero?.tagline && (
                    <p className="text-sm text-gray-500 mt-1 italic leading-relaxed">
                      &ldquo;{analysis.hero.tagline.replace(/\\n/g, ' ')}&rdquo;
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="강의 제목" value={analysis.title} />
                  <InfoRow label="강사" value={analysis.instructor?.name || '—'} />
                  <InfoRow label="총 분량" value={analysis.curriculum?.total_duration || '—'} />
                  <InfoRow label="챕터 수" value={`${analysis.curriculum?.total_chapters ?? analysis.curriculum?.chapters?.length ?? 0}개`} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <CountBadge color={primaryColor} label="핵심 하이라이트" count={analysis.key_highlights?.length ?? 0} unit="개 카드" />
                  <CountBadge color={primaryColor} label="페인 포인트" count={analysis.pain_points?.items?.length ?? 0} unit="개 항목" />
                  <CountBadge color={primaryColor} label="추천 대상" count={analysis.target_audience?.length ?? 0} unit="개 페르소나" />
                </div>

                <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">{analysis.summary}</p>
              </div>
            )}
          </section>
        )}

        {/* ---- Result panel ---- */}
        {step === 'done' && generatedHtml && (
          <section ref={resultRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-500" />
                <span className="font-semibold text-gray-800">생성 완료</span>
                <span className="text-xs text-gray-400">({Math.round(generatedHtml.length / 1024)}KB)</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setShowPreview(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors">
                  {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
                  {showPreview ? '미리보기 닫기' : '미리보기'}
                </button>
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors">
                  {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                  {copied ? '복사됨!' : 'HTML 복사'}
                </button>
                <button onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:brightness-90"
                  style={{ backgroundColor: primaryColor }}>
                  <Download size={15} />
                  다운로드
                </button>
              </div>
            </div>

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

        {/* ---- Review panel ---- */}
        {step === 'done' && generatedHtml && (
          <section ref={reviewRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} style={{ color: primaryColor }} />
                <span className="font-semibold text-gray-800">상세 페이지 마케팅 진단</span>
                <span className="text-xs text-gray-400">5항목 × 20점 평가</span>
              </div>
              {!showReview && (
                <button onClick={handleReview} disabled={isReviewing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:brightness-90 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}>
                  {isReviewing
                    ? <><Loader2 size={14} className="animate-spin" /> 분석 중...</>
                    : <><ClipboardList size={14} /> 진단 시작</>}
                </button>
              )}
              {showReview && !isReviewing && (
                <button onClick={handleReview}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs transition-colors">
                  <RefreshCw size={12} /> 재진단
                </button>
              )}
            </div>

            {showReview && (
              <div className="relative">
                {isReviewing && !reviewText && (
                  <div className="flex items-center gap-2 py-8 justify-center text-gray-400 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    AI가 마케팅 카피를 분석하는 중...
                  </div>
                )}
                {reviewText && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                    {isReviewing && (
                      <div className="flex items-center gap-1.5 mb-3 text-xs text-blue-500">
                        <Loader2 size={12} className="animate-spin" /> 분석 중...
                      </div>
                    )}
                    <ReviewResult text={reviewText} accentColor={primaryColor} />
                  </div>
                )}
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
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */
function SectionTitle({ num, color, title, sub }: {
  num: number; color: string; title: string; sub: string
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-7 h-7 rounded-full text-white text-sm flex items-center justify-center font-bold flex-shrink-0 mt-0.5"
        style={{ backgroundColor: color }}>
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

function CountBadge({ label, count, unit, color }: {
  label: string; count: number; unit: string; color: string
}) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: `${color}10` }}>
      <p className="text-xl font-bold" style={{ color }}>{count}</p>
      <p className="text-xs text-gray-500 mt-0.5">{unit}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}

function DifficultyBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; className: string }> = {
    beginner:     { label: '입문', className: 'bg-green-100 text-green-700' },
    intermediate: { label: '중급', className: 'bg-blue-100 text-blue-700' },
    advanced:     { label: '고급', className: 'bg-purple-100 text-purple-700' },
  }
  const { label, className } = map[level] ?? { label: level, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${className}`}>{label}</span>
  )
}

function ReviewResult({ text, accentColor }: { text: string; accentColor: string }) {
  const lines = text.split('\n')
  return (
    <div className="text-sm text-gray-700 leading-relaxed space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-base font-bold text-gray-900 mt-5 mb-1">{line.slice(3)}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-sm font-bold text-gray-800 mt-4 mb-1">{line.slice(4)}</h3>
        }
        if (line.startsWith('#### ')) {
          return (
            <h4 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-0.5 border-l-4 pl-2"
              style={{ borderColor: accentColor }}>
              {line.slice(5)}
            </h4>
          )
        }
        if (line.startsWith('**총점:')) {
          return (
            <p key={i} className="text-lg font-bold text-gray-900 my-2 py-2 px-3 rounded-lg"
              style={{ backgroundColor: `${accentColor}15` }}>
              {line.replace(/\*\*/g, '')}
            </p>
          )
        }
        if (line.startsWith('| ') && line.includes('|')) {
          const cells = line.split('|').filter(c => c.trim() !== '')
          if (cells[0]?.trim().startsWith(':') || cells[0]?.trim().startsWith('-')) return null
          return (
            <div key={i} className="flex gap-2 py-1 border-b border-gray-100 last:border-0">
              {cells.map((cell, ci) => {
                const val = cell.trim().replace(/\*\*/g, '')
                return (
                  <span key={ci} className={`
                    ${ci === 0 ? 'flex-1 text-gray-700' : 'w-20 text-center font-semibold'}
                    ${val === '우수' ? 'text-green-600' : ''}
                    ${val === '양호' ? 'text-blue-600'  : ''}
                    ${val === '미흡' ? 'text-orange-500': ''}
                    ${val === '심각' ? 'text-red-500'   : ''}
                  `}>{val}</span>
                )
              })}
            </div>
          )
        }
        if (/^- \*\*(진단|기존 문구|❌|✅|개선 이유):?\*\*/.test(line)) {
          const cleaned = line.replace(/^- \*\*/, '')
          const colonIdx = cleaned.indexOf(':**')
          const label = cleaned.slice(0, colonIdx)
          const content = cleaned.slice(colonIdx + 3).trim().replace(/^"/, '').replace(/"$/, '')
          const isGood = label.includes('✅')
          const isBad  = label.includes('❌')
          return (
            <div key={i} className="flex gap-2 mt-1.5 pl-1">
              <span className="font-semibold text-gray-800 whitespace-nowrap shrink-0">{label}:</span>
              <span className={`${isGood ? 'text-green-700 font-medium' : isBad ? 'text-red-600' : 'text-gray-600'}`}>
                {content}
              </span>
            </div>
          )
        }
        if (/^\*\*단 하나의 조언/.test(line)) {
          return (
            <p key={i} className="mt-3 font-semibold text-gray-900 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5">
              {line.replace(/\*\*/g, '')}
            </p>
          )
        }
        if (line.startsWith('---')) return <hr key={i} className="border-gray-200 my-3" />
        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i} className="text-gray-600">{line.replace(/\*\*/g, '').replace(/\*/g, '')}</p>
      })}
    </div>
  )
}
