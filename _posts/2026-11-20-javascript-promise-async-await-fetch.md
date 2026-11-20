---
title: "Promise, async/await, fetch"
date: 2026-11-20
tags:
  - JavaScript
---

"1초 뒤에 10P를 적립하고, 그 결과에 다시 1초 뒤 10P를 더한다"는 요구사항을 `setTimeout`으로 짜면 함수 안에 함수를 계속 넣게 된다. 같은 요구사항을 Promise와 `async/await`로 바꾸면 코드 모양과 에러 처리 방식이 어떻게 달라질까?  
수업 실습 파일의 포인트 적립 예제를 세 방식으로 실행해 비교하고, 같은 문법으로 외부 서버 API를 호출하는 `fetch`까지 정리했다. 내가 처음에 잘못 적어 둔 메모도 함께 바로잡았다.

> **TL;DR**
> - 콜백은 "끝나면 이 함수를 불러줘"라고 넘기는 방식이라 순서가 중요해질수록 중첩이 깊어지고, 에러도 단계마다 따로 처리해야 한다.
> - Promise는 `then`을 이어 붙여 위에서 아래로 읽게 하고, `catch` 하나로 중간 어디서든 난 에러를 받는다. `async/await`는 같은 일을 `try-catch`로 쓰는 문법이다.
> - `fetch`는 `Response` 객체를 담은 Promise를 돌려준다. 본문을 꺼내려면 `res.json()`을 한 번 더 `await`해야 하고, 404나 500에도 reject되지 않으니 `res.ok`를 직접 확인해야 한다.

환경: Node.js v24.20.0(Windows). 수업 파일은 브라우저 버튼으로 실행하지만, 아래 코드는 DOM 부분을 빼고 Node에서 직접 실행해 출력을 확인했다. `setTimeout`과 `fetch`는 Node 24에도 내장되어 있다. 브라우저 콘솔에서만 확인되는 동작(CORS 등)은 따로 표시했다.

## 요구사항과 예제 구성

주문할 때마다 1초 뒤에 포인트가 10P씩 적립되고, 적립 한도는 50P다. 호출 순서가 중요하다. 앞의 적립 결과(`point`)를 다음 적립에 넘겨야 하기 때문이다.

| 방식 | 구현 | 한도 초과 상황 |
|------|------|----------------|
| 콜백 | `pointCallback(point, func)` | 5단계까지만 호출해서 일어나지 않는다 |
| Promise | `earnPoint(point)`와 `then` 체인 | 6번째 호출에서 일부러 reject한다 |
| async/await | 같은 `earnPoint`에 `await` | 6번째 `await`에서 일부러 reject한다 |

`setTimeout`의 세부 동작과 이벤트 루프는 이 글에서 다루지 않는다. 여기서는 "1초 뒤에 결과가 나온다"는 비동기 작업을 흉내 내는 용도로만 쓴다.

## 콜백 지옥은 무엇이 문제일까?

비동기 함수는 `return`으로 결과를 돌려줄 수 없다. 결과가 나오기 전에 함수가 먼저 끝나 버리기 때문이다. 그래서 "결과가 나오면 이 함수를 불러줘" 하고 **콜백 함수**를 인자로 넘기는 방식을 썼다.

```js
function pointCallback(point, func) {
    setTimeout(() => {
        const result = point + 10;

        if (func) {
            func(result);
        }
    }, 1000);
}

pointCallback(0, point => {
    console.log(`${point}P`);
    pointCallback(point, point => {
        console.log(`${point}P`);
        pointCallback(point, point => {
            console.log(`${point}P`);
            pointCallback(point, point => {
                console.log(`${point}P`);
                pointCallback(point, point => {
                    console.log(`${point}P`);
                });
            });
        });
    });
});
```

```text
10P
20P
30P
40P
50P
```

마지막 줄이 찍히기까지 약 5초가 걸렸다. 앞 단계가 끝나야 다음 단계를 시작할 수 있으니 순서는 지켜진다. 대신 단계가 늘수록 함수가 안으로 계속 들어간다.

