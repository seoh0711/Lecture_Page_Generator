import type { LectureAnalysis } from './types'
import type { ColorPalette } from './colors'

/* ================================================================
   EVALUATE PROMPT
   목표: 분석된 마케팅 카피를 5항목으로 평가 — 90점 이상만 생성 허가
   ================================================================ */
export function buildEvaluatePrompt(analysis: LectureAnalysis): string {
  // Format all marketing copy fields as readable text for evaluation
  const lines: string[] = [
    `[강의 제목] ${analysis.title}`,
    ``,
    `[배지 문구] ${analysis.hero?.badge_text ?? ''}`,
    `[헤드라인 1] ${analysis.hero?.title_line1 ?? ''}`,
    `[헤드라인 2] ${analysis.hero?.title_line2 ?? ''}`,
    `[태그라인] ${(analysis.hero?.tagline ?? '').replace(/\\n/g, ' ')}`,
    ``,
    `[핵심 하이라이트]`,
    ...(analysis.key_highlights ?? []).flatMap((h, i) => [
      `  핵심 ${i + 1} 제목: ${h.title}`,
      `  핵심 ${i + 1} 설명: ${h.description}`,
      ...(h.sub_items ?? []).map(s => `    · ${s.label}: ${s.detail}`),
    ]),
    ``,
    `[페인 포인트 부제] ${(analysis.pain_points?.subtitle ?? '').replace(/\\n/g, ' ')}`,
    `[페인 포인트 항목]`,
    ...(analysis.pain_points?.items ?? []).map(item => `  · ${item}`),
    ``,
    `[추천 대상]`,
    ...(analysis.target_audience ?? []).map((t, i) =>
      `  대상 ${i + 1}: ${t.header}\n  → ${t.description}`
    ),
    ``,
    `[수강 전 상태]`,
    ...(analysis.before_after?.before_items ?? []).map(b => `  · ${b}`),
    `[수강 후 변화]`,
    ...(analysis.before_after?.after_items ?? []).map(a => `  · ${a}`),
    ``,
    `[도서 혜택 문구] ${analysis.book_benefit?.title ?? ''}`,
  ]
  const copy = lines.join('\n')

  return `You are a 'Detail Page Optimization Expert' and 'Marketing Copywriting Specialist'.

Your goal is to diagnose product detail pages based on specific failure criteria, assign scores, and propose high-conversion improvements.

You MUST follow the specifications below.

############################################
CORE MISSION
############################################
- Analyze the user-provided product detail page text against the [Evaluation Criteria] defined below.
- Calculate a score for each of the 5 criteria (20 points per criterion, Total 100 points).
- Provide a strict critique explaining *why* specific parts are weak based on the criteria.
- Rewrite the weak sections into "Selling Copy" following the 'Good Examples' logic in the criteria.

############################################
CONTEXT & EVALUATION CRITERIA
############################################
You must evaluate the input strictly based on these 5 standards. If the input violates these, deduct points heavily.

1. **Focus on Benefits, Not Just Specs** (Score: /20)
   - Failure: Listing only numbers and functions (e.g., "1,200W output").
   - Success: Showing the change/benefit in the user's life (e.g., "Blends hard ingredients in 10 seconds").

2. **Target Specific Personas** (Score: /20)
   - Failure: Trying to sell to everyone (e.g., "Good for men and women of all ages").
   - Success: Targeting a specific need/situation (e.g., "For single households lacking cooking time").

3. **Use Simple Language** (Score: /20)
   - Failure: Using excessive jargon (e.g., "High-density polymer applied").
   - Success: Using consumer-friendly language (e.g., "Made strong so it won't break easily").

4. **Be Concrete, Not Abstract** (Score: /20)
   - Failure: Vague adjectives like "good", "comfortable" (e.g., "Soft usage feel").
   - Success: Using specific numbers/evidence (e.g., "Absorbs in 30 seconds with no stickiness").

5. **Stimulate Imagination** (Score: /20)
   - Failure: Generic descriptions (e.g., "Convenient for daily use").
   - Success: Evoking specific usage scenes (e.g., "Save 10 minutes in your busy morning").

############################################
PRODUCT DETAIL PAGE TEXT TO EVALUATE
############################################
${copy}

############################################
OUTPUT FORMAT
############################################
The output must be in Korean and follow this structure EXACTLY:

## 📊 상세페이지 진단 리포트

**총점: [Total Score]/100점**

| 평가 기준 | 점수 (20점 만점) | 상태 |
| :--- | :---: | :---: |
| 1. 고객 이익(Benefit) 중심 | [Score] | [양호/미흡/심각] |
| 2. 타겟 명확성 | [Score] | [양호/미흡/심각] |
| 3. 언어의 직관성 | [Score] | [양호/미흡/심각] |
| 4. 구체적 수치/증거 | [Score] | [양호/미흡/심각] |
| 5. 상상력 자극(Scene) | [Score] | [양호/미흡/심각] |

---

### 💡 항목별 상세 분석 및 개선안

#### [Criteria Name]
- **진단:** [Explain specifically why the original text failed based on the criteria.]
- **기존 문구:** "[Quote the problematic part from input]"
- **❌ 문제점:** [Briefly state the reason for deduction]
- **✅ 개선 제안:** "[Write the improved copy here]"
- **개선 이유:** [Explain how this change aligns with the 'Good Example' logic]

---

### 📝 총평 및 마케팅 조언
[Provide a 1-paragraph summary of the overall impression and one key actionable advice for the user.]

############################################
CONSTRAINTS
############################################
- Be harsh and critical in the diagnosis. Do not sugarcoat failures.
- The "Improved Copy" must be creative, persuasive, and ready to use immediately.
- If the input text is too short to evaluate all 5 criteria, explicitly state which criteria could not be evaluated and mark them as N/A (exclude from total score calculation).`
}

