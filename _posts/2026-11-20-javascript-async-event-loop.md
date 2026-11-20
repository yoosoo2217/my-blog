---
title: "JavaScript 비동기와 이벤트 루프"
date: 2026-11-20
tags:
  - JavaScript
---

`setTimeout(피자, 5000)`을 코드 맨 위에 적었는데 "주문 받기" 메시지가 먼저 찍힌다. 자바스크립트는 위에서 아래로 실행한다고 배웠는데, 5초짜리 코드는 왜 기다려 주지 않을까?  
타이머 두 개로 실행 순서를 확인하고, 일부러 3초 동안 멈추는 `sleep`과 비교하면서 콜 스택, 태스크 큐, 이벤트 루프가 어떻게 맞물리는지 정리했다.

> **TL;DR**
> - 타이머는 자바스크립트 엔진이 아니라 실행 환경(브라우저의 Web API 등)이 센다. 시간이 지나면 콜백이 태스크 큐에 들어가고, 이벤트 루프가 콜 스택이 빌 때 하나씩 꺼내 실행한다.
> - 콜 스택은 후입선출(LIFO), 태스크 큐는 선입선출(FIFO)이다. 처음에 둘을 섞어서 적었다.
> - 지연시간은 "정확히 N ms 뒤"가 아니라 "최소 N ms 뒤"다. 콜 스택이 바쁘면 `setTimeout(fn, 0)`도 늦게 실행된다.

환경: Node.js v24.20.0, Windows. 아래 코드는 수업에서 브라우저(`<script>`)로 작성한 코드를 Node.js에서 실행해 출력과 시간을 확인했다. 브라우저에서 직접 실행해 비교한 것은 아니다(`확인 필요` 표시 참고).

## 동기와 비동기는 무엇이 다를까?

수업에서는 떡볶이 가게로 비유했다. 한 번만 쓰는 비유로 둔다.

| 구분 | 떡볶이 가게 | 코드의 동작 |
|------|-------------|-------------|
| 동기 | 조리 3초가 끝날 때까지 다음 손님 주문을 받지 못한다 | 앞의 작업이 끝나야 다음 코드를 시작한다 |
| 비동기 | 조리를 맡겨 두고 다음 손님 주문을 먼저 받는다 | 오래 걸리는 작업을 맡기고 다음 코드를 먼저 실행한다 |

동기는 순서가 보장되지만 기다리는 동안 멈추고, 비동기는 멈추지 않는 대신 결과가 도착하는 시점을 코드 순서로 알 수 없다. 프론트엔드가 백엔드 API를 호출할 때 응답이 느리면 화면이 그대로 멈추기 때문에, API 호출은 비동기로 처리한다.

## 동기로 기다리면 어떻게 될까?

3초 동안 멈추는 `sleep`을 만들어 동기 처리의 한계를 확인했다. `while` 문이 CPU를 쉬지 않고 돌면서 시간이 지나기를 기다리는 방식이라 **바쁜 대기(busy waiting)**라고 부른다. `Date.now()`는 1970-01-01부터 지금까지 흐른 밀리초(ms)를 반환한다.

```js
const t0 = Date.now();
const sec = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';

function sleep(func, delay) {
    const delayUntil = Date.now() + delay;
    while (Date.now() < delayUntil);
    func();
}

function cook() { console.log(sec(), '조리 완료'); }
function takeOrder() { console.log(sec(), '주문 받기'); }

sleep(cook, 3000);
takeOrder();
```

```text
3.0s 조리 완료
3.0s 주문 받기
```

`takeOrder()`는 코드상 바로 다음 줄인데도 3초가 지난 뒤에야 실행됐다. `while` 문이 콜 스택을 3초 동안 붙잡고 있어서 다른 코드는 끼어들 수 없다. 브라우저라면 같은 시간 동안 클릭이나 화면 갱신도 멈추므로, 실제 코드에서 이런 식으로 대기하면 안 된다.

## setTimeout으로 바꾸면 무엇이 달라질까?

같은 일을 `setTimeout`으로 바꾸면 주문이 먼저 출력된다.

```js
setTimeout(cook, 3000);
takeOrder();
takeOrder();
takeOrder();
```

주문 세 줄이 바로 출력되고, `cook`은 3초 뒤에 따로 실행됐다. Node.js에서 실행한 결과를 시간 표시와 함께 줄여 적었다.

```text
0.0s 주문 받기
0.0s 주문 받기
0.0s 주문 받기
(3초 뒤) cook 실행
```

(수업 파일은 `takeOrder()`를 6번 호출하는데, 글에서는 3번으로 줄였다.)

### cook 뒤에 괄호를 붙이면 안 되는 이유

