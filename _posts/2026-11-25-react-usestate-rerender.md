---
title: "React useState와 리렌더링"
date: 2026-11-25
tags:
  - React
  - JavaScript
---

버튼을 누를 때마다 `count`를 1씩 늘리는 코드를 `let count = 0`으로 짰는데, 콘솔에는 숫자가 올라가도 화면은 그대로였다. 값은 분명 바뀌었는데 화면이 왜 안 바뀔까?  
오늘 수업에서는 이 현상을 직접 만들어 보고, `useState`로 고친 뒤, `setCount`를 세 번 호출해도 1만 늘어나는 이유까지 확인했다.

> **TL;DR**
> - 일반 변수(`let`)를 바꿔도 React는 화면을 다시 그리지 않는다. 화면을 바꾸려면 state를 쓰고, setter로 바꿔야 한다.
> - setter를 호출하면 컴포넌트 함수가 **다시 실행**(리렌더링)된다. 그리고 한 번 렌더링된 동안 `count`는 고정된 값이다.
> - 같은 이벤트 안에서 이전 값을 이어받아 누적하려면 `setCount(prev => prev + 1)`처럼 함수를 넘긴다.

환경: React 19.3.1, Vite 8.3.6. 앞선 글 [React props와 children]({{ site.baseurl }}/react-props-children.html)에서 "props는 고치지 못한다"고 했는데, 바뀌는 값은 state가 맡는다.

## let 변수는 왜 화면을 바꾸지 못할까?

```jsx
function Counter() {
    let count = 0;

    const onClickPlusOne = () => {
        count = count + 1;
        console.log(`count: ${count}`);   // 1, 2, 3 ... 올라간다
    };

    return (
        <>
            <h1>count : {count}</h1>      {/* 계속 0 */}
            <button onClick={onClickPlusOne}>+ 1</button>
        </>
    );
}
```

두 가지 이유가 겹친다.

1. React는 `count`라는 변수를 감시하지 않는다. 변수 값이 바뀌었다고 알려 주는 신호가 없으므로 컴포넌트 함수를 다시 부르지 않는다.
2. 설령 다른 이유로 함수가 다시 실행된다면 `let count = 0;`이 처음부터 다시 실행되어 값이 0으로 돌아간다. 함수 컴포넌트는 호출될 때마다 지역 변수를 새로 만들기 때문이다.

즉 화면에 영향을 주는 값에는 "바뀌면 다시 그리라고 알려 주는 장치"와 "함수가 다시 실행되어도 값을 기억하는 장치"가 둘 다 필요하다. 이 둘을 한 번에 해 주는 것이 state다.

## useState로 고치기

```jsx
import { useState } from 'react';

const [count, setCount] = useState(0);
```

| 자리 | 이름 | 의미 |
|------|------|------|
| 반환값 첫 번째 | `count` | 현재 state 값 |
| 반환값 두 번째 | `setCount` | 값을 바꾸고 리렌더링을 요청하는 함수 |
| 인자 | `0` | 처음 렌더링할 때만 쓰는 초기값 |

`const [값, setter] = useState(초기값)`은 배열 구조 분해 할당이다. 이름은 마음대로 지어도 되지만 `[x, setX]` 형태로 쓰는 것이 관례다.

```jsx
const onClickPlusOne = () => {
    setCount(count + 1);
};
```

`count = count + 1` 대신 `setCount(count + 1)`을 호출하면 React가 새 값을 저장하고 컴포넌트 함수를 다시 실행한다. 함수가 다시 실행될 때 `useState(0)`은 0을 다시 돌려주는 것이 아니라 **React가 저장해 둔 최신 값**을 돌려준다. 초기값은 첫 렌더링에서만 쓰인다.

전체 흐름은 이렇다.

```text
버튼 클릭 → setCount 호출 → React가 새 값 저장 → 컴포넌트 함수 재실행 → 새 count로 화면 갱신
```

## setCount를 세 번 불렀는데 왜 1만 늘까?

