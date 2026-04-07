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

[2026-04-06] Vite 실행 뼈대 복구 및 진입점 분리

상황: 문서에는 Vite 기반 React 앱으로 정의되어 있었지만 실제 폴더에는 package.json, index.html, src/main.jsx가 없어 npm run dev / build를 바로 실행할 수 없는 상태였음.

해결: 기존 단일 구현 파일(App.jsx)은 유지하고, 루트에 package.json과 index.html, src/main.jsx를 추가하여 최소 Vite 실행 경로를 복구함. 기능 로직은 건드리지 않고 진입점만 분리해 이후 배포/프리뷰/자동 빌드 연결이 가능하도록 정리함.

[2026-04-06] 에셋 라이브러리 트레이 도입 및 CORS 제약 명시

상황: 실행계획 상 남은 핵심 기능으로 하단 에셋 브라우저가 필요했으나, 브라우저 단독 환경에서는 로컬 폴더를 직접 스캔할 수 없고 외부 이미지 URL은 Canvas export 시 CORS 제약으로 실패할 수 있음.

해결: 하단 Asset Tray를 추가하고, 로컬 다중 이미지 업로드와 URL 목록 붙여넣기 두 경로로 에셋을 수집하도록 구현함. 가능한 한 fetch + FileReader를 통해 data URL로 정규화해 export 호환성을 확보했고, URL fetch 실패 시 CORS/응답 문제를 상태 메시지로 안내하도록 처리함.

[2026-04-06] 포인터 기준 줌 및 보드별 레이어 속성 오버라이드 확장

상황: 확대/축소가 캔버스 중앙 기준으로만 동작해 정밀 작업이 불편했고, 레이어 텍스트/CTA 값 수정이 전체 아트보드에 전파되어 배너별 카피 변형 작업이 어려웠음.

해결: wheel 및 줌 UI가 마지막 마우스 포인터 위치를 기준으로 배율을 보존하도록 pan 보정 로직을 추가함. 동시에 보드별 overrides 구조를 위치/크기뿐 아니라 content, color, bg, font, size, weight, ls, lh, align 등 레이어 속성까지 확장해 현재 선택 보드에만 다른 값을 저장하도록 변경함. 변형 보드는 `(변형됨)` 표시와 보드 단위 초기화 버튼으로 원본 복귀가 가능하도록 정리함.

[2026-04-06] 4방향 레이어 리사이즈 핸들 도입

상황: 기존 레이어 transform은 우하단 코너 중심 리사이즈만 지원해 폭/높이를 개별적으로 잡기 어려웠고, 텍스트 박스 폭 조정이 불가능했음.

해결: 동서남북 및 우하단 핸들을 추가해 좌우/상하 크기 조절을 지원함. 이미지 레이어는 기존 1:1 비율 제약을 유지한 채 반대쪽 가장자리를 기준으로 크기와 위치가 보정되도록 구현했고, 텍스트 레이어는 박스 폭/높이를 직접 조절할 수 있게 변경함.

[2026-04-06] 보드 전용 삭제와 Material 기반 UI 리프레시

상황: 레이어 삭제가 전 아트보드에 동시에 적용되어 배너별 파생 작업을 방해했고, 전체 UI가 다크톤 임시 스타일 위주라 편집 툴로서의 정보 위계와 사용성이 떨어졌음.

해결: 삭제 동작을 보드 전용 숨김/제거 의미로 전환해 현재 보드에서만 레이어가 사라지도록 변경함. 새 텍스트 레이어도 활성 보드에만 보이도록 기본 hidden 오버라이드를 주입함. 동시에 패널, 헤더, 입력창, 버튼, 컨텍스트 메뉴, 하단 트레이를 밝은 Material 계열 표면과 라운드/그림자/상태색 체계로 재정비해 편집 중심 UI로 리디자인함.

[2026-04-06] 다크 모드 복귀와 비율 기반 Transform 핸들 보정

