---
title: "THE LAST RECORD 개발 정리"
date: 2026-09-23
tags:
  - 개발
---

게임이 끝난 뒤 실제 실종자 정보를 보여준다면, 허구와 현실을 어떻게 나눠야 할까?  
**THE LAST RECORD**는 브라우저에서 하는 심리 공포 추리 게임이고, 마지막에 경찰청 Safe182 API의 실제 실종자 정보를 보여준다.  
하루 만에 만든 이 프로젝트의 게임 구조와 기술 요소를 정리한다.  
게임의 단서와 엔딩 내용이 나오므로 스포일러가 포함되어 있다.

> **TL;DR**
> - 플레이어는 "한서연 실종 사건(CASE_014)"의 조사관이 되어 CCTV, 보안 기록, 지도, 음성 단서를 모으고, 3가지 엔딩 중 하나를 맞는다.
> - 화면 전환은 `Stage` 유니온과 `useState` 하나로 만든 스테이지 머신이 맡는다. 런타임 라이브러리는 `next`, `react`, `react-dom`뿐이고, 서버 코드는 Safe182 프록시 라우트 1개다.
> - 처음에는 엔딩 안에 있던 실제 정보를 세 번의 커밋에 걸쳐 엔딩·에필로그·실제 정보 화면으로 나눴다. 정답이 클라이언트에 있고 진행 상황이 저장되지 않는 점은 한계로 남았다.

## 1. 프로젝트 개요

플레이어가 조사관이 되어 단서를 모으면, 게임 끝에서 실제 실종자 정보를 보여주며 허구와 현실을 연결해 마무리한다.  
아래 수치는 저장소의 코드와 git 기록을 읽어 정리한 것이고, 실행하거나 빌드해 확인한 것은 아니다.

| 항목 | 내용 |
|---|---|
| 프레임워크 | Next.js 16.3.6 (App Router), React 19.2.8 |
| 언어 | TypeScript 5, `strict: true`, 경로 별칭 `@/*` |
| 스타일 | Tailwind CSS v4 (`@tailwindcss/postcss`). 설정 파일 없이 CSS의 `@theme inline`으로 토큰을 정의 |
| 폰트 | `next/font/google`로 Geist, Geist Mono, Spectral 3종을 CSS 변수로 주입 |
| 린트 | ESLint 9 flat config (`eslint-config-next`의 `core-web-vitals` + `typescript`) |
| 외부 의존성 | 런타임 라이브러리는 `next`, `react`, `react-dom`뿐. 상태관리, UI, 애니메이션 라이브러리는 쓰지 않음 |
| 규모 | 컴포넌트 19개, 서버 라우트 1개, 상태 정의 1개, 총 약 2,240줄 |
| 기간 | 2026-09-23 하루 (git 기록 기준 커밋 9개) |

`layout.tsx`에서는 `LayoutProps<"/">` 타입을 썼다.  
Next 16에서 타입 생성기가 만들어 주는 전역 헬퍼 타입이다.  
서버 코드는 API 라우트 1개뿐이고, 게임 화면은 클라이언트 컴포넌트(`"use client"`)로 동작한다.

## 2. 개발 타임라인

커밋 순서대로 정리했다.  
첫 번째 커밋의 내용은 정리해 둔 기록에서 확인하지 못해서 표에서 뺐다.

| 순서 | 커밋 | 내용 |
|---|---|---|
| 2 | Build THE LAST RECORD… | 게임 전체 뼈대 (16개 파일, +1,443줄) |
| 3 | Add title screen | 인물 등록 전에 타이틀 화면 추가 |
| 4 | Enhance title screen | 긴장감과 포렌식 분위기 연출 강화 |
| 5 | Lower puzzle difficulty | 퍼즐 난이도 하향, 목표·힌트 시스템 도입 |
| 6 | Connect ending to Safe182 | 실제 실종자 API 연동 |
| 7 | Separate real info from ending | 실제 정보를 게임 엔딩에서 분리 |
| 8 | Separate epilogue/real-info screens | 에필로그와 실제 정보를 별도 화면으로 분리 |
| 9 | Rewrite ending narratives | 엔딩 서사 재작성, CCTV 타임스탬프 하이라이트 수정 |

