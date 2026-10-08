---
title: "SOLID 원칙 5가지: 요구사항이 바뀔 때 어디까지 고쳐야 할까"
date: 2026-10-08
tags:
  - Java
---

결제 수단이 하나 늘 때마다 기존 `PaymentService`를 열어서 `if`를 추가해야 한다면, 그 클래스는 요구사항이 바뀔 때마다 위험에 노출된다.  
SOLID는 이런 상황을 줄이려고 만든 객체지향 설계 원칙 5가지의 앞 글자를 모은 이름이다.  
다섯 원칙을 "나쁜 코드 → 고친 코드" 예시로 하나씩 보고, 마지막의 의존성 역전(DIP)이 의존성 주입(DI)과 어떻게 이어지는지까지 정리했다.

> **TL;DR**
> - SOLID는 **변경에 강하고 확장하기 쉬운** 코드를 만드는 5가지 원칙(SRP, OCP, LSP, ISP, DIP)이다.
> - 다섯 원칙은 모두 "무엇이 바뀔 때 어디를 고쳐야 하는가"를 줄이는 방향으로 이어진다.
> - DIP는 설계 원칙이고, DI(의존성 주입)는 그 원칙을 코드로 실현하는 방법이다.

환경: Java (버전 무관한 개념 설명). 아래 코드는 원칙을 보이기 위한 **예시 코드**이고, 직접 실행해 확인하지는 않았다. `...`는 생략한 구현이다.

## 1. 다섯 원칙을 한눈에 보기

| 약어 | 이름 | 한 줄 정의 |
|---|---|---|
| SRP | 단일 책임 원칙 | 하나의 클래스는 하나의 책임만 가져야 한다 |
| OCP | 개방-폐쇄 원칙 | 확장에는 열려 있고, 수정에는 닫혀 있어야 한다 |
| LSP | 리스코프 치환 원칙 | 자식 클래스는 부모 클래스를 대체할 수 있어야 한다 |
| ISP | 인터페이스 분리 원칙 | 클라이언트가 쓰지 않는 메소드에 의존하면 안 된다 |
| DIP | 의존성 역전 원칙 | 구체 클래스가 아니라 추상화(인터페이스)에 의존해야 한다 |

이 원칙을 지키면 유지보수가 쉽고, 변경에 유연하며, 테스트하기 좋은 구조가 된다.  
스프링(Spring) 같은 프레임워크도 이 원칙 위에서 설계되어 있다.  
지금은 개념을 익히는 단계이고, 직접 구현해서 연결하는 일은 스프링에서 다시 다룬다.

## 2. SRP: 클래스가 바뀌는 이유는 하나여야 한다

여기서 책임은 곧 **변경의 이유**다.  
한 클래스가 여러 이유로 바뀐다면 책임이 둘 이상이라는 뜻이다.

### 책임이 섞인 코드

```java
class Report {

    String title;
    String content;

    void saveToFile() { /* 파일 저장 */ }
    void print() { /* 콘솔 출력 */ }
}
```

`Report` 하나에 데이터 관리, 저장, 출력 책임이 모두 들어 있다.  
출력 방식이 바뀌어도, 저장 방식이 바뀌어도 이 클래스를 고쳐야 한다.

### 책임을 나눈 코드

```java
class Report {

    String title;
    String content;
}

class ReportPrinter {

    void print(Report report) { ... }
}

class ReportSaver {

    void saveToFile(Report report) { ... }
}
```

각 클래스의 변경 이유가 하나로 분리된다.  
출력이 바뀌면 `ReportPrinter`만, 저장이 바뀌면 `ReportSaver`만 고친다.

적용하는 방법은 세 가지다.

| 방법 | 설명 |
|---|---|
| 기능별 클래스로 분리 | 하나의 클래스에 여러 역할을 넣지 않는다 |
| 관심사의 분리(SoC, Separation of Concerns) | UI, 로직, 저장소를 명확히 나눈다 |
| 변경 원인이 하나뿐인 구조 | 클래스를 고치는 이유가 하나로 떨어지게 설계한다 |

