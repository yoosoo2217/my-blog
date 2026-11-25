---
title: "React 반복 렌더링과 key"
date: 2026-11-25
tags:
  - React
  - JavaScript
---

이름 목록을 `<li>` 세 개로 직접 적으면 데이터가 늘어날 때마다 코드를 고쳐야 한다. 그렇다고 배열 `names`를 `push`로 늘리면 화면이 바뀌지 않는다.  
오늘 수업에서는 `map`으로 배열을 화면 요소로 바꾸고, `key`가 필요한 이유를 확인하고, 배열 state에 항목을 추가·삭제하는 방법을 정리했다.

> **TL;DR**
> - 배열은 `map`으로 엘리먼트 배열로 바꿔 렌더링하고, 각 항목에는 형제 사이에서 고유한 `key`를 준다.
> - state 배열은 `push`, `splice`처럼 원본을 고치지 않고 **새 배열**을 만들어 setter에 넘긴다. 추가는 `[...배열, 새값]`, 삭제는 `filter`다.
> - key와 새 항목의 id는 데이터의 고유값을 쓴다. 인덱스나 `배열.length + 1`은 삭제가 일어나면 깨진다.

환경: React 19.3.1, Vite 8.3.6. [React props와 children]({{ site.baseurl }}/react-props-children.html), [React useState와 리렌더링]({{ site.baseurl }}/react-usestate-rerender.html)에서 쓴 개념을 이어서 쓴다.

## map으로 목록 그리기

JSX의 `{ }` 안에는 표현식을 쓸 수 있고, `map`은 새 배열을 반환하는 표현식이다. JSX는 엘리먼트가 담긴 배열을 만나면 안의 요소를 차례로 화면에 그린다.

```jsx
const [names, setNames] = useState([
    { id: 1, name: '홍길동' },
    { id: 2, name: '유관순' },
    { id: 3, name: '이순신' }
]);

<ul>
    {names.map(name => <li key={name.id}>{name.id} 번 {name.name}</li>)}
</ul>
```

`for` 문은 값이 아니라 문장이라서 `{ }` 안에 쓸 수 없다. 반복을 값으로 바꿔 주는 `map`이 JSX와 잘 맞는 이유다.

## key는 왜 필요할까?

`key` 없이 위 코드를 실행하면 콘솔에 다음 경고가 나온다.

```text
Warning: Each child in a list should have a unique "key" prop.
```

React는 화면이 바뀔 때 이전 목록과 새 목록을 비교해서 **어떤 항목이 추가·삭제·이동했는지** 찾는다. 항목에 이름표(`key`)가 없으면 순서로만 비교할 수 있어서, 목록 중간의 항목이 삭제되면 그 뒤의 모든 항목이 바뀐 것처럼 취급된다. `key`가 있으면 "id가 2인 항목만 사라졌다"고 정확히 알 수 있다.

| 규칙 | 이유 |
|------|------|
| 형제 사이에서 고유해야 한다 | 같은 key가 둘이면 어떤 항목인지 구분할 수 없다 |
| `map`이 반환하는 가장 바깥 요소에 단다 | React가 목록의 최상위 항목을 추적한다 |
| 자식 컴포넌트에서 props로 읽을 수 없다 | key는 React가 쓰는 이름표다. 값이 필요하면 `id` 같은 다른 props로 따로 넘긴다 |

### 인덱스를 key로 쓰면 안 되는 이유

`map((name, index) => <li key={index}>...)`는 경고가 사라지지만, 항목이 삭제되거나 순서가 바뀌면 같은 인덱스가 다른 데이터를 가리키게 된다. 첫 번째 항목을 지우면 원래 두 번째 항목이 `key=0`이 되어, React는 "첫 번째 항목의 내용이 바뀌었다"고 해석한다. 항목 안에 입력칸 같은 상태가 있으면 엉뚱한 항목에 값이 남는 버그가 생길 수 있다. 데이터베이스에서 온 데이터라면 PK(기본 키) 값을 key로 쓰는 것이 가장 안전하다.

목록이 절대 바뀌지 않는 정적인 경우라면 인덱스를 써도 문제가 없다. 그러나 추가·삭제가 있는 목록에서는 쓰지 않는다.

## state 배열에 항목 추가하기

입력창에 이름을 쓰고 [추가]를 누르면 목록 끝에 항목이 늘어나게 만든다.

```jsx
const [inputText, setInputText] = useState('');
const [nextId, setNextId] = useState(4);

const onClickHandler = () => {
    setNames([...names, { id: nextId, name: inputText }]);
    setNextId(nextId + 1);
    setInputText('');
};
```

### 왜 push를 쓰면 안 될까?

```jsx
names.push({ id: nextId, name: inputText });   // 원본 배열을 직접 수정
setNames(names);                               // 같은 배열을 다시 전달
```

`push`는 원본 배열에 항목을 넣을 뿐 배열의 **참조**(메모리 주소)는 그대로다. React는 이전 state와 새 state가 같은 값인지 비교해서 같으면 리렌더링을 건너뛴다. 같은 배열을 다시 넘기면 "바뀐 게 없다"고 판단하므로 화면이 갱신되지 않는다. `[...names, 새값]`은 기존 항목을 새 배열에 복사하고 끝에 새 값을 붙인 **새 배열**이라서 변경이 감지된다.

