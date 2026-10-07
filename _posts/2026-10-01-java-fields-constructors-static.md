---
title: "필드, 생성자, static 키워드"
date: 2026-10-01 10:30:00
tags:
  - Java
---

객체를 만들 때마다 따로 생기는 변수가 있고, 모든 객체가 하나를 같이 쓰는 변수도 있다. 이 차이는 어디서 생길까? 클래스를 이루는 필드·생성자·메서드와, 인스턴스 없이 쓸 수 있는 `static` 키워드를 정리한다. 객체지향의 사고방식은 [이전 글]({{ site.baseurl }}/java-oop-vs-procedural.html)에서 정리했다.

> **TL;DR**
> - 인스턴스 변수는 객체마다 따로 생기고, `static` 클래스 변수는 모든 객체가 공유한다.
> - 오버로딩의 성립 요건은 메서드 시그니처(이름 + 매개변수 타입/개수/순서)이며, 접근제한자·반환형·매개변수 이름은 포함되지 않는다.
> - `static` 멤버는 `클래스명.`으로 바로 접근하며, 초기화 블록·static import·싱글턴 패턴에도 쓰인다.

## 1. 필드(fields) : 객체가 가질 상태

필드는 Java의 클래스에서 **객체가 가지게 될 상태(= 데이터)**를 추상화해 정의해놓은 것이다.

## 2. 인스턴스 변수와 클래스 변수의 차이

```java
class Counter {
    int count = 0;              // 인스턴스 변수
    static int totalCount = 0;  // 클래스 변수 (static 키워드가 붙으며 공유가 목적임)

    void increment() {
        count++;
        totalCount++;
    }
}
```

- **인스턴스 변수**: 객체를 생성할 때마다 매번 별도로 생성되는 변수.
- **클래스 변수(`static`)**: 클래스가 로드될 때 1번만 생성되며, 생성될 모든 객체가 공유하는 변수.

| 변수 | 생성 시기 | 소멸 시기 |
|---|---|---|
| 클래스 변수 | 프로그램 시작 시 | 프로그램 종료 시 |
| 인스턴스 변수 | 인스턴스 생성 시 | 참조하지 않을 시(GC 소관) |
| 지역 변수 | 메서드 호출 시 | 메서드 종료 시 |

## 3. 생성자는 어떤 패턴으로 쓸까

```java
class Book {
    String title;

    // 기본 생성자
    Book() {
        this("제목 없음"); // 다른 생성자 호출
    }

    // 오버로딩된 생성자
    Book(String title) {
        this.title = title;
    }
}
```

- **기본 생성자(default constructor)**: 파라미터가 없는 생성자. 명시적으로 작성하지 않아도, 다른 생성자가 없으면 컴파일러가 자동으로 만들어준다.
- **오버로딩된 생성자(parameterized constructor)**: 파라미터가 다른 여러 생성자를 만들어 객체 생성 시 다양한 초기화 방식을 제공한다.

```java
class Animal {
    Animal(String type) {
        System.out.println(type + " 생성됨");
    }
}

class Dog extends Animal {
    Dog() {
        super("개");  // 부모 생성자 호출
    }
}
```

`this()`는 같은 클래스의 **다른 생성자**를 호출하고, `super()`는 **부모 클래스의 생성자**를 호출한다.

## 4. 메서드 시그니처와 오버로딩

동일한 클래스 내에는 동일한 이름의 생성자나 메서드를 작성할 수 없다. 하지만 매개변수의 **타입, 개수, 순서를 다르게** 작성하면 Java는 서로 다른 메서드로 인식하기 때문에, 같은 이름의 메서드를 여러 개 작성할 수 있다. 이것을 **오버로딩(overloading)**이라고 한다.

`메서드 시그니처` = `메서드 이름` + `매개변수 타입/개수/순서`다. 시그니처 중 매개변수의 타입/개수/순서가 다르면 다른 메서드로 인식하기 때문에, **메서드 시그니처가 오버로딩의 성립 요건**이 된다. 매개변수로는 기본자료형, 기본자료형 배열, 참조자료형, 참조자료형 배열, 가변인자를 쓸 수 있다.

```java
public void test() {}

// public void test() {}             // 에러남 (시그니처가 완전히 동일)
// private void test() {}            // 에러남 -> 접근제한자는 메서드 시그니처에 해당하지 않는다.
// public int test() { return 0; }   // 에러남 -> 반환형은 메서드 시그니처에 해당하지 않는다.

public void test(int num) {}         // 파라미터 선언부는 메서드 시그니처에 해당한다.

// public void test(int num2) {}     // 에러남 -> 매개변수의 이름은 메서드 시그니처에 영향을 주지 않는다.

public void test(int num1, int num2) {}
public void test(int num, String name) {}
public void test(String name, int num) {}
```

즉 접근제한자·반환형·매개변수 이름은 시그니처에 포함되지 않고, **매개변수의 타입·개수·순서**만 시그니처를 결정한다.

## 5. 가변인자(Variadic Arguments, varargs)

매개변수 개수가 정확히 정해져 있지 않고 가변적인 경우 `...` 문법으로 선언하며, 여러 개의 인자가 와도 에러 없이 모두 처리해준다.