게임의 큰 뼈대는 2번 커밋 하나에 들어갔고, 이후 커밋은 연출, 난이도, 실제 정보 연동과 분리에 집중했다.

## 3. 게임 흐름: 라우팅 없이 만든 스테이지 머신

게임 전체가 `/` 한 페이지다.  
URL 라우팅 대신 `currentStage` 값에 따라 `switch`로 컴포넌트를 갈아 끼운다.  
스테이지는 12단계다.

```text
IDENTIFICATION → CASE_FILE → CCTV → SECURITY_RECORD → MAP → AUDIO
→ EVIDENCE_BOARD → HORROR → FINAL_DECISION → ENDING → EPILOGUE → MISSING_PERSONS
```

`Stage`는 문자열 리터럴 유니온 타입이고, `STAGE_ORDER` 배열이 순서를 정의한다.  
`lib/gameState.ts`에는 `Stage` 유니온과 `STAGE_ORDER`, 단서 6종(`CLUES`), `GameState` 인터페이스가 있다.

| 구분 | 내용 |
|---|---|
| 장점 | 상태를 한 곳에서 관리하고, 흐름이 한 파일에 모인다 |
| 단점 | 뒤로 가기가 동작하지 않고, 단계별 딥링크를 만들 수 없다 |
| 저장 | 상태는 일부러 메모리에만 둔다. `localStorage`에 저장하지 않으므로 새로고침하면 어느 단계에서든 타이틀로 돌아간다 |

### 상태 설계

`GameShell.tsx`가 `useState` 하나로 아래 상태를 들고 있다.

```ts
interface GameState {
  investigatorName: string;
  currentStage: Stage;
  foundClues: ClueId[];       // 단서 6종 유니온
  solvedPuzzles: string[];
  unlockedRecords: string[];
  discoveredB4: boolean;
  finalChoice: FinalChoice;   // "ELEVATOR" | "RECORD" | "LEAVE" | null
  ending: Ending;             // "A" | "B" | "C" | null
}
```

- `CLUES: Record<ClueId, {...}>`로 단서 메타데이터를 타입 안전하게 관리한다. `ClueId`에 값을 하나 추가했는데 `CLUES`에 항목이 없으면 컴파일 에러가 난다.
- `addClue`는 함수형 업데이트(`setState(s => ...)`)를 쓰고, 이미 있는 단서면 기존 객체를 그대로 반환한다. 같은 단서를 여러 번 얻어도 상태가 바뀌지 않는다(멱등).

### 자식 컴포넌트에는 `GameApi`만 내려준다

`GameShell`이 `GameApi` 객체(`setStage`, `addClue`, `update`, `resetGame`, `returnToTitle`)를 만들어 각 스테이지 컴포넌트에 props로 내려준다.  
Context나 Redux 없이 prop 하나로 충분한 규모다.  
자식은 `setState`의 구현을 모르고 이 함수들만 호출하므로, 나중에 Context나 reducer로 바꿔도 자식 코드는 그대로 둘 수 있다.  
타입은 `import type { GameApi } from "@/components/GameShell"`로 가져와서 순환 import가 런타임에 생기지 않게 했다.

## 4. 스테이지별 구현

