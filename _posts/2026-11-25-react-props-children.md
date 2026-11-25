---
title: "React props와 children"
date: 2026-11-25
tags:
  - React
  - JavaScript
---

`<h1>안녕하세요 홍길동님</h1>`을 만드는 `Title` 컴포넌트가 있다고 하자. 이름이 바뀔 때마다 컴포넌트를 새로 만들어야 한다면 컴포넌트는 재사용할 수 없는 고정된 조각에 불과하다. React는 부모가 자식에게 값을 넘기는 통로인 props로 이 문제를 푼다.  
오늘 수업에서는 props의 기본 형태, 구조 분해 할당, `children`까지 세 단계로 코드를 바꿔 보며 정리했다.

> **TL;DR**
> - props는 부모가 자식 컴포넌트에 넘기는 값이다. 넘긴 속성들은 **객체 하나**로 묶여 함수의 첫 번째 매개변수로 들어온다.
> - props는 읽기 전용이다. 자식에서 고치려 하면 에러가 난다. 문자열이 아닌 값은 `{ }`로 넘긴다.
> - 태그 사이에 쓴 내용은 `props.children`으로 들어온다. 이를 이용하면 감싸는 틀(`Box`)과 안쪽 내용을 분리할 수 있다.

환경: React 19.3.1, Vite 8.3.6 프로젝트(`npm run dev`)에서 확인했다. 지난 글 [React JSX와 컴포넌트]({{ site.baseurl }}/react-jsx-component.html)에서 만든 함수 컴포넌트를 이어서 쓴다.

## props는 어떤 모양으로 들어올까?

부모가 `Title`에 `name` 속성을 붙여 호출하면, 자식 쪽에서는 그 값을 어떻게 받을까? 처음에는 `function Title(name)`처럼 `name`이 바로 문자열로 들어온다고 생각했는데, 실제로는 다르다.

```jsx
function Title(props) {
    console.log(props);   // { name: '홍길동' }
    return <h1>안녕하세요 {props.name}님 반갑습니다.</h1>;
}

export default function Props() {
    return (
        <>
            <Title name="홍길동"/>
            <Title name="유관순"/>
        </>
    );
}
```

콘솔에는 `{ name: '홍길동' }`이 찍힌다. 매개변수 이름이 `name`이 아니라 `props`인 이유가 여기에 있다. 속성이 여러 개여도 **하나의 객체에 키-값 쌍으로 묶여서** 첫 번째 매개변수 한 자리로 들어오기 때문에, 값을 꺼낼 때는 `props.name`처럼 점으로 접근한다.

지난 글에서 본 `createElement`와 연결해 보면 더 쉽다. `<Title name="홍길동"/>`은 `React.createElement(Title, { name: '홍길동' })`로 바뀌고, 두 번째 인자였던 속성 객체가 그대로 `Title` 함수의 인자가 된다. props는 새로운 개념이라기보다 `createElement`의 두 번째 인자를 받는 방법이다.

## 매개변수에서 바로 구조 분해하기

`props.name`, `props.age`를 반복해서 쓰면 코드가 길어진다. 객체의 키로 값을 바로 변수에 꺼내는 구조 분해 할당(destructuring)을 매개변수 자리에서 쓰면 줄어든다.

```jsx
function Profile({ name, age }) {
    return <h3>{name}님은 {age}살입니다.</h3>;
}

<Profile name="홍길동" age={20}/>
```

| 쓰는 방식 | 코드 | 특징 |
|-----------|------|------|
| props 객체 그대로 | `function Profile(props)` | 어떤 값이 들어오는지 함수 본문을 읽어야 안다 |
| 매개변수에서 구조 분해 | `function Profile({ name, age })` | 함수 선언부만 봐도 필요한 속성이 보인다 |

구조 분해 할당은 React 문법이 아니라 자바스크립트 문법이다. 그래서 변수 이름은 키 이름과 같아야 한다. `{ nam }`이라고 쓰면 `props.nam`을 꺼내므로 `undefined`가 된다.

### 문자열이 아니면 왜 중괄호를 쓸까?

위 예제에서 `name="홍길동"`은 따옴표인데 `age={20}`은 중괄호다. 따옴표로 쓰면 값은 **항상 문자열**이다. `age="20"`이면 숫자 20이 아니라 문자열 `'20'`이 들어간다. 숫자, 배열, 객체, 함수, 불리언을 넘길 때는 JSX가 "여기는 자바스크립트 표현식"이라고 알 수 있도록 `{ }`로 감싼다.

| 넘기는 값 | 쓰는 방법 | 자식에서 받는 타입 |
|-----------|-----------|--------------------|
| 문자열 | `age="20"` | `string` |
| 숫자 | `age={20}` | `number` |
| 배열 | `list={[1, 2, 3]}` | `array` |
| 함수 | `onClick={() => {}}` | `function` |

## props를 고치면 왜 안 될까?