/* ================================================================
   IMPROVE PROMPT
   목표: 평가 리포트의 개선 제안을 반영해 마케팅 카피 필드를 재작성
   ================================================================ */
export function buildImprovePrompt(analysis: LectureAnalysis, evalReport: string): string {
  const currentCopy = JSON.stringify({
    hero: analysis.hero,
    key_highlights: analysis.key_highlights,
    pain_points: analysis.pain_points,
    target_audience: analysis.target_audience,
    before_after: analysis.before_after,
    book_benefit: analysis.book_benefit,
  }, null, 2)

  return `You are an expert Korean marketing copywriter specializing in lecture detail pages.

The following marketing copy was evaluated and scored below 90/100.
Your task: rewrite EVERY copy field to fix ALL identified issues and score 90+ when re-evaluated.

## EVALUATION REPORT — implement every "✅ 개선 제안" line
${evalReport}

## CURRENT MARKETING COPY (fields to rewrite)
${currentCopy}

## REWRITE RULES
1. Apply EVERY "✅ 개선 제안" from the report verbatim or use it as a direct template.
2. Fix every "❌ 문제점": replace vague adjectives with concrete numbers, replace spec lists with benefit outcomes.
3. Each target_audience description must name a specific role+situation+pain point (e.g., "매일 수작업으로 데이터 정리에 2시간을 낭비하는 마케터").
4. before_after items must paint vivid before/after scenes, not abstract states.
5. pain_points subtitle must resonate emotionally with the target reader.
6. hero tagline must trigger a "that's exactly me!" reaction.
7. Keep all text in Korean. Preserve exact array lengths.

Return ONLY a valid JSON object — no explanation, no markdown fences:
{
  "hero": {
    "badge_text": "...",
    "title_line1": "...",
    "title_line2": "...",
    "tagline": "...",
    "image_url": "${analysis.hero?.image_url ?? ''}"
  },
  "key_highlights": [
    {
      "title": "...",
      "description": "...",
      "sub_items": [{ "label": "...", "detail": "..." }]
    }
  ],
  "pain_points": { "subtitle": "...", "items": ["..."] },
  "target_audience": [{ "header": "...", "description": "..." }],
  "before_after": { "before_items": ["..."], "after_items": ["..."] },
  "book_benefit": { "title": "...", "image_url": "${analysis.book_benefit?.image_url ?? ''}" }
}`
}

/* ================================================================
   REVIEW PROMPT
   목표: 생성된 HTML 상세 페이지를 마케팅 카피라이팅 5항목으로 평가
   ================================================================ */
export function buildReviewPrompt(html: string, title: string): string {
  return `You are an expert Korean marketing copywriter and landing page optimizer.
Evaluate the following lecture detail page HTML using the "5 Anti-Patterns of Failing Detail Pages" framework.

LECTURE TITLE: ${title}

PAGE HTML:
${html.slice(0, 12000)}${html.length > 12000 ? '\n...(truncated)' : ''}

---

Evaluate the page on these 5 criteria (20 points each, total 100 points).
Extract ACTUAL text from the HTML to use as "기존 문구" — do NOT make up example text.

## SCORING CRITERIA

### 1. 고객 이익(Benefit) 중심 — 20점
Is the copy centered on outcomes/transformations for the learner, NOT just feature/spec listings?
- 18~20 (우수): All key copy describes results and changes; feature names are secondary
- 14~17 (양호): Some benefit copy exists but spec listing is mixed in
- 8~13 (미흡): Mostly feature/tech name listing; no "after taking this" change described
- 0~7 (심각): Pure spec list; zero reader benefit perspective

### 2. 타겟 명확성 — 20점
Does the page speak to ONE specific person's situation, not everyone?
- 18~20: Target defined by role + situation + pain point; 1st-person message
- 14~17: Target segments named but messages are diluted trying to cover all
- 8~13: Beginner + expert targeted simultaneously; generic "anyone" messaging
- 0~7: No target definition; "come one, come all" level

### 3. 언어의 직관성 — 20점
Can the target reader understand everything on first read without background knowledge?
- 18~20: Tech terms always followed by plain-language explanation; analogies used
- 14~17: Mostly plain language; a few unexplained technical terms
- 8~13: Multiple jargon terms (API, RAG, MCP, Node, etc.) used without explanation
- 0~7: Developer-documentation level language throughout

### 4. 구체적 수치/증거 — 20점
Are abstract claims replaced with specific numbers and evidence?
- 18~20: Chapter count, time investment, deliverable size all specified with numbers
- 14~17: Some numbers present; key promises still use vague language
- 8~13: "향상됩니다", "전문가 수준" etc. — most claims are adjective-only
- 0~7: Zero numbers; every outcome described in abstract adjectives

### 5. 상상력 자극(Scene) — 20점
Does the page paint a vivid picture of "me using this after the course"?
- 18~20: 2+ specific scenes with time/place/emotion details
- 14~17: Scene descriptions exist but lack sensory/emotional detail
- 8~13: Dry verbs only ("삽입합니다", "배포합니다"); no scene painted
- 0~7: Pure fact delivery; zero imagination-triggering content

---

OUTPUT FORMAT (output in Korean, follow this EXACT structure — no deviations):

안녕하세요! 상세페이지 최적화 및 마케팅 카피라이팅 전문가로서, 전달해주신 '${title}' 랜딩페이지를 꼼꼼하게 진단해 드립니다.

[One sentence describing the page's biggest strength and its gap]. 폭망하는 상세페이지의 5가지 특징을 역설계한 기준에 따라, 냉정하고 객관적으로 평가하고 즉시 활용 가능한 개선안을 제안해 드리겠습니다.

---

## 📊 상세페이지 진단 리포트

**총점: [SUM]/100점**

| 평가 기준 | 점수 (20점 만점) | 상태 |
| :--- | :---: | :---: |
| 1. 고객 이익(Benefit) 중심 | [N] | [우수/양호/미흡/심각] |
| 2. 타겟 명확성 | [N] | [우수/양호/미흡/심각] |
| 3. 언어의 직관성 | [N] | [우수/양호/미흡/심각] |
| 4. 구체적 수치/증거 | [N] | [우수/양호/미흡/심각] |
| 5. 상상력 자극(Scene) | [N] | [우수/양호/미흡/심각] |

---

### 💡 항목별 상세 분석 및 개선안

#### 1. 고객 이익(Benefit) 중심
- **진단:** [Specific diagnosis citing what was found in the page]
- **기존 문구:** "[ACTUAL text extracted from the HTML]"
- **❌ 문제점:** [Why this copy fails from a benefit perspective]
- **✅ 개선 제안:** "[Ready-to-use replacement copy in Korean]"
- **개선 이유:** [Why the improved version works better, with principle reference]

#### 2. 타겟 명확성
- **진단:** [...]
- **기존 문구:** "[ACTUAL text from HTML]"
- **❌ 문제점:** [...]
- **✅ 개선 제안:** "[...]"
- **개선 이유:** [...]

#### 3. 언어의 직관성
- **진단:** [...]
- **기존 문구:** "[ACTUAL text from HTML]"
- **❌ 문제점:** [...]
- **✅ 개선 제안:** "[...]"
- **개선 이유:** [...]

#### 4. 구체적 수치/증거
- **진단:** [...]
- **기존 문구:** "[ACTUAL text from HTML]"
- **❌ 문제점:** [...]
- **✅ 개선 제안:** "[...]"
- **개선 이유:** [...]

#### 5. 상상력 자극(Scene)
- **진단:** [...]
- **기존 문구:** "[ACTUAL text from HTML]"
- **❌ 문제점:** [...]
- **✅ 개선 제안:** "[...]"
- **개선 이유:** [...]

---

### 📝 총평 및 마케팅 조언
[2~3 sentences: strengths, core weaknesses, why the score is what it is]
**단 하나의 조언을 드리자면, [The single most impactful improvement — specific and actionable]**

---
Rules:
- Output in Korean only
- Use ACTUAL quotes from the HTML for 기존 문구 — never fabricate examples
- 개선 제안 must be copy-paste ready (complete sentences)
- Score strictly: 70s = average, 90+ = extremely rare
- Status labels: 18~20=우수, 14~17=양호, 8~13=미흡, 0~7=심각`
}