| 스테이지 | 플레이어가 하는 일 | 구현 포인트 |
|---|---|---|
| 타이틀 (`TitleScreen`) | 게임을 시작한다 | 흐릿한 사건 기록 조각과 CCTV 프레임 장식을 배경에 깔았다. CSS 키프레임으로 단계별 페이드인을 하고 스캔라인이 한 번 훑고 지나간다. 반복 효과는 일부러 뺐다. 버튼에 마우스를 올리면 "기록에 접근하시겠습니까?"가 나타난다 |
| 조사관 등록 → 사건 파일 | 이름을 입력한다 | 입력한 이름이 이후 화면과 엔딩에 계속 등장하고, 엔딩의 반전 장치가 된다 |
| CCTV 조사 (`CctvInvestigation`) | 2×2 구역(엘리베이터, 복도, 출입문, 두 번째 인물)을 클릭해 조사한다 | 엘리베이터에서 `02:17:03`(시간 단서), 두 번째 인물에서 "공식 기록에 없는 인원"(인원 불일치 단서)을 얻는다. 선택한 구역에 맞춰 상단 타임스탬프가 빨갛게 강조된다 |
| 보안 기록 (`SecurityRecord`) | 4자리 비밀번호를 푼다 | 정답은 CCTV 시각 `02:17:03`에서 시·분만 뽑은 `0217`이다. 숫자만 입력받고, 시도 횟수를 표시하며, 실패하면 힌트를 준다. 열리면 출발 B3, 목적지 B4 기록이 나오고 "건물 도면과 대조" 버튼으로 B4가 도면에 없음을 확인한다 |
| 지도 조사 (`MapInvestigation`) | "이상 구역 스캔"을 누른다 | 확인된 B1~B3 아래에 `???` 칸이 있고, 스캔 1.2초 뒤 미등록 층 B4가 드러난다 |
| 음성 분석 (`AudioForensics`) | 파형에서 수상한 구간을 고른다 | 60개 막대로 만든 파형이고, 정답 구간(00:31~00:34)에만 스파이크가 있다. 3개 구간 중 정답을 고르면 정상 음성 "이곳은 거기가 아니에요", "아직 나를 찾으러 오지 마"가 나온다. "배경음 분리"를 누르면 낮은 음량의 숨겨진 음성 "이미 찾았잖아"가 나온다 |
| 증거 보드 (`EvidenceBoard`) | 단서 카드 6장을 두 개씩 연결한다 | 정답 연결은 4쌍이다. 틀린 연결에는 "연관성을 찾을 수 없습니다."가 뜬다 |
| 공포 이벤트 (`HorrorEvent`) | - | 글리치 화면이 2.2초 나온 뒤 "기록 변경됨"이 뜨고, 대상 위치 B4, 상태 ACTIVE가 표시된다 |
| 최종 선택 (`FinalDecision`) | 선택지 3개 중 하나를 고른다 | 선택지마다 엔딩 A, B, C에 대응한다 |

증거 보드의 정답 연결 4쌍은 시간↔엘리베이터, 엘리베이터↔B3, B3↔미등록 층, 두 번째 인물↔숨겨진 음성이다.

선택지는 엔딩 3종으로 이어진다.

| 선택지 | 엔딩 | 결말 |
|---|---|---|
| 건물을 떠난다 | A "사라진 기록" | 조사 종료 시각이 `02:17:18`이고, 시스템에 조사관 이름의 기록이 남아 있다 |
| 엘리베이터를 연다 | B "기록의 일부" | 기록의 작성자가 한서연이 아니라 현재 조사자였고, 조사자는 사건의 일부였다 |
| 마지막 기록을 확인한다 | C "마지막 기록" | SUBJECT 02에 플레이어 이름이 등록되고, "마지막 기록이 당신을 찾은 것이다"로 끝난다 |

## 5. 구현 기법

### 5-1. 증거 보드: 두 카드를 누른 순서와 상관없이 비교한다

카드 이름 두 개를 정렬해서 `::`로 이은 키를 만들면, 어떤 순서로 눌러도 같은 키가 나온다.

```ts
function pairKey(a: ClueId, b: ClueId) { return [a, b].sort().join("::"); }
const REQUIRED_KEYS = REQUIRED_PAIRS.map(([a, b]) => pairKey(a, b));
```

