---
title: "React useEffect 의존성 배열과 정리 함수"
date: 2026-11-26
tags:
  - React
  - JavaScript
---

버튼을 한 번 눌렀을 뿐인데 콘솔에 "백엔드 API 호출함"이 줄줄이 찍혔다. 화면을 다시 그릴 때마다 서버에 요청을 보내고 있었던 것이다.  
오늘 수업에서는 `useEffect`의 두 번째 인자인 **의존성 배열**을 세 가지로 바꿔 가며 콘솔을 비교했고, 타이머를 통해 **정리 함수**가 왜 필요한지도 확인했다.

> **TL;DR**
> - `useEffect`는 "화면을 그린 **다음에** 할 일"을 등록하는 훅이다. API 호출, 타이머 시작처럼 화면 그리기와 직접 관계없는 작업을 여기에 둔다.
> - 두 번째 인자(의존성 배열)가 **언제 다시 실행할지**를 정한다. 생략하면 매 렌더링, `[]`이면 처음 한 번, `[count]`이면 `count`가 바뀔 때만 실행된다.
> - effect에서 함수를 `return`하면 그 함수가 정리 함수다. 타이머처럼 직접 시작한 작업은 정리 함수에서 끝내야 한다.

환경: React 19.3.1, Vite 8.3.x. 앞선 글 [React useState와 리렌더링]({{ site.baseurl }}/react-usestate-rerender.html)에서 "state가 바뀌면 컴포넌트 함수가 다시 실행된다"고 했는데, 이 글의 모든 내용은 그 사실 위에 있다.

## 왜 API 호출을 컴포넌트 본문에 쓰면 안 될까?

컴포넌트 함수 본문은 **렌더링할 때마다** 실행된다. 여기에 API 호출을 두면 렌더링할 때마다 요청이 나간다. 더 큰 문제는 응답을 state에 저장하는 순간 생긴다.

```text
렌더링 → API 호출 → 응답을 setState → 리렌더링 → API 호출 → 응답을 setState → ...
```

state가 바뀌면 리렌더링되고, 리렌더링되면 다시 호출하고, 호출하면 state가 바뀌는 무한 반복이다. 그래서 React는 "렌더링 중에는 화면을 계산하는 일만 하고, 바깥세상과 주고받는 일은 따로 등록하라"는 장치를 만들었다. 그것이 `useEffect`다.

> **부수 효과(side effect)** : 화면을 계산하는 것 말고 컴포넌트 바깥에 영향을 주거나 받는 모든 작업이다. 서버 요청, 타이머, `console.log`, 브라우저 제목 바꾸기 등이 해당한다. `useEffect`의 "effect"가 이 말이다.

수업 코드의 주석도 같은 이야기를 한다. API 응답은 언제 올지 알 수 없으므로 컴포넌트를 먼저 화면에 띄우고, 응답이 오는 대로 데이터를 끼워 넣는다.

## 기본 모양과 실행 시점

```jsx
useEffect(() => {
    // 화면을 그린 뒤에 실행할 코드
}, [의존성 배열]);
```

첫 번째 인자는 실행할 함수이고, 두 번째 인자는 "이 값들이 바뀌었을 때만 다시 실행하라"는 목록이다.

처음 보는 용어가 몇 개 나오므로 먼저 정리한다.

| 용어 | 뜻 |
|------|----|
| 마운트(mount) | 컴포넌트가 처음 화면에 나타나는 것 |
| 리렌더링(re-render) | state나 props가 바뀌어 컴포넌트 함수가 다시 실행되는 것 |
| 언마운트(unmount) | 컴포넌트가 화면에서 사라지는 것 (예: `{isShow && <Timer/>}`에서 `isShow`가 `false`가 될 때) |

## 의존성 배열 세 가지 비교

같은 컴포넌트에 세 가지를 모두 넣고 콘솔을 비교했다.

```jsx
import { useState, useEffect } from 'react';

function EffectTest() {
    const [count, setCount] = useState(0);
    const [text, setText] = useState('');

    useEffect(() => {
        console.log('[배열 없음] 렌더링 이후에 실행');
    });

    useEffect(() => {
        console.log('[빈 배열] 마운트 시 1번만 실행');
    }, []);

    useEffect(() => {
        console.log('[count] count가 바뀔 때만 실행');
    }, [count]);

    console.log('EffectTest 렌더링');

    return (
        <>
            <h2>count: {count}</h2>
            <button onClick={() => setCount(count + 1)}>+ 1</button>
            <input value={text} onChange={e => setText(e.target.value)} />
        </>
    );
}
```

| 동작 | 배열 없음 | `[]` | `[count]` |
|------|-----------|------|-----------|
| 처음 화면에 나타남 | 실행 | 실행 | 실행 |
| 버튼 클릭 (`count` 변경) | 실행 | 실행 안 함 | 실행 |
| 글자 입력 (`text` 변경) | 실행 | 실행 안 함 | 실행 안 함 |

글자를 입력하면 `text`가 바뀌어 리렌더링되므로 `EffectTest 렌더링`은 매번 찍힌다. 하지만 `[count]` effect는 `count`가 그대로이므로 건너뛴다. "렌더링은 매번 일어나지만 effect는 골라서 실행된다"는 점이 이 표의 핵심이다.

### 언제 무엇을 쓸까?