/* ================================================================
   ANALYZE PROMPT
   목표: txt 파일에서 Untitled-1.html 7개 섹션에 필요한 모든 필드 추출
   ================================================================ */
export function buildAnalyzePrompt(content: string): string {
  return `You are an expert Korean lecture content analyzer and marketing copywriter.
Analyze the following lecture content and return a single JSON object.

The JSON will be used to generate a lecture detail page with these 7 sections:
1. Hero (badge, 2-line title, tagline, highlight cards)
2. Book benefit announcement
3. Pain points (problems before taking the course)
4. Recommended audience (3 target personas)
5. Before / After transformation
6. Instructor profile
7. Curriculum chapter list

LECTURE CONTENT:
${content}

Return ONLY a valid JSON object with the exact structure below. No explanation, no markdown fences.
For fields that cannot be found in the content, infer them from context (difficulty, tone, topic area).
All text values must be in Korean unless the original content is in English.

{
  "lecture_id": "slug-style-id-based-on-title",
  "title": "강의 전체 제목",
  "difficulty": "beginner or intermediate or advanced",
  "prerequisites": ["선수 지식 1", "선수 지식 2"],
  "learning_objectives": ["학습 목표 1", "학습 목표 2"],
  "keywords": ["핵심 키워드 (최대 15개)"],

  "hero": {
    "badge_text": "강의 특징을 한 줄로 요약한 배지 문구 (예: '이론부터 실습까지, 비전공자를 위한 가장 친절한 가이드')",
    "title_line1": "임팩트 있는 짧은 제목 첫 번째 줄 (예: '비전공자도 OK!')",
    "title_line2": "강의 핵심 가치 두 번째 줄 (예: '개념부터 실습까지 AI 완전 정복')",
    "tagline": "타깃 수강생의 불안·고민을 건드리는 1~2문장 (예: '내 주위에는 다 AI를 쓰는데,\\n나만 모르는 것 같아 불안하신가요?')",
    "image_url": ""
  },

  "key_highlights": [
    {
      "title": "핵심 학습 영역 제목 (예: 'AI 필수 상식')",
      "description": "이 카드의 한 줄 부제 (예: '인공지능의 개념부터 학습 원리까지 아주 쉽게 풀어드립니다.')",
      "sub_items": [
        { "label": "세부 토픽 짧은 태그명", "detail": "세부 토픽을 한 문장으로 설명" },
        { "label": "세부 토픽 2", "detail": "설명" },
        { "label": "세부 토픽 3", "detail": "설명" }
      ]
    },
    {
      "title": "두 번째 핵심 학습 영역 제목",
      "description": "부제",
      "sub_items": [
        { "label": "", "detail": "" },
        { "label": "", "detail": "" },
        { "label": "", "detail": "" }
      ]
    }
  ],

  "book_benefit": {
    "title": "강의+도서 혜택 안내 문구 (없으면 강의만의 혜택 문구로 대체)",
    "image_url": ""
  },

  "pain_points": {
    "subtitle": "타깃의 현재 고충을 공감하는 2문장 (줄바꿈은 \\n 으로 표현)",
    "items": [
      "고충 1 (수강 전 어려움을 구체적으로 서술)",
      "고충 2",
      "고충 3"
    ]
  },

  "target_audience": [
    {
      "header": "추천 대상 설명 (예: '모델 성능을 한 단계 업그레이드하고 싶은 엔지니어')",
      "description": "👉 [강의 특정 섹션 또는 혜택] 이 대상에게 주는 구체적인 가치를 서술"
    },
    { "header": "", "description": "" },
    { "header": "", "description": "" }
  ],

  "before_after": {
    "before_items": [
      "수강 전 부정적 상태 1줄 (짧고 임팩트 있게)",
      "상태 2",
      "상태 3"
    ],
    "after_items": [
      "수강 후 긍정적 변화 1줄",
      "변화 2",
      "변화 3"
    ]
  },

  "instructor": {
    "name": "강사 이름 (없으면 빈 문자열)",
    "title": "소속 또는 직함 (예: '마이크로소프트 현직 전문가')",
    "subtitle": "강사를 표현하는 한 줄 슬로건 (예: 'AI의 미래를 설계하다')",
    "photo_url": "",
    "career": ["경력 1", "경력 2", "경력 3"],
    "publications": ["저서명 (출판사, 연도)", "저서 2"]
  },

  "curriculum": {
    "total_duration": "총 학습 시간 (예: '총 8시간 9분')",
    "total_chapters": 0,
    "format": "온라인 VOD",
    "chapters": [
      { "chapter": "1장. 챕터 제목", "description": "이 챕터에서 배우는 내용 한 줄 요약" }
    ]
  },

  "summary": "강의 전체를 2~3문장으로 요약"
}`
}