상황: 밝은 Material 리프레시 이후 기존 작업 몰입감이 떨어졌고, 텍스트 레이어를 스케일할 때 선택 박스와 핸들이 실제 콘텐츠보다 더 빠르게 커져 조작 피드백이 어색했음.

해결: 전체 편집기 표면을 다크 톤으로 되돌리고, 선택 테두리를 0.5px 보더 기반으로 재구성해 레이어 외곽에 더 밀착되도록 조정함. 상하좌우와 우하단 핸들은 3px dot 형태와 0.5px 흰색 스트로크로 통일했고, 우하단 스케일은 절대 델타 대신 비율 기반 계산을 사용해 폰트 크기가 요소 크기와 정비례하도록 보정함.

[2026-04-06] 포인터 중심 줌 감도와 아트보드 직접 텍스트 편집 고도화

상황: 휠 줌과 패닝, 리사이즈 조작이 여러 번 반복해야 체감될 정도로 둔했고, 텍스트 레이어를 선택한 뒤에도 우측 패널로 이동해야만 내용을 수정할 수 있어 캔버스 중심 작업 흐름이 끊겼음.

해결: 줌은 선형 증감 대신 지수 기반 곱셈 스텝으로 바꿔 일반 디자인 툴에 가까운 감도로 상향했고, 패닝/이동/리사이즈에도 추가 감도 배수를 적용해 적은 드래그로 더 큰 변화를 만들도록 조정함. 동시에 선택된 텍스트 레이어는 아트보드 위에서 즉시 textarea로 전환되게 만들어 클릭 직후 바로 카피를 수정할 수 있도록 개선함.

[2026-04-06] 인플레이스 텍스트 편집과 선택 링 드래그 분리

상황: 선택된 텍스트를 수정하려고 들어가면 textarea가 기존 레이어 표현을 깨뜨렸고, 편집 중에는 텍스트 본문이 드래그 영역과 충돌해 요소 이동이 불편했음.

해결: 텍스트 편집 UI를 textarea에서 contentEditable 기반 인플레이스 편집으로 전환해 현재 보이는 레이어 상태를 유지한 채 바로 타이핑할 수 있도록 변경함. Enter는 줄바꿈을 그대로 사용하고 Escape는 수정값을 유지한 채 편집 모드만 종료하도록 정리했으며, 선택 테두리 바깥에 1px 투명 드래그 링을 추가해 본문 편집과 위치 이동을 분리함.

[2026-04-06] 사각형 핸들과 더블탭 자동 맞춤 도입

상황: 원형 핸들은 정리감이 떨어졌고, 텍스트/CTA 레이어의 박스가 실제 콘텐츠보다 크게 남아 있는 경우 손으로 다시 줄여야 해서 미세 조정 비용이 컸음.

해결: Transform 핸들을 4px 사각형 스퀘어로 교체하고 흰색 0.5px 스트로크를 유지해 가시성을 확보함. 동시에 핸들 더블탭 시 현재 텍스트 또는 CTA 콘텐츠의 실제 폭과 높이를 측정해 레이어 박스를 잉여공간 없이 자동 맞춤하는 로직을 추가함.

[2026-04-06] 텍스트 편집 포커스와 드래그 오버레이 충돌 수정

상황: 인플레이스 text editing 구조를 넣은 뒤에도 선택 레이어 위의 투명 드래그 링이 편집 영역보다 우선해서 커서를 잡아먹었고, 편집 상태로 전환돼도 실제 포커스가 들어가지 않아 타이핑이 되지 않았음.

해결: 편집 중인 텍스트 레이어에서는 이동용 투명 오버레이를 렌더링하지 않도록 분기하고, `contentEditable` 노드에 ref와 포커스 effect를 추가해 선택 직후 커서가 자동으로 들어가도록 수정함. 동시에 편집 중 마우스다운은 드래그 시작으로 이어지지 않게 차단해 편집/이동 이벤트를 분리함.

[2026-04-06] 캔버스 이미지 레이어 체크보드 배경 제거