- 사용자가 연결한 쌍은 `Set<string>`에 저장하고, `every(...)`로 4쌍이 모두 연결됐는지 판정한다.
- 완료되면 `solvedPuzzles`에 `"evidence_board"`를 추가한다.
- 화면의 "연결된 단서" 목록은 `REQUIRED_PAIRS`를 순회해 그리므로, 데이터와 UI가 한 곳에서 만들어진다.

### 5-2. CCTV: 데이터로 구역을 정의한다

`AREAS` 배열 하나에 라벨, 목표 문구, 타임스탬프 인덱스, 결과, 획득 단서를 모두 넣었다.  
렌더링과 진행 판정(`inspected.size === AREAS.length`)이 같은 배열에서 나온다.  
조사한 구역은 `Set<AreaId>`로 추적하고, 갱신할 때는 새 `Set`을 만들어서 불변성을 지킨다.  
선택한 구역의 `timestampIndex`로 3개의 타임스탬프 중 하나를 빨갛게 강조한다.  
마지막 커밋에서 이 하이라이트 버그를 고쳤다.

### 5-3. 비밀번호 입력 처리

```tsx
onChange={e => setInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
inputMode="numeric" maxLength={4}
```

정규식으로 숫자 외 문자를 걸러내고 4자리로 자른다.  
모바일에서는 숫자 키패드가 뜬다.  
Enter 키로 제출할 수 있고, 4자리가 아니면 버튼이 비활성화된다.

### 5-4. 파형 시각화를 라이브러리 없이 만든다

```ts
function barHeight(i) {
  const base = Math.abs(Math.sin(i * 0.7) * 0.5 + Math.sin(i * 0.31) * 0.35);
  const spike = i >= TARGET_START && i < TARGET_END ? 0.25 : 0;
  return Math.min(1, 0.15 + base + spike);
}
```

서로 다른 주파수의 `sin` 두 개를 합쳐 그럴듯한 파형을 만들고, 정답 구간에만 스파이크를 더한 뒤 `Math.min`으로 높이를 1로 제한한다.  
오디오 파일은 쓰지 않았고 `div` 60개의 높이만 계산한다.  
선택 구간은 `start <= i < end` 조건으로 색을 바꾼다.

### 5-5. 타이머 기반 연출

| 연출 | 구현 |
|---|---|
| 지도 스캔 | `setTimeout` 1.2초 동안 `scanning` 상태로 버튼을 막은 뒤 B4 발견 상태로 바꾼다 |
| 공포 이벤트 | `useEffect`에서 2.2초 타이머를 걸고, cleanup에서 `clearTimeout`을 호출한다. 언마운트 중에 상태가 바뀌는 것을 막기 위해서다 |
| 힌트 제안 | 45초 뒤 힌트 제안을 띄운다. `solved`, `revealed`, `dismissed` 상태가 바뀔 때 타이머를 정리하고 다시 건다. 풀었거나 힌트를 이미 열었으면 타이머를 걸지 않는다 |

### 5-6. 순차 텍스트 연출: `RecordReveal`

- 항목마다 `animationDelay: i * stepMs`를 줘서 CSS 애니메이션만으로 한 줄씩 나타나게 했다. JS 타이머가 필요 없다.
- 화면을 클릭하면 `skipped` 상태가 되어 딜레이를 0ms로, 지속시간을 150ms로 줄인다. 읽는 속도가 사람마다 다르다는 점을 고려한 장치다.
- `entries`를 `ReactNode[]`로 받아서 문장, 그리드, 입력 필드 등 어떤 JSX든 같은 방식으로 연출된다.

### 5-7. 재사용 UI 부품 (`ui.tsx`)

- `TerminalButton`은 `ButtonHTMLAttributes<HTMLButtonElement>`를 확장하고 `variant`(default, danger, ghost)를 받는다. `...props`로 나머지 속성(`disabled`, `onClick`)을 그대로 전달한다.
- `Panel`은 border 클래스를 prop으로 받아 일반 패널과 경고(붉은 테두리) 패널을 구분한다.
- `Screen`(레이아웃), `SystemHeader`, `Label`, `ClueTag`로 모든 화면의 모양을 통일했다.

