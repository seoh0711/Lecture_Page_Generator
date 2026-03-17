'use client'

import { useState } from 'react'

interface Props {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
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

export default function ColorPicker({ value, onChange, disabled }: Props) {
  const [inputVal, setInputVal] = useState(value)

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
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Preset swatches */}
      <div>
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
      <div>
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
