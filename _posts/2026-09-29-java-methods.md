---
title: "메소드로 코드 재사용하기"
date: 2026-09-29 10:00:00
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-loops.html)에서 반복문을 정리했고, 이번엔 반복되는 코드를 아예 하나의 단위로 묶어서 재사용하는 메소드를 정리한다.

## 1. 메소드가 없을 때의 문제

두 수를 더하고 출력하는 코드를 두 번 짜보면 문제가 보인다.

```java
int num1 = 1;
int num2 = 2;
System.out.println("1번째 연산 결과:" + (num1 + num2));

int num3 = 3;
int num4 = 4;
System.out.println("2번째 연산 결과:" + (num3 + num4));
```

```text
1번째 연산 결과:3
2번째 연산 결과:7
```

더하고 싶은 숫자 쌍이 늘어날 때마다, 변수 선언 2줄과 연산·출력 1줄이 계속 반복된다.

## 2. 메소드 정의와 호출

메소드는 특정 작업을 수행하는 코드 블록이다. 코드의 재사용성과 가독성을 높이기 위해 사용하며, 형식은 다음과 같다.

```text
[접근제어자][반환타입] 메소드명 ([매개변수 타입 매개변수명]) {
    실행할 코드
    [return 반환값;]
}
```

```java
public int sumTwoNumber(int a, int b) {
    return a + b;
}
```

메소드를 호출하려면 먼저 클래스의 인스턴스를 만든 뒤, 그 인스턴스를 통해 메소드에 접근한다.

```java
Application01 app = new Application01();

System.out.println("3번째 연산 : " + app.sumTwoNumber(5, 6));
System.out.println("4번째 연산 : " + app.sumTwoNumber(7, 8));
System.out.println("5번째 연산 : " + app.sumTwoNumber(9, 10));
```

```text
3번째 연산 : 11
4번째 연산 : 15
5번째 연산 : 19
```

`클래스명 변수명 = new 클래스명();`으로 인스턴스를 만들고, `변수명.메소드명()`으로 호출한다. 호출할 때마다 매개변수(`a`, `b`)에 다른 값을 넘겨서, 덧셈 코드는 한 번만 작성하고 여러 번 재사용했다.

## 3. 메소드는 "정의"만으로는 실행되지 않는다

메소드를 만드는 것과, 그 메소드가 실제로 실행되는 것은 서로 다른 이야기다. 아래 `methodB()`처럼 메소드를 정의해두기만 하고 프로그램 어디에서도 그 이름을 불러주지 않으면, 그 안의 코드는 프로그램을 아무리 실행해도 절대 출력되지 않는다.

```java
public void methodB() {
    System.out.println("methodB() 호출됨..");
}
```

이유는 간단하다. 자바 프로그램은 파일에 적힌 순서대로, 즉 위에서 아래로 모든 메소드를 차례로 실행하는 게 아니다. `main()`에서 시작해서, **실제로 호출된 메소드만, 호출된 바로 그 시점에** 실행한다. 메소드를 정의하는 건 "이런 기능을 나중에 쓸 수 있게 준비해뒀다"는 뜻일 뿐, 그 자체가 실행 명령은 아니다. 그래서 `methodB()`를 어디선가 직접 호출해주지 않는 한, 그 안의 출력문은 존재하지 않는 코드나 마찬가지다.

## 4. 메소드 호출 문법 뜯어보기

메소드를 호출하려면 먼저 그 메소드가 속한 클래스의 인스턴스(객체)를 만들어야 한다.

```java
Application02 app2 = new Application02();
app2.methodA();
```

이 두 줄을 하나씩 뜯어보면 다음과 같다.

1. `new Application02()` — `Application02` 클래스의 인스턴스를 하나 만든다. 클래스가 "설계도"라면, `new`는 그 설계도로 실제 객체를 하나 찍어내는 동작이다.
2. `Application02 app2 = ...` — 방금 만든 인스턴스를 `app2`라는 변수에 담아서, 앞으로 이 인스턴스를 `app2`라는 이름으로 가리킬 수 있게 한다.
3. `app2.methodA()` — `app2`가 가리키는 인스턴스 안에 있는 `methodA`를 **지금 당장 실행하라**는 명령이다. 여기서 이름 뒤에 붙는 `()`(소괄호)가 핵심이다. 소괄호가 붙어야 비로소 "호출"이 되고, 소괄호 없이 `methodA`라는 이름만 있으면 그냥 이름을 가리키는 것일 뿐 실행되지 않는다.

`methodA`, `methodB`, `sumTwoNumber`처럼 `static`이 붙지 않은 메소드는 클래스 자체가 아니라 **인스턴스에 속한 기능**이기 때문에, `app2`나 `app` 같은 인스턴스를 먼저 만들지 않으면 애초에 호출할 방법이 없다.

