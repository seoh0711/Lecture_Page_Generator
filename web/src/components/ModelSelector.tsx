'use client'

import { MODEL_OPTIONS } from '@/lib/types'
import type { ModelConfig, AIProvider } from '@/lib/types'

interface Props {
  value: ModelConfig
  onChange: (config: ModelConfig) => void
  disabled?: boolean
}

const PROVIDER_LABELS: Record<AIProvider, string> = {
  claude: 'Claude (Anthropic)',
  gemini: 'Gemini (Google)',
}

export default function ModelSelector({ value, onChange, disabled }: Props) {
  const claudeModels = MODEL_OPTIONS.filter((m) => m.provider === 'claude')
  const geminiModels = MODEL_OPTIONS.filter((m) => m.provider === 'gemini')

  const handleProviderChange = (provider: AIProvider) => {
    const first = MODEL_OPTIONS.find((m) => m.provider === provider)!
    onChange({ provider, modelId: first.id })
  }

  return (
    <div className="space-y-3">
      {/* Provider toggle */}
      <div className="flex gap-2">
        {(['claude', 'gemini'] as AIProvider[]).map((p) => (
          <button
            key={p}
            disabled={disabled}
            onClick={() => handleProviderChange(p)}
            className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              ${value.provider === p
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
          >
            {PROVIDER_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Model sub-selection */}
      <div className="flex flex-wrap gap-2">
        {(value.provider === 'claude' ? claudeModels : geminiModels).map((m) => (
          <button
            key={m.id}
            disabled={disabled}
            onClick={() => onChange({ provider: value.provider, modelId: m.id })}
            className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              ${value.modelId === m.id
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