## 3. OCP: 새 기능을 기존 코드 수정 없이 붙인다

### if가 계속 늘어나는 코드

```java
class PaymentService {

    void pay(String method) {

        if (method.equals("card")) {
            System.out.println("카드 결제");
        } else if (method.equals("kakao")) {
            System.out.println("카카오페이");
        }
    }
}
```

결제 수단이 늘 때마다 `pay()`를 수정해야 한다.  
기존 코드를 고치면 잘 동작하던 부분까지 망가질 위험이 있고 유지보수 비용도 늘어난다.

### 인터페이스로 확장하는 코드

```java
interface PayStrategy {

    void pay();
}

class CardPay implements PayStrategy {

    public void pay() {
        System.out.println("카드 결제");
    }
}

class KakaoPay implements PayStrategy {

    public void pay() {
        System.out.println("카카오페이");
    }
}

class PaymentService {

    private PayStrategy payStrategy;

    public PaymentService(PayStrategy payStrategy) {
        this.payStrategy = payStrategy;
    }

    public void processPayment() {
        payStrategy.pay();   // 구현체에 따라 동작이 바뀐다
    }
}
```

새 결제 수단은 `PayStrategy`를 구현하는 **새 클래스를 추가**하면 된다.  
`PaymentService`는 고치지 않는다.  
이렇게 행위(메소드)를 객체로 분리해 주입해서 동작을 바꾸는 방식을 전략 패턴(Strategy Pattern)이라고 하고, OCP를 구현하는 대표적인 방법이다.

## 4. LSP: 부모 자리에 자식을 넣어도 똑같이 동작해야 한다

LSP는 자식이 부모와 맺은 **계약**을 지켜야 한다는 원칙이다.  
계약은 메소드가 실행되기 전에 만족해야 할 조건(사전조건), 실행 후 보장해야 할 결과(사후조건)를 뜻한다.

### 계약을 깨는 경우

```java
class Bird {

    void fly() { System.out.println("날아간다"); }
}

class Ostrich extends Bird {

    void fly() { throw new UnsupportedOperationException(); }
}
```

`Ostrich`는 `Bird`이지만 날지 못한다.  
`Bird` 타입 변수에 `Ostrich`를 넣고 `fly()`를 부르면 예외가 난다.  
부모 자리에 자식을 넣었더니 동작이 달라진 것이므로 LSP 위반이다.

### 사전조건과 사후조건

| 구분 | 의미 | 자식이 해서는 안 되는 일 | 위반 예 |
|---|---|---|---|
| 사전조건 | 실행 전에 만족해야 할 조건 | **강화**한다(더 까다롭게 만든다) | 부모는 모든 금액을 환불하는데 자식은 1000원 초과를 거부한다 |
| 사후조건 | 실행 후 보장해야 할 결과 | **약화**한다(보장을 줄인다) | 부모는 `"OK"`를 반환하는데 자식은 `null`을 반환한다 |

```java
class Payment {
    void refund(int amount) {
        // 모든 금액 환불 가능
    }
}

class SecurePayment extends Payment {
    void refund(int amount) {
        if (amount > 1000) throw new IllegalArgumentException();   // 사전조건 강화
    }
}
```

### 다형성과 LSP

다형성은 부모 타입으로 자식 객체를 다룰 수 있다는 뜻이다.  
LSP가 지켜져야 이 다형성이 안전하다.

```java
List<Animal> animals = List.of(new Dog(), new Cat());

for (Animal a : animals) {
    a.speak();   // Dog든 Cat이든 똑같이 동작해야 한다
}
```

`Dog`나 `Cat`이 `Animal`의 규약을 깨면 이 반복문은 예외나 잘못된 동작을 일으킨다.

### 날지 못하는 새는 어떻게 설계할까

