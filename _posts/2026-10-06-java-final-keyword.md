---
title: "final 필드를 초기화하는 두 가지 방법"
date: 2026-10-06
tags:
  - Java
---

`final` 필드는 선언만 해두고 값을 비워두면 컴파일이 되지 않는다. [이전 글]({{ site.baseurl }}/java-singleton-pattern.html)의 싱글톤 패턴에 이어, `FinalFieldTest` 클래스로 `final` 필드를 어떻게 초기화해야 하는지 직접 실험했다.

> **TL;DR**
> - `final` 필드는 최초로 값을 대입한 뒤에는 바꿀 수 없다.
> - 초기화 방법은 필드 선언과 동시에 대입하거나, 생성자 안에서 대입하는 두 가지다.
> - 대문자와 `_`로 쓰는 표기법은 엄밀히는 `static final` 상수에 쓰는 관례다.

## 1. final은 최초 대입 이후 변경을 막는다

`final`이 붙은 변수는 **변경이 불가능**하다. 최초로 값을 대입한 이후에는 그 값을 다시 바꿀 수 없게 만들고 싶을 때 사용한다.

## 2. 실험에 쓴 FinalFieldTest 코드

```java
package com.wanted.oop.b_oop.f_keyword.c_final;

public class FinalFieldTest {
    /*comment. final 키워드
       final 키워드는 변경 불가의 의미를 갖는다.
       즉, 최초 초기화 이후에 값을 대입 후,
       변경 불가능하게 만들고자할 때에 사용된다.
       - final 키워드가 붙은 변수들은 식별을 위해
       - 예외적으로 대문자와 _(언더바)를 사용한다.
      */

    // final 키워드는 초기화 이후에 값을 변경할 수 없기 때문에
    // 선언만 하게 된다면 JVM 이 설정한 기본 값인 0이 들어가게 되는 것을 허용하지 않는다.
    // private final int NON_STATIC_NUM;

    // 1. final 키워드가 붙은 변수는 무조건 선언과 동시에 초기화를 해주어야 한다.
    private final int NON_STATIC_NUM =1;

    // 2. 생성자의 특징을 이용해서 선언만 할 수 있다.
    // 단, 무조건 생성자를 통해 초기화가 되어야 한다.
    private final int NON_STATIC_NUM2;

    public FinalFieldTest(int num){
        this.NON_STATIC_NUM2 = num;
    }

    public int getNON_STATIC_NUM() {
        return NON_STATIC_NUM;
    }

    public int getNON_STATIC_NUM2() {
        return NON_STATIC_NUM2;
    }

//    final 키워드가 붙은 변수는 값을 다시 대입할 수 없다.
//    public void setNON_STATIC_NUM(int num){
//        this.NON_STATIC_NUM = num;
//    }

}
```

```java
package com.wanted.oop.b_oop.f_keyword.c_final;

public class Application {
    public static void main(String[] args) {

        FinalFieldTest f = new FinalFieldTest(3);

    }
}
```

## 3. 선언과 동시에, 또는 생성자에서 초기화한다

`final` 필드는 선언만 해두고 비워둘 수 없다. 선언만 하면 `int` 같은 기본 자료형에 JVM이 기본값(`0`)을 넣어주는데, `final`은 그 기본값조차 "최초 대입"으로 쳐주지 않고 **반드시 명시적으로 값을 넣어야만** 컴파일을 허용한다. 그 방법은 두 가지다.

| 방법 | 코드 | 특징 |
|---|---|---|
| 필드 선언과 동시에 초기화 | `private final int NON_STATIC_NUM = 1;` | 모든 인스턴스가 같은 초기값을 가짐 |
| 생성자를 통한 초기화 | `private final int NON_STATIC_NUM2;` 선언 후 `this.NON_STATIC_NUM2 = num;`을 생성자에서 대입 | 인스턴스마다 생성자 매개변수로 다른 값을 넣을 수 있음 |