### 들여쓰기보다 에러 처리가 더 큰 문제였다

수업 노트에는 "들여쓰기가 깊어져서 보기 불편한 것"이 문제라고만 적어 두었다. 그런데 더 큰 문제는 **에러 처리**다. 콜백 안에서 던진 에러는 바깥의 `try-catch`로 잡히지 않는다.

```js
try {
    setTimeout(() => { throw new Error('콜백 안 에러'); }, 10);
} catch (e) {
    console.log('잡힘', e.message);
}
console.log('try-catch 블록 지나감');
```

```text
try-catch 블록 지나감
Error: 콜백 안 에러
    at Timeout._onTimeout (...)
Node.js v24.20.0
```

`try` 블록은 `setTimeout`을 등록하는 순간 이미 끝났고, 에러는 10ms 뒤 다른 시점에 발생한다. `catch`는 이 에러를 만나지 못하고 Node 프로세스가 종료됐다. 그래서 콜백 방식에서는 단계마다 에러를 직접 받아 처리하는 코드가 따로 필요하다. 브라우저에서도 같은 구조일지는 직접 확인하지 않았다(확인 필요).

## Promise로 바꾸면 무엇이 달라질까?

Promise는 비동기 작업의 결과(성공 또는 실패)를 담아 두는 객체다. 세 가지 상태 중 하나이고, 한 번 정해지면 다시 바뀌지 않는다.

| 상태 | 의미 | 결과를 받는 곳 |
|------|------|----------------|
| `pending` (대기) | 아직 결과가 정해지지 않음 | - |
| `fulfilled` (이행) | `resolve(값)`이 호출됨 | `then()` |
| `rejected` (거부) | `reject(에러)`가 호출됨 | `catch()` |

콜백 대신 Promise를 반환하도록 `earnPoint`를 만들었다. 한도(50P)를 넘으면 reject한다.

```js
function earnPoint(point) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const result = point + 10;

            if (result > 50) {
                return reject(new Error("적립 한도 초과"));
            }

            return resolve(result);
        }, 1000);
    });
}
```

`new Promise`의 안쪽 함수(executor)는 Promise를 만드는 즉시 **동기적으로** 실행된다. 비동기인 것은 그 안의 `setTimeout`이다. 또 `return reject(...)`의 `return`은 Promise와 상관없고, "여기서 함수를 끝낸다"는 뜻일 뿐이다.

### then 체인과 return

```js
earnPoint(0)
    .then(point => { console.log(`${point}P`); return earnPoint(point); })
    .then(point => { console.log(`${point}P`); return earnPoint(point); })
    .then(point => { console.log(`${point}P`); return earnPoint(point); })
    .then(point => { console.log(`${point}P`); return earnPoint(point); })
    .then(point => { console.log(`${point}P`); return earnPoint(point); })
    .catch(e => console.log(e.message, '발생'))
    .finally(() => console.log("포인트 적립 종료"));
```

```text
10P
20P
30P
40P
50P
적립 한도 초과 발생
포인트 적립 종료
```

`then()`은 항상 **새 Promise**를 반환하기 때문에 `.then().then()`으로 이어 쓸 수 있다. `then` 안에서 값을 `return`하면 다음 `then`이 그 값을 받고, Promise를 `return`하면 그 Promise가 끝날 때까지 기다린 뒤 결과를 넘긴다. 마지막 `then`에서 호출한 6번째 `earnPoint(50)`이 60 > 50이라 reject되고, 체인이 곧바로 `catch`로 이동했다. 첫 호출부터 약 6초가 걸렸다.

`return`을 빼먹으면 어떻게 될까? 아래처럼 첫 `then`에서 `earnPoint(point)`를 반환하지 않으면 두 번째 `then`은 기다리지 않고 바로 `undefined`를 받는다.

```js
earnPoint(0)
    .then(point => { console.log(`1: ${point}`); earnPoint(point); })
    .then(point => { console.log(`2: ${point}`); });
```

```text
1: 10
2: undefined
```