상황: PNG 업로드 후에도 이미지 레이어 컨테이너에 체크보드 배경이 남아 있어 실제 이미지와 투명 영역, 크롭 상태를 한눈에 구분하기 어려웠고 편집 캔버스에서 혼동을 유발했음.

해결: 캔버스 내 이미지 레이어가 소스를 가진 경우 기본 배경을 투명으로 변경해 체크보드 패턴이 보이지 않도록 조정함. 플레이스홀더 상태에서만 점선/가이드 표현이 남고, 실제 편집 중에는 이미지 자체만 보이도록 정리함.

[2026-04-06] 한글 IME 조합 입력 깨짐 수정

상황: 인플레이스 텍스트 편집에서 `onInput`마다 React 상태를 즉시 갱신하면서 contentEditable 노드가 계속 다시 그려져, 한글 조합 입력이 `핑핑피잎...`처럼 깨지는 IME 충돌 현상이 발생했음.

해결: 편집 중에는 내용을 DOM과 ref에만 유지하고, blur 또는 Escape 시점에만 최종 문자열을 보드 오버라이드 상태로 커밋하도록 구조를 변경함. composition start/end를 분리해 조합 입력 중에는 React 리렌더가 개입하지 않도록 정리해 한글 타이핑 안정성을 확보함.

[2026-04-06] 텍스트 기본 박스 실측화와 편집 종료 동작 통일

상황: 텍스트/CTA 레이어의 기본 선택 박스가 레이아웃 구역 전체를 따라가 실제 콘텐츠보다 과하게 크게 잡혔고, 바깥 클릭이나 Escape로 편집을 끝낼 때 수정값 유지와 선택 해제 동작이 일관되지 않았음.

해결: 보드 오버라이드가 없는 텍스트/CTA 레이어는 canvas measureText 기반 실측 폭과 높이를 기본 박스로 사용하도록 변경해 선택 UI가 콘텐츠 크기에 더 가깝게 맞춰지도록 조정함. 동시에 편집 중 전역 포인터 다운을 감지해 현재 레이어 바깥을 클릭하거나 탭하면 수정값을 저장한 뒤 선택을 해제하도록 통일했고, Escape 역시 동일한 저장 후 선택 해제 흐름으로 정리함.

[2026-04-06] CTA 패딩 기준 재정의

상황: `자세히 보기` CTA 버튼의 상하/좌우 여백이 텍스트 크기 대비 과하게 커서 버튼 박스와 선택 박스가 불필요하게 부풀어 보였음.

해결: CTA 버튼 패딩을 폰트 크기 기준 상하 20%, 좌우 30%로 재정의하고, 캔버스 렌더링과 export 렌더링 양쪽에 동일하게 반영해 화면과 저장 결과가 일치하도록 조정함.

[2026-04-06] 선택 규칙을 이미지/CTA까지 확장하고 레이어명 표시 추가

상황: 최근 보정된 선택 해제 흐름과 선택 UI 정리는 주로 텍스트 레이어 기준으로 체감되어 이미지 레이어와 CTA 버튼 레이어에서는 일관성이 약했고, 이미지 플레이스홀더 중앙 텍스트는 편집 중 시각적 소음이 컸음.

해결: 전역 포인터/ESC 선택 해제 흐름을 활성 레이어 전반에 적용해 이미지와 CTA도 바깥 클릭 또는 Escape 시 선택이 해제되도록 통일함. 동시에 선택된 레이어 좌상단에 작은 이름 라벨을 표시하고, 이미지 영역 중앙의 `이미지 영역` 플레이스홀더 텍스트는 제거해 선택 정보는 라벨로 대체함.

[2026-04-06] 편집 중 멀티라인 높이 실시간 반영

상황: 텍스트 레이어는 실측 기반 기본 박스를 쓰도록 바꿨지만, 편집 중인 임시 문자열은 상태에 즉시 커밋하지 않도록 바뀌면서 줄바꿈 직후에는 선택 박스 높이가 한 줄 기준처럼 남아 보일 수 있었음.

