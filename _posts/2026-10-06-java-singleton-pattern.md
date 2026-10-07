---
title: "싱글톤 패턴: Eager와 Lazy"
date: 2026-10-06
tags:
  - Java
---

같은 클래스의 인스턴스를 매번 `new`로 만들면 메모리를 낭비하지 않을까? [이전 글]({{ site.baseurl }}/java-static-keyword.html)에서 확인한 `static` 필드의 공유 특성을 활용하면, 인스턴스를 하나만 만들어 계속 쓰는 **싱글톤(Singleton) 패턴**을 만들 수 있다. `EagerSingleton`, `LazySingleton` 두 가지 방식으로 직접 구현했다.

> **TL;DR**
> - 싱글톤은 생성자를 `private`로 막고 `static` 메소드(`getInstance()`)로만 인스턴스를 얻게 해서, 인스턴스를 하나만 공유하는 패턴이다.
> - Eager는 클래스 로드 시점에, Lazy는 `getInstance()`가 처음 호출될 때 인스턴스를 만든다.
> - `LazySingleton`은 여러 스레드가 동시에 처음 호출하면 인스턴스가 두 개 생길 위험이 있다.

## 1. 싱글톤은 인스턴스를 하나만 공유하는 패턴이다

싱글톤은 애플리케이션이 실행되는 동안 어떤 클래스의 인스턴스를 **딱 하나만** 만들어서, 그 인스턴스를 어디서든 공유해서 쓰는 디자인 패턴이다. 매번 `new`로 새 인스턴스를 만들지 않고 이미 만들어둔 하나를 재사용하기 때문에, 불필요한 메모리 낭비를 막을 수 있다. 리모컨에 비유하면, 사용할 때마다 리모컨을 새로 만들어서 쓰는 게 아니라 이미 있는 리모컨 하나를 계속 재사용하는 것과 같다.

싱글톤을 구현하는 방법은 크게 두 가지다.

- **이른 초기화(Eager Initialization)**: 클래스가 로드되는 시점에 바로 인스턴스를 만들어둔다.
- **게으른 초기화(Lazy Initialization)**: 실제로 인스턴스가 필요해질 때(`getInstance()`가 처음 호출될 때) 그제서야 인스턴스를 만든다.

## 2. EagerSingleton, LazySingleton 구현 코드

외부에서 `new`로 인스턴스를 마음대로 만들지 못하게 생성자를 `private`로 막고, 대신 `static` 메소드로만 인스턴스에 접근하게 만들었다.

```java
package com.wanted.oop.b_oop.f_keyword.b_singleton;

// 해당 클래스는 리모컨 클래스라고 생각해보자
public class EagerSingleton {

    // 필드에 인스턴스 초기화
    private static EagerSingleton eager = new EagerSingleton();

    // 기본 생성자 private
    private EagerSingleton() {}

    // 인스턴스 반환하는 메서드
    public static EagerSingleton getInstance() {
        return eager;
    }
}
```

```java
package com.wanted.oop.b_oop.f_keyword.b_singleton;

public class LazySingleton {
    private static LazySingleton lazy;

    private LazySingleton() {}

    // 외부에서 객체 필요 시 호출하는 메소드
    public static LazySingleton getInstance() {
        if (lazy == null) {
            lazy = new LazySingleton();
        }
        return lazy;
    }
}
```

두 클래스를 호출해서 실제로 같은 인스턴스가 반환되는지 `hashCode()`로 확인하는 코드도 작성했다.

```java
package com.wanted.oop.b_oop.f_keyword.b_singleton;

public class Application {
    static void main(String[] args) {
        /*comment. static 키워드를 활용한 singleton 패턴
            - 싱글톤 : 단일 인스턴스 (하나의 객체)
              어플리케이션이 실행될 때 어떤 클래스가 최초 한 번만 메모리에 할당되고,
              그 메모리에 인스턴스를 만들어서 하나의 인스턴스를 공유해 사용하여
              메모리 낭비를 방지할 수 있게 하는 디자인 패턴을 의미함.
            - 리모컨 : 1개 (재활용)

          comment. 싱글톤 패턴의 2가지 방법
                1. 이른 초기화 (eager)
                2. 게으른 초기화 (lazy)
          */

        // private 로 제한 (new: 리모컨 더 만들어서 배포와 같음)
        // 인스턴스를 생성하는 기본 생성자를 private로 막았기 때문에 외부 클래스에서 new로 객체 생성을
        // 막을 수 없게 만들어 두었다
        // EagerSingleton eager1 = new EagerSingleton();

        EagerSingleton eager1 = EagerSingleton.getInstance(); //getInstance : 싱글톤 타입
        EagerSingleton eager2 = EagerSingleton.getInstance();
        // eager1 = eager2 값이 같음
        System.out.println("eager1 의 hashcode() : "+ eager1.hashCode());
        System.out.println("eager2 의 hashcode() : "+ eager2.hashCode());
        // hashcode = 주민번호 (주소코드 알아볼 수 없어서 십진법으로 나오게 함)
        // 같은 값 나옴 : 같은 객체를 바라보고 있음

        LazySingleton lazy1 = LazySingleton.getInstance();
        LazySingleton lazy2 = LazySingleton.getInstance();
        System.out.println("lazy1 의 hashcode() : "+ lazy1.hashCode());
        System.out.println("lazy2 의 hashcode() : "+ lazy2.hashCode());

    }
}
```

