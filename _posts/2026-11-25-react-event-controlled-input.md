---
title: "React 이벤트 처리와 제어 컴포넌트"
date: 2026-11-25
tags:
  - React
  - JavaScript
---

회원가입 폼에 입력칸이 두 개 있고 `useState`로 값을 관리하려는데, 이름을 쓰면 이메일이 사라지는 현상이 생겼다. `onChange` 핸들러를 하나만 써서 두 입력칸을 처리하려다 만난 문제였다.  
오늘 수업에서는 React의 이벤트 문법, input을 state에 연결하는 제어 컴포넌트, 객체 state를 올바르게 갱신하는 방법을 정리했다.

> **TL;DR**
> - 이벤트 속성은 카멜 표기(`onClick`)이고, 코드 문자열이 아니라 **함수**를 넘긴다. 이벤트는 DOM 요소에만 연결된다.
> - input의 `value`를 state로 두고 `onChange`에서 state를 바꾸는 방식을 제어 컴포넌트라고 한다.
> - 입력칸이 여러 개면 객체 state 하나와 핸들러 하나로 관리한다. 이때 `...form`(스프레드)과 `[e.target.name]`(계산된 키)이 핵심이다.

환경: React 19.3.1, Vite 8.3.6. 앞선 글 [React useState와 리렌더링]({{ site.baseurl }}/react-usestate-rerender.html)에서 배운 `useState`를 그대로 쓴다.

## 이벤트 속성은 HTML과 무엇이 다를까?

HTML에서는 `<button onclick="alert('hi')">`처럼 문자열로 코드를 적는다. React(JSX)에서는 규칙이 두 가지 바뀐다.

| 구분 | HTML | JSX |
|------|------|-----|
| 속성 이름 | `onclick`, `onchange` | `onClick`, `onChange` (카멜 표기) |
| 값 | 실행할 코드 문자열 | 함수 (`{ }`로 전달) |

이름이 카멜 표기인 이유는 JSX가 결국 자바스크립트 객체(props)가 되기 때문이다. 지난 글들에서 본 `className`과 같은 흐름이다.

### 함수를 넘기는 것과 호출하는 것은 다르다

```jsx
<button onClick={onResetHandler}>초기화</button>     {/* 함수를 넘김 */}
<button onClick={onResetHandler()}>초기화</button>   {/* 렌더링 중에 바로 호출됨 */}
```

뒤쪽처럼 괄호를 붙이면 클릭할 때가 아니라 **렌더링되는 순간**에 실행되고, 그 반환값(`undefined`)이 `onClick`에 들어간다. 인자를 넘겨야 할 때는 `onClick={() => onRemove(id)}`처럼 화살표 함수로 한 번 감싼다.

### 컴포넌트에 onClick을 주면 어떻게 될까?

수업에서 짚은 내용이다. `onClick`은 `button`, `input` 같은 DOM 요소에서만 이벤트로 동작한다. 내가 만든 컴포넌트에 쓰면 그냥 `onClick`이라는 이름의 props일 뿐이다.

```jsx
<MyButton onClick={handler}/>   {/* MyButton이 props로 받아 내부의 button에 연결해야 동작 */}
```

`MyButton` 안에서 `<button onClick={props.onClick}>`처럼 다시 연결해야 한다. 이름이 같아서 자동으로 연결될 것 같지만 그렇지 않다.

## input의 값을 state로 관리하기 (제어 컴포넌트)

HTML의 input은 입력값을 브라우저가 가진다. 제어 컴포넌트(controlled component)에서는 그 값을 **React state가 가진다.**

```jsx
const [text, setText] = useState('');

<input value={text} onChange={e => setText(e.target.value)} />
```

흐름은 다음과 같다.

1. 사용자가 글자를 입력하면 `onChange`가 호출된다.
2. `e.target.value`(입력칸의 현재 값)로 `setText`를 호출한다.
3. 리렌더링되며 `value={text}`에 새 값이 들어가 화면에 반영된다.

`value`만 주고 `onChange`를 빼면 입력칸에 아무것도 입력되지 않는다. 화면이 항상 state 값을 보여 주는데, state를 바꾸는 코드가 없기 때문이다. 이 구조 덕분에 "초기화 버튼을 누르면 입력칸도 비운다" 같은 동작이 state만 바꾸면 되는 일이 된다.

참고로 React의 `onChange`는 브라우저 기본 `change` 이벤트(입력칸에서 포커스를 벗어날 때 발생)와 달리 **글자를 입력할 때마다** 호출된다.

## 입력칸이 여러 개라면: 객체 state 하나로 관리

입력칸마다 `useState`를 만들어도 되지만, 항목이 늘면 핸들러도 늘어난다. 객체 하나와 핸들러 하나로 묶으면 코드가 줄어든다.

