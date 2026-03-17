'use client'

import { useCallback, useState, useRef } from 'react'
import { Upload, X, FileText, FileCode } from 'lucide-react'
import type { FileItem, TemplateFile } from '@/lib/types'

interface Props {
  files: FileItem[]
  onChange: (files: FileItem[]) => void
  disabled?: boolean
  templateFile?: TemplateFile | null
  onTemplateChange?: (file: TemplateFile | null) => void
}

export default function FileDropzone({ files, onChange, disabled, templateFile, onTemplateChange }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isTemplateDragging, setIsTemplateDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const templateInputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(
    async (rawFiles: FileList) => {
      const added: FileItem[] = []
      for (const file of Array.from(rawFiles)) {
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const content = await file.text()
          // Avoid duplicates by name
          if (!files.some((f) => f.name === file.name)) {
            added.push({ name: file.name, content, size: file.size })
          }
        }
      }
      if (added.length > 0) onChange([...files, ...added])
    },
    [files, onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (!disabled) processFiles(e.dataTransfer.files)
    },
    [disabled, processFiles]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
      e.target.value = ''
    }
  }

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  const processTemplate = useCallback(
    async (rawFiles: FileList) => {
      if (!onTemplateChange) return
      const file = Array.from(rawFiles).find(
        (f) => f.type === 'text/html' || f.name.endsWith('.html') || f.name.endsWith('.htm')
      )
      if (file) {
        const content = await file.text()
        onTemplateChange({ name: file.name, content, size: file.size })
      }
    },
    [onTemplateChange]
  )

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processTemplate(e.target.files)
      e.target.value = ''
    }
  }

  const handleTemplateDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsTemplateDragging(false)
      if (!disabled) processTemplate(e.dataTransfer.files)
    },
    [disabled, processTemplate]
  )

  const totalSize = files.reduce((acc, f) => acc + f.size, 0)

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="파일 업로드 영역"
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all select-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => { if (!disabled) inputRef.current?.click() }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      >
        <Upload className="mx-auto mb-3 text-gray-400" size={36} />
        <p className="text-gray-700 font-semibold text-base">
          강의 스크립트 파일을 드래그하거나 클릭해서 업로드
        </p>
        <p className="text-gray-400 text-sm mt-1">
          .txt 파일만 지원 · 여러 파일 동시 업로드 가능
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>{files.length}개 파일</span>
            <span>{(totalSize / 1024).toFixed(1)} KB 총합</span>
          </div>
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-4 py-3"
            >
              <FileText size={16} className="text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {!disabled && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded"
                  aria-label={`${file.name} 제거`}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Template upload */}
      {onTemplateChange && (
        <div className="pt-1">
          <p className="text-xs font-medium text-gray-500 mb-2 px-1">
            HTML 템플릿 <span className="text-gray-400 font-normal">(선택 · 업로드 시 템플릿 UI를 참고해 페이지를 생성합니다)</span>
          </p>

          {templateFile ? (
            <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-lg px-4 py-3">
              <FileCode size={16} className="text-purple-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{templateFile.name}</p>
                <p className="text-xs text-gray-400">{(templateFile.size / 1024).toFixed(1)} KB · HTML 템플릿</p>
              </div>
              {!disabled && (
                <button
                  onClick={() => onTemplateChange(null)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded"
                  aria-label="템플릿 제거"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label="HTML 템플릿 업로드"
              className={`border border-dashed rounded-xl px-5 py-4 text-center transition-all select-none
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${
                  isTemplateDragging
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsTemplateDragging(true) }}
              onDragLeave={() => setIsTemplateDragging(false)}
              onDrop={handleTemplateDrop}
              onClick={() => { if (!disabled) templateInputRef.current?.click() }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') templateInputRef.current?.click() }}
            >
              <div className="flex items-center justify-center gap-2">
                <FileCode size={16} className="text-purple-400" />
                <p className="text-gray-500 text-sm">
                  템플릿 .html 파일을 드래그하거나 클릭해서 업로드
                </p>
              </div>
              <input
                ref={templateInputRef}
                type="file"
                accept=".html,.htm,text/html"
                className="hidden"
                onChange={handleTemplateChange}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