해결: 현재 편집 중인 레이어에 대해서는 상태값 대신 editing draft 문자열을 기준으로 실측 폭과 높이를 계산하도록 변경해, 두 줄 이상 입력할 때도 선택 박스 높이가 즉시 늘어나도록 보정함.

[2026-04-06] 문서 루프 표준화와 세션 인계 문서 추가

상황: 작업 기록은 누적되고 있었지만, 다음 세션이나 다른 기기에서 어떤 문서를 어떤 순서로 읽고 어떤 루프로 진행해야 하는지 한 번에 파악하기 어려웠음.

해결: `중간정리_2026-04-06.md`, `자동루프_운영규칙.md`, `완성체크리스트.md`를 추가해 현재 상태, 배운 점, 자가발전 과제, 남은 완성 항목, 반복 루프 규칙을 분리 기록함. 이후 세션은 `AGENTS.md -> 실행계획.md -> 중간정리 -> 자동루프 문서` 순으로 읽고 이어받도록 표준화함.

[2026-04-06] Board Size Override Layer Added

Situation: The user needed to change the currently selected artboard size directly with numeric width/height inputs, but board dimensions only existed as immutable preset/custom size definitions.

Resolution: Added `boardSizeOverrides` as a board-scoped state layer and routed artboard measurement through `getSizeById()` so rendering, layer geometry, image ratio calculations, and inspector labels all read the same resolved size. Reset actions now clear board size overrides together with board defaults and layer overrides.

[2026-04-06] Inspector Input Legibility and Button Press Feedback

Situation: The new artboard size number inputs were visually cramped in the narrow inspector and values could look clipped. Buttons across the editor also lacked clear pressed-state feedback.

Resolution: Restacked the artboard width/height inputs vertically, tightened `NumberInput` label and unit widths, and applied `min-width: 0` plus number-field appearance cleanup to prevent clipping. Added lightweight global hover/active transitions for editor buttons and context items so clicks feel tactile without changing existing layout logic.

## Cross-Platform Compatibility Rule (2026-04-07)
- Any new UI control must be checked for Chrome + Safari/WebKit compatibility before shipping.
- Do not rely on a browser-specific CSS property without adding a fallback or vendor-prefixed companion when needed.
- Small interactive targets such as resize handles must use explicit box sizing, fixed pixel dimensions, and non-text-selection styles so they render consistently on macOS retina displays.
- Form controls must avoid clipped native UI by normalizing `appearance`, `WebkitAppearance`, and spinner behavior for number inputs.
- Blur, scrollbar hiding, and pressed-state interactions must include WebKit-safe handling where relevant.

[2026-04-07] WebKit Compatibility Hardening Pass

Situation: The user reported that resize handles and some inspector controls did not render consistently on macOS, which strongly suggested WebKit/Safari differences in form controls and tiny absolute-positioned UI.

Resolution: Added WebKit-safe form normalization for number inputs, hid textarea scrollbars with a WebKit rule, added `WebkitBackdropFilter` for the header blur, and hardened resize handles with explicit min sizes, box sizing, touch/user-select guards, and tap-highlight removal. This pass improves static compatibility, but true Safari rendering still needs live verification on a Mac or Safari browser.

[2026-04-07] Parent-Selection Driven Disabled UI

Situation: Panels whose controls depend on an upper-level selection still looked active even when their parent context was missing, which made the editor feel misleading. A clear example was the left layer panel appearing interactive before any artboard had been selected.

Resolution: The layer panel now accepts an explicit disabled state and visually deactivates itself while also blocking selection, visibility toggles, uploads, and add-layer actions until an artboard is selected. The right properties area also shows a disabled-state placeholder when no artboard context exists, making the selection hierarchy clearer.

[2026-04-07] Artboard Ratio Input, Numeric Draft Handling, and First-Enter Textarea Fix

Situation: Direct artboard size inputs behaved poorly when entering multiple digits because controlled numeric fields were reformatting too aggressively. The user also needed aspect-ratio-based resizing, background canvas clicks to clear artboard selection, and the first Enter in inline text edit still caused the first line to jump upward before the box settled.