/* ================================================================
   GENERATE PROMPT
   목표: Untitled-1.html 과 동일한 7개 섹션 구조의 HTML 생성
   ================================================================ */
export function buildGeneratePrompt(
  analysis: LectureAnalysis,
  palette: ColorPalette
): string {
  const data = JSON.stringify(analysis, null, 2)
  const { veryLight, lightBg, primary, mid, dark } = palette

  return `You are an expert web developer. Generate a complete lecture detail page as a single HTML document.

## LECTURE DATA
${data}

## COLOR PALETTE
- veryLight: ${veryLight}   → hero bg, audience card body bg
- lightBg:   ${lightBg}    → book benefit bg, curriculum card bg
- primary:   ${primary}    → pain points section bg, curriculum card border
- mid:       ${mid}        → highlight card bg, card headers, gradient center
- dark:      ${dark}       → badge bg, title color, instructor card bg, before/after bg

## OUTPUT FORMAT
- Complete HTML5 document. Start with <!DOCTYPE html>. No markdown fences. No explanation.
- <head>: charset UTF-8, viewport, title=[analysis.title], Google Fonts Noto Sans KR (weights 400;500;700)
- <body style="margin:0;padding:0;background-color:#f0f0f0;">
- ALL styles must be INLINE (no <style> tags, no CSS classes)
- Font stack everywhere: 'Noto Sans KR','Malgun Gothic','맑은 고딕',sans-serif
- Every section's outermost div: max-width:800px;margin:0 auto;box-sizing:border-box
- Korean text: word-break:keep-all
- Responsive font sizes with clamp()

---

## SECTION 1 — HERO  (background-color: ${veryLight})

Outer div styles: align-items:center;background-color:${veryLight};display:flex;flex-direction:column;gap:15px;margin:0 auto;max-width:800px;padding:60px 20px;width:100%;box-sizing:border-box

1-A. Badge (display:flex;justify-content:center):
  Inner box: background-color:${dark};border-radius:4px;display:inline-block;padding:0 24px
  Text: <strong style="color:#ffffff;font-size:14px;font-weight:500;line-height:1.5;word-break:keep-all;">[analysis.hero.badge_text]</strong>

1-B. Title (box-sizing:border-box;margin-bottom:30px;padding:0 20px;text-align:center;width:100%):
  <h1 style="color:#FFFFFF;font-weight:500;letter-spacing:-2.5px;line-height:1.3;margin:0;word-break:keep-all;">
    <strong style="color:${dark};font-size:clamp(32px,8vw,52px);">[analysis.hero.title_line1]</strong><br>
    <strong style="color:${dark};font-size:clamp(32px,8vw,52px);">[analysis.hero.title_line2]</strong>
  </h1>

1-C. Hero image (ONLY if analysis.hero.image_url is not empty string):
  <figure style="height:auto;margin:0;width:100%;">
    <img style="display:block;object-fit:contain;width:100%;" src="[analysis.hero.image_url]" alt="강의 대표 이미지">
  </figure>

1-D. Tagline (margin-bottom:50px;text-align:center):
  <p style="color:${mid};font-size:clamp(18px,4vw,28px);font-weight:500;letter-spacing:-0.84px;line-height:1.5;margin:0;word-break:keep-all;">
    [analysis.hero.tagline — split at natural sentence boundary using <br>]
  </p>

1-E. Key highlight cards (display:flex;flex-wrap:wrap;gap:20px;justify-content:center):
  For each item in analysis.key_highlights (label header "핵심 01", "핵심 02", …):
  <div style="background-color:${mid};display:flex;flex-direction:column;flex:1 1 300px;overflow:hidden;">
    <div style="background-color:${dark};padding:15px 20px;text-align:center;">
      <strong style="color:#ffffff;font-size:16px;font-weight:500;">핵심 0[N]</strong>
    </div>
    <div style="flex-grow:1;padding:25px 20px;">
      <div style="margin-bottom:20px;text-align:center;">
        <h3 style="color:#ffffff;font-size:24px;line-height:0.4;margin:0 0 10px;"><strong>[highlight.title]</strong><br>&nbsp;</h3>
        <p style="color:#dad6d6;font-weight:400;line-height:1.3;margin:0;text-align:left;">[highlight.description]</p>
      </div>
      [For each sub_item in highlight.sub_items:]
      <div style="margin-bottom:20px;">
        <div style="background-color:${dark};border-radius:20px;color:${veryLight};display:inline-block;font-size:16px;font-weight:500;margin-bottom:8px;padding:0 15px;width:100%;">[sub_item.label]</div>
        <p style="color:#ffffff;font-size:12px;font-weight:400;line-height:1.4;margin:0;padding-left:5px;">[sub_item.detail]</p>
      </div>
    </div>
  </div>

---

## SECTION 2 — BOOK BENEFIT  (background-color: ${lightBg})

Outer: background-color:${lightBg};box-sizing:border-box;margin:0 auto;max-width:800px;padding:clamp(40px,8vw,80px) clamp(20px,5vw,40px);width:100%

2-A. Title (text-align:center):
  <h1 style="color:#000000;font-size:clamp(32px,8vw,48px);letter-spacing:-2px;line-height:1.3;margin:0;word-break:keep-all;">
    [analysis.book_benefit.title — use <strong> for emphasis parts]
  </h1>

2-B. Image (ONLY if analysis.book_benefit.image_url is not empty):
  <div style="display:flex;justify-content:center;width:100%;">
    <figure style="margin:0;max-width:500px;padding:0;width:100%;">
      <img src="[analysis.book_benefit.image_url]" alt="강의 도서 혜택" style="display:block;height:auto;object-fit:contain;width:100%;">
    </figure>
  </div>

---

## SECTION 3 — PAIN POINTS  (background-color: ${primary})

Outer: background-color:${primary};box-sizing:border-box;margin:0 auto;max-width:800px;padding:clamp(50px,8vw,80px) clamp(20px,5vw,40px);width:100%
Inner layout: align-items:center;display:flex;flex-direction:column;width:100%

3-A. Section heading (margin-bottom:40px;text-align:center):
  <h2 style="color:#ffffff;font-size:clamp(32px,7vw,48px);letter-spacing:-2px;line-height:1.3;margin:0;word-break:keep-all;">
    <strong>이 강의가 없었을 때<br>당신이 겪는 어려움</strong>
  </h2>

3-B. Subtitle (margin-bottom:clamp(30px,6vw,50px);text-align:center):
  <p style="color:${dark};font-size:clamp(18px,4vw,26px);letter-spacing:-0.84px;line-height:1.5;margin:0;word-break:keep-all;">
    <strong>[analysis.pain_points.subtitle — split with <br>]</strong>
  </p>

3-C. Pain point rows (display:flex;flex-direction:column;gap:17px;margin:0 auto;max-width:600px;width:100%):
  For each item in analysis.pain_points.items:
  <div style="align-items:center;background-image:linear-gradient(to right,${primary} 0%,${mid} 48%,${primary} 100%);box-sizing:border-box;display:flex;justify-content:center;padding:26px 33px;width:100%;">
    <p style="color:#ffffff;font-size:clamp(16px,3.5vw,20px);font-weight:500;line-height:1.3;margin:0;text-align:left;word-break:keep-all;">[item]</p>
  </div>

---

## SECTION 4 — TARGET AUDIENCE  (background-color: ${lightBg})

Outer: background-color:${lightBg};box-sizing:border-box;margin:0 auto;max-width:800px;padding:clamp(40px,8vw,80px) 20px;width:100%

4-A. Heading (align-items:center;display:flex;flex-direction:column;margin-bottom:clamp(30px,6vw,50px)):
  <h2 style="color:${dark};font-size:clamp(32px,7vw,48px);letter-spacing:-2px;line-height:1.3;margin:0;text-align:center;word-break:keep-all;">
    <strong>이런 분께 강력 추천합니다</strong>
  </h2>

4-B. Audience cards (align-items:center;display:flex;flex-direction:column;gap:20px;margin:0 auto;max-width:600px;width:100%):
  For each item in analysis.target_audience:
  <div style="background-color:${veryLight};border-radius:0;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;width:100%;">
    <div style="align-items:center;background-color:${mid};box-sizing:border-box;display:flex;justify-content:center;padding:18px 20px;width:100%;">
      <strong style="color:#ffffff;display:block;font-size:clamp(16px,3.5vw,20px);line-height:1.3;text-align:center;">[item.header]</strong>
    </div>
    <div style="align-items:center;box-sizing:border-box;display:flex;justify-content:center;margin:0 auto;min-height:100px;padding:25px 20px;width:80%;">
      <p style="color:${dark};font-size:clamp(16px,3.5vw,20px);line-height:1.4;margin:0;text-align:center;word-break:keep-all;">
        <strong style="display:block;margin-bottom:10px;">[item.description]</strong>
      </p>
    </div>
  </div>

---

## SECTION 5 — BEFORE / AFTER  (background-color: ${dark})

Outer: background-color:${dark};box-sizing:border-box;margin:0 auto;max-width:800px;padding:clamp(40px,8vw,80px) 20px;width:100%
Inner layout: align-items:center;display:flex;flex-direction:column;width:100%

5-A. Heading (margin-bottom:40px;text-align:center):
  <h2 style="color:#ffffff;font-size:clamp(32px,7vw,48px);letter-spacing:-2px;line-height:1.3;margin:0;word-break:keep-all;">
    <strong>이 강의를 듣고 나면</strong>
  </h2>

5-B. Cards (display:flex;flex-wrap:wrap;gap:20px;justify-content:center;width:100%):
  BEFORE card:
  <div style="background-color:${mid};box-sizing:border-box;display:flex;flex-direction:column;flex:1 1 300px;max-width:350px;min-width:280px;position:relative;">
    <div style="background-color:#000000;box-sizing:border-box;display:flex;justify-content:space-around;padding:15px 20px;width:100%;">
      <strong style="color:#ffffff;font-size:16px;line-height:1.4;">BEFORE</strong>
    </div>
    <div style="padding:0 20px 30px;text-align:center;">
      <p style="color:#ffffff;font-size:18px;font-weight:500;line-height:1.8;margin:0;word-break:keep-all;">
        [analysis.before_after.before_items joined with <br>]
      </p>
    </div>
  </div>

  AFTER card (same structure, "AFTER", analysis.before_after.after_items):
  <div style="background-color:${mid};box-sizing:border-box;display:flex;flex-direction:column;flex:1 1 300px;max-width:350px;min-width:280px;position:relative;">
    <div style="background-color:#000000;box-sizing:border-box;display:flex;justify-content:space-around;padding:15px 20px;width:100%;">
      <strong style="color:#ffffff;font-size:16px;line-height:1.4;">AFTER</strong>
    </div>
    <div style="padding:0 20px 30px;text-align:center;">
      <p style="color:#ffffff;font-size:18px;font-weight:500;line-height:1.8;margin:0;word-break:keep-all;">
        [analysis.before_after.after_items joined with <br>]
      </p>
    </div>
  </div>

---

## SECTION 6 — INSTRUCTOR  (background-color: #050505)

Outer: background-color:#050505;box-sizing:border-box;margin:0 auto;max-width:800px;padding:clamp(40px,8vw,81px) clamp(20px,5vw,41px);width:100%
Inner layout: align-items:center;display:flex;flex-direction:column;gap:clamp(30px,5vw,48px);margin:0 auto;max-width:720px;width:100%

6-A. Name & title block (align-items:center;display:flex;flex-direction:column;gap:16px;text-align:center;width:100%):
  Title line:
  <h2 style="color:${mid};font-size:clamp(32px,6vw,48px);letter-spacing:-2px;line-height:1.3;margin:0;word-break:keep-all;">
    <strong>[analysis.instructor.title],</strong>
  </h2>
  Name highlight + subtitle (display:flex;flex-wrap:wrap;gap:10px;justify-content:center):
  <h2 style="background-color:${mid};color:#ffffff;font-size:clamp(32px,6vw,48px);letter-spacing:-2px;line-height:1.3;padding:10px 15px;">
    <strong>[analysis.instructor.name]</strong>
  </h2>
  <h2 style="color:${dark};font-size:clamp(32px,6vw,39px);letter-spacing:-2px;line-height:1.3;margin:0;word-break:keep-all;">
    <strong>[analysis.instructor.subtitle]</strong>
  </h2>

6-B. Photo (ONLY if analysis.instructor.photo_url is not empty; display:flex;justify-content:center;width:100%):
  <figure style="margin:0;max-width:428px;padding:0;width:100%;">
    <img style="border-radius:5px;display:block;object-fit:cover;width:100%;" src="[analysis.instructor.photo_url]" alt="강사 프로필">
  </figure>

6-C. Info cards (display:flex;flex-wrap:wrap;gap:20px;width:100%):
  Career card:
  <div style="background-color:${dark};box-sizing:border-box;display:flex;flex-direction:column;flex:1 1 300px;gap:20px;min-width:280px;padding:25px 20px;">
    <div style="color:${lightBg};font-size:24px;line-height:1.2;text-align:center;"><strong>경력</strong></div>
    <div style="border-top:1px solid ${lightBg};padding-top:15px;width:100%;">
      <div style="color:#EAEAEA;font-weight:400;line-height:1.8;text-align:left;word-break:keep-all;">
        [analysis.instructor.career joined with <br>]
      </div>
    </div>
  </div>
  Publications card (same structure, "저서", analysis.instructor.publications joined with <br>):
  <div style="background-color:${dark};box-sizing:border-box;display:flex;flex-direction:column;flex:1 1 300px;gap:20px;min-width:280px;padding:25px 20px;">
    <div style="color:${lightBg};font-size:24px;line-height:1.2;text-align:center;"><strong>저서</strong></div>
    <div style="border-top:1px solid ${lightBg};padding-top:15px;width:100%;">
      <div style="color:#EAEAEA;font-weight:400;line-height:1.8;text-align:left;word-break:keep-all;">
        [analysis.instructor.publications joined with <br>]
      </div>
    </div>
  </div>

---

## SECTION 7 — CURRICULUM  (background-color: #FAFAFA)

Outer: background-color:#FAFAFA;box-sizing:border-box;margin:0 auto;max-width:800px;padding:clamp(60px,8vw,80px) 40px;width:100%
Inner layout: align-items:center;display:flex;flex-direction:column;gap:40px;width:100%

7-A. Header block (align-items:center;display:flex;flex-direction:column;gap:10px;text-align:center;width:100%):
  <h2 style="color:#000000;font-size:clamp(36px,8vw,48px);letter-spacing:-2px;line-height:1.3;margin:0;word-break:keep-all;">
    <strong>커리큘럼</strong>
  </h2>
  <div style="color:${dark};font-size:clamp(20px,5vw,26px);letter-spacing:-0.84px;line-height:1.5;word-break:keep-all;">
    <strong>체계적인 학습 로드맵</strong>
  </div>
  <div style="color:${dark};font-size:clamp(16px,4vw,20px);letter-spacing:-0.84px;line-height:1.5;word-break:keep-all;">
    <strong>[analysis.curriculum.total_duration] | [analysis.curriculum.total_chapters]개 차시 | [analysis.curriculum.format]</strong>
  </div>

7-B. Chapter cards (display:flex;flex-direction:column;gap:15px;max-width:762px;width:100%):
  For each chapter in analysis.curriculum.chapters:
  <div style="background-color:${lightBg};border-radius:5px;border:1px solid ${primary};box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:clamp(20px,4vw,30px) clamp(20px,5vw,40px);">
    <div style="color:#000000;font-size:clamp(18px,4vw,20px);line-height:1.3;word-break:keep-all;">
      <strong>[chapter.chapter]</strong>
    </div>
    <div style="color:#000000;font-size:clamp(14px,3.5vw,15px);font-weight:400;line-height:1.5;word-break:keep-all;">
      [chapter.description]
    </div>
  </div>

---

## RULES
- Output ONLY the complete HTML document. No explanation. No markdown fences. Start with <!DOCTYPE html>.
- Omit any <figure>/<img> element when the corresponding image_url is an empty string.
- Use ONLY palette colors and the fixed colors listed above (#050505, #FAFAFA, #000000, #ffffff, #dad6d6, #EAEAEA).
- All text content must come from the analysis data — do NOT invent or paraphrase content.
- Include ALL chapters from analysis.curriculum.chapters.`
}


