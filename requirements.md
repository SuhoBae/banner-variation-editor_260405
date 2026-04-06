# AdCanvas 요구사항 및 기능 명세

## 1. 핵심 아키텍처
- **DOM + Canvas 하이브리드**: 화면 미리보기는 CSS/DOM으로 구현하여 빠른 인터랙션을 제공하고, 최종 다운로드는 DOM의 좌표/스타일을 Canvas API(`ctx.fillText`, `drawImage`)로 1:1 매핑하여 그린다.
- **상태 구조**:
  - `layers`: 모든 텍스트/이미지 레이어의 공통 기본값 (배경색, 텍스트 내용, 기본 폰트 크기 등)
  - `overrides`: `[boardId][layerId]` 형태로 각 아트보드별 요소의 개별 위치(x,y), 크기(w,h), 숨김(hidden) 상태를 덮어씌움.
  - `boardDefaults`: 각 아트보드별로 사용자가 저장한 커스텀 초기 템플릿 세팅값.

## 2. 주요 기능 세부 명세
- **스마트 레이아웃 엔진 (`computeLayout`)**: 
  - 아트보드의 가로/세로 비율(Aspect Ratio)을 계산하여 이미지와 텍스트를 겹치지 않게 자동 배치한다. (ex. 1.25 이상 가로형은 좌-이미지/우-텍스트)
- **Safe Area (가용 영역)**: 
  - 매체별 안전 영역 밖으로는 초기 렌더링 시 요소가 침범하지 않도록 퍼센트 렌더링을 보정한다.
- **다중 선택 & 정렬 (Multi-Select & Align)**: 
  - `Shift+Click`으로 다수 레이어 선택.
  - 다중 정렬 시, 선택된 엘리먼트들의 DOM 크기(`getBoundingClientRect()`)를 계산하여 그룹 외곽선 기준으로 정렬한다.
- **1:1 정방형 이미지 제어**: 
  - 이미지 레이어는 사이즈 조절 시 비율을 무조건 1:1로 강제 유지한다.
- **50단계 History (Undo/Redo)**:
  - `Ctrl+Z`, `Ctrl+Shift+Z` 지원. 상태가 변경되기 직전의 `layers`, `overrides`, `bgColor`, `boardDefaults`를 스냅샷으로 저장한다.
## Modular Implementation Guideline (2026-04-06)
- Feature-based modularization is now a project requirement.
- Minimum split direction:
  - `src/adcanvas/config.js`: constants, presets, design tokens
  - `src/adcanvas/utils.js`: measurement, layout, parsing, shared math
  - `src/adcanvas/components/*`: reusable panel and control UI
  - `App.jsx`: state orchestration, board composition, high-level workflow only
- New feature work should first decide whether it belongs to config, utils, components, or orchestration.
- Repeated logic across two or more UI surfaces must be extracted before adding more behavior.

## Artboard Sizing Requirement (2026-04-06)
- The active artboard must support direct numeric width/height editing from the inspector.
- Artboard size edits must apply only to the selected board, not globally to all preset boards.
- Resolved board size must be the single source used by board rendering, layer measurement, drag/resize math, and export.
- Resetting a board must also clear its size override so the preset or custom base size is restored.

## Compatibility Requirement (2026-04-07)
- The editor must remain usable across Windows Chrome and macOS Safari/WebKit.
- Number inputs, textarea overlays, and resize handles must avoid browser-native clipping or disappearing UI.
- Browser-specific visual features such as blur or scrollbar hiding must degrade gracefully and include WebKit-safe handling where applicable.
- Compatibility checks must be recorded in project docs whenever a control relies on custom form styling or tiny absolute-positioned interaction targets.
