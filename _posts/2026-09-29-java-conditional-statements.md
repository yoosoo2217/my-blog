---
title: "Java 기초 - 조건문(if, switch)으로 실행 흐름 분기하기"
date: 2026-09-29
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-operators.html)에서 연산자를 정리했고, 이번엔 그 연산자로 만든 조건을 가지고 프로그램의 실행 흐름 자체를 나누는 조건문을 정리한다.

## 1. if / else if / else — 조건에 따라 분기하기

`if`문은 조건식의 결과(참/거짓)에 따라 프로그램의 실행 흐름을 "분기"시키는 제어문이다.

```text
if (조건식) {조건 만족 시 실행될 코드} [else{조건 불만족 시 실행될 코드}]
```

점수에 따라 등급을 나누는 코드로 확인했다.

```java
System.out.println("프로그램이 시작됩니다. 다들 긴장하세요.");

int score = 80;

if (score >= 90) {
    System.out.println("A 등급입니다~!^^");
} else if (score >= 80) {
    System.out.println("B 등급입니다~ 좀만 더 열심히 하세여");
} else if (score >= 70) {
    System.out.println("C 라뇨,, 분발하세요.");
} else {
    System.out.println("재수강 확정! 뻉이치자");
}

System.out.println("프로그램 종료합니다.");
```

```text
프로그램이 시작됩니다. 다들 긴장하세요.
B 등급입니다~ 좀만 더 열심히 하세여
프로그램 종료합니다.
```

`score`가 80이므로 첫 번째 조건(90 이상)은 거짓이고, 두 번째 조건(80 이상)이 참이 되는 순간 그 블록만 실행되고 이후의 `else if`, `else`는 전부 건너뛴다. 조건을 위에서부터 순서대로 검사하다가, **처음으로 참이 되는 블록 하나만 실행**한다는 게 핵심이다.

## 2. 사용자 입력을 받아 조건 분기하기

`Scanner`로 콘솔 입력을 받아서, 나이에 따라 할인율을 다르게 매기는 프로그램도 만들었다.

```java
Scanner sc = new Scanner(System.in);

System.out.println("나이를 입력해주세요 : ");
int age = sc.nextInt();

double discountRate;

if (age < 13) {
    discountRate = 0.5;
} else if (age >= 65) {
    discountRate = 0.3;
} else {
    discountRate = 0.0;
}

System.out.println("나이 : " + age + ", 할인율 : " + (discountRate * 100) + "%");
```

예를 들어 10을 입력하면 다음과 같이 출력된다.

```text
나이 : 10, 할인율 : 50.0%
```

`discountRate`는 `if` 블록 밖에서 먼저 선언만 해두고, 실제 값은 조건에 맞는 블록 안에서 정한다. `sc.nextInt()`는 콘솔에 입력된 값을 정수로 받아오는 역할을 한다.

## 3. 조건의 순서와 단락 평가 복습

`&&`의 단락 평가(short-circuit evaluation)는 [연산자 정리 글]({{ site.baseurl }}/java-operators.html)에서 이미 다뤘는데, 이번 수업에서는 조건의 순서가 실행 시간에 어떤 영향을 주는지 직접 코드로 비교해봤다.

```java
int age = 25;
String discount;

long startTime = System.nanoTime();
if (age <= 19) { // 드문 조건을 먼저 검사
    discount = "학생 할인 가능";
} else {
    discount = "할인 불가";
}
long endTime = System.nanoTime();
System.out.println("결과 : " + discount + ", 시간 : " + (endTime - startTime) + "(ns)");

long startTime2 = System.nanoTime();
if (age > 19) { // 자주 발생하는 조건을 먼저 검사
    discount = "학생 할인 가능";
} else {
    discount = "할인 불가";
}
long endTime2 = System.nanoTime();
System.out.println("결과 : " + discount + ", 시간 : " + (endTime2 - startTime2) + "(ns)");
```