```java
class Logger {
    void log(String... messages) {
        for (String msg : messages) {
            System.out.println(msg);
        }
    }
}

Logger logger = new Logger();
logger.log("시작합니다.");
logger.log("DB 연결", "쿼리 실행", "연결 종료");
```

- 내부적으로는 **배열**로 처리된다. `log("A", "B", "C")`는 내부적으로 `log(new String[]{"A", "B", "C"})`로 전달된다.
- 가변인자는 파라미터 선언부에서 **항상 마지막**에 와야 한다. `void notify(String... messages, String prefix)`처럼 쓰는 건 불가능하다.
- 가변인자는 배열과 비슷해서, 오버로딩 시 모호함(ambiguity)이 발생할 수 있다.

```java
void process(int... nums) { }     // OK
void process(int[] nums) { }      // 모호해서 컴파일 에러 발생 가능성 존재
```

## 6. static 키워드의 의미와 활용

`static`은 정적 메모리 영역에 프로그램이 시작될 때 할당하고자 할 때 쓰는 키워드다. `static` 필드나 메서드는 인스턴스 생성 없이 **`클래스명.`을 통해 바로 접근**할 수 있다. 여러 인스턴스가 **공유해서 사용할 목적**인 속성이나 필드에 붙인다.

`static`이 붙은 필드/메서드는 **클래스 차원**에서 존재해서, 별도의 객체 생성 없이 바로 사용할 수 있고 공통 값이나 유틸성 함수에 적합하다.

```java
class MathUtil {
    // PI(원주율)는 수학과 관련된 여러 곳에서 공용으로 접근할 수 있게 static으로 정의
    static final double PI = 3.1415;

    static int square(int x) {
        return x * x;
    }
}

int area = MathUtil.square(5);
```

## 7. static 초기화 블록

클래스가 처음 로드될 때 **한 번만 실행되는 블록**으로, 복잡한 초기화 작업에 사용한다.

```java
class AppConfig {
    static String version;

    static {
        version = "1.0.0";
        System.out.println("AppConfig 초기화");
    }
}
```

## 8. static import

`static import`를 사용하면 클래스 이름 없이 static 멤버를 사용할 수 있다. 다만 너무 남용하면 가독성이 떨어질 수 있으므로 꼭 필요한 상황에만 쓴다.

```java
import static java.lang.Math.*;

class Demo {
    void show() {
        // Math 클래스를 정적 임포트 했기 때문에 Math.sqrt() 대신 sqrt()로 바로 호출 가능
        System.out.println(sqrt(16));
    }
}
```

## 9. 싱글턴 패턴에서의 static 활용

애플리케이션 전체에서 객체를 **단 하나만 유지**하고 싶을 때 `static`으로 인스턴스를 보관하고 반환한다.

```java
class Singleton {
    private static Singleton instance = new Singleton();

    private Singleton() {}  // 외부에서 객체 생성 불가

    public static Singleton getInstance() {
        return instance;
    }
}

Singleton s = Singleton.getInstance();
```

싱글턴이란, 클래스의 인스턴스를 사용할 때 메모리 공간에 있는 하나의 인스턴스를 공유해서 사용하는 디자인 패턴이다(생성된 하나의 인스턴스만 사용).

## 정리

- 필드는 객체가 가질 상태를 정의한 것이고, 인스턴스 변수는 객체마다 따로, 클래스 변수(`static`)는 모든 객체가 공유한다는 차이를 정리했다.
- 생성자는 `this()`로 같은 클래스의 다른 생성자를, `super()`로 부모 클래스의 생성자를 호출할 수 있다.
- 메서드 시그니처(이름 + 매개변수 타입/개수/순서)가 오버로딩의 성립 요건이고, 접근제한자·반환형·매개변수 이름은 시그니처에 영향을 주지 않는다는 걸 에러 나는 코드와 나지 않는 코드로 직접 비교했다.
- `static`은 인스턴스 없이 클래스명으로 바로 접근할 수 있는 공유 멤버이고, 초기화 블록·static import·싱글턴 패턴까지 활용 범위를 넓혀서 봤다.

## 더 학습하면 좋은 개념

- **SOLID 원칙** — 오늘 배운 메서드 시그니처와 오버로딩은 결국 "유연한 설계"를 위한 도구인데, 더 큰 틀의 설계 원칙인 SOLID를 알면 왜 이런 문법이 필요한지 이해가 깊어질 것 같다.
- **싱글턴 패턴의 스레드 안전성** — 오늘 배운 싱글턴 코드는 간단한 형태인데, 여러 스레드가 동시에 `getInstance()`를 호출할 때도 안전한지는 다음에 더 알아보고 싶다.
- **static 멤버의 메모리 저장 위치** — `static` 변수가 정확히 메모리의 어느 영역에 저장되는지는 다음 글(JVM 메모리 구조)에서 바로 이어서 다룰 예정이다.

## 참고 자료
- [Oracle - Understanding Class Members](https://docs.oracle.com/javase/tutorial/java/javaOO/classvars.html)
- [Oracle - Arbitrary Number of Arguments](https://docs.oracle.com/javase/tutorial/java/javaOO/arguments.html)
