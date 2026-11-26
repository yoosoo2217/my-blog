---
title: "React fetch 데이터 요청과 포켓몬 도감"
date: 2026-11-26
tags:
  - React
  - JavaScript
---

포켓몬 도감의 "다음" 버튼을 빠르게 연타했더니 화면의 번호는 5번인데 3번 포켓몬이 떠 있었다. 요청은 분명 순서대로 보냈는데 응답이 뒤섞인 것이다.  
오늘 수업에서는 `fetch`와 `useEffect`를 묶어 서버 데이터를 화면에 띄우는 패턴을 배우고, 그 위에서 **이전 요청의 응답을 무시하는 방법**까지 포켓몬 도감으로 확인했다.

> **TL;DR**
> - 데이터를 불러오는 기본 패턴은 `useState`로 빈 값을 만들고 → `useEffect`에서 `fetch` → 응답을 `setState`로 저장하는 세 단계다.
> - `fetch`는 응답 본문까지 두 번 기다려야 한다. `await fetch(...)`, `await res.json()` 모두 `await`가 필요하다.
> - 요청 값(예: 포켓몬 번호)이 바뀌면 의존성 배열에 넣고, 정리 함수에서 `ignore = true`로 이전 요청의 결과를 버린다.

환경: React 19.3.1, Vite 8.3.x, 브라우저 내장 `fetch`. 앞선 글 [React useEffect 의존성 배열과 정리 함수]({{ site.baseurl }}/react-useeffect-dependency-cleanup.html)의 내용을 전제로 한다.

## fetch로 데이터를 받아 화면에 그리기

연습용 API인 `https://jsonplaceholder.typicode.com/users`로 회원 목록을 그렸다. 흐름은 세 단계다.

1. 데이터를 담을 state를 빈 값으로 만든다. `useState([])`
2. 마운트될 때 한 번만 API를 호출한다. `useEffect(() => {...}, [])`
3. 응답이 오면 state에 저장한다. 그러면 리렌더링되며 목록이 그려진다.

```jsx
import { useEffect, useState } from 'react';

function UserList() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        async function loadUsers() {
            const res = await fetch('https://jsonplaceholder.typicode.com/users');
            const json = await res.json();
            setUsers(json);
        }
        loadUsers();
    }, []);

    if (users.length === 0) return <h3>불러오는 중...</h3>;

    return (
        <div>
            {users.map(user => <UserCard key={user.id} user={user} />)}
        </div>
    );
}
```

`UserCard`는 사용자 한 명의 이름, 이메일, 전화번호를 그리는 컴포넌트다. `UserList`는 API를 호출해 데이터를 받아 오는 역할만 하고, 한 명을 그리는 일은 `UserCard`에게 props로 넘긴다. 이 역할 분리는 [React props와 children]({{ site.baseurl }}/react-props-children.html), [React 반복 렌더링과 key]({{ site.baseurl }}/react-list-rendering-key.html)에서 배운 내용이 그대로 쓰인 것이다.

### 처음에는 users가 빈 배열이다

컴포넌트는 응답이 오기 **전에** 먼저 한 번 그려진다. 이때 `users`는 초기값 `[]`이므로 `users.length === 0`이면 로딩 문구를 보여 주고, 응답이 도착해 `setUsers`가 호출되면 리렌더링되며 목록으로 바뀐다. 로딩 처리를 빼면 빈 화면이 잠깐 보이거나, `users[0].name`처럼 아직 없는 값을 읽다가 에러가 난다.

## fetch는 왜 await가 두 번 필요할까?

```jsx
const res = await fetch(url);      // 1단계: 응답의 "헤더"가 도착하면 끝난다
const json = await res.json();     // 2단계: 응답의 "본문"을 읽어 객체로 바꾼다
```

서버는 응답을 헤더(상태 코드 등)와 본문(데이터)으로 나눠 보낸다. `fetch`는 헤더가 오면 먼저 `Response` 객체를 돌려주고, 본문은 아직 오는 중일 수 있다. 그래서 본문을 읽는 `res.json()`도 시간이 걸리는 작업이고, 이것도 Promise를 반환한다.

> **Promise** : "지금은 값이 없지만 나중에 값을 줄게"라는 약속 객체다. `await`는 그 약속이 이행될 때까지 기다렸다가 값을 꺼내 준다. 자세한 내용은 [Promise, async/await, fetch]({{ site.baseurl }}/javascript-promise-async-await-fetch.html)에 정리했다.

### 괄호를 빼먹으면 생기는 일

```jsx
const json = await res.json;     // 잘못된 코드: 괄호가 없다
const json = await res.json();   // 올바른 코드
```

