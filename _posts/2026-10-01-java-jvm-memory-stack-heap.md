---
title: "JVM 메모리 구조 — Stack과 Heap"
date: 2026-10-01 11:00:00
tags:
  - Java
---

`Student s = new Student();` 한 줄을 실행하면 변수 `s`와 `Student` 객체는 메모리 어디에 저장될까? [이전 글]({{ site.baseurl }}/java-fields-constructors-static.html)에서 정리한 필드·생성자·static 키워드가 실제로 놓이는 위치를 알려면 JVM의 메모리 구조를 알아야 한다.

> **TL;DR**
> - Method Area에는 클래스 정보와 `static` 변수, Heap에는 `new`로 만든 객체, Stack에는 지역 변수와 참조 변수가 저장된다.
> - `new Student()` 한 줄은 클래스 로딩 → Stack 프레임 생성 → Heap 할당 → 필드 초기화 순서로 처리된다.
> - GC는 주로 Heap에서 더 이상 참조되지 않는 객체를 회수하며, 실행 시점은 JVM이 판단한다.

## 1. JVM은 바이트코드를 실행하는 가상 기계다

JVM(Java Virtual Machine)은 Java를 실행하기 위한 **가상 기계**다. 운영체제나 하드웨어에 의존하지 않도록(플랫폼 독립성) 해주며, 실행 가능한 바이트코드(`.class` 파일)를 해석하고 실행하는 **해석기(interpreter)** 역할을 한다.

## 2. JVM 메모리는 세 영역으로 나뉜다

Java 애플리케이션은 실행 시 JVM에 의해 크게 **Method 영역, Heap 영역, Stack 영역**으로 나뉘어 메모리가 관리된다. (이 외에 PC Register, Native Stack 같은 영역도 있지만, 지금 단계에서 반드시 알아야 하는 내용은 아니다.)

### 2-1. Method Area (= Static Area)

- 클래스의 메타 정보, `static` 변수, 상수(`final`) 등을 저장한다.
- **JVM이 클래스를 로딩할 때** 메타 정보(클래스명, 메서드명, `static` 변수 등)를 저장하는 공간이다. 클래스가 처음 사용될 때 단 1회 로드되고, JVM 종료 시까지 유지된다.
- 한 번 로드된 클래스는 이 영역에 머무르며 **모든 스레드에서 공유**된다.
- 메서드 영역에 상주하는 정보 예: 클래스 구조, `static` 변수(예: `static int totalCount`), `final` 상수(예: `final double PI = 3.14`), 메서드 정의 정보.

### 2-2. Heap Area

- **`new` 키워드**로 생성된 **객체(인스턴스)**가 저장되는 공간이다.
- 모든 객체는 Heap에 저장되며, 참조형 변수는 이 주소를 가리킨다.
- **GC(Garbage Collector)**에 의해 메모리가 자동 해제된다.
- `Student s = new Student();`처럼 쓰면, `new Student()` 객체가 Heap에 생성되고 `s` 변수는 그 주소를 Stack에 저장한다.

### 2-3. Stack Area

- **메서드 호출 시 생성되는 실행 스택**이다.
- 각 메서드 호출마다 **스택 프레임(stack frame)**이 생성되며, **지역 변수, 매개변수, 참조 변수** 등을 저장한다.
- 메서드 실행이 끝나면 해당 스택 프레임은 **자동으로 제거**된다. Stack은 빠르지만 수명이 짧고, Heap보다 제한된 공간이다.

| 영역 | 저장되는 것 | 생명 주기 | 특징 |
|---|---|---|---|
| Method Area | 클래스 정보, static, 상수 | JVM 종료 시까지 | 모든 스레드 공유 |
| Heap | 객체(인스턴스) | GC가 제거 전까지 | 느리지만 유연 |
| Stack | 지역 변수, 참조 변수 | 메서드 종료 시 제거 | 빠르고 제한적 |

## 3. `new Student()` 한 줄은 메모리에서 어떻게 처리될까?

다음 코드를 기준으로 JVM 내부에서 메모리가 어떤 순서로 쓰이는지 따라가본다.

