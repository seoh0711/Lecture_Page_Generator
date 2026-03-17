'use client'

import { useState } from 'react'

interface Props {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
  hasTemplate?: boolean
  keepTemplateColor?: boolean
  onKeepTemplateColorChange?: (keep: boolean) => void
}

const PRESETS = [
  { color: '#166EC0', label: '블루' },
  { color: '#002345', label: '네이비' },
  { color: '#1a7340', label: '그린' },
  { color: '#7C3AED', label: '퍼플' },
  { color: '#DC2626', label: '레드' },
  { color: '#D97706', label: '앰버' },
  { color: '#0891B2', label: '시안' },
  { color: '#374151', label: '슬레이트' },
  { color: '#9D174D', label: '로즈' },
  { color: '#065F46', label: '에메랄드' },
]

function isValidHex(str: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(str)
}

export default function ColorPicker({ value, onChange, disabled, hasTemplate, keepTemplateColor, onKeepTemplateColorChange }: Props) {
  const [inputVal, setInputVal] = useState(value)
  const pickerDisabled = disabled || keepTemplateColor

  const handlePreset = (color: string) => {
    setInputVal(color)
    onChange(color)
  }

  const handleHexInput = (raw: string) => {
    const val = raw.startsWith('#') ? raw : '#' + raw
    setInputVal(val)
    if (isValidHex(val)) onChange(val)
  }

  const handleColorWheel = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div className="space-y-4">
      {/* Template color keep toggle — only shown when template is uploaded */}
      {hasTemplate && onKeepTemplateColorChange && (
        <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors select-none
          ${keepTemplateColor
            ? 'bg-purple-50 border-purple-200'
            : 'bg-gray-50 border-gray-200 hover:border-purple-200'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0
            ${keepTemplateColor ? 'bg-purple-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
              ${keepTemplateColor ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
          <input
            type="checkbox"
            className="sr-only"
            checked={!!keepTemplateColor}
            onChange={(e) => onKeepTemplateColorChange(e.target.checked)}
            disabled={disabled}
          />
          <div>
            <p className={`text-sm font-semibold ${keepTemplateColor ? 'text-purple-700' : 'text-gray-700'}`}>
              템플릿 컬러 유지
            </p>
            <p className="text-xs text-gray-400">
              업로드된 템플릿의 원본 색상을 그대로 사용합니다
            </p>
          </div>
        </label>
      )}

      {/* Preset swatches */}
      <div className={pickerDisabled ? 'opacity-40 pointer-events-none' : ''}>
        <p className="text-xs text-gray-500 mb-2 font-medium">프리셋 색상</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(({ color, label }) => (
            <button
              key={color}
              title={label}
              onClick={() => handlePreset(color)}
              className="relative w-9 h-9 rounded-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
              style={{ backgroundColor: color }}
            >
              {value === color && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </span>
              )}
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom input row */}
      <div className={pickerDisabled ? 'opacity-40 pointer-events-none' : ''}>
        <p className="text-xs text-gray-500 mb-2 font-medium">직접 입력</p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value}
            onChange={handleColorWheel}
            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5"
            title="색상 선택기"
          />
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <span className="text-gray-400 text-sm font-mono mr-1">#</span>
            <input
              type="text"
              value={inputVal.replace(/^#/, '')}
              onChange={(e) => handleHexInput('#' + e.target.value)}
              maxLength={6}
              className="w-20 text-sm font-mono outline-none text-gray-700 uppercase"
              placeholder="166EC0"
            />
          </div>
          {/* Live preview strip */}
          <div className="flex-1 h-10 rounded-lg border border-gray-100 shadow-inner" style={{ backgroundColor: value }} />
          <span className="text-xs text-gray-400 font-mono">{value.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}
