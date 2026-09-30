---
title: "매개변수, 전달인자, 그리고 다른 클래스의 메서드 호출"
date: 2026-09-30
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-methods.html)에서 메서드를 정의하고 호출하는 법을 정리했고, 오늘은 그 메서드를 호출할 때 값을 주고받는 매개변수·전달인자, 그리고 다른 클래스에 있는 메서드를 호출하는 방법을 정리한다.

## 0. 지난 이틀 복습

오늘 수업은 지난 이틀 내용을 간단히 복습하는 것으로 시작했다.

- **1일차** — 리터럴(값)과 변수(공간): [변수와 자료형 정리]({{ site.baseurl }}/java-variables-and-types.html)
- **2일차** — 조건문·반복문·메서드: [조건문]({{ site.baseurl }}/java-conditional-statements.html), [반복문]({{ site.baseurl }}/java-loops.html), [메서드]({{ site.baseurl }}/java-methods.html)

`int x = 4;`라는 한 줄도 뜯어보면 `int`(정수 자료형), `x`(변수), `=`(대입연산자 — 오른쪽은 값, 왼쪽은 공간), `4`(리터럴, 값)로 나뉜다는 걸 다시 짚었다. 오늘은 이 복습에 이어서, 메서드를 호출할 때 값을 어떻게 주고받는지를 배웠다.

## 1. 매개변수와 전달인자로 값을 주고받으며 메서드 호출하기

어제 정리한 `sumTwoNumber(int a, int b)`에서도 이미 나왔던 개념이지만, 오늘은 이 둘을 구분하는 용어를 정확히 짚었다.

- **매개변수(parameter)**: 메서드를 정의할 때 선언하는, 값을 받을 자리. 정의 시점에는 아직 값이 없다.
- **전달인자(argument)**: 메서드를 호출할 때 그 자리에 실제로 건네주는 값.

```java
Application03 app3 = new Application03();
int x = app3.testMethod(40);
System.out.println("당신의 나이는 " + x + "세 입니다.");

public int testMethod(int a) {
    return a;
}
```

```text
당신의 나이는 40세 입니다.
```

여기서 `int a`가 매개변수이고, 호출할 때 넘긴 `40`이 전달인자다. `testMethod`는 받은 값을 그대로 `return`해서, 호출한 쪽(`main`)이 그 값을 `x`에 담아 원하는 대로 쓸 수 있게 했다.

### 시행착오 — void로 직접 출력하던 버전에서 반환하는 버전으로

같은 파일 안에 주석으로 남겨둔 이전 버전이 있었는데, 처음에는 이렇게 짰다.

```java
public void testMethod(int a) {
    System.out.println("당신의 나이는 " + a + "세 입니다.");
}
```

이 버전은 메서드 안에서 바로 출력까지 해버려서, `void`로 반환값이 없다. 지금 버전은 반환타입을 `int`로 바꾸고, 출력은 메서드를 호출한 `main` 쪽으로 옮겼다. 메서드가 값을 직접 출력해버리면 그 메서드는 "출력하는 일"밖에 못 하지만, 값을 반환하도록 만들면 호출한 쪽에서 출력할 수도, 다른 계산에 쓸 수도 있어서 더 유연하게 재사용할 수 있다. 참고로 반환타입이 `void`가 아니라면 `return`은 생략할 수 없다.

### 전달인자는 매개변수의 순서·타입과 정확히 맞아야 한다

수업 코드에는 이런 주석도 있었다.

```java
// int x = app3.testMethod(40, "문자열", true, 'ㅂ'); << 순서 중요 -> 순서 바뀌면 오류!
```

`testMethod`는 실제로는 `int` 매개변수 하나만 받지만, 이 주석은 만약 메서드가 여러 개의 매개변수(예: `int`, `String`, `boolean`, `char`)를 받는다면 호출할 때 넘기는 전달인자도 정의된 매개변수와 **개수·순서·타입이 정확히 일치**해야 한다는 걸 보여주는 메모다. 순서가 바뀌면 타입이 맞지 않아 컴파일 오류가 난다.

### 접근제어자 — 메서드를 어디까지 공개할지

| 접근제어자 | 접근 가능 범위 |
|---|---|
| `public` | 모든 클래스에서 접근 가능 |
| `protected` | 같은 패키지 또는 자식 클래스에서 접근 가능 |
| (default, 작성하지 않음) | 같은 패키지에서만 접근 가능 |
| `private` | 같은 클래스 내부에서만 접근 가능 |

메서드 형식은 `[접근제어자][반환타입] 메소드명([매개변수 타입 매개변수명]) { 실행할 코드 [return 반환값;] }`이고, 접근제어자는 그중 가장 앞에 와서 이 메서드를 어디까지 공개할지를 정한다.

## 2. 다른 클래스에 있는 메서드 호출하기

지금까지는 같은 클래스 안에 있는 메서드만 호출했는데, 오늘은 계산기 역할을 하는 `Calculator` 클래스를 따로 만들고 `Application04`에서 그 메서드를 불러와봤다.

```java
public class Calculator {
    public int minNumberOf(int a, int b) {
        return (a > b) ? b : a;
    }

    public int maxNumberOf(int a, int b) {
        return (a > b) ? a : b;
    }
}
```

```java
int first = 100;
int second = 20;

Calculator calc = new Calculator();

int min = calc.minNumberOf(first, second);
System.out.println(first + ", " + second + " 중 최솟값은 " + min + "입니다.");

int max = calc.maxNumberOf(first, second);
System.out.println(first + ", " + second + " 중 최댓값은 " + max + "입니다.");
```

