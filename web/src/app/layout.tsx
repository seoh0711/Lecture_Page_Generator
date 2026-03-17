import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lecture Page Generator',
  description: '강의 스크립트를 업로드하면 AI가 분석하여 전문적인 강의 상세 페이지를 자동으로 생성합니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  )
}
