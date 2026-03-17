export interface FileItem {
  name: string
  content: string
  size: number
}

export interface LectureSection {
  title: string
  content: string
  keywords: string[]
  code_examples: string[]
}

export interface LectureAnalysis {
  lecture_id: string
  title: string
  instructor: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  prerequisites: string[]
  learning_objectives: string[]
  keywords: string[]
  sections: LectureSection[]
  summary: string
}

export type AppStep = 'idle' | 'analyzing' | 'generating' | 'done' | 'error'

export type AIProvider = 'claude' | 'gemini'

export interface ModelOption {
  id: string
  label: string
  provider: AIProvider
}

export interface ModelConfig {
  provider: AIProvider
  modelId: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'claude' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', provider: 'gemini' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', provider: 'gemini' },
  { id: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite', provider: 'gemini' },
]
