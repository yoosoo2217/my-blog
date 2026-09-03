---
title: "CSS flex, grid, transform 실습 정리"
date: 2026-09-03
tags:
  - CSS
  - 실습파일정리
---

# CSS flex, grid, transform 실습 정리

[지난 글]({{ site.baseurl }}/css-선택자-실습-정리.html)에서 CSS 선택자를 정리했고, 이번엔 이어서 **레이아웃(block/inline), flex, grid, transform/애니메이션** 실습을 정리한다. 마찬가지로 실습은 따라 했지만 개념이 흐릿했던 부분이라, 코드마다 왜 그렇게 동작하는지를 붙여서 정리했다.

## 1. 블록(block)과 인라인(inline)

flex/grid를 배우기 전에, 먼저 태그가 화면에서 차지하는 공간의 기본 성질부터 짚었다.

```html
<section class="display-demo">
  <div class="box-block">div — 자기 줄을 통째로 차지함</div>
  <div class="box-block">div — 그래서 아래로 쌓임</div>

  <span class="box-inline">span</span>
  <span class="box-inline">span— 옆으로 붙음</span>

  <span class="box-inline-block">span인데 너비가 먹음</span>
  <span class="box-block-span">같은 span인데 자기 줄을 차지</span>

  <div class="box-inline-div">같은 div 인데</div>
  <div class="box-inline-div">옆으로 붙음</div>
</section>
```

```css
.box-block-span { display: block; }  /* span인데 block처럼 */
.box-inline-div { display: inline; } /* div인데 inline처럼 */
```

| 값 | 기본으로 쓰는 태그 | 특징 |
|---|---|---|
| `block` | `div`, `p`, `h1`~`h6` | 한 줄(가로 전체)을 혼자 차지, 아래로 쌓임 |
| `inline` | `span`, `a`, `strong` | 내용 크기만큼만 차지, 옆으로 이어짐 |

`display` 속성으로 `div`를 `inline`처럼, `span`을 `block`처럼 강제로 바꿀 수 있다는 걸 실습으로 확인했다. flex/grid도 결국 이 `display` 속성값 중 하나(`flex`, `grid`)라서, 먼저 기본 성질을 아는 게 순서상 중요했다.

## 2. flex 레이아웃

`div`만으로 카드 3개를 가로로 배치하려 하면, `div`가 기본적으로 세로로 쌓이기 때문에 화면 너비에 맞춰 유연하게 배치할 수 없다. 이 문제를 해결하려고 flexbox를 배웠다.

```html
<main class="card-list">
    <div class="card">
        <div class="thumb"></div>
        <h2 class="product-name">노트북 거치대</h2>
        <p class="price">17,000원</p>
        <p class="desc">많은 구매 부탁드립니다.</p>
    </div>
    <div class="card"> <!-- 카드 2개 더 반복, desc 문단 없음 --> </div>
</main>
```

```css
.card-list {
    display: flex;                   /* 카드를 감싸는 부모에 준다 */
    flex-direction: row;
    justify-content: space-between;
    /* align-items: flex-start;      기본값 stretch 대신 높이를 안 늘리려면 */
    gap: 20px;
    flex-wrap: wrap;
}
```

**플렉스박스(Flexbox)** 는 항목을 **한 방향의 줄**로 세우는 배치 방식이다. `display: flex`를 준 요소를 **플렉스 컨테이너**, 그 안의 자식 요소들을 **플렉스 아이템**이라고 부른다. 플렉스에는 두 개의 축이 있다.

| 축 | 의미 |
|---|---|
| 주축(main axis) | `flex-direction`이 정하는 방향 (기본: 가로) |
| 교차축(cross axis) | 주축과 직각인 방향 |

| 속성 | 역할 |
|---|---|
| `flex-direction` | 주축의 방향 (`row`, `column`, `row-reverse`, `column-reverse`) |
| `justify-content` | 주축 방향 정렬 |
| `align-items` | 교차축 방향 정렬 |
| `gap` | 아이템 사이 간격 |
| `flex-wrap` | 한 줄에 안 들어갈 때 줄바꿈 여부 |

`align-items`를 `flex-start`로 주지 않고 기본값(`stretch`)으로 두면, 설명 문단(`desc`)이 있는 카드만 내용이 길어져도 다른 카드들의 높이가 컨테이너 높이만큼 늘어나서 나란히 맞춰진다는 걸 실습으로 확인했다.

## 3. grid 레이아웃

카드가 6개로 늘어나면서, 한 줄로만 배치하는 flex 대신 **행과 열을 함께 지정**하는 grid를 배웠다.

