---
title: "static 필드는 왜 리셋되지 않을까"
date: 2026-10-06
tags:
  - Java
---

인스턴스를 새로 만들면 필드가 다시 0으로 시작하는데, `static` 필드는 왜 값이 그대로 남아 있을까?  
`Application`과 `StaticFieldTest` 두 클래스를 만들어서, 인스턴스 필드와 `static` 필드가 객체를 새로 만들 때 각각 어떻게 동작하는지 값을 출력하며 확인했다.  
앞선 주제는 [이전 글]({{ site.baseurl }}/java-method-overloading.html)에 정리해뒀다.

> **TL;DR**
> - `static` 멤버는 인스턴스가 아니라 클래스에 속해서, 모든 인스턴스가 하나의 값을 공유한다.
> - 인스턴스 필드는 `new`로 새 인스턴스를 만들 때마다 기본값으로 다시 시작하지만, `static` 필드는 값이 유지된다.
> - `static` 멤버는 `this`가 아니라 `클래스명.멤버명`으로 접근한다.

## 1. static은 클래스에 묶인 생명주기를 가진다

`static`이 붙은 변수나 메소드는 객체(인스턴스)가 생성되는 시점이 아니라, **애플리케이션이 시작되는 시점**에 초기화된다.  
`static`은 "정적"이라는 뜻 그대로, 일반적인 객체의 생명주기(생성 → 사용 → 소멸)와는 다른, 클래스 자체에 묶인 생명주기를 가진다.  
그래서 인스턴스를 몇 개를 만들든 `static` 멤버는 단 하나만 존재하고, 모든 인스턴스가 이 값을 공유한다.

## 2. StaticFieldTest와 Application 코드

필드와 메소드에 `static`을 붙인 경우와 안 붙인 경우를 나란히 비교해보려고 `StaticFieldTest` 클래스를 만들었다.

```java
package com.wanted.oop.b_oop.f_keyword.a_static;

public class StaticFieldTest {
        // static 키워드 확인을 위한  2개의 필드 선선
        private int nonStaticInt;
        private static int staticInt;

        // 인스턴스 생성 시 호출되는 기본 생성자
        // 필드를 초기화 하거나, 인스턴스 생성 시
        // 가장 먼저 해야 할 작업이 있다면 생성자 내부에 작성
        public StaticFieldTest(){}
        // alt+insert 값 출력 메서드


        public int getNonStaticInt() {
            return nonStaticInt;
        }

        public static int getStaticInt() {
            return staticInt;
        }

    // 각 필드 호출 시 1씩 증가시키는 메서드
        public void increaseNonstatic() {
            this.nonStaticInt++; // this : 자기 자신
        }
        public void increasestatic() {
            // static 키워드가 붙은 변수는 클래스명.변수명 으로 접근이 가능하다
            // this 는 사용되지 않는다-> 자기 자신에 포함되지 않는다
            StaticFieldTest.staticInt++;
        }
}
```

그리고 이 클래스를 실제로 호출해보는 코드를 `Application`에 작성했다.

```java
package com.wanted.oop.b_oop.f_keyword.a_static;

public class Application {
    static void main(String[] args) {
        /*comment. static 키워드
             ** 메인 메소드 : 프로그램 돌릴 때 가장 먼저 작동하는 것
            static이 붙은 변수/메소드는
            객체 생성 시점에 초기화 되는 것이 아닌
            어플리케이션 시작 시점에 초기화가 된다
            static은 정적이라는 의미를 가지고 있으며
            일반적인 객체의 생명주기와는 다른 생명주기를 가지고 있게 된다.
            -> 나중엔 환경 세팅할 때 씀 (데이터베이스 하나 만든 것처럼)
            */
        // 객체 (인스턴스 ) 생성 구문
        StaticFieldTest st1 = new StaticFieldTest();
        // 기본생성자 : 클래스가 가지고 있는 값 초기화 -> 기본 값나오게 함 = 0
        System.out.println("non-static 변수 값 확인 : " + st1.getNonStaticInt());
        // static 이 붙은 메서드는 클래스명.메소드명() 이렇게 호출한다
        //
        System.out.println("static 변수 값 확인 : " + StaticFieldTest.getStaticInt());

        // 각 변수를 1씩 증가시키는 메소드 호출
        st1.increaseNonstatic();
        st1.increasestatic();

        System.out.println("non-static 변수 값 확인 : " + st1.getNonStaticInt());
        System.out.println("static 변수 값 확인 : " + StaticFieldTest.getStaticInt());

        //
        StaticFieldTest st2 = new StaticFieldTest();

        System.out.println("st2 = non-static 변수 값 확인 : " + st2.getNonStaticInt());
        System.out.println("st2 = static 변수 값 확인 : " + StaticFieldTest.getStaticInt());
        // 기존에 1을 추가 했었기 때문에..
    }
}
```

