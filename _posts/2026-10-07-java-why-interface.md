---
title: "Java-인터페이스를 쓰는 이유"
date: 2026-10-07
tags:
  - more
---

구현이 하나뿐인데도 굳이 `interface`를 따로 만들어야 할까? [인터페이스 기초 글]({{ site.baseurl }}/java-interface-basics.html)에서 인터페이스가 `new`가 안 되는 이유는 확인했지만, 왜 쓰는지는 따로 정리하지 못했다. 같은 일을 클래스만으로 하는 코드와 인터페이스를 쓴 코드를 비교하며 이유를 정리했다.

> **TL;DR**
> - 인터페이스는 "무엇을 할 수 있는가"(약속)와 "어떻게 하는가"(구현)를 분리하는 도구다.
> - 약속에만 의존하면 구현을 바꿔 끼워도 호출하는 코드는 그대로이고, 테스트용 가짜 구현도 쉽게 끼울 수 있다.
> - 클래스는 하나만 상속하지만 인터페이스는 여러 개 구현할 수 있다. 구현이 하나뿐이고 바뀔 일이 없다면 굳이 만들지 않아도 된다.

## 1. 인터페이스는 약속이다

인터페이스는 "이 메소드를 이런 모양으로 제공한다"는 약속만 적고 실제 동작은 구현 클래스에 맡긴다. 호출하는 쪽은 약속(인터페이스)만 알고 있으면 되고, 실제로 어떤 클래스가 동작하는지는 몰라도 된다. 추상클래스와의 차이는 [추상화 글]({{ site.baseurl }}/java-abstraction-interfaces.html)에서 정리했다.

## 2. 이유 1: 구현을 바꿔 끼울 수 있다

주문이 끝나면 알림을 보내는 `OrderService`를 가정한다. 먼저 인터페이스 없이 이메일 클래스에 직접 의존하게 만든 코드다. 아래 코드는 모두 설명을 위한 예시 코드이고, 직접 실행해 확인하지는 않았다.

```java
// 예시 코드: 인터페이스 없이 구체 클래스에 직접 의존
class EmailSender {
    public void send(String msg) {
        System.out.println("이메일: " + msg);
    }
}

class OrderService {
    private EmailSender sender = new EmailSender();

    public void complete() {
        sender.send("주문 완료");
    }
}
```

문자 메시지(SMS)로 바꾸려면 `OrderService` 안의 `EmailSender`를 직접 고쳐야 한다. 이번에는 `MessageSender` 인터페이스를 두고, `OrderService`가 인터페이스만 알도록 바꿨다.

```java
// 예시 코드: 인터페이스에 의존
interface MessageSender {
    void send(String msg);
}

class EmailSender implements MessageSender {
    public void send(String msg) {
        System.out.println("이메일: " + msg);
    }
}

class SmsSender implements MessageSender {
    public void send(String msg) {
        System.out.println("SMS: " + msg);
    }
}

class OrderService {
    private final MessageSender sender;

    public OrderService(MessageSender sender) {
        this.sender = sender;
    }

    public void complete() {
        sender.send("주문 완료");
    }
}
```

사용하는 쪽에서 어떤 구현을 넣을지만 정하면 된다.

```java
// 예시 코드
new OrderService(new EmailSender()).complete();
new OrderService(new SmsSender()).complete();
```

코드를 따라가서 적은 출력은 다음과 같고, 실행해서 확인하지는 않았다.

```text
이메일: 주문 완료
SMS: 주문 완료
```

| 구분 | 인터페이스 없음 | 인터페이스 사용 |
|---|---|---|
| `OrderService`가 아는 것 | `EmailSender`라는 구체 클래스 | `MessageSender`라는 약속 |
| 전송 방식을 SMS로 바꾸려면 | `OrderService`를 고친다 | `OrderService`는 그대로 두고 넣는 구현만 바꾼다 |
| 새 전송 방식(예: 푸시)을 추가하려면 | `OrderService`를 고친다 | `MessageSender`를 구현한 클래스만 추가한다 |

인터페이스 타입의 변수에 구현체를 담는 것은 [다형성 글]({{ site.baseurl }}/java-polymorphism.html)에서 본 업캐스팅과 같은 원리다.

## 3. 이유 2: 결합도가 낮아진다

`OrderService`가 `EmailSender`를 직접 알면, `EmailSender`가 바뀔 때 `OrderService`도 영향을 받는다. 약속(`MessageSender`)에만 의존하면, 약속이 그대로인 한 어떤 구현이 바뀌어도 `OrderService`는 영향을 받지 않는다. 클래스끼리 서로를 얼마나 아는지를 결합도라고 부르고, 인터페이스는 이 결합도를 낮추는 가장 기본적인 방법이다.

[학점 계산기 글]({{ site.baseurl }}/pokachip-score-calculator.html)에서 `GradeService`가 `ScoreCalculator`를 직접 만들어 쓴 구조도 같은 상황이다. 계산 방식을 바꾸고 싶어지면 `GradeService`를 고쳐야 한다. 이 글에서 정리한 방식으로 계산 도구를 인터페이스로 분리해 두면 `GradeService`는 건드리지 않아도 된다.

## 4. 이유 3: 여러 역할을 한 클래스가 가질 수 있다

자바에서 클래스는 하나만 상속할 수 있다(`extends` 하나). 인터페이스는 여러 개를 구현할 수 있다(`implements A, B`). 서로 다른 역할을 한 클래스가 함께 가질 때 쓴다.

