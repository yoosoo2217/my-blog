---
title: "React JSX와 컴포넌트"
date: 2026-11-23
tags:
  - React
  - JavaScript
---

화면에 `<h1>`을 하나 띄우는 데 `React.createElement('h1', {className:'hi'}, 'helloworld!!')`를 매번 호출해야 한다면 요소가 열 개만 돼도 코드를 읽기 어려워진다. React는 이 불편함을 JSX라는 문법과 컴포넌트라는 단위로 해결한다.  
오늘 수업에서는 `createElement`로 시작해 JSX, Fragment, 함수 컴포넌트, 컴포넌트 조합까지 한 단계씩 바꿔 보며 각 단계가 왜 필요한지 확인했다.

> **TL;DR**
> - 엘리먼트(element)는 "화면에 이렇게 그려 달라"는 설명서이고, `createElement`가 이를 만든다. JSX는 같은 일을 HTML처럼 쓰게 해 주는 문법이며, Babel이 `createElement` 호출로 바꿔 준다.
> - 컴포넌트는 엘리먼트를 반환하는 함수다. 한 컴포넌트는 최상위 요소를 하나만 반환할 수 있어서, 불필요한 `div` 없이 묶을 때 Fragment(`<>...</>`)를 쓴다.
> - 작은 컴포넌트를 `<Header/>`처럼 다른 컴포넌트 안에 배치해 큰 화면을 만드는 방식이 조합(composition)이다.

환경: React 18.3.1, ReactDOM 18.3.1, `@babel/standalone`을 CDN `script` 태그로 불러온 HTML 파일이다. 별도 빌드 도구 없이 브라우저에서 바로 열어 확인했다.

## createElement와 가상 DOM

React 문서 흐름에서 가장 먼저 나오는 코드는 `createElement`다.

```html
<div id="root"></div>
<script>
    const hiElement = React.createElement('h1', {className:'hi'}, 'helloworld!!');

    ReactDOM.createRoot(document.getElementById('root')).render(hiElement);
</script>
```

| 인자 | 의미 | 위 예제의 값 |
|------|------|--------------|
| 첫 번째 | 만들 요소의 타입 | `'h1'` |
| 두 번째 | 요소의 속성(props) | `{className:'hi'}` |
| 세 번째 | 자식 요소 또는 텍스트 | `'helloworld!!'` |

여기서 헷갈린 점이 하나 있었다. `createElement`가 진짜 `<h1>` 태그를 만든다고 생각했는데, 그렇지 않다.

### 엘리먼트는 화면 설명서다

`createElement`가 돌려주는 값은 DOM 노드가 아니라 **"h1 타입에 className이 hi이고 자식은 이 텍스트"라는 내용을 담은 평범한 자바스크립트 객체**다. 이 객체들로 이루어진 구조를 가상 DOM(Virtual DOM)이라고 부른다. 메모리 위에서 코드로 표현한 DOM이다.

실제 DOM 노드는 `render`가 호출될 때 React가 이 설명서를 읽고 만든다. 이렇게 한 단계를 거치는 이유는, 설명서끼리는 값싸게 비교할 수 있어서 화면이 바뀔 때 달라진 부분만 실제 DOM에 반영하기 쉽기 때문이다. 이 비교 과정은 이번 수업 범위를 넘어서 자세히 다루지 않았다.

속성 이름이 `class`가 아니라 `className`인 이유도 여기서 나온다. 엘리먼트는 자바스크립트 객체이고, `class`는 자바스크립트의 예약어(클래스 선언에 쓰는 키워드)라서 속성 이름으로 쓰기 곤란하다. 그래서 DOM 프로퍼티 이름인 `className`을 쓴다.

## JSX는 createElement를 대신 써 주는 문법이다

수업 자료에 있던 대응 관계는 이렇다.

```html
<h1 class='test'>안농!!</h1>
```
```js
React.createElement('h1', {className:'test'}, '안농!!')
```

JSX(JavaScript XML)는 아래처럼 쓰게 해 준다.

```jsx
const element = <h1 className='test'>하이염!!{formatName(user)}</h1>;
```

