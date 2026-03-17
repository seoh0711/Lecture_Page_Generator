# Lecture Page Generator — Web App

강의 스크립트(.txt) 파일을 업로드하면 Claude AI가 분석하여 전문적인 강의 상세 HTML 페이지를 자동으로 생성하는 웹 앱입니다.

## 기능

- **파일 업로드**: 드래그&드롭 또는 클릭으로 `.txt` 파일 업로드 (여러 파일 동시 지원)
- **메인 컬러 선택**: 10가지 프리셋 + 직접 입력으로 페이지 테마 색상 커스터마이징
- **AI 분석**: Claude가 강의 내용을 분석하여 구조화된 JSON 생성
- **HTML 생성 (스트리밍)**: 실시간 미리보기와 함께 상세 페이지 HTML 생성
- **다운로드/복사**: 완성된 HTML 파일 다운로드 또는 클립보드 복사

## 로컬 개발

```bash
cd web
npm install
cp .env.example .env.local
# .env.local에 ANTHROPIC_API_KEY 입력
npm run dev
```

## Vercel 배포

1. 이 저장소를 GitHub에 push
2. [Vercel](https://vercel.com)에서 New Project → 저장소 연결
3. **Root Directory**를 `web`으로 설정 (vercel.json이 자동 처리)
4. **Environment Variables**에 `ANTHROPIC_API_KEY` 추가
5. Deploy

## 환경 변수

| 변수명 | 설명 |
|--------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 키 ([발급](https://console.anthropic.com/)) |

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude (claude-sonnet-4-6)
- **Icons**: Lucide React
- **Deployment**: Vercel