### 5-8. 목표와 힌트 시스템

난이도를 낮추는 커밋에서 `InvestigationAids.tsx`가 나왔고, 모든 퍼즐 화면이 같은 컴포넌트를 쓴다.

| 컴포넌트 | 역할 |
|---|---|
| `ObjectiveTracker` | 완료한 목표는 ✓, 지금 할 일은 ▸로 보여준다 |
| `HintBox` | 힌트를 단계별(1/3, 2/3, 3/3)로 열어준다. 한 화면에서 45초간 진전이 없으면 "힌트가 필요하신가요?"라고 먼저 제안한다 |

## 6. 서버: Safe182 프록시 API 라우트

클라이언트가 Safe182를 직접 부르지 않고 `app/api/missing-persons/route.ts`의 Route Handler를 거친다.

```text
브라우저 → GET /api/missing-persons (Next Route Handler)
        → POST https://www.safe182.go.kr/api/lcm/findChildList.do
          (x-www-form-urlencoded: esntlId, authKey, rowSize=6)
        ← JSON 정규화 후 { records ... } 로 응답
```

### 6-1. 키 보호와 에러 코드

인증키는 `process.env`(`SAFE182_ESNTL_ID`, `SAFE182_AUTH_KEY`)에서만 읽는다.  
`.env*`는 `.gitignore`에 들어 있어 커밋되지 않고, 클라이언트 번들에도 포함되지 않는다.  
키가 없을 때 로그에는 "설정되지 않았다"만 남기고 값은 출력하지 않는다.

에러는 상황에 따라 응답을 나눈다.

| 상황 | 응답 |
|---|---|
| 환경변수 없음 | 500 (설정 오류) |
| 네트워크 실패 | 502 `UPSTREAM_UNREACHABLE` |
| JSON이 아님 | 502 `UPSTREAM_INVALID_RESPONSE` |
| `result` 80 (호출 한도) | 429 `RATE_LIMITED` |
| `result` 99 (필수값 누락) | 500 `BAD_REQUEST` |
| 그 외 `00`이 아닌 결과 | 502 `UPSTREAM_ERROR` |

### 6-2. 캐싱과 응답 정규화

- `fetch(..., { next: { revalidate: 300 } })`로 5분간 캐시해서, 새로고침마다 상위 API를 호출하지 않게 했다.
- 원본 필드(`nm`, `ageNow`, `occrde`, `alldressingDscd` 등)를 `MissingPersonRecord`로 매핑하고, 없는 값은 `null`로 통일한다.
- 날짜는 정규식 `^\d{8}$`를 확인한 뒤 `YYYY-MM-DD`로 바꾸고, 개수는 `slice(0, ROW_SIZE)`로 제한한다.
- 사진은 `tknphotoFile`(base64 JPEG)로 `data:image/jpeg;base64,...` URL을 만들어 내려준다. 문서에 없는 사진 URL이나 상세 페이지 주소는 추측해서 만들지 않는다는 원칙을 코드 주석에 남겼다.

### 6-3. 클라이언트 쪽 로딩 상태

`FetchState` 판별 유니온(`loading` | `error` | `ready`)으로 화면을 나눈다.  
`ready`일 때만 `records`가 존재하므로 타입 가드로 안전하게 접근한다.

```ts
// 예시 코드 (실제 저장소 코드가 아님)
type FetchState<T> =
  | { status: "loading" }
  | { status: "error"; code?: string }
  | { status: "ready"; data: T };
```

- 서버의 에러 코드가 `RATE_LIMITED`면 "잠시 후 다시 시도" 문구를, 그 외에는 일반 오류 문구를 보여준다. 에러 화면에는 "다시 시도" 버튼이 있다.
- `useCallback`으로 감싼 `fetchRecords`를 `useEffect`와 "다시 시도" 버튼이 함께 쓴다.
- 사진 로드에 실패하면 카드 단위로 `onError`가 "[ 실종자 사진 없음 ]" 플레이스홀더로 바꾸고, 값이 비어 있는 항목은 "정보 없음"으로 표시한다.