Resolution: `NumberInput` now keeps a local draft string so multi-digit and decimal input can be typed naturally before normalization. Active artboards now expose a ratio control derived from width/height, and ratio edits update width from the current height baseline. Empty canvas clicks clear the current artboard selection. For inline text editing, the textarea overlay now synchronizes its own height from `scrollHeight` during focus, change, composition end, and Enter, which stabilizes the first line break behavior.

[2026-04-07] Ratio UI Changed from Decimal to Width:Height Controls

Situation: A decimal ratio field like `0.1` was technically correct but not designer-friendly. The user wanted to work with ratio in the same form it is mentally modeled, such as `9:16`.

Resolution: Replaced the single decimal ratio input with two numeric fields representing horizontal and vertical ratio parts. The visible artboard summary now also appends the reduced ratio label, and changing either side updates the active board width from the current height baseline.

[2026-04-06] line-height 실측 반영과 레이어명 편집 도입

상황: 텍스트 레이어 선택 UI가 줄 수는 따라가더라도 `line-height` 값과 실제 줄바꿈 높이를 충분히 반영하지 못했고, 레이어 이동은 선택 스트로크 인식 영역이 좁아 잡기 어려웠음. 또한 좌측 레이어 패널에서 레이어명을 직접 정리할 수 없어 편집 캔버스와 목록 간의 맥락 연결이 약했음.

해결: 캔버스 기반 `measureText` 대신 숨김 DOM 프로브를 사용하는 `measureTextBlock` 보조 함수를 도입해 실제 폰트, `line-height`, 줄바꿈, 현재 박스 폭까지 반영한 텍스트 실측값으로 선택 박스 높이와 자동 맞춤 계산을 갱신함. 동시에 선택 상태의 이동 오버레이 `inset`을 넓혀 드래그 인식 범위를 확장했고, 좌측 레이어 목록에서는 더블클릭으로 레이어명을 수정하고 Enter/Escape/blur 시 현재 입력값으로 즉시 확정되는 인라인 이름 편집 흐름을 추가함. 선택된 레이어명 라벨은 선택 UI와 같은 파란색으로 줄여 표시하고, `(변형됨)`/`초기화` 칩도 더 작은 다크 UI 톤으로 정리함.

[2026-04-06] contentEditable 스페이스 충돌과 선택선 첫 드래그 보정

상황: 아트보드 인플레이스 편집이 `contentEditable` 기반으로 바뀐 뒤에도 전역 스페이스바 패닝 단축키가 편집 노드에서 그대로 작동해 텍스트 띄어쓰기가 막혔고, 선택된 텍스트 레이어는 편집 모드일 때 파란 선택선이나 선택 라벨을 드래그해도 첫 이동이 무시되는 문제가 남아 있었음. 또한 줄바꿈 추가/삭제 중 선택 박스가 draft 값 변화를 즉시 따라오지 못하는 순간이 있었음.

해결: 전역 키다운 처리에서 `document.activeElement.isContentEditable`를 예외 처리해 편집 중 Space 입력이 패닝으로 탈취되지 않도록 수정함. 동시에 선택 라벨 자체를 드래그 가능한 move hit-area로 바꾸고, 텍스트 레이어 wrapper는 편집 노드 내부를 클릭한 경우에만 드래그를 막도록 분기해 파란 선택선/라벨을 통한 첫 이동이 즉시 작동하게 정리함. 인플레이스 편집의 `onInput`/`onCompositionEnd`에서는 draft 문자열 갱신과 함께 tick rerender를 발생시켜 줄바꿈 추가와 제거가 선택 박스 높이에 바로 반영되도록 보정함.

[2026-04-06] contentEditable 줄바꿈 구조 실측 보강

상황: 브라우저의 `contentEditable`은 줄바꿈 입력 시 단순 `\n` 대신 `div`, `p`, `br` 조합으로 DOM을 구성할 수 있어, `innerText`만으로는 엔터 직후 줄 수 변화를 안정적으로 읽지 못해 선택 박스 높이 반영이 늦는 경우가 있었음.