```java
class Student {
    String name;
    int age;
}

public class MainApplication {
    public static void main(String[] args) {
        Student s = new Student();
        s.name = "민지";
        s.age = 20;
    }
}
```

1. **클래스 로딩 (Method Area)** — JVM이 `Student`, `MainApplication` 클래스를 로딩한다. 메서드 영역에 클래스 구조(필드, 메서드, static 등)가 저장된다. 이때까지 객체는 아직 생성되지 않은 상태다.
2. **`main()` 메서드 실행 (Stack 생성)** — `main()`이 호출되면서 Stack 영역에 스택 프레임이 생성된다. `String[] args`, 지역 변수 `s`가 스택에 할당된다(아직 `null` 상태).
3. **객체 생성 (Heap 할당)** — `new Student()` 실행 시, JVM은 Heap 영역에 `Student` 객체를 생성한다. `name`, `age` 필드가 각각 기본값으로 초기화되고(`String`은 `null`, `int`는 `0`), 지역 변수 `s`는 그 객체의 **참조 주소**를 Stack에 저장한다.
4. **필드 초기화** — `s.name = "민지"; s.age = 20;`는 `s`가 가리키는 Heap의 객체 내부 필드를 수정한다. Stack에는 여전히 `s` 참조변수만 있고, 값은 Heap에 저장된다.
5. **메서드 종료 → Stack 정리** — `main()`이 종료되면 `s`를 포함한 Stack 프레임이 제거된다. 단, 객체 자체는 Heap에 남아 있고, GC가 더 이상 참조되지 않는다고 판단하면 그때 메모리에서 제거된다.

## 4. GC는 언제, 어떻게 객체를 정리할까?

JVM은 **Garbage Collector(GC)**를 내장해서 더 이상 사용하지 않는 객체를 자동으로 정리한다. C나 C++는 개발자가 직접 객체를 소멸시켜야 해서 학습 난이도가 높지만, Java는 이 작업을 GC가 대신 해주기 때문에 메모리 누수나 오류를 비교적 줄일 수 있다. Mark and Sweep, Generational GC, G1 GC 같은 GC 알고리즘이 있으며, Java 11 이상에서는 **G1 GC**가 기본값이다.

GC는 **명확한 시점 없이** JVM이 내부적으로 판단해서 수행한다(메모리 부족 시, 또는 JVM의 힌트에 따라). 개발자가 `System.gc();`로 호출할 수는 있지만, 요청만 할 뿐 반드시 실행되는 건 아니다. 명시적으로 `null`을 할당하거나 스코프를 벗어나면 GC 대상이 될 수 있다.

```java
Student s = new Student();
s = null; // 이제 더 이상 인스턴스를 참조하지 않게 됨 → GC 대상
```

## 5. GC가 있어도 메모리 누수가 생기는 경우

**메모리 누수(memory leak)**란 더 이상 필요하지 않지만 여전히 참조되고 있어서 GC가 회수하지 못하는 객체를 말한다. Java에서도 발생할 수 있으며, 웹 서버나 데이터베이스 서버처럼 장시간 실행되는 서비스에서는 누수된 객체가 계속 쌓이므로 특히 주의해야 한다.

- **컬렉션에 객체를 추가하고 제거하지 않았을 때**

    ```java
    List<Student> list = new ArrayList<>();
    Student s = new Student();
    list.add(s); // 이제부터 s는 list에 의해 참조됨
    ```

    이후 `s = null;` 해도 `list`가 `s`를 참조하고 있어서 `s`는 GC 되지 않는다. 더 이상 필요 없는 객체는 `remove()`를 호출해 컬렉션에서 명시적으로 제거해야 한다.

- **`static` 변수로 객체를 오래 유지할 때**

    ```java
    public class Cache {
        public static List<User> users = new ArrayList<>();
    }
    ```

    `static` 변수는 애플리케이션 종료 전까지 메서드 영역에서 살아있기 때문에, 여기에 쌓인 객체는 애플리케이션을 종료할 때까지 GC 대상이 되지 않는다. 약한 참조(WeakReference)나 캐시 관리 전략으로 제어가 필요하다.