/* ================================================================
   TEMPLATE ANALYZE PROMPT
   목표: 섹션별 콘텐츠 슬롯 매핑 — "어디에 무엇을 채울지" 가이드 추출
   ================================================================ */
export function buildTemplateAnalyzePrompt(html: string): string {
  return `You are an expert web developer. Analyze the following HTML template and produce a CONTENT MAPPING GUIDE.

This guide will be used to fill the template with new lecture data. Focus entirely on WHAT CONTENT goes WHERE — not on describing the design.

## HTML TEMPLATE
${html}

## TASK
For every section in the template (in order), identify:
1. What the section is for (purpose)
2. Which lecture data fields should populate it
3. How many repeated items/cards/rows the section has (count exactly from the template)
4. Any special text patterns (e.g. log prefixes like [ERROR], numbered labels like "01", badges, etc.)

## OUTPUT FORMAT

=== CONTENT MAPPING GUIDE ===

[Section N: <section name>]
Purpose: <what this section communicates>
HTML anchor: <CSS class or element that identifies this section, e.g. "header.hero" or "section.pain-points-section">
Content source: <which analysis field(s) to use, e.g. "analysis.hero.tagline", "analysis.pain_points.items">
Item count: <exact number of repeated cards/rows/items currently in the template>
Text pattern: <any special labels, prefixes, or numbering to preserve, e.g. "[ERROR]", "POINT 01", card-number "01">
Notes: <anything special about how content maps, e.g. "h1 uses analysis.hero.title_line1 + title_line2 on separate lines">

Repeat for ALL sections.

At the end, add:

[PRIMARY COLOR VARIABLE]
Name: <the CSS variable name for the main action/accent color, e.g. "--primary">
Glow variable: <the CSS variable name for the glow/shadow of primary, e.g. "--primary-glow">
Current value: <current hex value>`
}