해결: 편집 노드 텍스트를 읽을 때 자식 노드를 순회하며 `div/p/br` 구조를 명시적으로 줄바꿈 문자로 환원하는 `readEditableText` 함수를 도입함. 동시에 `onInput`과 `Enter` 직후에는 `requestAnimationFrame` 타이밍으로 재측정을 예약해, DOM이 실제 줄 구조로 갱신된 뒤 선택 박스 높이를 다시 계산하도록 조정함.

[2026-04-06] 텍스트 자동 실측과 수동 리사이즈 우선순위 분리

상황: 텍스트 레이어가 한 번이라도 좁은 폭을 가지게 되면, 이후 편집 시 새 줄 입력보다 기존 박스 폭이 더 강하게 적용되어 두 줄이 아니라 글자 단위 세로 쌓임처럼 보이는 붕괴가 발생할 수 있었음.

해결: 보드 오버라이드에 `manualBox` 플래그를 도입해 사용자가 직접 리사이즈한 박스만 폭/높이 오버라이드를 강하게 유지하고, 그 외 기본 텍스트 레이어는 편집 중 내용 실측값을 우선 사용하도록 분리함. 결과적으로 일반 입력/줄바꿈에서는 박스가 콘텐츠 크기를 따라가고, 명시적으로 리사이즈한 뒤에만 고정 폭 박스로 동작하도록 구조를 정리함.

[2026-04-06] contentEditable 편집 엔진을 textarea 오버레이로 전환

상황: 여러 차례 보정 후에도 `contentEditable`은 한글 IME, 엔터에 따른 DOM 줄 구조, 첫 클릭 드래그 분기와 계속 충돌했고, 특히 줄바꿈 1회 후 텍스트 박스가 한 글자 폭으로 붕괴하는 문제가 완전히 사라지지 않았음.

해결: 텍스트 레이어 인플레이스 편집 엔진을 `contentEditable`에서 투명 `textarea` 오버레이 방식으로 교체함. 시각적으로는 기존 레이어 위치/폰트/정렬을 그대로 유지하면서도, 입력 이벤트는 일반 텍스트 입력 컨트롤의 안정적인 스페이스/엔터/줄바꿈 동작을 따르도록 바꿔 편집 안정성을 우선 확보함.

[2026-04-06] 텍스트 선택 진입 시 draft 즉시 동기화

상황: 텍스트 레이어를 선택하는 순간 `editingTextId`만 먼저 켜지고 draft 문자열은 effect에서 한 박자 늦게 채워지면, 첫 렌더의 선택 박스가 이전 draft 또는 빈 문자열 기준으로 계산되어 한 줄 높이, 잘못된 폭, textarea 스크롤바 같은 증상이 생길 수 있었음.

해결: 캔버스 클릭과 좌측 레이어 목록 선택 모두에서 텍스트 레이어 진입 시 해당 보드 레이어의 `content`를 즉시 `editingDraftRef`와 상태값으로 동기화하도록 변경함. 편집 오버레이는 `overflow: hidden`, `wrap: off`, `scrollbarWidth: none`으로 스크롤바를 차단하고, 박스 크기는 선택 즉시 현재 문자열 실측을 기준으로 계산되게 정리함.

## Modularization Rule (2026-04-06)
- `App.jsx` is the orchestration layer. New reusable UI should not be added there by default.
- Reusable UI must be extracted to `src/adcanvas/components/*`.
- Shared constants and design tokens must go to `src/adcanvas/config.js`.
- Shared calculations such as measurement, layout, and text parsing must go to `src/adcanvas/utils.js`.
- If the same edit flow or state transform appears in two places, extract a helper before extending it.
- Large new UI blocks should be split into modules instead of being appended directly to `App.jsx`.

