# ADK 기초 (Agent Development Kit) — 분석 요약

## 기본 정보

| 항목 | 내용 |
|------|------|
| **강좌 ID** | 9781806676453 |
| **강사** | Paulo Deone (Software Cloud AI Engineer) |
| **분량** | 7개 영상 (약 2~3시간) |
| **난이도** | Intermediate (중급) |
| **언어** | 영어 |

---

## 사전 요구사항

- Python 기초/중급 (강사는 Python을 가르치지 않음)
- LLM/AI 기초 지식
- UV 패키지 매니저 설치
- VS Code 또는 선호 IDE
- Google AI Studio API 키 (무료)
- OpenAI API 키 (선택)
- Ollama 로컬 설치 (선택)

---

## 학습 목표

1. Google ADK의 개념과 아키텍처 이해
2. ADK 개발 환경 설정 (UV, venv, 의존성)
3. AI 에이전트 생성 및 실행 (ADK web / run / api_server)
4. 다양한 LLM 연동 (Gemini, OpenAI GPT, Ollama 로컬 모델)
5. 에이전트에 커스텀 도구(Tool) 추가 및 활용
6. 순차 에이전트(Sequential Agent)로 멀티에이전트 워크플로우 구축
7. 병렬 에이전트(Parallel Agent)로 동시 작업 처리
8. 세션(Session)과 상태(State) 관리 이해 및 구현
9. 인메모리/데이터베이스 기반 메모리 영속성 구현
10. 콜백(Callback)을 활용한 에이전트 동작 커스터마이징 및 가드레일 적용

---

## 강의 목차

### Video 1 — 코스 소개
- 강사 소개 (Paulo Deone, 소프트웨어/클라우드 AI 엔지니어)
- 수강 대상 및 사전 요건 안내
- 개발 도구 준비 (VS Code, Python, UV, API 키)

### Video 2 — ADK 핵심 개념
- ADK란 무엇인가: Google이 만든 모듈식 AI 에이전트 프레임워크
- 모델 불가지론(model agnostic) & 배포 불가지론(deployment agnostic)
- 핵심 구성 요소: Agent, Tool, Callback, Session, Memory, Orchestration
- 주요 기능: 멀티에이전트 설계, 풍부한 도구 생태계, 유연한 오케스트레이션, LLM 지원

### Video 3 — 환경 설정 및 첫 번째 에이전트
- `uv init` → `uv venv` → `uv add google-adk litellm` 순서로 프로젝트 설정
- ADK 디렉토리 구조: `project/agent_name/__init__.py` + `agent.py`
- 첫 번째 에이전트 (`travel_planner_agent`) 생성 및 Ollama Gemma3로 로컬 실행
- `adk web` (웹 UI), `adk run` (CLI), `adk api_server` 실행 명령 비교
- `.env` 파일로 API 키 관리, LiteLLM을 통한 다양한 모델 사용

### Video 4 — 도구(Tools)와 에이전트 아키텍처
- OpenAI GPT, Gemini 모델 직접 연결 방법
- 커스텀 도구 생성: 일반 Python 함수로 정의, **docstring 필수** (LLM이 호출 여부 결정)
- 예시 도구: `get_weather(city)`, `get_current_time(city)` (목 데이터/timezone 활용)
- 에이전트 아키텍처 계층: Base Agent → LLM Agent / Workflow Agents / Custom Agent
- Workflow Agents: Sequential Agent, Parallel Agent, Loop Agent

### Video 5 — 멀티에이전트 워크플로우
**순차 에이전트 (Sequential Agent)**
- 입력 → Sub Agent 1 → Sub Agent 2 → Sub Agent 3 → 출력 순서로 처리
- 실습: 여행 계획 시스템 (Destination Research → Itinerary Builder → Travel Optimizer)
- `output_key`로 에이전트 간 데이터 전달, 내장 Google Search 도구 활용