`catch()`는 체인 중간 어디서든 발생한 reject와 예외를 한 곳에서 받고, `finally()`는 성공과 실패에 상관없이 마지막에 실행된다. 로딩 표시를 끄는 코드를 두기 좋다.

## async/await는 Promise와 무엇이 다를까?

`await`는 Promise가 끝날 때까지 기다렸다가 그 결과값을 꺼내 주는 연산자다. `then()`을 대신하는 문법이고, `await`는 `async` 함수 안에서만 쓸 수 있다.

```js
async function runAsync() {
    try {
        let point = await earnPoint(0);
        console.log(`${point}P`);
        point = await earnPoint(point);
        console.log(`${point}P`);
        point = await earnPoint(point);
        console.log(`${point}P`);
        point = await earnPoint(point);
        console.log(`${point}P`);
        point = await earnPoint(point);
        console.log(`${point}P`);
        point = await earnPoint(point);   // 6번째: 여기서 reject
        console.log(`${point}P`);          // 실행되지 않는다
    } catch (e) {
        console.log(e.message, '발생');
    } finally {
        console.log("포인트 적립 종료");
    }
}
```

```text
10P
20P
30P
40P
50P
적립 한도 초과 발생
포인트 적립 종료
```

reject된 Promise는 `await`한 줄에서 예외로 던져지고, 실행이 곧바로 `catch` 블록으로 이동한다. 그래서 6번째 `console.log`는 실행되지 않는다. 수업 파일에는 `finally`가 없었고, 위 코드에서는 Promise 체인과 비교하려고 추가했다.

### 헷갈렸던 점 1: await는 "안정성"이 아니라 "순서"를 준다

수업 노트에 "콜백지옥은 함수가 중첩됨 ↔ 이건 안정성", "await → earnPoint(비동기 함수)가 안정성 있게 실행할?"이라고 적어 두었다. 정리하다 보니 **안정성**은 맞는 표현이 아니었다. `await`가 주는 것은 실행이 더 안전해진다는 보장이 아니라, 앞의 `earnPoint`가 끝나야 다음 줄로 넘어가는 순서다. 덕분에 비동기 코드를 위에서 아래로 읽을 수 있다. 에러가 안 나게 해 주는 것도 아니라서, 에러 처리는 `try-catch`로 직접 해야 한다.

### 헷갈렸던 점 2: "동기 방식으로 동작한다"는 말은 반만 맞다

노트에는 "비동기 처리를 동기 방식으로 동작하게 만드는 문법"이라고도 적었다. 읽기에는 동기 코드처럼 보이지만, `async` 함수를 호출하면 실제로는 기다리지 않고 바로 Promise를 돌려준다.

```js
const p = runAsync();
console.log(p, '<- async 함수 호출 직후');
```

```text
Promise { <pending> } <- async 함수 호출 직후
10P
...
```

`async` 함수는 `return 10`이라고 써도 항상 Promise를 반환한다. `await`가 멈추는 것도 그 `async` 함수 안의 실행뿐이고, 브라우저 전체가 멈추는 것이 아니라서 기다리는 동안 다른 코드와 클릭 이벤트는 정상 동작한다. `await` 뒤의 코드가 이어서 실행되는 원리(마이크로태스크 큐)는 이벤트 루프 주제라서 여기서는 다루지 않는다.

## 같은 요구사항을 세 방식으로 구현한 비교

| 비교 기준 | 콜백 | Promise (`then`) | `async/await` |
|-----------|------|------------------|----------------|
| 순서 보장 방법 | 콜백 안에 다음 호출을 중첩 | `then`에서 Promise를 `return` | 줄 순서대로 `await` |
| 코드 모양 | 단계마다 안쪽으로 들어간다 | 평평하게 이어진다 | 평평하다 |
| 결과 받는 곳 | 콜백의 매개변수 | `then`의 매개변수 | `await`의 반환값(변수) |
| 에러 처리 | 단계마다 직접 (바깥 `try-catch` 불가) | `catch()` 한 곳 | `try-catch` 한 곳 |
| 마무리 코드 | 직접 작성 | `finally()` | `finally` 블록 |
| 읽는 방향 | 안쪽으로 파고들며 읽는다 | 위에서 아래로 | 위에서 아래로 |
| 흔한 실수 | 에러를 놓치고 프로세스가 종료됨 | `return` 누락으로 `undefined` 전달 | `await` 누락, 불필요한 순차 대기 |