```text
100, 20 중 최솟값은 20입니다.
100, 20 중 최댓값은 100입니다.
```

`calc.minNumberOf(...)`에서 `.`(점)은 **참조 연산자**다. `calc`가 가리키는 `Calculator` 인스턴스 안에 있는 `minNumberOf`를 가리켜서 호출하는 역할을 한다. `Calculator calc = new Calculator();`처럼 다른 클래스의 메서드를 호출할 준비는 같은 영역(같은 메서드) 안이라면 한 번만 해두면 충분하다 — 실제로 `Application04`의 `main`에서는 `calc`를 한 번만 만들고 `minNumberOf`, `maxNumberOf` 두 메서드 모두에 재사용했다.

### 삼항 연산자로 최솟값·최댓값 정하기

`minNumberOf`, `maxNumberOf` 안에서는 `if-else` 대신 **삼항 연산자**를 썼다. 어제 조건문 글의 "더 학습하면 좋은 개념"에 적어뒀던 게 바로 이거였는데, 오늘 실제로 배웠다.

```text
조건식 ? 값1 : 값2
```

`?` 앞의 조건식이 참이면 `값1`, 거짓이면 `값2`가 식 전체의 결과가 된다.

```java
int a = 20;
int b = 10;

(a > b) ? b : a;
```

`a > b`(20 > 10)가 참이므로 `b`(10)가 선택된다. `minNumberOf(int a, int b)`의 `(a > b) ? b : a`도 같은 원리다 — `a`가 `b`보다 크면 더 작은 쪽인 `b`를 반환하고, 그렇지 않으면(즉 `a`가 `b`보다 작거나 같으면) `a`를 반환한다. `maxNumberOf`는 이 둘을 뒤집어서, `a`가 `b`보다 크면 `a`(더 큰 쪽)를, 그렇지 않으면 `b`를 반환한다.

## 3. 이 모든 게 가능한 이유 — Heap 메모리와 `new` 연산자

어제 글에서는 "`static`이 아닌 메서드는 인스턴스에 속하기 때문에 인스턴스를 먼저 만들어야 호출할 수 있다"까지만 정리했는데, 오늘은 그 인스턴스가 실제로 어디에 만들어지는지를 배웠다.

수업에서는 이걸 "클래스들이 서로 알지 못하기 때문에 Heap 영역에 올려놔야 한다"고 표현했다. 조금 더 정확히 풀어보면 이렇다. `minNumberOf`, `maxNumberOf`처럼 `static`이 붙지 않은 메서드는 클래스 자체가 아니라 **인스턴스에 속한 기능**이라서, 그 인스턴스를 먼저 만들어야만 호출할 수 있다. `new Calculator()`가 하는 일이 바로 이 인스턴스를 실제 메모리인 **Heap 영역**에 만들어서, 그 위치를 가리키는 참조를 돌려주는 것이다. `calc`라는 변수는 그 참조를 담아두는 역할을 한다.

그래서 수업에서는 `new`를 **할당 연산자**라고 불렀다 — 메모리(Heap 영역)에 자리를 할당해서, 우리가 그 인스턴스의 메서드를 호출해 쓸 수 있게 준비하는 연산자라는 뜻이다. "호출한다"는 건 결국 이렇게 메모리 위에 인스턴스를 띄워놓고, 그걸 우리가 활용할 수 있게 만드는 과정이라고 정리했다.

## 오늘 정리

- **매개변수**는 메서드를 정의할 때 값을 받는 자리, **전달인자**는 호출할 때 실제로 건네는 값이다.
- **메서드 호출**은 매개변수의 개수·순서·타입에 맞는 전달인자를 넘기는 것이고, 접근제어자로 그 메서드를 어디까지 공개할지 정한다.
- **메서드 반환 타입**이 `void`가 아니면 메서드는 반드시 값을 반환해야 하며, 값을 반환하도록 만들면 호출한 쪽에서 그 값을 자유롭게 활용할 수 있어서 더 유연하다.
- 다른 영역(다른 클래스)에 있는 메서드를 호출하려면 **Heap 메모리에 할당**해야 하고, 할당할 때 `new`라는 **할당 연산자**를 사용한다.

## 더 학습하면 좋은 개념

- **오버로딩(Overloading)** — 오늘 배운 "전달인자는 매개변수의 개수·순서·타입과 정확히 맞아야 한다"는 규칙을 뒤집어보면, 매개변수 구성만 다르게 하면 같은 이름의 메서드를 여러 개 정의할 수 있다는 뜻도 된다. 실제로 `minNumberOf`를 `double` 버전으로도 만들어보면 이해가 확실해질 것 같다.
- **패키지(Package)와 default 접근제어자** — 오늘 배운 접근제어자 중 `protected`와 default는 "같은 패키지"라는 개념을 전제로 한다. `package com.wanted.c_method;`가 정확히 무슨 역할을 하는지 다음에 더 짚어보고 싶다.
- **스택(Stack)과 힙(Heap)의 관계** — 어제 배운 메서드 호출 스택(Call Stack)과 오늘 배운 Heap 메모리가 실행 중에 어떻게 함께 쓰이는지(스택엔 지역변수와 참조, 힙엔 실제 인스턴스가 저장되는 구조) 더 깊이 알아보고 싶다.

## 참고 자료
- [Oracle - Controlling Access to Members of a Class](https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html)
- [Java Language Specification - 15.25. Conditional Operator ? :](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.25)
- [Java Virtual Machine Specification - 2.5.3. Heap](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5.3)