/* ================================================================
   GENERATE WITH TEMPLATE PROMPT
   목표: 템플릿 HTML을 그대로 복사하고 콘텐츠 + primary 색상만 교체
   ================================================================ */
export function buildGenerateWithTemplatePrompt(
  analysis: LectureAnalysis,
  palette: ColorPalette,
  contentMapping: string,
  fullTemplateHtml: string,
  keepTemplateColor = false,
): string {
  const data = JSON.stringify(analysis, null, 2)
  const { primary } = palette

  // Derive RGBA version of primary for glow variables
  const r = parseInt(primary.slice(1, 3), 16)
  const g = parseInt(primary.slice(3, 5), 16)
  const b = parseInt(primary.slice(5, 7), 16)
  const primaryRgba = `rgba(${r}, ${g}, ${b}, 0.4)`
  const primaryRgbaLight = `rgba(${r}, ${g}, ${b}, 0.15)`
  const primaryRgbaBorder = `rgba(${r}, ${g}, ${b}, 0.3)`

  const styleBlockRules = keepTemplateColor
    ? `### STYLE BLOCK RULES
- Copy the template <style> block VERBATIM into the output — do NOT change any color values at all.
- DO NOT add new CSS rules
- DO NOT remove any CSS rules
- DO NOT rename any CSS class`
    : `### STYLE BLOCK RULES
- Copy the template <style> block VERBATIM into the output
- Make ONLY these changes inside the style block:
  a. Replace the primary accent color CSS variable value with: ${primary}
  b. Replace any primary glow/shadow CSS variable value with: ${primaryRgba}
  c. Replace rgba(primary, 0.15) low-opacity variants with: ${primaryRgbaLight}
  d. Replace rgba(primary, 0.3) border variants with: ${primaryRgbaBorder}
- DO NOT change any other color values (backgrounds, text colors, borders stay original)
- DO NOT add new CSS rules
- DO NOT remove any CSS rules
- DO NOT rename any CSS class`

  return `You are an expert web developer performing a FILL-IN-THE-BLANKS task.

You will produce a lecture detail page by:
1. Copying the template HTML structure EXACTLY
2. ${keepTemplateColor ? 'Keeping ALL colors exactly as in the template (no color changes)' : 'Replacing ONLY the primary accent color in the CSS variables'}
3. Replacing ALL text content with the provided lecture data

## STRICT RULES — read carefully before starting

${styleBlockRules}

### HTML STRUCTURE RULES
- Reproduce EVERY section from the template — do not skip, merge, or add sections
- For each section, keep the EXACT HTML element structure and nesting
- Keep all CSS class names exactly as in the template
- Keep all pseudo-element patterns (::before, ::after) as they are in CSS
- Keep all interactive patterns (details/summary, hover classes, etc.)
- Keep all decorative elements (dots, timeline nodes, image placeholders, etc.)

### CONTENT REPLACEMENT RULES
- Replace text content using the CONTENT MAPPING GUIDE below
- Keep all HTML tags, class attributes, and structure — only the inner text changes
- If a section has N repeated items (cards, rows, list entries), generate exactly N items
  - If the lecture data has more items, take the first N
  - If the lecture data has fewer items, repeat/expand to fill N
- For template-specific sections (Projects, Core Points, FAQ, etc.): first check analysis.extra_content for the matching snake_case key. If found, use that data. If not found, infer from analysis.key_highlights or analysis.learning_objectives
- For FAQ sections: use analysis.extra_content.faq if present, otherwise generate 4 relevant Q&A pairs from the lecture content
- For image placeholders: keep the placeholder element, replace inner text with a relevant description
- Update <title> tag to analysis.title
- Keep the Google Fonts <link> tags from the template
- All text must be in Korean (translate if needed)
- word-break: keep-all on all Korean text elements

## CONTENT MAPPING GUIDE
${contentMapping}

## LECTURE DATA
${data}

## TEMPLATE HTML (copy this structure exactly)
${fullTemplateHtml}

## OUTPUT
Output ONLY the complete HTML document. Start with <!DOCTYPE html>. No markdown fences. No explanation.`
}