## 7. CSS와 디자인 시스템

- **색 토큰:** `--raw-*` 값을 `@theme inline`에서 `red-bright` 등으로 연결해 `bg-panel`, `text-red-bright` 같은 유틸리티 클래스로 쓴다. 어두운 배경에 붉은 포인트를 쓰고, 본문은 Geist Mono, 감성 문구는 Spectral 세리프를 쓴다.
- **CRT 효과:** 스캔라인은 `repeating-linear-gradient` 오버레이와 `mix-blend-mode: overlay`, 비네트는 `radial-gradient`, 깜빡임은 6초 주기로 불투명도를 살짝 흔드는 `@keyframes flicker`다. 두 오버레이는 `pointer-events: none`과 `fixed`, `z-index`로 화면 전체를 덮는다.
- **글리치:** `@keyframes glitch-shake`가 0.15초마다 `translate`를 흔든다.
- **타이틀 연출:** 한 번만 재생되는 `title-fade`(`forwards`)와 스캔라인 스윕(`animation ... 1 both`)을 쓰고, 반복되는 효과는 배제했다. 색수차 느낌은 `text-shadow` 두 겹으로 정적으로만 줬다.
- **반응형:** `sm:`, `md:` 브레이크포인트로 일부 장식을 숨긴다(`hidden sm:block`).
- **접근성:** 장식 요소에 `aria-hidden`을 달았다. 다만 `prefers-reduced-motion` 대응은 코드에서 찾지 못했다.

## 8. 허구와 현실을 화면으로 분리한 결정

처음에는 실제 실종자 정보가 엔딩 안에 함께 있었다.  
이를 세 커밋(6~8번)에 걸쳐 분리했다.

| 화면 | 역할 |
|---|---|
| 엔딩 | 게임 서사 |
| 에필로그 | "방금까지의 사건은 허구였습니다. 하지만…"으로 시작해 현실로 전환 |
| 실제 정보 (`MissingPersonsSection`) | 에필로그와 정반대로 밝은 배경을 쓰고, 출처 표기(경찰청 안전Dream)와 공식 사이트 링크를 둔다 |

`Ending`에 몰려 있던 실제 정보 표시를 `Epilogue`와 `MissingPersonsSection`으로 쪼갰다(커밋 `32113b8`에서 38줄 변경).  
밝은 배경과 어두운 배경으로 시각적으로 나눠서 "여기부터는 현실"이라는 신호를 준다.  
실제 실종자 정보를 공포 연출의 소재로 쓰지 않으려는 구조로 보인다.  
이 의도는 커밋 기록에서 추정한 것이라 `확인 필요`다.

## 9. 트러블슈팅과 결정 기록

| 상황 | 결정 |
|---|---|
| `useEffect`에서 데이터 fetch를 시작할 때 `react-hooks/set-state-in-effect` 규칙에 걸림 | 상태 갱신은 비동기 콜백 안에서만 일어난다는 근거를 주석으로 남기고, 해당 줄만 규칙을 껐다 |
| 사진이 원격 도메인이 아니라 인라인 base64라서 `next/image`를 쓸 이유가 없음 | `<img>`를 쓰고 `@next/next/no-img-element`를 해당 줄에서만 껐다. 사유를 주석으로 적었다 |
| 새로고침했을 때 진행 상황을 저장할지 | `localStorage`를 쓰지 않고, 의도를 주석에 명시했다 |
| `Ending`에 몰린 화면 책임 | `Epilogue`와 `MissingPersonsSection`으로 분리했다 |
| CCTV 타임스탬프 하이라이트 버그 | 마지막 커밋에 포함해 고쳤다 |

## 10. 한계와 개선 아이디어