`setTimeout(cook, 3000)`에서 `cook`은 "나중에 실행할 함수 자체"이고, `cook()`은 "지금 실행한 결과값"이다. 괄호를 붙이면 `cook`이 즉시 실행되고, 반환값 `undefined`가 `setTimeout`에 전달된다. Node.js에서 직접 해 봤더니 `cook 실행`이 바로 출력된 뒤 오류가 났다.

```js
setTimeout(cook(), 100);
```

```text
cook 실행
TypeError [ERR_INVALID_ARG_TYPE]: The "callback" argument must be of type function. Received undefined
```

브라우저에서는 어떻게 동작하는지 확인하지 않았다(`확인 필요`).

## 콜 스택, Web API, 태스크 큐, 이벤트 루프는 어떻게 맞물릴까?

자바스크립트는 **싱글 스레드**라서 콜 스택이 하나뿐이고 한 번에 한 가지 일만 한다. 비동기는 스레드를 여러 개 쓰는 것이 아니라, 오래 걸리는 일을 실행 환경에 맡기고 콜 스택을 비워 두는 방식이다. 자바스크립트 엔진 자체에는 타이머가 없고, 브라우저가 제공하는 Web API가 시간을 센다.

`setTimeout(cook, 3000); takeOrder(); takeOrder();`의 흐름을 번호 목록으로 따라가 본다.

1. `setTimeout(cook, 3000)`이 콜 스택에서 실행된다. 타이머를 Web API에 맡기고 콜 스택에서 바로 빠진다.
2. `takeOrder()`가 콜 스택에서 차례로 실행되어 주문 메시지가 먼저 출력된다.
3. 3초가 지나면 Web API가 `cook`을 태스크 큐에 넣는다.
4. 이벤트 루프가 "콜 스택이 비었고, 태스크 큐에 대기 중인 함수가 있다"를 확인하고 `cook`을 콜 스택으로 옮긴다. 그제야 `cook`이 실행된다.

| 구성 요소 | 하는 일 | 순서 규칙 |
|-----------|---------|-----------|
| 콜 스택(call stack) | 지금 실행 중인 함수들이 쌓이는 곳 | 후입선출(LIFO) |
| Web API | 타이머, 네트워크 요청처럼 오래 걸리는 일을 대신 처리하는 곳 | - |
| 태스크 큐(task queue) | 실행을 기다리는 콜백(타이머 콜백, 이벤트 핸들러)이 줄 서는 곳 | 선입선출(FIFO) |
| 이벤트 루프(event loop) | 콜 스택과 태스크 큐를 계속 확인하고, 스택이 비면 큐의 맨 앞 콜백을 스택으로 옮긴다 | - |

## 헷갈렸던 점과 바로잡은 과정

수업 메모에 "콜 스택에서 태스크 큐 (후입선출)"이라고 적었다. 이 문장은 세 가지가 부정확했다.

- 후입선출은 **콜 스택**의 특징이다. 나중에 호출된 함수가 먼저 끝나기 때문이다.
- **태스크 큐는 선입선출**이다. 먼저 들어온 콜백이 먼저 나간다. 이벤트 루프를 설명한 아래 줄에는 FIFO라고 제대로 적어 놓고, 위 줄에서는 큐를 후입선출로 적어 서로 모순이었다.
- 콜백이 "콜 스택에서 태스크 큐로" 가는 것도 아니다. 타이머를 맡긴 쪽은 콜 스택이고, 콜백을 큐에 넣는 쪽은 Web API다. 이동 방향은 Web API → 태스크 큐 → 콜 스택이다.

`setInterval` 예제의 주석에도 "1000s ???"라고 적어 두었다. 단위는 `s`(초)가 아니라 **ms(밀리초)**다. 1000ms가 1초다.

## 지연시간은 정확한 시각이 아닐까?

`setTimeout(fn, 0)`이라고 해서 즉시 실행되는 것은 아니다. 태스크 큐를 거치므로 현재 실행 중인 코드가 모두 끝난 뒤에 실행된다. 1초짜리 `while` 문을 뒤에 두고 확인했다.

```js
setTimeout(() => console.log('timeout 0ms'), 0);
console.log('sync 1');
const s = Date.now(); while (Date.now() < s + 1000);
console.log('sync 2 (1초 뒤)');
```

```text
sync 1
sync 2 (1초 뒤)
timeout 0ms
```

100ms 뒤로 예약한 타이머도 콜 스택이 1초 동안 바쁘면 1초 이상 지난 뒤에 실행됐다. 그래서 지연시간은 "최소 N ms"이고, 콜 스택이 바쁠수록 더 늦어진다.

```js
const s = Date.now();
setTimeout(() => console.log('100ms 요청, 실제', Date.now() - s >= 1000 ? '1000ms 이상' : '미만'), 100);
while (Date.now() < s + 1000);
console.log('동기 코드 종료');
```