수업 자료에는 "props는 읽기 전용이므로 자식 컴포넌트에서 수정하지 않는다"라고 되어 있다. 규칙으로만 외우기보다 직접 확인하는 편이 낫다고 생각해서, 설치된 React 19.3.1에서 엘리먼트의 props 객체를 확인했다.

```js
const el = React.createElement('h1', { name: 'a' });
Object.isFrozen(el.props);   // true
el.props.name = 'b';         // strict mode에서 TypeError
```

```text
Cannot assign to read only property 'name' of object '#<Object>'
```

개발 모드의 React는 props 객체를 동결(freeze)해서 실제로 수정을 막는다. 이렇게 막아 둔 이유는 데이터가 **부모에서 자식으로 한 방향**으로만 흐르게 하기 위해서다. 자식이 props를 마음대로 고치면, 부모가 넘긴 값과 화면에 보이는 값이 달라져서 값을 누가 바꿨는지 추적하기 어려워진다. 값을 바꿔야 한다면 그 값을 가진 부모가 바꾸거나, 컴포넌트 안에서 바뀌는 값(state)으로 따로 관리한다. (state는 다음 글에서 정리한다.)

위 동결은 개발 모드 기준으로 확인한 결과다. 배포 빌드에서도 같은 동작을 하는지는 확인하지 않았다.

## children: 태그 사이에 쓴 내용

HTML에서 `<div>여기 내용</div>`처럼 태그 사이에 내용을 쓰는 것처럼, 컴포넌트 태그 사이에 쓴 내용도 props로 들어온다. 이때의 키 이름이 `children`이다.

{% raw %}
```jsx
function Box({ children }) {
    return <div style={{ border: '1px solid orangered', padding: 10, margin: 5 }}>{children}</div>;
}

<Box>텍스트 노드</Box>
<Box><Profile name="유관순" age={30}/></Box>
```
{% endraw %}

`Box`는 안에 무엇이 들어올지 모른 채 테두리와 여백만 책임진다. 첫 번째 `Box`의 `children`은 문자열이고, 두 번째는 `Profile` 엘리먼트다. 이처럼 어떤 타입이든 들어올 수 있다.

`name`이나 `age`처럼 이름이 정해진 props로 넘기면 `Box`가 알아야 하는 값이 늘어난다. 반면 `children`을 쓰면 "틀"과 "내용"이 분리되어서, 카드, 모달, 레이아웃처럼 안쪽 내용이 매번 다른 컴포넌트에 알맞다.

### 흔한 실수

| 실수 | 결과 | 바로잡기 |
|------|------|----------|
| `age="20"`으로 쓰고 숫자 연산 | 문자열이 들어와서 `age + 1`이 `'201'`이 된다 | `age={20}` |
| 컴포넌트 안에서 `props.name = ...` | 개발 모드에서 TypeError | 부모에서 바꾸거나 state로 관리 |
| `function Box(children)` | `children`에 props 객체 전체가 들어온다 | `function Box({ children })` |
| 소문자 `<profile .../>` | 컴포넌트가 아니라 HTML 태그로 해석된다 | 대문자로 시작하는 이름 |

## 정리

- props는 부모가 자식에게 넘기는 값이고, 자식에서는 객체 하나(`props`)로 받는다. 구조 분해 할당을 쓰면 필요한 속성이 선언부에 드러난다.
- 문자열 외의 값은 `{ }`로 넘기고, props는 읽기 전용이다. 개발 모드에서는 수정이 에러로 막힌다.
- 태그 사이의 내용은 `children`으로 들어온다. 감싸는 틀을 재사용할 때 쓴다.
- 다음에 볼 것: 컴포넌트 안에서 바뀌는 값을 다루는 state.

## 더 학습하면 좋은 개념

- **props 기본값** — 부모가 값을 안 넘겼을 때 쓸 값을 정하는 방법이다. 구조 분해 단계에서 `{ name = '손님' }`처럼 쓸 수 있다. 값이 빠졌을 때 `undefined`가 화면에 그대로 나오는 것을 막는다.
- **스프레드로 props 전달** — 객체를 `<Profile {...user}/>`처럼 한 번에 펼쳐 넘기는 방법이다. 속성이 많아질수록 코드가 줄지만, 어떤 값이 넘어가는지 가려질 수 있다.
- **단방향 데이터 흐름과 상태 끌어올리기** — 자식이 부모의 값을 바꾸고 싶을 때는 부모가 함수를 props로 내려 준다. 함수도 props로 넘길 수 있다는 점이 이 패턴의 출발점이다.
- **컴포넌트 합성(composition)** — `children`을 활용해 상속 대신 조합으로 재사용하는 React의 기본 설계 방식이다. 지난 글의 조합 개념이 props와 만나 완성된다.
- **PropTypes와 TypeScript** — props의 타입을 코드로 검사하는 방법이다. props 오타나 타입 실수를 실행 전에 잡을 수 있다.

## 참고 자료

- [React 공식 문서 - Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- [React 공식 문서 - Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [MDN - 구조 분해 할당](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/Destructuring)