[2026-04-06] 기능별 모듈화 1차 리팩터
상황: `App.jsx`에 레이어 목록, 숫자 입력, 리사이즈 핸들, 선택/편집 헬퍼가 한꺼번에 얽혀 있어 수정 비용이 계속 커졌음.
해결: `src/adcanvas/components` 아래로 `NumberInput`, `ResizeHandles`, `LayerListPanel`을 분리하고, `App.jsx`에는 오케스트레이션용 헬퍼만 남기는 방향으로 기준을 고정함. 이후 같은 성격의 UI는 같은 방식으로 계속 분리한다.

[2026-04-06] 텍스트 편집 상태와 표시 상태 줄바꿈 규칙 통일
상황: 텍스트 레이어는 편집 중 `textarea`에서는 명시적 줄바꿈만 유지했지만, 편집 종료 후 표시용 `span`은 공백 기준 자동 줄바꿈까지 수행해 같은 문자열이 상태별로 다르게 보였음.
해결: 기본 텍스트는 편집/표시 모두 `Enter`로 넣은 줄바꿈만 유지하도록 `pre` 기준으로 통일하고, 사용자가 수동 리사이즈한 `manualBox` 상태에서만 `pre-wrap` 줄바꿈을 허용하도록 분기함. 이제 선택 상태와 선택 해제 상태가 같은 레이아웃 규칙을 따름.

[2026-04-06] 수동 리사이즈 텍스트의 높이 자동 확장 보정
상황: 텍스트 레이어를 한 번 수동 리사이즈하면 `manualBox`가 폭과 높이를 모두 고정해, 편집 중 Enter로 줄이 늘어나도 박스 높이는 그대로 남고 텍스트만 위로 밀리는 문제가 있었음.
해결: 수동 리사이즈 상태에서는 폭만 고정 기준으로 유지하고, 높이는 항상 현재 내용의 실측 높이 이상으로 계산하도록 변경함. 이제 수동 박스를 가진 텍스트도 상단 기준을 유지한 채 아래 방향으로만 확장된다.

[2026-04-06] 텍스트/CTA 리사이즈 기준 단순화
상황: 텍스트 레이어에 수동 높이 조절이 남아 있으면 Enter 줄바꿈, 정렬, 편집 박스 높이 계산이 계속 충돌했음.
해결: 텍스트 계열은 상하 높이 핸들을 제거하고 `좌우 폭 조절 + 우하단 비율 스케일 + 자동 높이` 규칙으로 통일함. 속성 패널에서도 높이는 고정값이 아니라 자동값으로 읽기 전용 표시하도록 조정함.

[2026-04-07] Header Rename, CTA Inline Editing, and Selector Alignment

Situation: The service still surfaced the older `AdCanvas` title, CTA button layers could not be edited directly on the artboard, and multiline text editing could still leave the selector box one line short when the draft ended with a trailing line break. The user also wanted vertical resize handles back and requested a transform mark before each layer name.

Resolution: Renamed the header to `Banner Variation Editor` and removed the subtitle. Introduced a trailing-newline-safe text measurement helper so selector height follows the bottom blank line while editing. Allowed inline editing for all text layers including CTA, rendered CTA display/edit states against the same pill-sized box, restored vertical resize handles, and added transform badges before layer names in both the canvas labels and the layer list. Selector width and height overrides are now only respected when `manualBox` is active so stale bounds do not leak into text or CTA layers.

[2026-04-07] Saved History Panel Replaced URL Asset Tray

Situation: The bottom tray still focused on importing local or URL assets, but the user needed a project-oriented save and load workflow instead. The new requirement was to remove URL asset importing, preserve full working state snapshots, warn before overwriting the current unsaved canvas, and show a square-banner thumbnail in each saved entry.

Resolution: Replaced the bottom tray with a localStorage-backed saved history panel. Saving now captures the current editor state bundle, defaults the save name to the current date and time when left blank, and stores a generated thumbnail from the first square artboard found in the saved selection set. Loading now always asks for confirmation with an explicit warning that unsaved canvas changes can disappear before applying the snapshot. The saved list surfaces the generated square thumbnail, saved timestamp, and load/delete actions.