**병렬 에이전트 (Parallel Agent)**
- 모든 서브 에이전트가 동시에 실행 → 순서 무관
- 실습: 블로그 콘텐츠 생성 시스템 (Blog Writer, SEO, Visual Creator, Social Media, Email)
- **주의**: 메인 오케스트레이터 에이전트 변수명은 반드시 `root_agent`

### Video 6 — 세션, 메모리, 콜백
**세션(Session) & 상태(State)**
- 세션 = 현재 진행 중인 대화 스레드
- 세션 객체 속성: id, app_name, user_id, events, state, last_update_time
- 세션 서비스 3가지: `InMemorySessionService` (휘발성) / `VertexAISessionService` (Google Cloud) / `DatabaseSessionService` (SQLite 등, 영속성)
- `Runner` 클래스로 에이전트 실행, 세션과 연결

**구조화된 출력 (Structured Output)**
- Pydantic `BaseModel`로 에이전트 출력 형식을 일관되게 고정
- `output_schema`, `output_key` 파라미터 활용

**데이터베이스 영속성**
- 실습: 레시피 에이전트 (SQLite DB에 레시피 추가/조회/삭제/검색)
- 세션 종료 후에도 데이터 유지 — 새 세션에서도 이전 대화 기억 가능

**콜백 (Callback)**
- `before_agent_callback` / `after_agent_callback`: 에이전트 실행 전/후 실행
- `before_model_callback` / `after_model_callback`: LLM 호출 전/후 실행
- `before_tool_callback` / `after_tool_callback`: 도구 호출 전/후 실행
- 활용 예: 키워드 기반 콘텐츠 필터링(가드레일), 로깅, 이모지 추가, 응답 시간 측정

### Video 7 — 마무리 및 다음 단계
- 학습 내용 요약: 에이전트, 도구, 콜백, 세션, 메모리, 오케스트레이션
- ADK는 활발히 개발 중 → 변경 사항 지속 확인 권장
- 다음 단계: 직접 에이전트 구축 연습, GitHub `google/adk-python` 팔로우, ADK 공식 문서 참고

---

## 핵심 키워드

`ADK` `Agent Development Kit` `Google` `Gemini` `multi-agent` `sequential agent` `parallel agent` `tools` `callbacks` `session` `state` `memory` `LLM` `LiteLLM` `Ollama` `orchestration` `FastAPI` `Pydantic` `structured output` `guard rails`

---

## 주요 코드 패턴

```python
# 에이전트 생성
from google.adk.agents import Agent
root_agent = Agent(
    name='my_agent',
    model='gemini-2.0-flash',
    description='...',
    instruction='...',
    tools=[my_tool]
)

# 순차 에이전트
from google.adk.agents import SequentialAgent
root_agent = SequentialAgent(
    name='pipeline',
    sub_agents=[agent1, agent2, agent3]  # 순서 중요
)

# 병렬 에이전트
from google.adk.agents import ParallelAgent
root_agent = ParallelAgent(
    name='parallel_system',
    sub_agents=[agent_a, agent_b, agent_c]  # 순서 무관
)

# 세션 관리
from google.adk.sessions import InMemorySessionService
session_service = InMemorySessionService()
session = await session_service.create_session(app_name='app', user_id='user1')

# 콜백 등록
agent = Agent(
    before_agent_callback=my_before_callback,
    after_model_callback=my_after_callback
)
```

---

## 실습 프로젝트 목록

| 프로젝트 | 유형 | 주요 기술 |
|---------|------|----------|
| 여행 플래너 에이전트 | 단일 에이전트 | Tool (get_weather, get_current_time) |
| 여행 계획 시스템 | Sequential Agent | Google Search, output_key |
| 블로그 콘텐츠 생성기 | Parallel Agent | Google Search, 5개 서브 에이전트 |
| 고객 지원 에이전트 | 세션/상태 | InMemorySessionService, Pydantic |
| 레시피 에이전트 | 데이터베이스 | DatabaseSessionService, SQLite |
| 콜백 필터 에이전트 | Callback | before/after_model_callback |

---

*생성일: 2026-03-16 | 분석 파일: collect_9781806676453-video1~7.txt*