세 방식 모두 결국 Promise와 콜백 위에서 동작한다는 점은 같다. 새로 짠다면 `async/await`를 기본으로 쓰고, 여러 작업을 이어 붙이거나 `finally`로 정리하는 코드는 `then` 체인으로 쓸 수도 있다.

한계도 있다. `await`를 하나씩 쓰면 앞 작업이 끝나야 다음을 시작한다. 이 예제는 앞 결과를 다음 호출에 써야 하니 맞는 방식이지만, 서로 상관없는 요청이라면 총 시간이 불필요하게 길어진다. 그럴 때는 `Promise.all`로 동시에 보내는 방법이 있다(이 글에서는 실행해 보지 않았다).

## fetch로 외부 서버의 데이터 가져오기

가장 대표적인 비동기 작업은 외부 서버의 API를 호출하는 일이다. **API**는 프로그램끼리 데이터를 주고받기 위한 약속(주소, 요청 방식, 응답 형식)이다. 수업에서는 연습용 가짜 API 서버인 jsonplaceholder에 GET 요청을 보냈고, 쿼리 스트링 `?_limit=5`는 "5개만 달라"는 조건이다.

```js
async function getReviews() {
    const data = fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    console.log(data);

    const res = await data;
    const reviews = await res.json();

    console.log(reviews);
    console.log(reviews[0].title);
}
```

`fetch(url)`의 반환값은 Promise다. 첫 `console.log(data)`에는 아직 결과가 없는 Promise가 찍힌다. 또 Promise는 `await`나 `then`으로 풀기 전에는 값을 바로 읽을 수 없다.

### 헷갈렸던 점 3: res는 "문자열 json"이 아니라 Response 객체다

수업 노트에는 `res` 안에 "api의 호출 결과가 문자열 json으로 되어 있다"고 적었다. Node에서 확인한 결과는 달랐다.

```js
const res = await data;
console.log(typeof res, res.constructor.name, res.status, res.ok, res.headers.get('content-type'));
const reviews = await res.json();
console.log(Array.isArray(reviews), reviews.length, Object.keys(reviews[0]));
```

```text
object Response 200 true application/json; charset=utf-8
true 5 [ 'userId', 'id', 'title', 'body' ]
```

`res`는 문자열이 아니라 **Response 객체**이고, 상태 코드(`res.status`), 성공 여부(`res.ok`), 헤더, 본문(body)을 갖고 있다. JSON 문자열은 그 본문이다. `res.json()`이 그 문자열을 자바스크립트 배열이나 객체로 파싱한다.

| 단계 | 값 | 타입 |
|------|----|------|
| 1 | `fetch(url)` | Promise |
| 2 | `await fetch(url)` | Response 객체 |
| 3 | `res.json()` | Promise |
| 4 | `await res.json()` | 배열 (여기서는 객체 5개) |

`res.json()`도 Promise를 반환하므로 `await`가 두 번 필요하다. 본문은 네트워크로 조금씩 도착하기 때문이다. JSON은 데이터를 문자열로 표현하는 형식이다. 객체를 네트워크로 그대로 보낼 수 없어서 문자열로 바꿔(직렬화) 보내고, 받는 쪽에서 다시 객체로 바꾼다(역직렬화). 각각 `JSON.stringify(객체)`와 `JSON.parse(문자열)`에 대응한다.

같은 코드를 `then` 체인으로 쓰면 `return res.json()`이 필요하다.

```js
fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')
    .then(res => res.json())
    .then(json => console.log(json));
```

### 함정: 404가 와도 fetch는 reject되지 않는다

수업 예제에는 에러 처리가 없었다. 아래 코드는 내가 추가한 예시 코드이고, 존재하지 않는 글 번호를 요청해 직접 확인했다.