| 한계 | 개선 아이디어 |
|---|---|
| 정답(`0217` 등)이 클라이언트 번들에 들어 있다. 퍼즐 게임이라 감수했다 | 서버에서 검증하는 방식으로 바꿀 수 있다 |
| 뒤로 가기, 딥링크, 중간 저장이 없다 | 스테이지를 라우트로 나누거나 `sessionStorage`를 쓰는 방법이 있다 |
| 힌트 단계 문구와 정답이 컴포넌트마다 흩어져 있다 | JSON 같은 데이터 파일로 분리하면 수정이 쉬워진다 |
| `prefers-reduced-motion`에 대응하지 않았다 | 깜빡임과 글리치 효과를 줄이는 대응이 필요하다 |
| 테스트 코드가 저장소에 없다 | `pairKey` 로직과 API 라우트의 에러 분기가 단위 테스트를 붙이기 좋은 후보다 |

"미등록 층" 단서는 `SecurityRecord`의 도면 대조와 `MapInvestigation`의 스캔, 두 곳에서 모두 얻을 수 있다.  
의도한 이중 경로인지 중복인지는 코드만으로는 알 수 없어서 `확인 필요`다.  
프로젝트의 `AGENTS.md`에는 이 Next.js가 기존 버전과 다르니 `node_modules/next/dist/docs/`를 먼저 읽으라는 지침이 있다.  
Next 16 계열 API를 다룰 때는 예전 글을 그대로 따르지 말고 공식 문서를 먼저 확인해야 한다.

## 11. 정리

- 스테이지 머신(`Stage` 유니온 + `useState` 하나 + `GameApi` 전달)으로 12단계 게임 흐름을 한 곳에서 관리했다. 대신 뒤로 가기, 딥링크, 새로고침 유지는 포기했다.
- 외부 API는 Route Handler로 프록시해서 인증키를 숨기고, 에러를 구분하고, 5분 캐시와 응답 정규화를 넣었다. 런타임 의존성은 `next`, `react`, `react-dom`뿐이다.
- 실제 실종자 정보는 엔딩에서 분리해 에필로그와 별도 화면으로 나눴다. 이 분리가 이 프로젝트에서 가장 의도적으로 설계한 부분이다.

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **Next.js Route Handler와 캐싱** — `revalidate` 옵션이 어떤 단위로 캐시를 바꾸는지 알면, 외부 API 호출을 얼마나 줄일 수 있는지 판단할 수 있다.
- **TypeScript의 유니온 타입과 좁히기(Narrowing)** — `Stage`와 `FetchState`처럼 상태를 유니온으로 나타내면, 컴파일러가 빠뜨린 경우를 알려준다.
- **`useEffect`의 정리(cleanup)와 상태 업데이트** — 타이머를 걸고 지우는 패턴과, 이번에 규칙을 끈 부분이 왜 경고 대상이었는지 이해하려면 이펙트의 동작 방식을 알아야 한다.
- **`prefers-reduced-motion`과 모션 접근성** — 깜빡임과 글리치 같은 연출은 일부 사용자에게 불편을 줄 수 있다. 어떤 효과를 줄이거나 끌지 정하는 기준을 정리해 두면 좋다.
- **클라이언트와 서버의 검증 책임** — 정답을 클라이언트에 두는 구조의 한계를 이해하면, 서버에서 검증해야 하는 값과 아닌 값을 구분하기 쉽다.

## 참고 자료
- [Next.js - Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Next.js - fetch (revalidate 옵션)](https://nextjs.org/docs/app/api-reference/functions/fetch)
- [React - useEffect](https://react.dev/reference/react/useEffect)
- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [MDN - @keyframes](https://developer.mozilla.org/ko/docs/Web/CSS/@keyframes)
- [MDN - prefers-reduced-motion](https://developer.mozilla.org/ko/docs/Web/CSS/@media/prefers-reduced-motion)
- [Tailwind CSS - Theme](https://tailwindcss.com/docs/theme)