문제는 브라우저가 JSX 문법을 이해하지 못한다는 점이다. 그래서 Babel이 JSX를 `createElement` 호출로 바꿔 주는 **트랜스파일링**(한 문법을 다른 문법으로 변환)을 맡는다. 실습에서는 두 가지를 지켰다.

1. `head`에 `@babel/standalone` script를 추가한다.
2. JSX를 쓰는 script 태그에 `type="text/babel"`을 붙인다.

`type="text/babel"`이 없으면 브라우저가 JSX를 그대로 자바스크립트로 읽다가 문법 에러를 낸다. Babel이 어느 script를 변환해야 하는지 이 속성으로 알아보기 때문이다.

### 중괄호 안에는 표현식을 쓴다

JSX 안에서 `{ }`를 쓰면 자바스크립트 **표현식**(값 하나로 계산되는 코드)을 넣을 수 있다.

```jsx
function formatName(user){
    return `${user.lastName} ${user.firstName}`;
}

const user = { firstName : '홍', lastName : '길동' };

const element = <h1 className='test'>하이염!!{formatName(user)}</h1>;
```

함수 호출 결과나 객체의 프로퍼티는 값이 되므로 넣을 수 있다. 반면 `if`문이나 `for`문은 값이 아니라 문장(statement)이라서 중괄호 안에 직접 쓸 수 없다. 이 부분은 오늘 파일에서 직접 실행해 보지 않았으므로 **확인 필요**로 남긴다.

## Fragment는 왜 필요할까?

JSX를 쓰다가 만나는 첫 번째 규칙은 "최상위 엘리먼트는 하나여야 한다"는 것이다. 아래 코드는 문법 에러가 난다.

```jsx
// 문법 에러
const element = (
    <h1>안녕 얘들아~ 나 길은지야~</h1>
    <h3>제 전화번호는 {user.phone} 입니다.</h3>
);
```

이 규칙은 JSX가 `createElement` 호출로 바뀐다는 사실을 떠올리면 이해된다. 함수는 값을 하나만 반환한다. 형제 요소 두 개를 나란히 쓰면 반환할 값이 두 개가 되어버리는 셈이다. 그래서 하나로 감싸야 한다.

| 방법 | 코드 | 특징 |
|------|------|------|
| `div`로 감싸기 | `<div>...</div>` | 동작하지만 실제 DOM에 불필요한 `div`가 생긴다 |
| Fragment | `<>...</>` | 묶는 역할만 하고 DOM에는 아무 요소도 만들지 않는다 |

```jsx
const element = (
    <>
        <h1>안녕 얘들아~ 나 길은지야~</h1>
        <h3>제 전화번호는 {user.phone} 입니다.</h3>
    </>
);
```

`<></>`는 `React.Fragment`의 줄임 표기다. 레이아웃에 영향을 주는 `div`가 끼어들지 않으므로, 컴포넌트를 여러 겹 조합할수록 이 차이가 중요해진다.

## 함수 컴포넌트

컴포넌트는 **엘리먼트를 반환하는, 화면 구성 조각 단위**다. 함수로 만들면 함수 컴포넌트가 된다.

```jsx
function Header() {
    return(
        <>
            <h1>안녕하세요. 박헤더입니다.</h1>
            <h3>사이트 이름??~</h3>
        </>
    )
}

ReactDOM.createRoot(document.getElementById('root'))
    .render(<Header/>);
```

`render(React.createElement(Header))`와 `render(<Header/>)`는 같은 의미다. 앞에서 `createElement`의 첫 번째 인자에 `'h1'` 같은 문자열을 넣었는데, 컴포넌트는 그 자리에 **함수 자체**를 넣는다는 차이만 있다.

### 이름은 왜 대문자로 시작할까?

수업에서는 "암묵적 규칙"이라고 배웠는데, JSX에서는 실제로 동작을 가르는 기준이다.

| 쓴 모양 | React가 이해하는 방식 |
|---------|----------------------|
| `<Header/>` | 컴포넌트. `Header` 함수를 호출한다 |
| `<header/>` | 일반 HTML 태그 `header` |

JSX는 태그 이름이 대문자로 시작하면 변수로 보고, 소문자면 HTML 태그 이름 문자열로 본다. 그래서 `<header/>`라고 쓰면 `Header` 함수가 있어도 호출되지 않고 `header` 태그가 만들어진다.