```text
동기 코드 종료
100ms 요청, 실제 1000ms 이상
```

## setTimeout과 setInterval 쓰기

| 함수 | 실행 횟수 | 취소 방법 |
|------|-----------|-----------|
| `setTimeout(함수, 지연시간[, 인자...])` | 1번 | `clearTimeout(ID)` |
| `setInterval(함수, 간격[, 인자...])` | 멈추기 전까지 반복 | `clearInterval(ID)` |

3번째 인자부터는 콜백의 매개변수로 그대로 전달된다. 아래 코드에서는 `"치킨"`이 `menuName`으로 들어간다. 실행 순서는 코드를 쓴 순서(피자 → 치킨)가 아니라 **지연시간이 짧은 순서**다.

```js
const t0 = Date.now();
const sec = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';

setTimeout(() => console.log(sec(), '피자 5초'), 5000);
console.log(sec(), '주문 받기');
setTimeout((menuName) => console.log(sec(), `${menuName} 3초`), 3000, '치킨');

let count = 1;
const interval = setInterval(() => {
    console.log(sec(), `배달도착까지 ${5 - count}초`);
    count++;
    if (count == 5) {
        clearInterval(interval);
        console.log(sec(), '배달 완료');
    }
}, 1000);
```

```text
0.0s 주문 받기
1.0s 배달도착까지 4초
2.0s 배달도착까지 3초
3.0s 치킨 3초
3.0s 배달도착까지 2초
4.0s 배달도착까지 1초
4.0s 배달 완료
5.0s 피자 5초
```

- `setInterval`은 `count`가 5가 되는 4번째 실행에서 `clearInterval(interval)`로 끝난다. 그래서 4초 → 3초 → 2초 → 1초 → 배달 완료 순서다.
- 3.0초에는 치킨과 배달도착 메시지가 같이 나온다. 이번 실행에서는 먼저 등록한 치킨 타이머가 앞에 출력됐다. 같은 시각 타이머의 순서는 환경마다 다를 수 있어서 이 순서에 기대는 코드는 쓰지 않는 편이 좋다(`확인 필요`).
- `setInterval`의 반환값은 타이머 ID다. 브라우저에서는 숫자이고, Node.js에서는 `Timeout` 객체였다(`typeof`는 `object`).
- 종료 조건을 빼먹으면 탭을 닫을 때까지 계속 돌면서 메모리와 CPU를 쓴다. `clearInterval`은 ID가 맞지 않으면 아무 일도 하지 않는다.

## 정리

- 비동기는 오래 걸리는 일을 실행 환경에 맡기고 콜 스택을 비워 두는 방식이다. 스레드를 늘리는 것이 아니다.
- 흐름은 콜 스택 → Web API → 태스크 큐 → 콜 스택이다. 콜 스택은 LIFO, 태스크 큐는 FIFO다.
- 타이머 지연시간은 최소값이다. 동기 코드가 콜 스택을 오래 잡으면 `setTimeout(fn, 0)`도 그만큼 밀린다.
- 다음에 볼 것: 비동기 결과를 순서대로 다루는 방법(Promise, async/await).

## 더 학습하면 좋은 개념

- **마이크로태스크 큐(microtask queue)** — Promise 콜백이 들어가는 별도의 큐다. 이 글의 태스크 큐보다 먼저 비워지기 때문에, `setTimeout`과 Promise를 섞어 쓸 때 출력 순서를 이해하려면 필요하다.
- **실행 컨텍스트와 콜 스택** — 함수 호출 시 만들어지는 실행 컨텍스트가 어떻게 쌓이고 사라지는지 알면 스택 오버플로(재귀 오류)의 원인도 설명할 수 있다.
- **`requestAnimationFrame`** — 화면을 그리기 직전에 콜백을 실행하는 API다. 애니메이션을 `setInterval`로 만들면 왜 끊겨 보이는지 비교해 볼 수 있다.
- **Node.js 이벤트 루프의 단계(phases)** — Node.js는 브라우저와 구현이 달라서 타이머, I/O, `setImmediate`가 단계별로 처리된다. 같은 코드가 환경마다 순서가 다를 수 있는 이유를 알 수 있다.
- **Web Worker** — 자바스크립트가 싱글 스레드여도 별도 스레드에서 무거운 계산을 돌리는 방법이다. `sleep` 같은 바쁜 대기 대신 쓸 수 있는 대안이다.

## 참고 자료

- [MDN - setTimeout()](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout)
- [MDN - setInterval()](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)
- [MDN - clearInterval()](https://developer.mozilla.org/en-US/docs/Web/API/Window/clearInterval)
- [MDN - JavaScript 실행 모델](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
- [MDN - 호출 스택(Call stack)](https://developer.mozilla.org/en-US/docs/Glossary/Call_stack)
- [Node.js - The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