`res.json`은 함수 자체를 가리키고, `res.json()`은 그 함수를 **호출**한다. 괄호가 없으면 본문을 읽는 일이 시작되지 않으므로 `json`에는 데이터가 아니라 함수가 들어간다. 콘솔에서 `json`을 찍었을 때 `ƒ json() { [native code] }`처럼 나오면 이 실수를 의심하면 된다. 이 글을 쓰며 수업 파일을 읽어 보니 `await res.json;`으로 괄호가 빠져 있었다. 괄호를 붙였을 때의 정확한 화면 동작은 직접 실행해 확인하지 않았으므로 `확인 필요`다.

## useEffect 콜백은 왜 async로 만들 수 없을까?

```jsx
useEffect(async () => {          // 하지 마세요
    const res = await fetch(url);
}, []);
```

`async` 함수는 항상 Promise를 반환한다. 그런데 `useEffect`의 콜백이 반환할 수 있는 것은 **정리 함수뿐**이다. React가 Promise를 정리 함수로 오해하게 되므로, 수업에서는 effect 안에 `async` 함수를 따로 만들어 바로 호출하는 방식을 썼다.

```jsx
useEffect(() => {
    async function loadUsers() { /* ... */ }
    loadUsers();
}, []);
```

## 의존성 배열을 빼면 무한 반복된다

```text
요청 → setUsers → 리렌더링 → effect 다시 실행 → 요청 → setUsers → ...
```

의존성 배열을 생략하면 effect가 매 렌더링 뒤에 실행된다. 응답을 state에 저장하면 리렌더링이 일어나고, 리렌더링되면 또 요청이 나간다. 한 번만 가져오면 되는 데이터에는 반드시 `[]`를 붙인다.

## 포켓몬 도감: 값이 바뀔 때마다 다시 요청하기

PokeAPI(`https://pokeapi.co/api/v2/pokemon/1`)는 회원가입이나 API 키 없이 쓸 수 있다. 번호를 바꾸면 해당 번호의 포켓몬 정보가 온다. "이전/다음 버튼을 누를 때마다 새로 호출"해야 하므로 **번호(`id`)를 의존성 배열에 넣는다.**

```jsx
export default function Pokemon() {
    const [id, setId] = useState(1);
    const [pokemon, setPokemon] = useState(null);

    useEffect(() => {
        async function loadPokemon() {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const json = await res.json();
            setPokemon(json);
        }
        loadPokemon();
    }, [id]);

    return (
        <>
            <h1>포켓몬 도감</h1>
            <button onClick={() => setId(prev => prev - 1)} disabled={id === 1}>이전</button>
            <span> No.{id} </span>
            <button onClick={() => setId(prev => prev + 1)}>다음</button>

            {pokemon ? <PokemonCard pokemon={pokemon} /> : <h3>불러오는 중...</h3>}
        </>
    );
}
```

이 한 파일에 지금까지 배운 것이 모두 들어 있다.

| 배운 것 | 이 코드에서 쓰인 곳 |
|---------|--------------------|
| state | 현재 번호 `id`, 받아온 데이터 `pokemon` |
| event | 이전/다음 버튼의 `onClick` |
| useEffect | `id`가 바뀔 때마다 다시 요청 (`[id]`) |
| props | 받아온 데이터를 `PokemonCard`에 전달 |
| 반복 렌더링 | `pokemon.types.map(...)`으로 타입 목록 출력 |

### 이전 버튼의 disabled

`disabled={id === 1}`은 1번에서 "이전"을 눌러 0번이나 음수 번호를 요청하는 일을 막는다. 없는 번호를 요청하면 서버가 에러를 주기 때문이다. 다음 버튼에는 상한을 두지 않았는데, 전체 포켓몬 수를 넘기면 같은 문제가 생기므로 개선할 여지가 있다.

### 숫자 단위 변환