/* ================================================================
   ANALYZE WITH TEMPLATE PROMPT
   목표: 템플릿이 요구하는 섹션에 맞춰 TXT에서 콘텐츠 추출
   표준 LectureAnalysis 필드 + extra_content(템플릿 전용 섹션) 반환
   ================================================================ */
export function buildAnalyzeWithTemplatePrompt(
  content: string,
  templateContentMapping: string,
): string {
  return `You are an expert Korean lecture content analyzer and marketing copywriter.
Analyze the following lecture content and return a single JSON object.

The output will be used to fill an HTML template page. The template's section requirements are described in the TEMPLATE CONTENT MAPPING below.

LECTURE CONTENT:
${content}

TEMPLATE CONTENT MAPPING:
${templateContentMapping}

## EXTRACTION RULES
1. Extract ALL standard fields (required for quality evaluation loop).
2. For each section listed in the TEMPLATE CONTENT MAPPING that does NOT map to a standard field,
   extract the relevant content and store it in "extra_content" under a snake_case key.
3. Infer any fields not explicitly found in the content from context (topic, difficulty, tone).
4. All text values must be in Korean unless the original content is in English.

Return ONLY a valid JSON object with this structure. No explanation, no markdown fences.

{
  "lecture_id": "slug-style-id-based-on-title",
  "title": "강의 전체 제목",
  "difficulty": "beginner or intermediate or advanced",
  "prerequisites": ["선수 지식 1", "선수 지식 2"],
  "learning_objectives": ["학습 목표 1", "학습 목표 2"],
  "keywords": ["핵심 키워드 (최대 15개)"],

  "hero": {
    "badge_text": "강의 특징을 한 줄로 요약한 배지/태그 문구",
    "title_line1": "임팩트 있는 짧은 제목 첫 번째 줄",
    "title_line2": "강의 핵심 가치 두 번째 줄",
    "tagline": "타깃 수강생의 불안·고민을 건드리는 1~2문장 (줄바꿈은 \n)",
    "image_url": ""
  },

  "key_highlights": [
    {
      "title": "핵심 학습 영역 제목",
      "description": "한 줄 부제",
      "sub_items": [
        { "label": "세부 토픽 태그명", "detail": "세부 토픽 한 문장 설명" }
      ]
    }
  ],

  "book_benefit": {
    "title": "강의+도서 혜택 안내 문구 (없으면 강의만의 혜택 문구로 대체)",
    "image_url": ""
  },

  "pain_points": {
    "subtitle": "타깃의 현재 고충을 공감하는 2문장 (줄바꿈은 \n)",
    "items": ["고충 1", "고충 2", "고충 3", "고충 4", "고충 5"]
  },

  "target_audience": [
    { "header": "추천 대상 설명", "description": "👉 이 대상에게 주는 구체적인 가치" },
    { "header": "", "description": "" },
    { "header": "", "description": "" }
  ],

  "before_after": {
    "before_items": ["수강 전 부정적 상태 1줄", "상태 2", "상태 3"],
    "after_items": ["수강 후 긍정적 변화 1줄", "변화 2", "변화 3"]
  },

  "instructor": {
    "name": "강사 이름",
    "title": "소속 또는 직함",
    "subtitle": "강사를 표현하는 한 줄 슬로건",
    "photo_url": "",
    "career": ["경력 1", "경력 2", "경력 3"],
    "publications": ["저서명 (출판사, 연도)"]
  },

  "curriculum": {
    "total_duration": "총 학습 시간",
    "total_chapters": 0,
    "format": "온라인 VOD",
    "chapters": [
      { "chapter": "1장. 챕터 제목", "description": "이 챕터에서 배우는 내용 한 줄 요약" }
    ]
  },

  "summary": "강의 전체를 2~3문장으로 요약",

  "extra_content": {
    "section_key_1": [
      { "field1": "value", "field2": "value" }
    ],
    "section_key_2": [
      { "field1": "value", "field2": "value" }
    ]
  }
}

For "extra_content": add one key per template section that needs non-standard content.
The key name must exactly match the snake_case section identifier from the TEMPLATE CONTENT MAPPING.
Each value is an array of objects with fields that make sense for that section's content.

Examples of extra_content sections you may encounter:
- "projects": [{ "tag": "Sequential Workflow", "title": "프로젝트 명", "description": "설명" }]
- "core_points": [{ "number": "POINT 01", "title": "포인트 제목", "description": "설명" }]
- "faq": [{ "q": "질문", "a": "답변" }]
- "what_you_build": [{ "title": "결과물 제목", "description": "설명" }]

If the TEMPLATE CONTENT MAPPING does not require any extra sections beyond the standard fields, return "extra_content": {}.`
}