`increaseNonstatic()`은 `this.nonStaticInt++`처럼 `this`로 접근하는 반면, `increasestatic()`은 `this` 없이 `StaticFieldTest.staticInt++`로 클래스 이름을 통해 접근한다.  
`static` 멤버는 특정 인스턴스에 속한 값이 아니라 클래스 자체에 속한 값이기 때문에, 인스턴스를 가리키는 `this`로 접근할 수 없다.

## 3. 인스턴스를 새로 만들어도 staticInt는 유지된다

`Application`의 실행 흐름대로 `nonStaticInt`와 `staticInt`가 각각 어떻게 바뀌는지 정리하면 다음과 같다.

| 시점 | st1.nonStaticInt | st2.nonStaticInt | staticInt |
|---|---|---|---|
| `st1` 생성 직후 | 0 | - | 0 |
| `st1.increaseNonstatic()`, `st1.increasestatic()` 호출 후 | 1 | - | 1 |
| `st2` 생성 직후 | 1 (유지) | 0 | 1 (유지) |

`st1`의 `increaseNonstatic()`을 호출하면 `st1`이 가진 `nonStaticInt`만 1이 되고, `increasestatic()`을 호출하면 `StaticFieldTest` 클래스 전체가 공유하는 `staticInt`가 1이 된다.  
이후 `st2`를 새로 생성하면, 인스턴스 필드인 `nonStaticInt`는 `st2`만의 새 값(기본값 0)으로 다시 시작하지만, `static` 필드인 `staticInt`는 `st2`를 새로 만든 것과 무관하게 이미 증가했던 값(1)을 그대로 유지한다.  
`static` 필드는 인스턴스가 아니라 클래스에 속해 있어서, 인스턴스를 아무리 새로 만들어도 리셋되지 않고 프로그램이 끝날 때까지 하나의 값을 공유한다는 걸 이 흐름으로 확인했다.

## 4. main 메소드에 public이 빠져 있다 (확인 필요)

- `Application.main()`이 `static void main(String[] args)`로 선언돼 있다. `java` 명령으로 직접 실행하는 진입점(entry point)이 되려면 전통적으로는 `public static void main(String[] args)`처럼 `public`이 붙어야 한다. 이 코드는 `public`이 빠져 있어서, 사용하는 Java 버전에 따라 커맨드라인에서 바로 실행되지 않을 수 있다. 버전별 허용 여부는 `확인 필요`다. 일반적인 형태인 `public static void main(String[] args)`를 지키려고 한다.

## 5. 정리

- `static`이 붙은 필드/메소드는 인스턴스 생성 시점이 아니라 애플리케이션 시작 시점에 초기화되고, 모든 인스턴스가 하나의 값을 공유한다.
- 인스턴스 필드(`nonStaticInt`)는 `new`로 새 인스턴스를 만들 때마다 기본값으로 다시 시작하지만, `static` 필드(`staticInt`)는 인스턴스를 몇 개를 만들든 값이 유지된다. `st1`, `st2` 두 인스턴스로 비교해서 확인했다.
- `static` 멤버는 `this`로 접근할 수 없고, `클래스명.멤버명` 형태로 접근한다.

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **static 메소드에서 인스턴스 메소드를 바로 호출할 수 없는 이유** — `static` 메소드는 특정 인스턴스 없이도 호출되기 때문에, 그 안에서 인스턴스에 속한 멤버를 바로 쓰려면 먼저 인스턴스를 만들어야 한다는 걸 오늘 코드에서도 `st1`을 직접 만든 뒤에 `st1.increaseNonstatic()`을 호출하는 식으로 겪었는데, 왜 이런 제약이 있는지 원리까지 더 들여다보고 싶다.
- **static 초기화 블록(static {})** — 지금은 필드 선언에서 기본값(0)으로만 초기화했는데, 더 복잡한 초기화가 필요할 때 쓰는 `static {}` 블록이 궁금해졌다.
- **싱글턴(Singleton) 패턴** — 오늘 본 `staticInt`처럼 "모든 인스턴스가 공유하는 값"이라는 개념을 한 단계 더 끌고 가면, "애플리케이션 전체에서 인스턴스를 단 하나만 유지"하는 싱글턴 패턴으로 이어진다.

## 참고 자료
- [Oracle - Understanding Class Members](https://docs.oracle.com/javase/tutorial/java/javaOO/classvars.html)
- [Oracle - The main() Method (Hello World)](https://docs.oracle.com/javase/tutorial/getStarted/application/index.html)