`eager1`과 `eager2`는 각각 `EagerSingleton.getInstance()`를 따로 호출했지만, 둘 다 필드에 한 번 만들어둔 같은 `eager` 인스턴스를 반환받기 때문에 `hashCode()` 값이 서로 같다. `lazy1`, `lazy2`도 마찬가지로 `LazySingleton.getInstance()`를 호출할 때마다 `lazy` 필드가 `null`이 아니면 기존 인스턴스를 그대로 돌려주기 때문에 같은 값이 나온다. 즉, `new`를 직접 쓰지 않고 `getInstance()`를 여러 번 호출해도, 실제로는 하나의 인스턴스를 계속 공유하고 있다는 걸 해시코드로 눈으로 확인할 수 있었다.

## 3. Eager와 Lazy는 인스턴스를 만드는 시점이 다르다

| 구분 | 이른 초기화 (Eager) | 게으른 초기화 (Lazy) |
|---|---|---|
| 인스턴스 생성 시점 | 클래스 로드 시점 (필드 선언과 동시에) | `getInstance()`가 처음 호출될 때 |
| 구현 방식 | `private static EagerSingleton eager = new EagerSingleton();` | `getInstance()` 안에서 `lazy == null`일 때만 생성 |
| 장점 | 구현이 단순하고, 생성 시점이 명확함 | 실제로 쓰일 때까지 인스턴스를 만들지 않아 자원을 아낄 수 있음 |
| 단점 | 한 번도 쓰이지 않아도 애플리케이션 시작 시 무조건 생성됨 | 여러 스레드가 동시에 `getInstance()`를 처음 호출하면 인스턴스가 두 개 생길 위험이 있음 |

## 4. private 생성자가 인스턴스 하나를 보장한다

두 방식 모두 핵심은 **생성자를 `private`로 막았다는 것**이다. 생성자가 `private`이면 클래스 외부에서는 `new EagerSingleton()`, `new LazySingleton()`처럼 직접 인스턴스를 만들 수 없고, 오직 클래스 내부에서 정의한 `static` 메소드(`getInstance()`)를 통해서만 인스턴스에 접근할 수 있다. 그래서 외부 코드가 실수로라도 인스턴스를 여러 개 만들어버릴 방법 자체가 없어진다.

## 5. 정리

- 싱글톤 패턴은 생성자를 `private`로 막고, `static` 필드와 `static` 메소드(`getInstance()`)로만 인스턴스에 접근하게 해서 인스턴스를 하나만 공유한다.
- 이른 초기화(Eager)는 클래스 로드 시점에 바로 인스턴스를 만들고, 게으른 초기화(Lazy)는 `getInstance()`가 처음 호출될 때 `null` 체크 후 생성한다.
- `getInstance()`를 여러 번 호출해도 `hashCode()`가 계속 같아서, 같은 인스턴스를 공유하고 있음을 확인했다.

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **LazySingleton의 스레드 안전성(Thread Safety)** — 오늘 만든 `LazySingleton`은 `if (lazy == null)` 체크와 생성 사이에 여러 스레드가 동시에 끼어들면 인스턴스가 두 개 생길 수 있는 구조다. `synchronized` 키워드나 더블 체크 락킹(Double-Checked Locking)으로 이 문제를 어떻게 막는지 다음에 알아보고 싶다.
- **Bill Pugh Singleton (Holder 패턴)** — 정적 중첩 클래스(static nested class)를 이용해서 이른 초기화의 단순함과 게으른 초기화의 효율을 동시에 얻는 방법이 있다고 들었는데, 오늘 배운 두 방식과 비교해서 정리하면 좋을 것 같다.
- **enum을 이용한 싱글톤** — `enum`으로 싱글톤을 구현하면 직렬화·리플렉션 공격에도 안전하다고 알려져 있는데, 오늘 배운 `private` 생성자 방식과 어떻게 다른지 궁금해졌다.

## 참고 자료
- [Oracle - Understanding Class Members](https://docs.oracle.com/javase/tutorial/java/javaOO/classvars.html)
- [Java Language Specification - 12.4. Initialization of Classes and Interfaces](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.4)