여기서 한 가지 짚고 넘어갈 부분이 있다. 이 코드는 `if-else` 하나에 조건이 딱 하나뿐이라서, 조건의 순서를 바꿔도 **검사하는 비교 연산의 개수는 항상 1번으로 동일**하다. `&&`의 단락 평가처럼 오른쪽 조건이 실제로 "건너뛰어지는" 상황과는 다르다. 실행할 때마다 나노초 값 자체는 시스템 상태에 따라 달라지므로, 이 측정값 하나로 어느 쪽이 더 빠르다고 단정하기는 어렵다. 조건 순서가 정말 중요해지는 경우는 `&&`/`||`처럼 조건이 여러 개 이어지거나, 뒤쪽 조건 안에 부작용이 있는 코드(값을 바꾸는 등)가 들어있어서 "실행되는지 여부" 자체가 달라질 때라는 걸 다시 확인했다.

`&&`와 반대로 `||`(OR) 연산은 두 피연산자 중 **하나라도 참이면 전체가 참**이 되므로, 왼쪽 조건이 이미 참이면 오른쪽 조건은 검사하지 않고 바로 넘어간다. 그래서 `&&`에서는 거짓일 확률이 높은 조건을 좌항에 두는 게 유리했다면, `||`에서는 반대로 **참일 확률이 높은 조건을 좌항에 두는 것**이 유리하다 — 좌항에서 이미 참이 확정되면 오른쪽 조건의 실행 자체를 건너뛸 수 있기 때문이다.

## 4. switch문 — 값 하나로 여러 경우를 비교하기

`switch`문은 다중 조건 상황에서 `if-else` 체인이 길어지는 단점을 대체하는 문법이다.

```text
switch(식) {
    case 값 : 실행코드; break;
    default : 기본코드;
}
```

- `식`에는 정수, 문자열처럼 비교 가능한 값이 들어간다.
- `case`는 식과 값이 일치할 때 실행할 코드를 정의한다.
- `break`는 분기를 종료하고 `switch` 블록을 빠져나가는 역할을 한다.

```java
int month = 1;

switch (month) {
    case 1:
        System.out.println("1월~");
        break;
    case 2:
        System.out.println("2월~");
        break;
    case 3:
        System.out.println("3월~");
        break;
    default:
        System.out.println("그 외의 월이에염");
}
```

```text
1월~
```

`break`를 빠뜨리면 일치한 `case` 이후의 코드가 다음 `case`의 조건과 상관없이 그대로 이어서 실행된다(fall-through). `default`는 어떤 `case`와도 일치하지 않을 때 실행되는, `if-else`의 `else`와 같은 역할을 한다.

## 오늘 정리

- `if / else if / else`는 조건을 위에서부터 순서대로 검사하다가, 처음으로 참이 되는 블록 하나만 실행하고 나머지는 전부 건너뛴다.
- 조건 순서가 항상 성능에 큰 영향을 주는 건 아니라는 것도 확인했다 — 단일 `if-else`에서는 조건이 하나뿐이라 순서를 바꿔도 비교 횟수는 그대로다. 진짜 단락 평가 효과는 `&&`/`||`처럼 조건이 여러 개 이어질 때 나타난다.
- `switch`문은 값 하나를 여러 경우와 비교할 때 유용하지만, `break`를 빠뜨리면 의도치 않게 다음 `case`까지 실행된다는 점을 주의해야 한다.

## 더 학습하면 좋은 개념

- **삼항 연산자(`조건 ? 값1 : 값2`)** — 간단한 `if-else`를 한 줄로 줄일 수 있는 연산자다. 오늘 만든 `if-else` 상당수가 값 하나를 정하는 용도라서, 다음에 이 연산자로 바꿔보면 차이가 잘 보일 것 같다.
- **switch 표현식(Java 14+ 화살표 문법 `case 1 ->`)** — 오늘 배운 콜론+`break` 방식과 달리 fall-through 없이 값을 바로 반환하는 최신 문법이다. `break` 누락 실수를 원천적으로 막아준다.
- **반복문(for / while)** — 조건을 한 번만 검사하는 `if`와 달리, 조건이 참인 동안 반복해서 검사하는 제어문이다. 조건문 다음 단계로 자연스럽게 이어지는 주제다.

## 참고 자료
- [Oracle - The if-then and if-then-else Statements](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/if.html)
- [Oracle - The switch Statement](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/switch.html)