날 수 없는 새가 존재한다면 `Bird`에 `fly()`를 넣은 설계 자체가 문제다.  
날 수 있는 새만 `fly()`를 갖도록 인터페이스를 따로 둔다.

```java
// 예시 설계
interface Flyable {
    void fly();
}

class Sparrow implements Flyable {
    public void fly() { System.out.println("날아간다"); }
}

class Ostrich { /* fly()가 없다 */ }
```

## 5. ISP: 쓰지 않는 메소드를 구현하도록 강요하지 않는다

### 거대한 인터페이스

```java
interface MultiFunctionDevice {

    void print();
    void scan();
    void fax();
}

class SimplePrinter implements MultiFunctionDevice {
    public void print() { ... }
    public void scan() { throw new UnsupportedOperationException(); }
    public void fax() { throw new UnsupportedOperationException(); }
}
```

단순 프린터는 `scan`과 `fax`가 필요 없는데도 구현을 강제당한다.  
쓰지 않는 기능에 의존하게 되므로 ISP 위반이다.

### 필요한 기능만 담은 인터페이스

```java
interface Printer {
    void print();
}

interface Scanner {
    void scan();
}

interface Fax {
    void fax();
}

class SimplePrinter implements Printer {
    public void print() { ... }
}

class HomeMultiFunctionalPrinter implements Printer, Scanner {
    public void print() { ... }
    public void scan() { ... }
}
```

각 클래스는 자신이 할 수 있는 기능의 인터페이스만 구현한다.  
`Scanner`는 `java.util.Scanner`와 이름이 같아서, 실제 프로젝트에서는 겹치지 않는 이름으로 짓는 편이 낫다.

### 응집도 높은 인터페이스

인터페이스에 든 메소드가 **하나의 목적**을 공유하면 응집도가 높다고 한다.

```java
// 나쁜 예: 저장소가 이메일까지 보낸다
interface Repository {
    void save();
    void delete();
    void sendEmail();
}

// 좋은 예: 목적별로 분리한다
interface Saveable {
    void save();
}

interface Deletable {
    void delete();
}
```

목적이 분리되면 필요한 것만 골라서 조합할 수 있다.

## 6. DIP: 구체 클래스가 아니라 추상화에 의존한다

모듈은 두 종류로 나눠서 생각한다.

| 구분 | 역할 | 예 |
|---|---|---|
| 고수준 모듈 | 핵심 비즈니스 로직 | 주문 서비스, 결제 처리 |
| 저수준 모듈 | 세부 구현 | 파일 저장, 데이터베이스 연동 |

DIP는 고수준 모듈이 저수준 모듈의 구체 클래스에 직접 의존하지 말고, 둘 다 **추상화(인터페이스)**에 의존하라는 원칙이다.

### 구체 클래스에 직접 의존하는 코드

```java
class FileLogger {

    void log(String msg) {
        // 파일에 기록
    }
}

class OrderService {

    private FileLogger logger = new FileLogger();   // 구체 클래스에 직접 의존

    void processOrder() {
        logger.log("주문 처리");
    }
}
```

`OrderService`가 `FileLogger`와 강하게 묶여 있다.  
`DBLogger`나 `ConsoleLogger`로 바꾸려면 `OrderService`를 직접 고쳐야 한다.

### 인터페이스에 의존하는 코드

```java
interface Logger {

    void log(String msg);
}

class FileLogger implements Logger {

    public void log(String msg) { ... }
}

class DBLogger implements Logger {

    public void log(String msg) { ... }
}

class OrderService {

    private Logger logger;

    public OrderService(Logger logger) {
        this.logger = logger;
    }

    void processOrder() {
        logger.log("주문 처리");
    }
}
```

`OrderService`는 `Logger`라는 추상화만 안다.  
어떤 `Logger`가 와도 `OrderService`는 수정 없이 동작한다.

### DIP와 DI는 같은 말이 아니다

이니셜이 같아서 헷갈리지만 서로 다른 개념이다.

