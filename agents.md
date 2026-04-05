AGENTS.md
1. AI Framework Rules (에이전트 스웜 및 런타임 환경)
이 프로젝트를 빌드하는 AI 에이전트는 다음 시스템 규칙을 인지하고 따른다:

Agent Swarms: --agent-teams 플래그나 특정 환경 변수를 통해 다중 에이전트 협업 모드로 전환될 수 있다.

Deterministic IDs: 모든 에이전트는 agentName@teamName 포맷의 고유 ID를 가지며, 요청은 requestType-timestamp@agentId 형식으로 식별되어 장애 복구와 예측 가능한 라우팅을 지원한다.

Context Isolation: 동시성 환경에서 에이전트(Subagent/Teammate) 간의 상태가 섞이지 않도록 전역 변수가 아닌 AsyncLocalStorage를 사용하여 실행 컨텍스트를 추적한다.

Agentic Session Search: 과거 작업의 맥락이 끊겼을 경우, 빠른 모델(Small/Fast Model)을 활용해 로그/태그/트랜스크립트 기반의 시맨틱 검색을 수행하여 필요한 코딩 컨텍스트를 복구할 수 있다.

2. 앱 실행 및 빌드 환경 (AdCanvas)
로컬 구동: Node.js 환경, Vite 기반 React 템플릿 (npm install, npm run dev)

설계 제약: 모든 로직은 별도 라이브러리(package.json 추가) 없이 순수 React와 표준 Web API만 사용.

3. AI Learning Log (에이전트 자가학습 메모)
AI 작업 규칙: 버그 수정, 아키텍처 변경, 복잡한 로직 설계 시 그 원인과 해결책을 반드시 이곳에 기록하라. 다음 세션의 에이전트나 하위 에이전트가 이 기록을 읽고 학습한다.

[2026-04-05] JSX 이스케이프 문자(\) 생성 오류 방지 (Critical)

상황: React.createElement 내 속성값을 생성할 때 cursor: \"pointer\"와 같이 불필요한 역슬래시가 포함되어 SyntaxError: Expecting Unicode escape sequence 발생.

해결: 코드 생성 시 문자열 내부에 따옴표가 중복되지 않도록 구조화하고, 모든 인라인 스타일과 속성에서 이스케이프 문자를 전수 제거함. 향후 모든 코드 출력 전 문법 무결성을 자체 검증함.

[2026-04-05] 속성 귀속성(Attribute Isolation) 아키텍처 확립

상황: 특정 보드에서 폰트 크기 조정 시 다른 모든 보드가 영향을 받는 '상태 오염' 현상 발생.

해결: updateActiveProp 함수를 도입하여, 선택된 아트보드가 있는 경우 무조건 overrides[boardId][layerId]에 값을 저장하도록 로직 변경. 아트보드별 독립 제어권을 확보함.

[2026-04-05] 스페이스바 캔버스 패닝 이벤트 충돌 해결

상황: 스페이스바를 눌러 캔버스를 드래그하려 할 때, 마우스 포인트가 위치한 레이어나 아트보드가 선택되면서 드래그 이벤트가 겹침.

해결: beginDrag와 onMouseDown에 if(spaceHeld) return; 조건을 추가해 스페이스바를 누른 상태에서는 선택 로직을 무력화하고 오직 뷰포트 이동만 가능하도록 이벤트를 정제함.

[2026-04-05] 에이전트 텍스트 요약 (Agentic Summarization) Mocking 도입

상황: LLM 하위 에이전트를 호출하여 텍스트를 줄이는 기능이 필요함.

해결: runAgenticSummary 비동기 함수를 구현하여 1.5초간의 처리 딜레이와 정규식을 통한 수식어 제거 시뮬레이션을 수행하도록 작성함. 실제 API 연동 시 내부 fetch 로직만 교체하면 즉시 구동 가능하도록 뼈대를 완성.

[2026-04-05] DOM 물리 크기 기반 다중 정렬 도입

상황: CSS % 기반 좌표 계산만으로는 다중 선택된 요소들의 그룹 기준점을 잡기 어려움.

해결: getBoundingClientRect()를 사용해 브라우저가 실제 렌더링한 px 크기를 읽어온 뒤, 이를 다시 캔버스 비율에 맞게 역산하여 정렬 기준점으로 삼는 하이브리드 알고리즘을 구현함.

[2026-04-05] 1:1 이미지 스케일링 강제 로직

상황: 리사이징 시 아트보드 비율에 따라 이미지가 찌그러지는 현상 발생.

해결: 이미지 레이어에 한해 너비(w)와 높이(h)가 무조건 1:1이 되도록 h = w * (sz.w / sz.h) 공식을 리사이징 핸들러와 렌더링 엔진에 주입함.

[2026-04-05] 작은 사이즈 배너 레이어 증발 현상 픽스

상황: 300x250 등 작은 배너에서 폰트 크기가 3px 미만으로 계산될 경우 렌더링을 생략하던 방어 코드가 작동함.

해결: if(dfs < 3) return null; 제약을 제거하여 마이크로 텍스트도 정상 노출되도록 수정함.