---
title: "추상화, 추상클래스와 인터페이스"
date: 2026-10-01 11:30:00
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-jvm-memory-stack-heap.html)에서 JVM 메모리 구조를 정리했고, 이번엔 객체지향의 핵심 기법 중 하나인 **추상화**, 그리고 추상화를 문법으로 구현하는 **추상클래스**와 **인터페이스**를 정리한다.

## 1. 추상화(abstraction)란

추상화는 **유연성을 확보하기 위해 공통적인 것을 추출하고 공통적이지 않은 것을 제거하는 것**을 의미한다. 추상화 과정을 통해 객체(Object)가 도출되고, 이 객체를 생성하기 위해 클래스를 설계한다. 즉 추상화는 현실 세계의 복잡한 사건을 단순화해서 새로운 객체지향 세계를 창조해나가는 과정이다.

예를 들어 현실 세계의 '라디오'를 추상화한다면, 사용자는 라디오의 "전원을 켠다", "주파수를 낮춘다", "볼륨을 높인다" 등의 기능만 알면 되지, 내부 회로나 동작 방식까지 알 필요가 없다. 즉 사용자는 라디오와 상호작용하기 위한 **추상화된 인터페이스**만 알고 있으면 된다.

### 1-1. 추상화의 필요성

- **복잡한 시스템을 단순하게 표현할 수 있다** — 핵심만 모델링해서 이해와 설계가 쉬워진다.
- **공통점을 기준으로 설계하면 코드 재사용성이 높아진다** — 중복 코드를 줄이고 유지보수성을 향상시킨다.
- **유연한 구조 설계가 가능하다** — 구현체에 의존하지 않고 인터페이스만으로 프로그램을 구성할 수 있다.
- **기능 확장과 교체가 쉬워진다** — 새로운 클래스가 기존 추상 구조를 따르기만 하면 연동할 수 있다.

### 1-2. 행위 중심 추상화 vs 데이터 중심 추상화

| 구분 | 설명 | 예시 |
|---|---|---|
| 행위 중심 추상화 | 객체가 수행할 **기능(행동)**에 초점 | `interface Runnable { void run(); }` |
| 데이터 중심 추상화 | 객체가 가진 **속성(데이터)**에 초점 | `abstract class Shape { int x, y; }` |

OOP에서 중요한 건 **객체와 객체 간의 상호작용을 설계하는 것**이라서, 필드(데이터)보다는 **메서드(행위)를 중심**으로 추상화하는 게 중요하다. 다만 필요에 따라 데이터를 중심으로 추상화하는 경우도 있는데, 대표적으로 DTO(Data Transfer Object) 같은 클래스가 그렇다.

**행위 중심 추상화 예시** — 카레이서와 자동차 시스템을 "무엇을 할 수 있나"에 집중해서 설계해보면 다음 순서를 따른다.

1. 요구사항 파악: 카레이서는 시동걸기·엑셀레이터 밟기·브레이크 밟기·시동 끄기를 할 수 있고, 자동차는 시동걸기·앞으로가기·멈추기·시동끄기를 할 수 있다.
2. 필요한 객체 추출: 카레이서, 자동차
3. 상호작용(각 객체가 수신할 수 있는 메시지) 추출: 카레이서 — "시동을 걸어라", "엑셀레이터를 밟아라" 등 / 자동차 — "시동을 걸어라", "앞으로 가라" 등
4. 클래스 설계: 카레이서 클래스(속성: 자동차 / 행위: 시동을 걸어라 등), 자동차 클래스(속성: 시동상태, 현재시속 / 메서드: 시동을 걸어라 등)

**데이터 중심 추상화 예시** — 회원 정보를 "무엇을 가지고 있나"에 집중해서 `MemberDTO` 클래스로 설계해봤다.

```java
public class MemberDTO {

    private int number;              // 회원번호
    private String name;             // 회원명
    private int age;                 // 나이
    private char gender;             // 성별
    private double height;           // 키
    private double weight;           // 몸무게
    private boolean isActivated;     // 회원탈퇴여부(활성화여부)

    public void setNumber(int number) { this.number = number; }
    public void setName(String name) { this.name = name; }
    public void setAge(int age) { this.age = age; }
    public void setGender(char gender) { this.gender = gender; }
    public void setHeight(double height) { this.height = height; }
    public void setWeight(double weight) { this.weight = weight; }
    public void setActivated(boolean isActivated) { this.isActivated = isActivated; }

    public int getNumber() { return number; }
    public String getName() { return name; }
    public int getAge() { return age; }
    public char getGender() { return gender; }
    public double getHeight() { return height; }
    public double getWeight() { return weight; }

    // 참고: boolean의 접근자는 get이 아니라 is로 시작하는 게 일반적인 관례다.
    public boolean isActivated() { return isActivated; }
}
```

값 객체가 가지는 속성(필드)을 추출하는 과정도 추상화라고 볼 수 있다. DTO 클래스를 만들 때는 모든 필드를 `private`로 만들고, 설정자(setter)·접근자(getter)로 간접 접근하게 한다.