`NON_STATIC_NUM`은 필드 선언부에서 바로 `1`로 고정했기 때문에 `FinalFieldTest`의 모든 인스턴스가 같은 값(`1`)을 갖는다. 반면 `NON_STATIC_NUM2`는 필드 선언에서는 값을 비워두고, 대신 생성자가 반드시 실행되는 특징을 이용해서 생성자 안에서 `this.NON_STATIC_NUM2 = num;`으로 초기화한다. 그래서 `new FinalFieldTest(3)`처럼 호출할 때마다 인스턴스별로 다른 값을 줄 수 있다. 두 경우 모두 값이 한 번 정해지면, 주석 처리된 `setNON_STATIC_NUM()`처럼 이후에 값을 다시 대입하는 코드는 컴파일 에러가 난다.

## 4. 대문자+언더바 표기법은 어디까지 적용될까

코드 주석에 "`final` 키워드가 붙은 변수들은 식별을 위해 예외적으로 대문자와 `_`(언더바)를 사용한다"고 적어뒀다. 정확히는 이 표기법(`UPPER_SNAKE_CASE`)은 **모든 `final` 필드**가 아니라 주로 `static final`로 선언된, 클래스 전체가 공유하는 **상수(constant)**에 적용되는 관례다.

`NON_STATIC_NUM`, `NON_STATIC_NUM2`처럼 `static`이 붙지 않은 인스턴스 `final` 필드는 인스턴스마다 다른 값(`NON_STATIC_NUM2`처럼)을 가질 수 있어서 "상수"라고 보기엔 애매하다. 그래서 공식 코드 컨벤션 기준으로는 일반 필드와 같은 `camelCase`로 쓰는 경우가 더 일반적이다. `static` 없이 `final`만 붙인 필드에 상수 표기법을 쓰는 게 틀린 문법은 아니지만, 관례상으로는 `static final`에 더 가까운 표기법이다.

## 5. 정리

- `final` 필드는 기본값으로 남겨둘 수 없고, ① 필드 선언과 동시에 초기화하거나 ② 생성자 안에서 초기화하는 두 가지 방법 중 하나로 **명시적으로 초기화**해야 한다.
- 선언 시점에 초기화하면 모든 인스턴스가 같은 값을 갖고(`NON_STATIC_NUM`), 생성자에서 초기화하면 인스턴스마다 다른 값을 줄 수 있다(`NON_STATIC_NUM2`).
- `UPPER_SNAKE_CASE` 표기법은 엄밀히는 `static final` 상수에 쓰는 관례다. 이 코드는 `static`이 없는 인스턴스 필드에 썼다.

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **static final 상수** — 오늘은 인스턴스마다 값이 달라질 수 있는 `final` 필드를 다뤘는데, `static`과 `final`을 같이 쓰면 클래스 전체가 공유하는 진짜 "상수"가 된다. [이전에 정리한 static 키워드]({{ site.baseurl }}/java-static-keyword.html)와 묶어서 `static final`의 동작을 따로 정리하면 좋을 것 같다.
- **불변 객체(Immutable Object)와의 관계** — [캡슐화·불변 객체를 다룬 글]({{ site.baseurl }}/java-encapsulation-immutable-objects.html)에서 "한 번 만들어지면 상태가 바뀌지 않는 객체"를 다뤘는데, `final` 필드는 그런 불변 객체를 만들 때 핵심 재료가 된다. 오늘 배운 두 가지 초기화 방식이 불변 객체 설계에 어떻게 쓰이는지 연결해서 보고 싶다.
- **effectively final과 람다** — 람다식이나 익명 클래스 안에서 바깥의 지역 변수를 참조하려면 그 변수가 `final`이거나 "사실상 final(effectively final)"이어야 한다는 규칙이 있다고 들었는데, 오늘 배운 필드 레벨의 `final`과는 어떤 차이가 있는지 다음에 알아보고 싶다.

## 참고 자료
- [Oracle - Final Fields and Variables (Understanding Class Members)](https://docs.oracle.com/javase/tutorial/java/javaOO/classvars.html)
- [Java Language Specification - 4.12.4. final Variables](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.12.4)