수업에서 가장 헷갈렸던 부분이다. 아래 코드는 +3이 될 것 같지만 +1만 된다.

```jsx
const onClickPlusThree = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
};
```

원인은 setter가 변수 `count`를 바꾸는 함수가 아니라는 점이다. 이 렌더링에서 `count`는 이미 정해진 값(예: 0)이다. 세 줄 모두 `setCount(0 + 1)`을 요청한 것과 같다. 그리고 React는 요청을 이벤트 핸들러가 끝난 뒤 한 번에 모아서 반영한다.

`setCount` 호출 뒤에 `console.log(count)`를 찍어 보면 방금 바꾼 값이 아니라 **이전 값**이 출력된다. 함수 안에서 `count`는 그 렌더링 시점에 찍힌 사진처럼 고정되어 있기 때문이다.

### 이전 값을 받는 함수형 업데이트

setter에 값 대신 함수를 넘기면 React가 "지금까지 쌓인 최신 값"을 인자로 넣어 준다.

```jsx
const onClickPlusThree = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
};
```

| 방식 | 계산에 쓰는 값 | 세 번 호출 결과 |
|------|----------------|-----------------|
| `setCount(count + 1)` | 이 렌더링의 `count` (고정) | +1 |
| `setCount(prev => prev + 1)` | 직전 요청이 반영된 값 | +3 |

React는 이 함수들을 큐에 쌓았다가 순서대로 실행한다. 0에서 시작하면 `prev`는 0 → 1 → 2로 이어지고 최종 3이 된다.

항상 함수형을 써야 하는 것은 아니다. 클릭 한 번에 한 번만 바꾸고 값이 단순하다면 `setCount(count + 1)`로도 충분하다. 같은 핸들러 안에서 여러 번 누적하거나, 타이머처럼 오래된 `count`를 붙잡고 있을 수 있는 곳에서 함수형이 필요하다.

## 정리

- 화면에 보이는 값이 바뀌어야 한다면 `let` 대신 `useState`를 쓰고, 값을 바꿀 때는 반드시 setter를 호출한다.
- setter 호출은 "값 변경"이 아니라 "리렌더링 요청"에 가깝다. 한 번의 렌더링 안에서 state 변수는 바뀌지 않는다.
- 이전 값에 의존해 여러 번 갱신할 때는 `prev => ...` 형태를 쓴다.
- 다음에 볼 것: 버튼 클릭과 입력 이벤트를 다루는 방법과, 입력값을 state로 관리하는 제어 컴포넌트.

## 더 학습하면 좋은 개념

- **렌더링과 커밋(Render and Commit)** — React가 함수를 실행해 화면 설명서를 만드는 단계와 실제 DOM에 반영하는 단계를 구분하는 개념이다. "왜 state가 바로 안 바뀌는지"를 정확히 설명해 준다.
- **state는 스냅샷이다** — 렌더링마다 state가 고정된 값으로 취급된다는 React 공식 설명이다. 오늘 `console.log(count)`가 이전 값을 찍은 현상이 이 개념으로 풀린다.
- **자동 배치(Automatic Batching)** — 여러 setter 호출을 한 번의 리렌더링으로 묶는 동작이다. React 18부터 이벤트 핸들러 밖(타이머, 비동기 콜백)에서도 적용된다. 성능과 직결된다.
- **지연 초기화(lazy initialization)** — `useState(() => 비싼계산())`처럼 초기값 계산을 함수로 넘기는 방법이다. 초기값 계산이 무거울 때 렌더링마다 반복 계산하는 낭비를 막는다.
- **useRef** — 값이 바뀌어도 리렌더링을 일으키지 않는 저장소다. "바뀌어도 화면과 무관한 값"과 state의 경계를 이해하는 데 도움이 된다.

## 참고 자료

- [React 공식 문서 - State: A Component's Memory](https://react.dev/learn/state-a-components-memory)
- [React 공식 문서 - State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- [React 공식 문서 - Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [React 공식 문서 - useState](https://react.dev/reference/react/useState)