```js
const r404 = await fetch('https://jsonplaceholder.typicode.com/posts/99999');
console.log('404:', r404.status, r404.ok);
```

```text
404: 404 false
```

404 응답인데도 `await`는 예외 없이 지나갔고, `res.ok`만 `false`였다. `fetch`의 Promise가 reject되는 경우는 네트워크가 끊기거나 주소를 찾지 못하는 것처럼 요청 자체가 실패했을 때뿐이다. 존재하지 않는 도메인을 호출해 보면 `TypeError`가 던져진다.

```js
async function safeGet(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        return await res.json();
    } catch (e) {
        console.log('실패:', e.message);
    }
}
```

`safeGet`에 없는 글 번호(`/posts/99999`)와 존재하지 않는 도메인(`https://no-such-host.invalid/`)을 차례로 넘겨 실행했다.

```text
실패: Error HTTP 404
실패: TypeError fetch failed
```

HTTP 에러는 직접 `throw`한 `Error`로, 네트워크 실패는 `fetch`가 던진 `TypeError`로 같은 `catch`에 도착했다. `/posts/1`처럼 정상 주소를 넘기면 `res.json()` 결과가 반환된다.

### CORS는 브라우저에서만 나타난다

수업에서는 CORS(Cross-Origin Resource Sharing)도 같이 배웠다. 브라우저는 다른 출처(도메인)의 서버가 허용했을 때만 그 응답을 코드가 읽게 해 준다. jsonplaceholder는 허용 헤더를 내려 주기 때문에 동작하고, 허용하지 않는 서버를 호출하면 콘솔에 CORS 에러가 나는데 이는 프론트 코드가 아니라 서버 설정의 문제다. Node에서 실행하는 위 예제들에는 이 제한이 없었고, 브라우저에서의 CORS 에러 재현은 직접 하지 않았다(확인 필요).

## 정리

- 콜백은 순서가 중요해질수록 중첩이 깊어지고, 콜백 안의 에러는 바깥 `try-catch`에 잡히지 않는다. Promise와 `async/await`는 이 두 문제를 `catch`와 `try-catch` 한 곳으로 모은다.
- `await`는 안정성이 아니라 실행 순서를 준다. 코드가 동기처럼 읽혀도 `async` 함수는 호출 즉시 Promise를 반환하는 비동기 함수다.
- `fetch`는 `await`를 두 번 쓴다(`fetch` → Response, `res.json()` → 데이터). HTTP 에러는 reject되지 않으므로 `res.ok`를 확인한다.
## 더 학습하면 좋은 개념

- **`Promise.all` / `Promise.allSettled`** — 여러 Promise를 동시에 실행하고 결과를 모은다. `await`를 하나씩 쓸 때 생기는 불필요한 대기를 줄이는 방법이라 가장 먼저 이어서 볼 만하다.
- **이벤트 루프와 마이크로태스크 큐** — `then`과 `await` 뒤의 코드가 언제 실행되는지 결정하는 원리다. 출력 순서가 예상과 다를 때 이유를 설명해 준다.
- **HTTP 상태 코드** — `res.ok`가 `true`가 되는 범위(200~299)와 404, 500의 의미를 알아야 `fetch` 에러 처리를 제대로 설계할 수 있다.
- **CORS와 프리플라이트(preflight) 요청** — 브라우저에서 만나는 CORS 에러의 원인과 서버가 보내야 하는 헤더를 이해하는 데 필요하다.
- **`AbortController`** — 진행 중인 `fetch`를 취소하는 표준 방법이다. 응답이 늦거나 화면이 바뀌었을 때 불필요한 요청을 정리하는 데 쓴다.

## 참고 자료

- [MDN - Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN - Promise 사용하기 (Using promises)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [MDN - async 함수](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN - await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
- [MDN - fetch()](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch)
- [MDN - Response.ok](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok)
- [MDN - Response.json()](https://developer.mozilla.org/en-US/docs/Web/API/Response/json)
- [MDN - CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [MDN - Promise.all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