## 컴포넌트 조합

컴포넌트를 만드는 이유는 화면을 쪼개서 재사용하고 읽기 쉽게 만들기 위해서다. 오늘 마지막 실습은 `Header`, `NavBar`, `Main`, `Footer`를 만들고 `MainLayout` 하나로 묶는 것이었다.

{% raw %}
```jsx
function MainLayout(){
    return(
        <div style = {{border : '1px solid red', backgroundColor : 'green'}}>
            <Header/>
            <NavBar/>
            <Main/>
            <Footer/>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root'))
    .render(<MainLayout/>);
```
{% endraw %}

| 컴포넌트 | 맡은 부분 |
|----------|-----------|
| `Header` | 사이트 상단 소개 |
| `NavBar` | 내비게이션 영역 |
| `Main` | 본문. `user` 객체의 값을 `{user.name}`처럼 출력한다 |
| `Footer` | 하단 영역 |
| `MainLayout` | 위 네 개를 순서대로 배치하고 테두리와 배경색을 입힌다 |

이렇게 컴포넌트가 다른 컴포넌트를 포함해서 큰 화면을 만드는 방식이 **조합**(composition)이다. `render`에는 최상위 컴포넌트 `MainLayout` 하나만 넘기고, 그 안의 구조는 `MainLayout`이 책임진다. 나중에 푸터만 바꾸고 싶으면 `Footer` 함수만 고치면 된다.

### 중괄호가 두 겹인 이유

{% raw %}`style = {{border : '1px solid red', backgroundColor : 'green'}}`{% endraw %}에서 중괄호가 두 번 나온다. 바깥 중괄호는 "여기부터 자바스크립트 표현식"이라는 JSX 표시이고, 안쪽 중괄호는 **객체 리터럴** 자체다. 즉 `style`에는 객체를 넘기고 있는 것이다. 객체의 키는 CSS의 `background-color` 대신 카멜 케이스인 `backgroundColor`로 쓴다. 하이픈이 들어간 이름은 자바스크립트 프로퍼티 이름으로 바로 쓸 수 없기 때문이다.

## 정리

- `createElement`는 엘리먼트(화면 설명서 객체)를 만들고, JSX는 그 호출을 HTML처럼 읽히게 쓴 문법이다. Babel이 변환을 맡는다.
- 컴포넌트는 값을 하나만 반환하므로 최상위 요소가 하나여야 한다. 불필요한 `div`가 싫으면 Fragment를 쓴다.
- 컴포넌트 이름은 대문자로 시작해야 React가 함수 호출로 인식한다. 작은 컴포넌트를 조합해 큰 화면을 만든다.

## 더 학습하면 좋은 개념

- **props** — 컴포넌트에 값을 전달하는 방식이다. 오늘 `Header`와 `Main`은 값이 코드에 고정되어 있는데, props를 배우면 같은 컴포넌트를 다른 데이터로 재사용할 수 있다.
- **children** — 컴포넌트 태그 사이에 넣은 내용을 받는 props다. 오늘은 `MainLayout`이 컴포넌트를 직접 나열했지만, `children`을 쓰면 레이아웃과 내용을 분리할 수 있다.
- **리스트 렌더링과 `key`** — 배열을 요소 여러 개로 바꾸는 방법이다. 데이터 목록을 화면에 그릴 때 가장 먼저 필요해진다.
- **상태(state)** — 화면이 시간에 따라 바뀌게 하는 개념이다. 오늘 만든 화면은 한 번 그리고 끝이라, 사용자 동작에 반응하려면 필요하다.
- **빌드 도구(Vite 등)** — 오늘은 브라우저에서 Babel이 변환했지만, 실제 프로젝트는 빌드 단계에서 미리 변환한다. 브라우저에서 변환하면 로딩이 느려서 학습용으로만 적합하다.

## 참고 자료

- [React 공식 문서 - Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx)
- [React 공식 문서 - Your First Component](https://react.dev/learn/your-first-component)
- [React 공식 문서 - Fragment](https://react.dev/reference/react/Fragment)
- [React 공식 문서 - createElement](https://react.dev/reference/react/createElement)
- [Babel 공식 문서 - @babel/standalone](https://babeljs.io/docs/babel-standalone)