```java
MemberDTO member = new MemberDTO();

member.setNumber(1);
member.setName("홍길동");
member.setAge(20);
member.setGender('남');
member.setHeight(180.5);
member.setWeight(80.6);
member.setActivated(true);

System.out.println("회원번호 : " + member.getNumber());
System.out.println("회원명 : " + member.getName());
```

```text
회원번호 : 1
회원명 : 홍길동
```

## 2. 추상클래스와 인터페이스의 차이점

### 2-1. 추상클래스란

**추상 메서드(메서드의 기능이 없고 헤더부만 존재하는 불완전한 메서드)를 0개 이상 포함하는 클래스**다. 스스로 자신의 생성자를 활용한 인스턴스 생성이 불가능하기 때문에 **불완전한 클래스**라고 볼 수 있다. 상속을 활용해 하위 클래스 타입의 인스턴스를 이용해서 생성해야 한다. 추상 메서드를 하나라도 포함하면 반드시 추상 클래스가 되어야 한다.

```java
abstract class AbstractClass {
    // 메서드의 바디가 없는 추상 메서드. 헤더(접근제어자, 예약어, 반환형, 메서드명, 매개변수)만 존재하고,
    // 반드시 끝에 세미콜론을 붙여야 한다.
    public abstract void method();

    public void method2() {} // 추상 클래스에는 추상 메서드가 아닌 완전한 메서드가 있어도 된다.
}
```

### 2-2. 인터페이스란

추상 메서드와 상수 필드만 가질 수 있는 **클래스의 변형체**다. 상속과 달리 `implements` 키워드를 쓰며, 자식 클래스 입장에서 '상속받았다'가 아니라 **'구현한다'**는 표현을 쓴다.

```java
interface TestInter {
    // 모든 필드는 public static final만 가능하다.
    public static final double PI1 = 3.1415;

    // public static final을 생략해도 자동으로 작성된다(생략 가능).
    double PI2 = 3.14;

    // 기본적으로 메서드는 public abstract여야 한다.
    public abstract void method1();

    // public abstract를 생략해도 자동으로 작성된다(생략 가능).
    void method2();
}
```

```java
class Person implements Instinct, Serializable {
    @Override
    public void eating(String food) {
        System.out.println("사람은 " + food + "를 요리하고 식기를 활용해 음식을 먹는다.");
    }
}
```

### 2-3. 공통점과 차이점

**공통점**

| 구분 | 추상 클래스 | 인터페이스 |
|---|---|---|
| 자체 인스턴스 생성 | 생성 불가 | 생성 불가 |
| 다형성 적용 시 상위 타입 활용 가능 유무 | 가능 | 가능 |

**차이점**

| 구분 | 추상 클래스 | 인터페이스 |
|---|---|---|
| 상속 가능 범위 | 단일 상속 | 다중 상속 |
| 키워드 | `extends` 사용 | `implements` 사용 |
| 추상 메서드 개수 | `abstract` 메서드 0개 이상 | 모든 메서드는 `abstract` |
| `abstract` 키워드 명시 | 명시적 사용 | 묵시적으로 `abstract` |

## 3. 언제 추상클래스/인터페이스를 사용해야 하는가

### 3-1. 추상 클래스를 사용하는 이유

추상 클래스는 스스로 인스턴스를 만들지 못하지만 **다형성 적용을 위한 부모 타입 역할**을 할 수 있다. 추상 메서드를 포함한 추상 클래스는 자식 클래스에 오버라이딩에 대한 **문법적 강제성을 부여**할 수 있다(추상 클래스를 상속받는 자식 클래스는 반드시 추상 메서드를 오버라이딩해야 한다). 필수 기능을 정의해 일관된 인터페이스(동일 기능)를 제공하는 데 도움이 된다.

```java
abstract class Animal {
    String name;      // 공통 속성

    void eat() {       // 기본 기능
        System.out.println("먹는다");
    }
}
```

### 3-2. 인터페이스를 사용하는 이유

인터페이스는 공유를 목적으로 하는 상수(`public static final` 필드)를 기반으로 **모든 기능을 공통화**(`public abstract` 메서드 = 공통된 인터페이스)해서 문법적 강제성을 부여할 목적으로 만들어졌다.

```java
interface Movable {
    // 이 인터페이스를 구현한 구현체는 반드시 move() 메서드를 강제로 구현해야 함.
    void move();
}
```

또한 Java의 **단일 상속이라는 단점을 어느 정도 극복**하기 위해서도 사용된다. 모든 클래스는 하나의 부모 클래스 외에도 여러 개의 인터페이스를 구현할 수 있다.

정리하면 다음과 같다.

- 상속 계층 설계가 필요하다면 → 추상클래스
- 역할(기능)만 정의하고 구현은 위임하고 싶다면 → 인터페이스