[2026-04-07] Dead-Code Cleanup and History Serialization Optimization

Situation: As the editor accumulated rapid feature work, some legacy helpers and refs from older edit and asset flows remained in the file even after the UI moved on. The undo history path also re-serialized the full editor state multiple times per save, which added avoidable overhead in a single-file React app.

Resolution: Removed unused legacy pieces such as the old editable-text parser helper, the stale asset tray ref, and an unreferenced image sync helper. Added a small history serialization layer so undo snapshots compare against one cached serialized string instead of repeatedly stringifying the same state tree multiple times per history save. This keeps the current feature set intact while trimming code noise and reducing unnecessary work in the hot undo/save path.

[2026-04-07] Unified Font Size Source and Outside Artboard Selection Stroke

Situation: The typography panel still exposed a base `size` value while transform scaling changed the resolved `fs` override, which made the number input and resize-handle scaling feel disconnected. The layer-name transform badges also added visual noise, and the selected artboard stroke was still using an inside border that visually ate into the board.

Resolution: Chose the rendered font size as the single interactive source of truth in the typography panel by binding the main `Size` input to the resolved `fs` value and updating the layer override directly, which keeps numeric font changes aligned with transform scaling. Removed the extra transform badge decoration from both the canvas label and the layer list. Switched active artboard emphasis from an inside border to an outside box-shadow stroke so selection feels external without changing physical layout thickness.

[2026-04-07] Default LGE Hero Board, Center-Only Grid, and Export Directory Picker

Situation: The editor still opened with multiple legacy artboards selected, safe area guides enabled by default, and a busier grid that stacked center guides with the old image-region frame. The user also wanted exports to target a chosen folder instead of immediately downloading files, and requested a new default 780x780 `LGE_heroBanner` board plus always-available eyedropper actions beside color inputs.

Resolution: Added `780x780 / LGE_heroBanner` to the default artboard catalog and changed the initial selected board set to only that board. Safe area guides now default to `off`, including restored snapshots unless they explicitly saved `showSafe: true`. Simplified grid rendering to the center horizontal and vertical crosshair only. Added `window.showDirectoryPicker()`-based export so supported browsers let the user choose a destination folder before writing selected PNG files, while unsupported browsers still fall back to direct download. Added `EyeDropper` shortcut buttons beside text color and CTA background color inputs, with graceful disable when the browser does not support the API.

[2026-04-07] Selection Stroke Hit Area Expansion and Typographic Percent Controls

Situation: The layer selection stroke was still visually thin relative to its draggable hit area needs, making move-by-stroke interactions feel unreliable. The user also wanted clearer typography controls: letter-spacing should be adjusted as a `0%`-centered offset, line-height should default to `140%`, and the editor should support `Pretendard` as a Korean UI/text font option.

Resolution: Changed selected text and image boxes to render an inside-plus-outside blue stroke using paired inset and outer shadows, then widened the stroke-only drag strips so dragging on the visible selector edge reliably moves the layer. Added `Pretendard` to the selectable font list and load path via CDN, while preserving existing font fallback chains. Converted inspector tracking and line-height sliders to percentage-based controls: tracking now maps `-30%` to `+30%` onto `-0.3em` to `+0.3em`, and line-height now uses a `140%` default with percent-based adjustments stored back into the existing numeric line-height value.

[2026-04-07] Unit Label Clarification and Layer-Panel Deletion Consolidation

Situation: The right inspector still used short labels like `Size` and `Wt`, which made unit meaning ambiguous while the user was tuning typography. The same screen also duplicated the board-scoped delete action, once in the right inspector and once conceptually in the layer list, which made the destructive action feel scattered.

Resolution: Clarified typography labels in the inspector to `Size (px)` and `Weight (100-900)` so font size and CSS font-weight units are explicit in the UI. Moved the board-only delete action into the left layer panel as a small trash icon on each layer row, and replaced the right-panel delete button with a short note pointing users to the consolidated delete control. This keeps the destructive action closer to the layer it affects and removes duplicated delete UI.