| 하고 싶은 일 | 원본을 고치는 방법 (쓰지 않음) | 새 배열을 만드는 방법 |
|--------------|-------------------------------|------------------------|
| 추가 | `push`, `unshift` | `[...배열, 새값]` |
| 삭제 | `splice`, `pop` | `filter` |
| 교체 | `arr[i] = 값` | `map`으로 해당 항목만 바꾼 새 배열 |

### id를 따로 state로 관리하는 이유

새 항목의 id를 `names.length + 1`로 만들면 안 될까? 항목이 3개일 때 id 2를 삭제하면 길이가 2가 되어 다음 id는 3이 된다. 그런데 id 3은 이미 존재하므로 key가 중복된다. 그래서 삭제와 상관없이 계속 증가하는 `nextId`를 따로 둔다. 코드 주석에도 "다음 추가 시에 id가 4가 되면 안 되기 때문에 + 1"이라고 적어 두었다.

`setNames`, `setNextId`, `setInputText`를 연달아 호출해도 리렌더링이 세 번 일어나지는 않는다. React가 한 이벤트 핸들러 안의 setter 호출을 모아서 한 번에 반영하기 때문이다. 이전 글 [React useState와 리렌더링]({{ site.baseurl }}/react-usestate-rerender.html)에서 본 동작과 같은 원리다.

## filter로 삭제하기

```jsx
const onRemove = id => {
    setNames(names.filter(name => name.id !== id));
};

<li key={name.id} onDoubleClick={() => onRemove(name.id)}>...</li>
```

`filter`는 조건이 `true`인 항목만 모아 **새 배열**을 반환한다. `name.id !== id`로 조건을 주면 지울 id를 가진 항목만 빠진 배열이 만들어지고, 원본은 그대로다. 삭제할 항목을 정확히 가리키려면 항목마다 고유한 값이 필요하며, 그 값이 앞에서 `key`로 쓴 `id`다. 같은 고유값이 key와 삭제 기준 두 곳에서 쓰이는 셈이다.

`onDoubleClick={() => onRemove(name.id)}`에서 화살표 함수로 감싼 이유는 이전 글에서 본 것처럼, `onRemove(name.id)`를 그대로 쓰면 렌더링 중에 바로 호출되기 때문이다.

## 이 코드의 한계

이번 실습 코드는 학습용이라 다음을 처리하지 않았다.

- 입력창이 비어 있어도 [추가]를 누르면 이름이 빈 항목이 생긴다. 추가 전에 `inputText.trim()`이 비었는지 확인하면 막을 수 있다. (직접 실행해 확인하지는 않았다.)
- `nextId`는 화면에 그려지지 않는 값인데 state로 두었다. 이 값이 바뀔 때마다 리렌더링이 걸린다. 화면에 영향이 없는 값은 `useRef`로 두는 방법이 있다. 오늘 수업 범위를 넘어서 적용하지는 않았다.

## 정리

- `map`으로 배열을 엘리먼트 배열로 바꾸고, 각 항목에 형제 사이에서 고유한 `key`를 준다. 변하는 목록에서는 인덱스 대신 데이터의 고유값을 쓴다.
- state 배열은 원본을 직접 고치지 않고 새 배열을 만든다. 추가는 스프레드, 삭제는 `filter`다.
- 새 id는 `length + 1`이 아니라 계속 증가하는 값으로 만든다.
- 다음에 볼 것: 컴포넌트가 화면에 나타난 뒤 작업을 하는 `useEffect`와 서버에서 데이터를 받아 목록으로 그리기.

## 더 학습하면 좋은 개념

- **불변성과 얕은 비교** — React가 state 변경을 참조 비교(`Object.is`)로 판단한다는 원리다. 오늘 `push`가 통하지 않은 이유를 설명해 주고, 중첩 객체 갱신에서 더 중요해진다.
- **재조정(Reconciliation)** — React가 이전 화면 설명서와 새 설명서를 비교해 바뀐 부분만 반영하는 알고리즘이다. `key`가 이 알고리즘의 입력이라는 점을 이해하면 key 규칙이 외울 것이 아니라 이유 있는 규칙이 된다.
- **`useRef`와 state의 구분** — 렌더링에 쓰이는 값은 state, 쓰이지 않는 값은 ref로 나누는 기준이다. `nextId`처럼 애매한 값을 판단하는 데 쓴다.
- **불변 갱신 보조 라이브러리(Immer)** — 중첩된 state를 직접 수정하는 것처럼 써도 내부에서 새 객체를 만들어 주는 라이브러리다. 객체가 깊어지면 스프레드가 길어지기 때문에 도움이 된다.
- **서버 데이터와 목록 렌더링** — 목록 데이터는 대부분 서버에서 온다. 다음 글의 `useEffect`와 `fetch` 흐름이 오늘 만든 `map` 렌더링과 합쳐진다.

## 참고 자료

- [React 공식 문서 - Rendering Lists](https://react.dev/learn/rendering-lists)
- [React 공식 문서 - Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state)
- [MDN - Array.prototype.map()](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
- [MDN - Array.prototype.filter()](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