- **리스너나 콜백을 등록 후 해제하지 않을 때**

    리스너가 계속 등록되어 있으면 해당 객체도 메모리에 남아 있게 된다. 리스너 해제(`removeListener`)나 약한 참조 사용이 필요하다.

## 6. `"Hello World"`를 출력하기까지 일어나는 일

`System.out.println("Hello World")` 한 줄이 실행되기까지, 크게 **컴파일 타임**과 **런타임** 두 단계를 거친다.

**컴파일 타임**

1. 개발자가 IntelliJ 같은 IDE에서 `.java` 소스 파일을 작성한다. 이 파일은 텍스트 기반이라 컴퓨터가 바로 실행할 수 없다.
2. 실행(Run) 버튼을 누르면 IDE가 OS 커널에 시스템 호출을 보내 **Java 컴파일러(`javac`)**를 실행하도록 요청한다. 이때 `JAVA_HOME` 같은 환경 변수로 적절한 컴파일러를 찾는다.
3. OS 커널은 파일 시스템 호출(open, read)로 소스 파일을 읽고, `javac`는 문법과 참조 오류를 검증한 뒤 `.class` 확장자의 **바이트코드 파일**을 생성해 디스크에 기록한다. 이 바이트코드는 JVM이 이해할 수 있는 중간 언어이며, CPU가 직접 실행할 수는 없다.

**런타임**

1. 컴파일이 끝나면 IDE는 OS 커널에 **JVM**을 실행하도록 요청한다. 커널은 JVM 실행을 위한 메모리를 할당하고 `java` 실행 파일을 메모리에 로드한다.
2. JVM의 **클래스 로더(Class Loader)**가 필요한 `.class` 파일을 동적으로 메모리에 로드한다(OS의 파일 시스템 호출을 통해 디스크에서 읽어온다). 읽어온 바이트코드는 Method Area에 저장된다.
3. 클래스 로더는 로드된 바이트코드가 Java 언어 명세와 JVM 명세에 맞는지 **검증(Verification)** 한다. 이 과정에서 커널은 JVM이 쓰는 메모리와 다른 프로세스의 메모리를 보호하기 위한 가상 메모리 관리를 수행한다.
4. JVM의 **실행 엔진**이 바이트코드를 실제 동작으로 바꾼다. 두 가지 방식이 있다.
    - **인터프리터**: 바이트코드를 한 줄씩 해석해서 실행한다. 초기 실행 속도는 빠르지만 전체 실행 속도는 느리다.
    - **JIT(Just-In-Time) 컴파일러**: 반복적으로 실행되는 코드 블록을 감지해 기계어로 변환하고 네이티브 코드 캐시에 저장한다. 한 번 컴파일된 코드는 바로 실행되므로 전체 속도를 높인다.
5. 실행 중 생성된 객체는 **Heap Area**에 저장되고, 더 이상 쓰이지 않는 객체는 **가비지 컬렉터**가 회수하며 필요 시 OS 커널에 메모리 반환을 요청한다.
6. `System.out.println("Hello World")`는 JVM 내부에서 네이티브 메서드를 통해 OS의 **표준 출력 스트림(stdout)**을 호출한다. OS는 이 요청을 처리해 콘솔에 `"Hello World"` 문자열을 표시한다.

## 7. (옵션) GC는 Heap Area만 대상일까?

Stack Area나 네이티브 메모리 영역은 GC의 관여 대상이 아니고, **Heap Area가 주 대상**이다. 즉, 대부분의 객체(인스턴스)는 Heap에 생성되며 더 이상 도달할 수 없는 객체들이 이 영역에서 회수된다.

다만 몇 가지 고려할 점이 있다.