| 형태 | 쓰는 경우 | 예시 |
|------|-----------|------|
| 배열 생략 | 거의 쓰지 않는다. 매 렌더링마다 요청이 나가기 때문이다 | - |
| `[]` | 화면이 열릴 때 한 번만 가져오면 되는 데이터 | 메뉴 전체 조회, 회원 목록 |
| `[값]` | 값이 바뀔 때마다 다시 가져와야 하는 데이터 | 포켓몬 번호 변경, 검색어 변경 |

## 의존성 배열은 어떻게 "바뀌었다"를 판단할까?

React는 이전 렌더링의 배열과 이번 배열을 **같은 위치끼리 비교**한다. 비교는 `Object.is`로 하는데, 숫자와 문자열은 값이 같으면 같다고 본다. 객체와 배열은 값이 아니라 **참조(메모리 주소)**를 비교한다.

```jsx
function Example() {
    const options = { page: 1 };           // 렌더링할 때마다 새 객체가 만들어진다

    useEffect(() => {
        console.log('실행');
    }, [options]);                          // 내용은 같아도 매번 다른 객체라 매번 실행된다
}
```

그래서 의존성 배열에는 `count`, `id`, `name` 같은 **원시값(숫자·문자열·불리언)**을 넣는 것이 안전하다. 객체를 넣어야 하는 상황은 이 글의 범위를 넘으므로 "더 알아볼 것"으로 남긴다.

## 정리 함수는 왜 필요할까?

effect 안에서 `setInterval`로 타이머를 시작했다고 하자. 컴포넌트가 화면에서 사라져도 **타이머는 자동으로 멈추지 않는다.** 타이머를 시작한 것은 브라우저이지 React가 아니기 때문이다.

아래는 수업 과제(TODO 4)를 바탕으로 쓴 예시 코드다. 이 글을 쓰며 직접 실행해 확인하지는 않았으므로 콘솔 출력은 `확인 필요`다.

```jsx
function Timer() {
    const [time, setTime] = useState(() => new Date().toLocaleTimeString());

    useEffect(() => {
        const timerId = setInterval(() => {
            console.log('tick');
            setTime(new Date().toLocaleTimeString());
        }, 1000);

        return () => clearInterval(timerId);   // 정리 함수
    }, []);

    return <h2>현재 시간: {time}</h2>;
}
```

`return () => clearInterval(timerId)` 한 줄이 정리 함수다. 이 줄을 지우고 "타이머 토글" 버튼으로 `<Timer/>`를 숨기면, 화면에서는 사라졌는데 콘솔에는 `tick`이 계속 찍힌다. 이미 사라진 컴포넌트의 state를 계속 바꾸려는 코드가 돌고 있는 셈이다.

### 정리 함수가 실행되는 두 시점

| 시점 | 설명 |
|------|------|
| 언마운트될 때 | 컴포넌트가 화면에서 사라지기 직전 |
| effect가 다시 실행되기 직전 | 의존성 값이 바뀌어 effect를 다시 돌리기 전에, **이전 effect의 정리 함수**를 먼저 실행한다 |

두 번째 시점은 헷갈리기 쉽다. `[count]` effect에 정리 함수가 있다면 순서는 다음과 같다.

```text
마운트        : effect(count=0) 실행
count 1로 변경 : 정리 함수(count=0 때 만든 것) 실행 → effect(count=1) 실행
언마운트      : 정리 함수(count=1 때 만든 것) 실행
```

정리 함수는 "다음 effect를 위해 이전 effect의 흔적을 지우는 단계"라고 이해하면 된다. 이 성질은 다음 글 [React fetch 데이터 요청과 포켓몬 도감]({{ site.baseurl }}/react-fetch-useeffect-pokemon.html)에서 이전 요청을 무시하는 데 그대로 쓰인다.

## 흔한 오해

* **"의존성 배열은 effect 안에서 쓰는 값만 넣으면 된다"** : 거의 맞다. 정확히는 effect 안에서 읽는 state와 props를 모두 넣는 것이 원칙이고, 빼면 effect가 오래된 값을 보게 된다. 이를 자동으로 잡아 주는 `react-hooks/exhaustive-deps` lint 규칙이 있다.
* **"`[]`면 컴포넌트가 다시 렌더링되지 않는다"** : 아니다. 렌더링은 계속 일어난다. `[]`는 effect만 한 번 실행하게 한다.
* **"개발 중에 effect가 두 번 실행된다"** : `StrictMode`를 켠 개발 환경에서 React가 일부러 마운트 → 정리 → 마운트를 한 번 더 해 보는 동작이다. 정리 함수를 제대로 썼는지 점검하는 용도다. 수업에서 쓴 `src/main.jsx`에는 `StrictMode`가 없어서 이 동작을 직접 보지는 못했다.

## 정리

1. `useEffect`는 화면을 그린 뒤에 실행되며, 서버 요청이나 타이머 같은 부수 효과를 넣는 자리다.
2. 의존성 배열이 실행 시점을 정한다. 생략은 매번, `[]`는 한 번, `[값]`은 값이 바뀔 때다.
3. 직접 시작한 작업(타이머 등)은 정리 함수에서 끝낸다.

더 알아볼 것 : 의존성 배열에 객체나 함수를 넣어야 할 때의 처리 방법(`useMemo`, `useCallback`)

## 참고 자료

* [React 공식 문서: useEffect](https://react.dev/reference/react/useEffect)
* [React 공식 문서: Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
* [React 공식 문서: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