```jsx
const [form, setForm] = useState({ username: '', email: '' });

const onChangeHandler = e => {
    setForm({
        ...form,
        [e.target.name]: e.target.value
    });
};

<input name="username" placeholder="이름" value={form.username} onChange={onChangeHandler}/>
<input name="email" placeholder="이메일" value={form.email} onChange={onChangeHandler}/>
```

여기서 문법이 두 가지 나온다.

| 문법 | 역할 | 예 |
|------|------|-----|
| `...form` (스프레드) | 기존 객체의 키-값을 새 객체에 복사한다 | `{ username: '', email: '' }`이 펼쳐진다 |
| `[e.target.name]` (계산된 프로퍼티 이름) | 대괄호 안의 **값**이 키가 된다 | `name`이 `'email'`이면 키는 `email` |

`input`의 `name` 속성이 `'email'`일 때 `e.target.name`은 `'email'`이고, 위 코드는 `{ ...form, email: 입력값 }`으로 계산된다. 그래서 입력칸마다 핸들러를 따로 만들지 않아도 된다. 이 방식이 동작하려면 input의 `name`이 state의 키와 **철자까지 같아야 한다.**

### 스프레드를 빼면 어떻게 될까?

처음 수업 주석에는 "기존 값이 초기화된다"라고 적혀 있었는데, 정확히 말하면 조금 다르다. React의 setter는 객체를 **병합하지 않고 통째로 교체**한다.

```jsx
setForm({ [e.target.name]: e.target.value });   // ...form 없이
```

이름을 입력하면 새 state는 `{ username: '홍' }`뿐이라서 `email` 키 자체가 사라진다. `form.email`은 `''`가 아니라 `undefined`가 되고, `value={undefined}`가 된 input은 제어 컴포넌트가 아닌 일반 input으로 취급된다. 개발 모드에서는 제어 상태에서 비제어 상태로 바뀐다는 경고가 콘솔에 나올 수 있다. 이 경고 문구는 이번 실습에서 직접 확인하지 않아 **확인 필요**로 남긴다.

기존 state 객체를 직접 고치는 방식(`form.username = '홍'`)도 안 된다. React는 새 객체가 들어와야 "바뀌었다"고 판단하기 때문이다. 이 부분은 다음 글 반복 렌더링에서 배열로 한 번 더 다룬다.

## 초기화 버튼

```jsx
const onResetHandler = () => {
    setForm({ username: '', email: '' });
};
```

초기화 버튼은 state를 초기값과 같은 모양으로 바꾸는 것이 전부다. input에 `value={form.username}`을 연결해 두었기 때문에 입력칸의 글자도 같이 사라진다. `value`를 연결하지 않았다면 state만 비워지고 입력칸의 글자는 남는다.

## 정리

- 이벤트 속성은 카멜 표기이고 함수를 넘긴다. `onClick={handler()}`처럼 호출하면 렌더링 중에 실행된다.
- 제어 컴포넌트는 `value={state}`와 `onChange={state 변경}` 두 개가 한 쌍이다.
- 객체 state를 갱신할 때는 `...기존값`으로 복사하고, 바뀐 키만 덮어쓴다. 입력칸이 여러 개면 `[e.target.name]`으로 핸들러를 하나로 합칠 수 있다.
- 다음에 볼 것: 배열 state를 `map`으로 그리고, 추가·삭제하는 방법.

## 더 학습하면 좋은 개념

- **비제어 컴포넌트와 `useRef`** — 입력값을 state가 아니라 DOM이 가지게 하는 방식이다. 제어 컴포넌트가 항상 정답은 아니며, 파일 업로드처럼 React가 값을 제어할 수 없는 경우를 이해하는 데 필요하다.
- **합성 이벤트(SyntheticEvent)** — React가 브라우저마다 다른 이벤트 객체를 감싸 같은 모양으로 제공하는 객체다. 오늘 쓴 `e`의 정체이고, `e.target`, `e.preventDefault()`가 어떻게 동작하는지 설명해 준다.
- **이벤트 버블링과 `stopPropagation`** — 자식에서 발생한 이벤트가 부모로 전달되는 동작이다. 컴포넌트가 중첩될수록 "왜 부모 핸들러도 실행되지?"라는 문제로 만나게 된다.
- **폼 제출 처리(`onSubmit`과 `preventDefault`)** — 오늘은 버튼만 눌러 초기화했지만, 실제 회원가입은 `form`의 제출 이벤트를 다룬다. 페이지 새로고침을 막는 기본 패턴이다.
- **불변성(immutability)** — state를 직접 고치지 않고 새 값으로 교체한다는 원칙이다. 스프레드를 쓰는 이유가 여기에 있고, 중첩 객체를 다룰 때 더 중요해진다.

## 참고 자료

- [React 공식 문서 - Responding to Events](https://react.dev/learn/responding-to-events)
- [React 공식 문서 - Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state)
- [React 공식 문서 - Updating Objects in State](https://react.dev/learn/updating-objects-in-state)
- [React 공식 문서 - `<input>`](https://react.dev/reference/react-dom/components/input)
- [MDN - 전개 구문](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
