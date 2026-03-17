import type { LectureAnalysis } from './types'
import type { ColorPalette } from './colors'

export function buildAnalyzePrompt(content: string): string {
  return `You are an expert lecture content analyzer. Analyze the following lecture transcript(s) and return a structured JSON analysis.

LECTURE CONTENT:
${content}

Return ONLY a valid JSON object with this exact structure (no explanation, no markdown fences):
{
  "lecture_id": "unique string id based on content",
  "title": "Full lecture title in Korean if possible",
  "instructor": "Instructor name if mentioned, otherwise empty string",
  "duration": "Estimated total duration (e.g. '7 videos / approx. 2-3 hours')",
  "difficulty": "beginner or intermediate or advanced",
  "prerequisites": ["prerequisite 1", "prerequisite 2"],
  "learning_objectives": ["objective 1", "objective 2"],
  "keywords": ["keyword1", "keyword2"],
  "sections": [
    {
      "title": "Section title",
      "content": "2-3 sentence description of this section",
      "keywords": ["keyword"],
      "code_examples": ["short code snippet if present, otherwise empty array"]
    }
  ],
  "summary": "2-3 sentence overall summary of the lecture"
}`
}

export function buildGeneratePrompt(
  analysis: LectureAnalysis,
  palette: ColorPalette
): string {
  return `You are an expert web developer. Create a complete, professional lecture detail page as a single HTML file.

## LECTURE DATA
${JSON.stringify(analysis, null, 2)}

## COLOR PALETTE
- Primary/Accent: ${palette.primary}
- Dark (headers/dark bg): ${palette.dark}
- Mid (card headers): ${palette.mid}
- Light background: ${palette.lightBg}
- Very light background: ${palette.veryLight}

## HTML REQUIREMENTS
- Complete HTML5 document (DOCTYPE, head, body)
- Head must include: charset UTF-8, viewport, meta description, og:title, og:description, Google Fonts (Noto Sans KR)
- ALL styles must be INLINE — no <style> tags, no CSS classes
- Font stack: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif
- Every top-level section div: max-width:800px; margin:0 auto; width:100%; box-sizing:border-box
- Responsive font sizes using clamp()
- Korean text: word-break:keep-all
- body: margin:0; padding:0; background-color:#f0f0f0

## SECTIONS (generate in this exact order)

### 1. HERO (bg: ${palette.veryLight})
- Padding: 60px 20px
- Badge div (bg: ${palette.dark}, text white, border-radius:4px, inline-block): one-line course category label
- H1 (color: ${palette.dark}, clamp(32px,8vw,52px), letter-spacing:-2.5px): 2-line strong title
- Subtitle p (color: ${palette.mid}, clamp(16px,3.5vw,22px)): short hook sentence
- 3 feature cards (flex-wrap, gap:20px), each card:
  - Outer div: bg:${palette.mid}, flex:1 1 220px, flex-direction:column
  - Header div: bg:${palette.dark}, padding:15px 20px, white text "핵심 0N"
  - Body: padding:25px 20px, H3 white, 3 sub-items each with a badge (bg:${palette.dark}, border-radius:20px, color:${palette.veryLight}) and description (white, font-size:12px)
  - Fill card content from first 3 sections of the lecture

### 2. PAIN POINTS (bg: ${palette.primary})
- Padding: clamp(50px,8vw,80px) clamp(20px,5vw,40px)
- H2 white, clamp(28px,7vw,44px): question headline about pain before taking this course
- 4 pain point rows, each: background-image:linear-gradient(to right,${palette.primary} 0%,${palette.mid} 48%,${palette.primary} 100%), padding:26px 33px, white text
- Infer 4 real pain points from prerequisites + difficulty level

### 3. TARGET AUDIENCE (bg: #f5f8fd)
- Padding: clamp(40px,8vw,80px) 20px
- H2 (color:${palette.dark}): "이런 분께 강력 추천합니다"
- 3 audience cards stacked, each:
  - Header: bg:${palette.mid}, padding:18px 20px, white bold text describing target person
  - Body: bg:${palette.veryLight}, padding:22px, centered text with emoji + description
  - Infer from difficulty + learning objectives

### 4. BEFORE/AFTER (bg: ${palette.dark})
- Padding: clamp(40px,8vw,80px) 20px
- H2 white: "이 강의를 듣고 나면"
- 2 side-by-side cards (flex-wrap, gap:20px), each flex:1 1 300px, min-width:260px, bg:${palette.mid}:
  - Header: bg:#000000, padding:15px, bold BEFORE / AFTER text
  - Body: centered emoji (😵 / 🚀), white text with line-height:1.9 listing 4 items each

### 5. LEARNING OBJECTIVES (bg: ${palette.lightBg})
- Padding: clamp(40px,8vw,80px) clamp(20px,5vw,40px)
- H2 (color:${palette.dark}) + subtitle p (color:${palette.primary})
- Numbered list: each item is a div with bg:white, border-left:4px solid ${palette.primary}, flex layout
  - Circle number badge: bg:${palette.primary}, border-radius:50%, white, 26px
  - Text: color:${palette.dark}, clamp(14px,3vw,16px)
- Include ALL learning_objectives from data

### 6. INSTRUCTOR (bg: #050505)
- Padding: clamp(40px,8vw,80px) clamp(20px,5vw,40px)
- H2 (color:${palette.veryLight}): instructor name headline
- 2 cards side by side (flex-wrap, gap:20px), each bg:${palette.dark}, flex:1 1 280px, padding:25px 20px:
  - Title (color:${palette.veryLight}, font-size:20px, border-bottom)
  - Content (color:#EAEAEA, line-height:1.9): career info + course characteristics

### 7. PREREQUISITES (bg: ${palette.mid})
- Padding: clamp(40px,8vw,70px) clamp(20px,5vw,40px)
- H2 white + subtitle
- Grid of checklist items (flex-wrap, gap:15px), each: bg:${palette.dark}, flex:1 1 280px, padding:18px 20px
  - Emoji ✅ or ☑️ + white text
  - Map from prerequisites array

### 8. CURRICULUM (bg: #FAFAFA)
- Padding: clamp(60px,8vw,80px) 40px
- H2 black + subtitle (${palette.dark}) + info line (videos, duration)
- Each section as a card: bg:${palette.lightBg}, border:1px solid ${palette.primary}, border-radius:5px, padding:clamp(20px,4vw,28px) clamp(20px,5vw,36px), gap:10px
  - Title: strong black, clamp(16px,3.5vw,19px)
  - Content: gray #333, clamp(13px,3vw,15px), line-height:1.6
  - If code_examples exist: <pre style="background:#1e1e2e;color:#cdd6f4;font-family:'Consolas','Monaco',monospace;font-size:13px;line-height:1.6;padding:16px 20px;border-radius:6px;overflow-x:auto;margin:8px 0 0;"><code> ... </code></pre>

### 9. KEYWORDS (bg: ${palette.dark})
- Padding: clamp(40px,8vw,60px) clamp(20px,5vw,40px)
- H2 white
- flex-wrap, gap:10px, justify-content:center badges
  - Alternate between bg:${palette.primary} and bg:${palette.mid}
  - border-radius:20px, color:white, padding:8px 18px, font-size:clamp(13px,2.5vw,15px)

### 10. FOOTER (bg: #001528)
- Padding: 30px 40px
- Small centered text (color:#6c7086, font-size:12px): lecture_id, instructor, difficulty, duration

## IMPORTANT
- Generate ONLY the complete HTML. No explanation. No markdown fences.
- Start directly with <!DOCTYPE html>
- Be concise in descriptions to keep the output under 8000 tokens`
}