## 5. 호출이 실제로 일어나는 순서

```java
public void methodA() {
    System.out.println("methodA() 호출됨..");
    methodB();
    System.out.println("methodA() 종료됨");
}

public void methodB() {
    System.out.println("methodB() 호출됨..");
}
```

```text
main() 시작됨..
methodA() 호출됨..
methodB() 호출됨..
methodA() 종료됨
main() 종료됨..!
```

`void`는 반환값이 없는 메소드에 쓰는 반환 타입이다. 실행 순서를 단계별로 따라가면 다음과 같다.

1. `main()`이 가장 먼저 실행되며 `"main() 시작됨.."`을 출력한다.
2. `app2.methodA()`가 호출되면서 실행 흐름이 `methodA` 내부로 넘어간다.
3. `methodA` 안에서 `"methodA() 호출됨.."`이 출력된다.
4. `methodA` 안에서 `methodB()`를 호출하는 순간, `methodA`는 그 자리에서 멈추고 실행 흐름이 `methodB` 내부로 넘어간다.
5. `methodB` 안에서 `"methodB() 호출됨.."`이 출력된다.
6. `methodB`에는 더 실행할 코드가 없으므로 종료되고, 멈춰 있던 `methodA`로 실행 흐름이 돌아온다.
7. `methodA`의 나머지 코드인 `"methodA() 종료됨"`이 출력된다.
8. `methodA`도 종료되어 `main()`으로 돌아오고, `"main() 종료됨..!"`이 출력되며 프로그램이 끝난다.

여기서 중요한 건 `methodB()`가 `main()`이 아니라 `methodA` 코드 안에서 호출됐다는 점이다. `main()`이 `methodB`를 직접 부른 게 아니라, `methodA`가 실행되는 도중에 `methodA`가 `methodB`를 불렀다. 그래서 `methodB`가 끝나면 `main()`으로 바로 돌아가는 게 아니라, `methodB`를 부른 `methodA`로 먼저 돌아간다.

## 6. 메소드 호출과 후입선출(LIFO)

오늘 노트 끝에는 "선입선출/후입선출, FIFO/LIFO"라는 메모가 따로 남아 있었는데, 이건 방금 본 `methodA` → `methodB` 호출 순서와 바로 연결된다. `methodA`가 `methodB()`를 호출하면 `methodA`는 그 자리에서 잠시 멈추고, `methodB`가 그 위에 쌓여 먼저 실행된다. `methodB`가 끝나야 비로소 `methodA`로 돌아와 나머지 코드(`"methodA() 종료됨"`)를 실행한다. 즉 **나중에 호출된 메소드가 먼저 끝나고 돌아가는 구조**라서, 먼저 들어온 게 먼저 나가는 FIFO가 아니라 나중에 들어온 게 먼저 나가는 후입선출(LIFO) 방식이다. 이 호출 스택(Call Stack) 구조가, 오늘 본 실행 순서(`methodA` 시작 → `methodB` 시작·종료 → `methodA` 종료)가 나오는 이유다.

## 오늘 정리

- 반복되는 코드를 메소드로 묶으면 재사용성과 가독성이 좋아진다는 걸 직접 비교해서 확인했다 — 같은 덧셈 로직을 변수 선언 없이 인자만 바꿔서 여러 번 호출할 수 있었다.
- 메소드는 다른 메소드 안에서도 호출할 수 있고, 그 실행 순서는 호출 스택(LIFO) 구조를 따른다는 걸 `methodA` → `methodB` 예제로 확인했다.

## 더 학습하면 좋은 개념

- **매개변수·반환값의 다양한 조합** — 오늘은 `int` 반환(`sumTwoNumber`)과 `void`(`methodA`, `methodB`) 두 형태만 봤는데, 매개변수가 없거나 여러 개인 경우까지 정리하면 메소드 형식이 완전히 정리될 것 같다.
- **오버로딩(Overloading)** — 같은 이름의 메소드를 매개변수 구성만 다르게 여러 개 정의하는 문법이다. 오늘 만든 `sumTwoNumber(int, int)`를 다른 타입 버전으로 늘리는 경우가 궁금해졌다.
- **재귀(Recursion)** — 메소드가 자기 자신을 호출하는 방식이다. 오늘 배운 호출 스택 개념이 재귀를 이해하는 데 그대로 쓰이기 때문에 바로 이어서 볼 만한 주제다.

## 참고 자료
- [Oracle - Defining Methods](https://docs.oracle.com/javase/tutorial/java/javaOO/methods.html)
- [Java Virtual Machine Specification - 2.6. Frames](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.6)
