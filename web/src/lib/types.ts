export interface FileItem {
  name: string
  content: string
  size: number
}

export interface TemplateFile {
  name: string
  content: string
  size: number
}

/* ---------- Sub-types ---------- */
export interface SubItem {
  label: string
  detail: string
}

export interface KeyHighlight {
  title: string
  description: string
  sub_items: SubItem[]
}

export interface BookBenefit {
  title: string
  image_url: string
}

export interface PainPoints {
  subtitle: string
  items: string[]
}

export interface TargetAudience {
  header: string
  description: string
}

export interface BeforeAfter {
  before_items: string[]
  after_items: string[]
}

export interface InstructorInfo {
  name: string
  title: string
  subtitle: string
  photo_url: string
  career: string[]
  publications: string[]
}

export interface CurriculumChapter {
  chapter: string
  description: string
}

export interface Curriculum {
  total_duration: string
  total_chapters: number
  format: string
  chapters: CurriculumChapter[]
}

export interface Hero {
  badge_text: string
  title_line1: string
  title_line2: string
  tagline: string
  image_url: string
}

/* ---------- Main analysis type ---------- */
export interface LectureAnalysis {
  lecture_id: string
  title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  prerequisites: string[]
  learning_objectives: string[]
  keywords: string[]
  /** Section 1 – Hero */
  hero: Hero
  /** Section 1 – Highlight cards (2–3 items) */
  key_highlights: KeyHighlight[]
  /** Section 2 – Book & lecture benefit */
  book_benefit: BookBenefit
  /** Section 3 – Pain points before taking the course */
  pain_points: PainPoints
  /** Section 4 – Recommended audience (3 items) */
  target_audience: TargetAudience[]
  /** Section 5 – Before / After transformation */
  before_after: BeforeAfter
  /** Section 6 – Instructor profile */
  instructor: InstructorInfo
  /** Section 7 – Curriculum */
  curriculum: Curriculum
  summary: string
  /**
   * Template-specific sections not covered by the standard schema.
   * Populated only when an HTML template is uploaded.
   * Keys are snake_case section names (e.g. "projects", "core_points", "faq").
   * Values are arrays of structured objects serialized as JSON strings, or plain strings.
   */
  extra_content?: Record<string, unknown[]>
}

/* ---------- App state types ---------- */
export type AppStep = 'idle' | 'analyzing' | 'evaluating' | 'generating' | 'done' | 'error'

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