- **클래스 메타데이터와 메서드 영역(메타스페이스)**: JDK 8 이후 PermGen 영역이 Metaspace로 대체됐는데, 여기엔 클래스의 메타데이터(클래스, 메서드, 상수 풀 등)가 저장된다. GC 알고리즘에 따라 클래스 언로딩이 이루어질 때 메타스페이스 내 일부 데이터도 회수될 수 있지만, 이건 "객체 GC"와는 구분되는, 클래스 언로딩과 밀접한 동작이다.
- **스택과 로컬 변수**: 각 스레드의 스택(메서드 호출 시 생성되는 프레임)은 GC 대상이 아니다. 스택 프레임은 메서드 호출 종료 시 자동으로 해제되며, GC 관점에서는 관리되지 않는다.

즉 일반적인 가비지 컬렉션은 Heap Area에서 이루어지지만, 클래스 언로딩에 따른 메타스페이스 회수처럼 GC와 유사한 효과를 내는 다른 영역도 존재할 수 있다. Stack Area와 네이티브 메모리 영역은 GC의 관여 대상이 아니다.

## 8. (옵션) 지역 내부 클래스(Local Inner Class)는 GC에서 어떻게 될까?

```java
void method() {
    class LocalInner {
        void print() {
            System.out.println("LocalInner");
        }
    }
    new LocalInner().print();
}
```

로컬 클래스는 메서드 내부에서 정의되는 클래스이고, 컴파일 시 별도의 `.class` 파일(예: `Application$1LocalInner.class`)로 생성된다. JVM은 클래스를 로딩하면 보통 메타데이터(이름, 필드, 메서드 정보 등)를 메서드 영역(Java 8 이후 Metaspace)에 저장한다. 그리고 "클래스 로더"와 그 클래스를 참조하는 객체들이 모두 GC 대상이 되었을 때, 그 클래스의 메타 정보를 **클래스 언로딩(Class Unloading)**을 통해 회수할 수 있다.

`method()`가 종료되면 `LocalInner` 인스턴스는 GC 대상이 되지만, `LocalInner` 클래스 자체의 메타 정보는 아직 메서드 영역에 남아 있다. 해당 클래스의 로딩 주체인 **클래스 로더가 살아있는 한** JVM은 메타 정보를 남겨두는 경향이 있고, JVM이 해당 클래스가 더 이상 필요 없다고 판단해서 클래스 언로딩이 발생할 때 비로소 메서드 영역에서 수거된다. 즉, `method()`가 종료되더라도 `LocalInner` 클래스의 메타 정보는 **즉시** 수거되지 않는다.

## 정리: 핵심 3가지와 다음에 볼 것

- JVM 메모리는 Method Area(클래스 정보·static), Heap(객체), Stack(지역 변수·참조 변수)으로 나뉘고, 각각 생명 주기와 공유 범위가 다르다.
- `Student s = new Student();` 한 줄은 클래스 로딩 → Stack 프레임 생성 → Heap 할당 → 필드 초기화 → 메서드 종료 시 Stack 정리 순서로 처리된다.
- GC는 기본적으로 Heap을 대상으로 하지만, 메타스페이스 회수처럼 유사한 효과를 내는 영역도 있다.
- 다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 정리했다.

## 더 학습하면 좋은 개념

- **Generational GC / G1 GC** — 오늘은 GC가 "언젠가 알아서 회수한다"는 수준까지만 봤는데, Young/Old 영역으로 나눠 효율을 높이는 세대별 GC 전략은 더 깊이 알아볼 만하다.
- **WeakReference / 약한 참조** — 메모리 누수를 막는 방법으로 언급됐는데, 일반 참조와 정확히 뭐가 다른지 코드로 직접 확인해보고 싶다.
- **클래스 로더(Class Loader) 계층 구조** — 오늘 "클래스 로더가 살아있는 한"이라는 표현이 나왔는데, 클래스 로더 자체가 부트스트랩/확장/애플리케이션처럼 계층을 이룬다는 걸 들어서, 다음에 자세히 보고 싶다.

## 참고 자료
- [Oracle - JVM Garbage Collection Tuning Guide](https://docs.oracle.com/en/java/javase/17/gctuning/introduction-garbage-collection-tuning.html)
- [The Java Virtual Machine Specification - 2.5. Run-Time Data Areas](https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-2.html#jvms-2.5)