| 상황 | 추상클래스 | 인터페이스 |
|---|---|---|
| "is-a" 관계 (상속 기반) | 사용 적합 | - |
| "can-do" 관계 (능력 부여) | - | 사용 적합 |
| 공통된 상태(필드)를 함께 정의하고 싶을 때 | 가능 | 불가 |
| 공통된 기능(메서드)만 정의하고 싶을 때 | 가능 | 더 적합 |
| 단일 상속 구조 | 적합 | 가능 |
| 다중 타입 구현 필요(다중 상속) | 불가 | 가능 |

| 개념 | 의미 | 설명 | 예시 |
|---|---|---|---|
| is-a | 상속 | A는 B의 일종이다 | `Cat` is-a `Animal` |
| has-a | 포함(컴포지션) | A는 B를 가진다 | `Car` has-a `Engine` |
| can-do | 행위 능력(인터페이스) | A는 어떤 행동을 할 수 있다 | `Bird` can-do `Flyable` |

### 3-3. 잘못된 추상화의 예시와 개선 방법

**상황**: 회사 시스템에서 직원(Employee) 정보를 관리하려 한다. 관리자(Admin)와 개발자(Developer)는 모두 직원이다. 그래서 아래처럼 추상클래스를 설계했다.

```java
abstract class Employee {
    String name;
    int employeeId;

    abstract void writeCode(); // 모든 직원이 개발자는 아닌데도 구현이 강제됨
}

class Developer extends Employee {
    void writeCode() {
        System.out.println("코드를 작성합니다."); // 개발자는 코드를 작성하는 게 일이라 당연함.
    }
}

class Admin extends Employee {
    void writeCode() {
        // 관리자는 코드를 작성하는 게 자신의 일이 아닌데도 강제로 구현해야 함.
        throw new UnsupportedOperationException("관리자는 코드를 작성하지 않음");
    }
}
```

**문제점**

- `Employee` 추상 클래스가 **모든 하위 클래스가 코드를 작성할 수 있다고 강제**한다.
- 공통되지 않는 책임인 `writeCode()`를 추상화 과정에 포함시킨 게 문제다.
- `Admin`은 `writeCode()`를 쓸 일이 없는데도 강제로 구현해야 한다. → **리스코프 치환 원칙(LSP) 위반**, 유지보수 어려움, 런타임 예외 가능성 증가.

**개선 방법**: 역할 기반 분리 → 인터페이스 활용

```java
abstract class Employee {
    String name;
    int employeeId;
    // 공통 속성과 일반 행동만 정의
}

interface Coder {
    void writeCode();
}

class Developer extends Employee implements Coder {
    public void writeCode() {
        System.out.println("코드를 작성합니다.");
    }
}

class Admin extends Employee {
    // 코드 작성 기능 없음 → 인터페이스 구현하지 않음
}
```

| 항목 | 설명 |
|---|---|
| 행동을 인터페이스로 분리 | "코드 작성"은 일부 직원의 능력(can-do)이므로 분리 |
| 공통 속성은 추상클래스로 유지 | 이름, ID 등은 추상클래스에서 관리 |
| 불필요한 메서드 강제를 제거 | 관리자는 더 이상 `writeCode()`를 구현할 필요 없음 |

> "공통점이 아닌 것을 억지로 추상화하면, 오히려 하위 클래스에 불필요한 책임을 떠넘기게 된다."

## 오늘 정리

- 추상화는 공통적인 것을 추출하고 공통적이지 않은 것을 제거하는 작업이고, 행위(메서드) 중심으로 하는 게 원칙이지만 DTO처럼 데이터 중심으로 하는 경우도 있다는 걸 정리했다.
- 추상클래스는 상태(필드)를 가질 수 있고 단일 상속만 되지만, 인터페이스는 행위 명세에 집중하고 다중 구현이 가능하다는 차이를 코드와 표로 비교했다.
- "회사 직원" 예시로, 공통되지 않는 책임을 추상클래스에 억지로 넣으면 하위 클래스가 불필요한 구현을 강제당한다는 걸 직접 리팩토링하면서 확인했다.

## 더 학습하면 좋은 개념

- **리스코프 치환 원칙(LSP)** — 잘못된 추상화 예시에서 언급된 개념인데, SOLID 원칙 중 하나로 더 제대로 알아보고 싶다.
- **`default` 메서드 (인터페이스)** — 오늘 배운 인터페이스는 모든 메서드가 추상 메서드였는데, Java 8부터는 인터페이스에도 구현부가 있는 `default` 메서드를 쓸 수 있다고 들어서 다음에 비교해보고 싶다.
- **다형성** — 추상클래스/인터페이스가 "다형성 적용을 위한 부모 타입 역할"을 한다고 여러 번 나왔는데, 정작 다형성 자체는 아직 제대로 안 배워서 바로 다음으로 이어볼 주제다.

## 참고 자료
- [Oracle - Abstract Methods and Classes](https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html)
- [Oracle - Defining an Interface](https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html)