| 구분 | DIP(Dependency Inversion Principle) | DI(Dependency Injection) |
|---|---|---|
| 종류 | 설계 원칙 | 구현 기법 |
| 내용 | 추상화에 의존하라 | 의존하는 객체를 밖에서 넣어 준다 |
| 위 코드에서 | `OrderService`가 `Logger`에 의존한다 | `new OrderService(logger)`로 `Logger`를 주입받는다 |

DIP라는 원칙을 코드로 실현하는 방법이 DI라고 이해하면 된다.

### 의존성을 주입하는 세 가지 방법

| 방식 | 내용 | 특징 |
|---|---|---|
| 생성자 주입 | 객체를 만들 때 주입받는다 | 가장 일반적이고 필수 의존성에 적합하다 |
| 세터(setter) 주입 | 필요할 때 setter로 설정한다 | 선택적 의존성에 적합하다 |
| 필드 주입 | 필드에 직접 주입한다 | 테스트가 어려워서 스프링에서는 권장하지 않는다 |

스프링은 이 의존성 주입을 자동으로 해 주는 DI 컨테이너를 제공한다.

```java
// 예시 코드 (스프링 애노테이션, 스프링 강의에서 다룬다)
@Service
public class OrderService {

    private final Logger logger;

    @Autowired
    public OrderService(Logger logger) {   // 생성자 주입
        this.logger = logger;
    }
}
```

## 7. 헷갈리기 쉬운 점

### 원칙은 규칙이 아니라 방향이다

모든 클래스를 잘게 쪼개고 인터페이스를 만든다고 좋은 설계가 되는 것은 아니다.  
요구사항이 바뀔 가능성이 있는 부분에서 이 원칙이 도움이 된다.  
바뀔 일이 없는 단순한 코드까지 나누면 코드만 늘어난다.

### SRP의 책임은 기능의 개수가 아니다

메소드가 하나라고 책임이 하나인 것은 아니다.  
책임은 "이 클래스가 바뀌는 이유"로 판단한다.

### OCP와 DIP는 함께 쓰인다

OCP 예시의 `PaymentService`도 `PayStrategy`라는 인터페이스에 의존하고 생성자로 주입받는다.  
확장을 쉽게 하는 구조가 곧 추상화에 의존하는 구조다.

## 8. 정리

- SRP는 변경 이유를 하나로, OCP는 수정 없이 확장하는 구조로, LSP는 자식이 부모의 계약을 지키는 것으로 요약된다.
- ISP는 쓰지 않는 메소드를 강요하지 않도록 인터페이스를 쪼개고, DIP는 구체 클래스 대신 추상화에 의존한다.
- DIP는 원칙이고 DI는 그 원칙을 실현하는 방법이다.  
  생성자 주입이 가장 일반적이다.

다음에는 스프링에서 DI 컨테이너가 이 구조를 어떻게 자동으로 연결하는지 보면 좋다.

## 더 학습하면 좋은 개념

- **전략 패턴(Strategy Pattern)** — OCP를 구현하는 대표적인 방법이다.  
  행위를 객체로 분리해 런타임에 바꿔 끼우는 구조다.
- **계약에 의한 설계(Design by Contract)** — LSP의 바탕이 되는 개념으로, 사전조건·사후조건·불변조건을 명확히 정하는 설계 방식이다.
- **결합도와 응집도** — ISP의 응집도, DIP의 결합도 모두 이 두 지표로 설계를 평가한다.
- **IoC와 DI 컨테이너** — 객체 생성과 연결을 프레임워크가 맡는 구조다.  
  스프링을 배울 때 이 원칙들이 실제로 쓰인다.
- **다형성과 인터페이스** — 이 원칙들이 동작하는 기반이다.  
  부모 타입으로 자식을 다루는 방식을 이해하면 LSP와 DIP가 쉬워진다.

## 참고 자료
- [Oracle - Interfaces (The Java Tutorials)](https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html)
- [Oracle - Polymorphism (The Java Tutorials)](https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html)
- [Spring Framework - Dependency Injection](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)
