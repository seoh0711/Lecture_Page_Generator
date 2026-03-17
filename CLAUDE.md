# 강의 분석 & 상세 페이지 생성 프로젝트

## 프로젝트 개요
강의 콘텐츠(영상, 스크립트, 슬라이드)를 분석하여 샘플 상세 페이지와 유사한 형식의 상세 페이지를 자동 생성하는 AI 기반 프로젝트입니다.

## 주요 기능
1. 강의 콘텐츠 분석 (영상 스크립트, 슬라이드 추출)
2. 핵심 내용 구조화
3. 샘플 페이지 패턴 학습
4. 상세 페이지 자동 생성
5. 품질 검증 및 리뷰

## 디렉토리 구조
- `input/`: 강의 원본 파일 및 샘플 템플릿
- `output/`: 생성된 상세 페이지 및 분석 리포트
- `.claude/`: Claude 설정 및 스킬, 명령어
- `resources/`: 공통 리소스 (이미지, 에셋)

## 워크플로우
1. 강의 파일을 `input/lectures/` 에 업로드
2. 샘플 상세 페이지를 `input/templates/` 에 저장
3. `/analyze` 명령으로 강의 분석
4. `/generate` 명령으로 상세 페이지 생성
5. 생성된 페이지는 `output/detail-pages/` 에 저장

## 시작하기
```bash
# 1. 강의 파일 준비
cp your-lecture.mp4 input/lectures/video/
cp your-slides.pdf input/lectures/slides/

# 2. 샘플 페이지 준비
cp sample-page.html input/templates/

# 3. Claude에서 분석 시작
/analyze lecture-name
```

## 명령어
- `/analyze [lecture-name]`: 강의 분석
- `/generate [lecture-name]`: 상세 페이지 생성
- `/review [page-name]`: 생성된 페이지 품질 검토