```html
<main class="grid-list">
    <div class="card"> ... 노트북 거치대 ... </div>
    <div class="card"> ... 모니터 ... </div>
    <div class="card"> ... 마유수 ... </div>
    <div class="card"> ... 키보드 ... </div>
    <div class="card"> ... 헤드폰 ... </div>
    <div class="card"> ... 에어팟 ... </div>
</main>
```

```css
.grid-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 열 3개, 남은 공간을 1:1:1로 */
    gap: 20px;
}
```

`fr`(fraction)은 "남은 공간의 몫"을 뜻하는 grid 전용 단위다.

| 개념 | flex | grid |
|---|---|---|
| 배치 방향 | 한 방향(축) 하나 | 행 + 열, 두 방향 동시 |
| 비유 | 한 줄로 세우고 정렬 | 칸을 미리 그려두고 그 칸에 채움 |
| 적합한 상황 | 메뉴바처럼 한 줄/한 열 배치 | 카드 그리드처럼 표 형태 배치 |

행(row) 개수를 따로 지정하지 않아도, 열(`grid-template-columns`)만 정해주면 내용물 개수에 맞춰 행이 자동으로 늘어난다는 점이 grid의 특징이었다.

## 4. transform과 애니메이션

카드에 마우스를 올렸을 때 움직이는 효과와, 배지가 깜빡이는 효과를 vanilla CSS로 직접 만들어봤다.

```html
<div class="card">
  <div class="thumb"></div>
  <span class="badge">NEW</span>
  <h2 class="product-name">무선 이어폰</h2>
  <p class="price">89,000원</p>
</div>
```

```css
.card {
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s; /* :hover가 아니라 원래 규칙에 써야 뗄 때도 부드럽다 */
}

.card:hover {
  background-color: #F9FAFB;
  transform: translate(0, -8px) scale(1.05); /* 위로 8px, 1.05배 확대 */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.badge {
  background-color: #DC2626;
  border-radius: 999px;
  transform: rotate(-5deg);
  animation: blink 1.2s infinite;
}

@keyframes blink {
  0%, 100% { background-color: #DC2626; } /* 시작·끝을 같은 색으로 둬야 끊기지 않는다 */
  50%      { background-color: #F97316; }
}
```

| 속성 | 역할 |
|---|---|
| `transform` | 요소의 위치·크기·회전을 바꾼다 (`translate`, `scale`, `rotate` 등). 레이아웃 흐름에는 영향을 주지 않는다 |
| `transition` | 속성값이 바뀔 때 그 변화를 부드럽게 이어준다 |
| `animation` + `@keyframes` | 시작~끝 사이 여러 지점의 스타일을 직접 정의해, 반복되는 움직임을 만든다 |

`transition`은 "상태가 바뀔 때(예: hover 진입/이탈)" 자동으로 부드럽게 연결해주는 것이고, `animation`은 반복 재생처럼 **스스로 계속 움직이는** 효과라는 차이를 배웠다.

## 5. 직접 쓴 CSS vs Tailwind/Bootstrap

같은 카드 UI(위 4번의 `.card`)를 vanilla CSS로 만든 버전과, CDN으로 불러온 유틸리티 클래스(Tailwind, Bootstrap)로 만든 버전을 비교해봤다.

```html
<!-- Tailwind 버전: 클래스 이름 자체가 스타일. 별도 CSS 파일이 거의 필요 없다 -->
<div class="bg-white border border-gray-200 rounded-lg p-4 transition hover:bg-gray-50 hover:-translate-y-2 hover:scale-105 hover:shadow-lg">
  <div class="w-44 h-28 bg-gray-200 rounded"></div>
  <span class="inline-block bg-red-600 text-white text-sm px-2 py-1 rounded-full mt-2">NEW</span>
  <h2 class="text-lg font-bold mt-2 mb-1">무선 이어폰</h2>
  <p class="text-red-700">89,000원</p>
</div>
```

```html
<!-- Bootstrap 버전: 미리 만들어진 컴포넌트 클래스(.btn 등)를 그대로 가져다 쓴다 -->
<button type="button" class="btn btn-outline-success">눌러주세요</button>
```

| 구분 | Vanilla CSS | Tailwind (유틸리티 우선) | Bootstrap (컴포넌트 우선) |
|---|---|---|---|
| 스타일 작성 위치 | 별도 `.css` 파일 | HTML class 속성에 직접 | HTML class 속성에 직접 |
| 클래스 이름 | `.card`, `.price`처럼 의미 단위 | `.p-4`, `.text-lg`처럼 속성값 단위 | `.btn`, `.card`처럼 완성된 컴포넌트 |
| 커스터마이징 | 자유로움 | 자유로움 (유틸리티 조합) | 정해진 컴포넌트 안에서만 |
| 학습 부담 | CSS 문법 전반 | 유틸리티 클래스 이름 암기 | 컴포넌트 클래스 이름 암기 |