PokeAPI의 `height`는 데시미터(0.1m), `weight`는 헥토그램(0.1kg) 단위다. 그래서 `pokemon.height / 10`을 m로, `pokemon.weight / 10`을 kg로 표시했다. 출처는 [PokeAPI 문서](https://pokeapi.co/docs/v2#pokemon)다.

## 버튼을 연타하면 왜 엉뚱한 포켓몬이 뜰까?

"다음"을 빠르게 두 번 누르면 `id`가 1 → 2 → 3으로 바뀌고 요청도 두 개가 나간다.

```text
요청 A (id=2) ──────────────────▶ 응답이 늦게 도착
요청 B (id=3) ─────────▶ 응답이 먼저 도착
```

네트워크는 요청한 순서대로 응답을 준다고 보장하지 않는다. B의 응답이 먼저 와서 `setPokemon(3번)`을 하고, 그 뒤에 A의 응답이 와서 `setPokemon(2번)`을 하면 **화면의 번호는 3인데 내용은 2번 포켓몬**이 된다. 이런 문제를 경쟁 상태(race condition, 여러 작업이 순서 없이 경쟁하다 결과가 뒤바뀌는 현상)라고 부른다.

### 해결: 정리 함수로 이전 요청을 무시하기

```jsx
useEffect(() => {
    let ignore = false;

    async function loadPokemon() {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const json = await res.json();
        if (!ignore) setPokemon(json);
    }
    loadPokemon();

    return () => { ignore = true; };
}, [id]);
```

동작 순서를 따라가 본다.

1. `id=2`일 때 effect가 실행되고 `ignore`(A용)가 만들어진다.
2. `id=3`으로 바뀌면 React가 **A의 정리 함수를 먼저 실행**해서 A의 `ignore`를 `true`로 바꾼다.
3. 그 뒤 B용 effect가 실행되고 B용 `ignore`가 새로 만들어진다.
4. A의 응답이 뒤늦게 도착해도 `if (!ignore)`가 `false`이므로 `setPokemon`을 건너뛴다.

앞 글에서 본 "effect가 다시 실행되기 직전에 이전 정리 함수가 실행된다"는 성질이 그대로 쓰였다. 요청마다 `ignore`가 따로 있을 수 있는 이유는, 각 effect 실행이 자기만의 `ignore` 변수를 만들고 정리 함수가 그 변수를 기억하기 때문이다. 이처럼 함수가 자신이 만들어진 곳의 변수를 기억하는 성질을 클로저(closure)라고 한다.

### 로딩 표시도 번호를 확인한다

```jsx
{pokemon?.id === id ? <PokemonCard pokemon={pokemon} /> : <h3>불러오는 중...</h3>}
```

수업 코드는 `pokemon`이 있는지만 보지 않고 **받은 데이터의 번호가 현재 `id`와 같은지**까지 확인한다. 번호를 바꾼 직후에는 `pokemon`에 아직 이전 번호의 데이터가 남아 있다. 이를 그대로 보여 주면 "No.4"라고 적힌 아래에 3번 포켓몬이 잠깐 보이므로, 번호가 다르면 로딩 문구를 보여 준다.

`pokemon?.id`의 `?.`는 옵셔널 체이닝(optional chaining)이다. `pokemon`이 `null`이면 에러 없이 `undefined`를 돌려준다. 처음 렌더링에서는 `pokemon`이 `null`이므로 `pokemon.id`라고 쓰면 에러가 난다.

## 한계와 대안

* `ignore` 방식은 요청 자체를 취소하지 않는다. 요청은 서버까지 가고, **결과만 버린다.** 요청까지 취소하려면 `AbortController`를 `fetch`에 연결하는 방법이 있다.
* 이 글의 코드에는 **에러 처리가 없다.** 네트워크가 끊기거나 서버가 오류를 주면 "불러오는 중..."에서 멈춘다. 실무에서는 `try/catch`와 에러 state를 추가한다. 또 `fetch`는 404나 500 응답도 에러로 던지지 않으므로 `res.ok`를 확인해야 한다.
* 로딩, 에러, 캐싱, 중복 요청 방지를 직접 다루기 번거로워 실무에서는 TanStack Query 같은 라이브러리를 많이 쓴다. 이 부분은 직접 확인하지 않은 일반 지식이므로 필요하면 공식 문서로 검증한다.

## 정리

1. 데이터 요청은 `useState`(빈 값) → `useEffect` → `fetch` → `setState` 순서로 한다. `await`는 `fetch`와 `res.json()` 둘 다 필요하다.
2. 요청 값이 바뀌면 의존성 배열에 넣어 다시 요청하고, 정리 함수에서 `ignore = true`로 이전 요청의 결과를 버려 응답이 뒤섞이는 것을 막는다.
3. 응답이 오기 전의 화면(로딩)과 실패했을 때의 화면(에러)을 항상 생각한다.

더 알아볼 것 : `AbortController`로 요청 취소하기, `try/catch`와 `res.ok`로 에러 처리하기

## 참고 자료

* [MDN: Fetch API 사용하기](https://developer.mozilla.org/ko/docs/Web/API/Fetch_API/Using_Fetch)
* [React 공식 문서: Synchronizing with Effects (Fetching data)](https://react.dev/learn/synchronizing-with-effects#fetching-data)
* [PokeAPI 문서](https://pokeapi.co/docs/v2)