```java
// 예시 코드
interface Flyable { void fly(); }
interface Swimmable { void swim(); }

class Duck implements Flyable, Swimmable {
    public void fly()  { System.out.println("날아간다"); }
    public void swim() { System.out.println("헤엄친다"); }
}
```

| 구분 | 클래스 상속 | 인터페이스 구현 |
|---|---|---|
| 키워드 | `extends` | `implements` |
| 한 클래스가 가질 수 있는 개수 | 1개 | 여러 개 |

## 5. 이유 4: 협업과 테스트가 쉬워진다

- **협업:** 팀에서 "이 메소드는 이런 입력을 받아 이런 값을 돌려준다"는 약속만 먼저 정하면, 구현은 각자 따로 만들 수 있다. [포카칩 계산기 글]({{ site.baseurl }}/pokachip-cafe-calculator.html)에서 메소드 이름과 반환형을 이슈에 먼저 정해 두고 각자 클래스를 만든 것과 같은 발상이다.
- **테스트:** 진짜 외부 서비스 대신 가짜 구현으로 바꿔 끼울 수 있다. 위의 `OrderService`를 테스트할 때 실제로 이메일을 보내는 대신 아래 가짜 구현을 넣는다.

```java
// 예시 코드: 테스트용 가짜 구현
class FakeSender implements MessageSender {
    String last;

    public void send(String msg) {
        last = msg;
    }
}
```

`OrderService`를 `new OrderService(fake)`로 만들고 `complete()`를 호출한 뒤 `fake.last`가 `"주문 완료"`인지만 확인하면 된다. 이메일 서버가 없어도 확인할 수 있다.

## 6. 헷갈리기 쉬운 점

- **구현할 때 `public`을 빼먹으면 컴파일 오류가 난다.** 인터페이스의 메소드는 자동으로 `public`이다. 구현 클래스에서 `void send(String msg)`처럼 접근 제어자를 생략하면 더 좁은 접근 권한이 되어 컴파일되지 않는다. 위 예시 코드에서 `public void send`로 쓴 이유다.
- **인터페이스는 `new`로 만들 수 없다.** 인터페이스 타입의 변수에는 구현체를 담고, 객체는 구현 클래스로 만든다. 이유는 [인터페이스 기초 글]({{ site.baseurl }}/java-interface-basics.html)에서 확인했다.
- **인터페이스를 쓰면 항상 좋은 것은 아니다.** 아래에서 설명한다.

## 7. 언제 안 써도 될까

구현이 하나뿐이고 앞으로도 바뀔 일이 없다면, 인터페이스는 파일과 코드만 늘린다. 기준은 "바뀔 수 있는 부분", "여러 구현이 생길 부분", "테스트에서 바꿔 끼울 부분"이다. 처음부터 모든 클래스에 인터페이스를 만들기보다, 구현이 둘 이상이 되거나 테스트가 어려워질 때 분리해도 늦지 않다.

## 8. 정리

- 인터페이스는 약속(무엇을 하는가)과 구현(어떻게 하는가)을 분리한다. 호출하는 쪽은 약속만 알면 된다.
- 약속에만 의존하면 구현을 바꾸거나 추가해도 호출하는 코드는 그대로이고, 테스트용 가짜 구현도 끼울 수 있다. 클래스와 달리 여러 인터페이스를 구현할 수 있다.
- 구현이 하나뿐이고 바뀔 일이 없다면 만들지 않아도 된다. 바뀔 부분에 쓴다.

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **의존성 주입(Dependency Injection)** — 이번 예시에서 `OrderService`가 생성자로 `MessageSender`를 받은 방식이 의존성 주입의 가장 단순한 형태다. 스프링 같은 프레임워크가 이 과정을 대신해 주는 방식을 알면, 인터페이스를 왜 이렇게 많이 쓰는지 이해하기 쉽다.
- **`default` 메소드와 `static` 메소드** — Java 8부터 인터페이스도 구현을 가진 메소드를 둘 수 있다. 이 기능이 생긴 이유와 추상클래스와의 경계가 어떻게 달라졌는지 정리하면 좋다.
- **SOLID 원칙(특히 DIP, ISP)** — "구체 클래스가 아니라 추상(인터페이스)에 의존하라"는 원칙(DIP)과 "인터페이스를 역할별로 작게 나누라"는 원칙(ISP)이 이번 내용의 일반화다.
- **단위 테스트와 목(mock) 객체** — 가짜 구현을 직접 만드는 대신 라이브러리(예: Mockito)로 만드는 방법이다. 테스트에서 인터페이스가 쓰이는 방식을 확인할 수 있다.
- **전략 패턴(Strategy Pattern)** — 이번 `MessageSender`를 바꿔 끼우는 구조가 전략 패턴의 대표적인 예다. 디자인 패턴으로 이름을 붙여 정리해 두면 비슷한 구조를 알아보기 쉽다.

## 참고 자료
- [Oracle - What Is an Interface?](https://docs.oracle.com/javase/tutorial/java/concepts/interface.html)
- [Oracle - Interfaces (The Java Tutorials)](https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html)
- [Oracle - Default Methods](https://docs.oracle.com/javase/tutorial/java/IandI/defaultmethods.html)
- [Java Language Specification - 9. Interfaces](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html)