CSS 프레임워크는 CSS를 직접 작성하는 대신, CDN으로 미리 만들어진 스타일 규칙(클래스)을 가져와 쓰는 방식이라는 걸 배웠다. Tailwind는 `p-4`(padding), `text-lg`(font-size)처럼 **속성 하나하나에 대응하는 유틸리티 클래스**를 조합하는 방식이고, Bootstrap은 `.btn`, `.card`처럼 **이미 완성된 컴포넌트 클래스**를 통째로 가져다 쓰는 방식이라는 차이가 가장 인상 깊었다.

## 막혔던 것

- `.card:hover`와 `.card :hover`(공백 있음)를 처음엔 같은 뜻인 줄 알았는데, 공백이 들어가면 "카드 안의 자식 요소에 마우스가 올라갔을 때"라는 완전히 다른 의미가 된다는 걸 알고 놀랐다.
- flex의 `justify-content`(주축)와 `align-items`(교차축)가 어느 방향인지 계속 헷갈렸는데, `flex-direction: row`일 땐 주축=가로, 교차축=세로라고 방향을 먼저 그려보고 나서야 정리됐다.
- grid의 `fr` 단위가 `%`나 `px`와 뭐가 다른지 몰랐는데, "남은 공간을 비율로 나눈다"는 뜻이라는 걸 알고 나서야 `repeat(3, 1fr)`이 왜 3등분인지 이해했다.
- CSS 파일 안에 `border: 3px soild rgb(0, 0, 0);`처럼 `solid`를 `soild`로 잘못 쓴 오타가 있었다. 오타가 나면 그 속성 전체가 조용히 무시된다는 걸 실습으로 확인했다 (에러가 나지 않아서 찾기 더 어려웠다).

## 오늘 정리

- block/inline이라는 기본 성질 위에, `display: flex`와 `display: grid`로 레이아웃을 자유롭게 바꿀 수 있다는 걸 배웠다.
- flex는 "한 줄로 정렬", grid는 "칸을 만들어 배치"라는 목적 차이가 있고, 상황에 따라 골라 쓰면 된다는 걸 알았다.
- `transform`/`transition`/`animation`으로 정적인 화면에 움직임을 줄 수 있고, Tailwind 같은 프레임워크는 같은 결과를 클래스 조합만으로도 만들 수 있다는 걸 비교해봤다.

## 더 학습하면 좋은 개념

- **flex-grow / flex-shrink / flex-basis** — 오늘은 컨테이너(부모) 속성 위주로 배웠는데, 아이템(자식) 각각이 얼마나 늘어나고 줄어들지를 정하는 속성도 있다. 카드 너비를 화면 크기에 따라 다르게 하고 싶을 때 필요하다.
- **grid-template-areas** — 오늘 배운 `grid-template-columns`보다 더 직관적으로 레이아웃 영역에 이름을 붙여 배치하는 방법으로, 복잡한 페이지 레이아웃에 유용하다.
- **CSS 애니메이션 타이밍 함수(easing)** — `transition`/`animation`에 `ease`, `linear`, `cubic-bezier()` 같은 값을 주면 움직임의 속도감을 다르게 줄 수 있다. 지금은 기본값만 써봤지만, 더 자연스러운 움직임을 만들려면 필요하다.
- **CSS 프레임워크의 트레이드오프** — Tailwind/Bootstrap은 빠르지만 HTML이 클래스로 뒤덮여 가독성이 떨어질 수 있다. 언제 vanilla CSS를 쓰고 언제 프레임워크를 쓸지 판단 기준을 더 공부하면 좋다.
- **반응형 웹 디자인(미디어 쿼리)** — flex의 `flex-wrap`, grid의 `repeat()`처럼 오늘 배운 속성들은 화면 크기 대응의 기초다. `@media` 쿼리로 화면 크기별 스타일을 다르게 주는 법을 배우면 진짜 반응형 레이아웃을 만들 수 있다.

## 참고 자료
- [MDN - Flexbox 기본 개념](https://developer.mozilla.org/ko/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox)
- [MDN - Grid 레이아웃 기본 개념](https://developer.mozilla.org/ko/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout)
- [MDN - transform](https://developer.mozilla.org/ko/docs/Web/CSS/transform)
- [MDN - CSS 애니메이션 사용하기](https://developer.mozilla.org/ko/docs/Web/CSS/CSS_animations/Using_CSS_animations)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [Bootstrap 공식 문서](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
