---
title: "Spring IoC 컨테이너 기초"
date: 2026-10-26
tags:
  - Java
  - Spring
---

네이버페이를 카카오페이로 바꾸라는 요구가 들어오면 어디까지 고쳐야 할까? `new`로 객체를 직접 만들면 결제 수단 하나를 바꾸는 데도 서비스 코드를 열어야 한다.  
결제 시스템 예제를 세 단계로 고치면서, 객체 생성을 스프링 컨테이너에 맡기는 이유와 Bean 스코프(singleton, prototype)를 정리했다.

> **TL;DR**
> - `new`로 직접 만들면 결합도가 높아져서, 구현체를 바꿀 때 사용하는 쪽 코드를 함께 고쳐야 한다. (OCP 위반)
> - 인터페이스로 메서드 모양을 통일하고, `@Configuration` + `@Bean`으로 객체 생성을 IoC 컨테이너에 맡기면 교체 지점이 설정 클래스 한 곳으로 줄어든다.
> - Bean은 기본이 singleton이라 필드에 상태를 두면 모든 요청이 값을 공유한다. 실습 코드에는 prototype을 확인하려다 놓친 부분이 있었다.

환경: Java, Gradle, `org.springframework:spring-context:7.0.8`. 콘솔 출력은 코드에서 읽은 예상 결과이며 실제 실행은 `확인 필요`.  
코드는 이번 실습 프로젝트에서 가져왔고, import 문과 일부 주석은 줄였다.

## 1. new로 직접 만들면 무엇이 불편할까? (section01)

예제에는 결제 시스템이 있고, `PaymentService`가 `KakaoPayGateway` 또는 `NaverPayGateway`를 호출해서 결제한다. 먼저 스프링 없이 `new`로 연결했다.

```java
public class PaymentService {

    private KakaoPayGateway kakaoPayGateway;

    public PaymentService() {
        this.kakaoPayGateway = new KakaoPayGateway();
    }

    public boolean processPay(String orderId, int amount) {
        boolean result = kakaoPayGateway.pay(orderId, amount);
        // ... 결과 출력 생략
        return result;
    }
}
```

`PaymentService`가 `KakaoPayGateway`라는 구체적인 클래스를 직접 알고 있다. 네이버페이로 바꾸려면 이 클래스를 열어서 필드 타입, `new` 대상, 호출 줄을 모두 고쳐야 한다. 실습 코드에도 네이버 쪽 줄을 주석으로 남겨 두고 하나씩 바꾼 흔적이 있다.

문제가 하나 더 있다. 두 구현체의 메서드 모양이 다르다.

| 구현체 | 메서드 | 수량 매개변수 |
|---|---|---|
| `KakaoPayGateway` | `pay(String orderId, int amount)` | `int` |
| `NaverPayGateway` | `pay(String orderId, double amount)` | `double` |

메서드 이름이나 매개변수가 다른 구현체로 바꾸면 호출하는 쪽을 전부 수정해야 한다. 수업에서는 이를 SOLID 원칙의 **개방-폐쇄 원칙(OCP, Open-Closed Principle)** 위반이라고 했다. 소프트웨어는 확장에는 열려 있고 변경에는 닫혀 있어야 하는데, 구현체 하나를 바꾸면 여러 코드를 고쳐야 하는 상태다.

## 2. 인터페이스로 메서드 모양 통일하기 (section02)

첫 번째 해결책은 인터페이스다. 두 구현체가 같은 약속을 지키게 하면 사용하는 쪽은 구현체의 종류를 몰라도 된다.

```java
public interface PaymentInterface {
    boolean processPay(String orderId, int amount);
}

public class NaverPayGateway implements PaymentInterface {
    @Override
    public boolean processPay(String orderId, int amount) {
        System.out.println("네이버페이로 결제 시작! : 주문 ID = " + orderId + ", 수량 = " + amount);
        return true;
    }
}
// KakaoPayGateway도 같은 방식으로 구현
```

`PaymentService`는 구체 클래스 대신 `PaymentInterface`를 생성자로 받는다.

```java
public class PaymentService {

    private final PaymentInterface paymentInterface;

    public PaymentService(PaymentInterface paymentInterface) {
        this.paymentInterface = paymentInterface;
    }

    public boolean processPay(String orderId, int amount) {
        boolean result = paymentInterface.processPay(orderId, amount);
        // ... 결과 출력 생략
        return result;
    }
}
```

이제 `PaymentService`의 필드와 생성자에는 `Naver`, `Kakao`라는 이름이 없다. 어떤 구현체를 쓸지는 `PaymentService`를 만드는 쪽이 정한다. 객체를 만들고 연결하는 일을 밖에서 해 주는 방식이다.

## 3. 만드는 일을 컨테이너에 맡기기 (@Configuration, @Bean)

`PaymentService`를 만드는 쪽도 결국 코드다. 이 일을 스프링의 IoC 컨테이너(Inversion of Control, 제어의 역전)에 맡긴다. 객체를 만들고 연결하는 제어권이 개발자 코드에서 컨테이너로 넘어간다는 뜻이다.

수업에서 정리한 용어는 다음과 같다.

| 용어 | 뜻 |
|---|---|
| Bean | 스프링에서 컨테이너가 관리하는 객체 |
| IoC 컨테이너 | Bean을 만들고 보관하고 연결해 주는 곳. `ApplicationContext`, `BeanFactory`와 같은 계열로 설명했다 |
| `@Configuration` | 이 클래스가 Bean 설정을 모아 둔 클래스라는 표시 |
| `@Bean` | 이 메서드의 반환 객체를 컨테이너에 등록한다. 이름은 기본적으로 메서드명이다 |
| `getBean()` | 컨테이너 안의 Bean을 꺼내는 메서드 |

```java
@Configuration
public class AppConfig {

    @Bean
    public KakaoPayGateway kakaoPayGateway() {
        return new KakaoPayGateway();
    }

    @Bean
    public NaverPayGateway naverPayGateway() {
        return new NaverPayGateway();
    }

    @Bean
    public PaymentService paymentService() {
        return new PaymentService(naverPayGateway());
    }
}
```

```java
ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);

PaymentService paymentService = context.getBean("paymentService", PaymentService.class);
boolean result = paymentService.processPay("order-001", 3);
```

```mermaid
flowchart LR
    A[AppConfig] -->|@Bean 메서드 실행| B[IoC 컨테이너]
    B -->|Bean 보관| C[kakaoPayGateway]
    B -->|Bean 보관| D[naverPayGateway]
    B -->|Bean 보관| E[paymentService]
    F[Application] -->|getBean| B
```

카카오페이로 바꾸려면 `paymentService()` 안의 `naverPayGateway()`를 `kakaoPayGateway()`로 한 번 고치면 된다. 교체 지점이 `AppConfig` 한 곳으로 모였다.

| 항목 | section01 | section02 |
|---|---|---|
| 객체 생성 | 서비스 안에서 `new` | 컨테이너가 `@Bean` 메서드로 생성 |
| 서비스가 아는 것 | 구체 클래스 | 인터페이스 |
| 구현체 교체 | 서비스 코드 수정 | `AppConfig` 한 줄 수정 |

`paymentService()`가 `naverPayGateway()`를 호출하는데 새 객체가 만들어지는지, 컨테이너에 등록된 Bean이 쓰이는지는 `확인 필요`다. `@Configuration`의 동작은 공식 문서로 확인하는 편이 안전하다.

## 4. Bean의 스코프: singleton과 prototype (section03)

`getBean()`을 두 번 호출하면 같은 객체가 나올까, 새 객체가 나올까? 스코프(scope)는 Bean이 몇 개 만들어지는지 정하는 설정이다.

```java
@Bean("single") // 기본 이름은 메서드명이지만 직접 지정할 수 있다
@Scope("singleton") // 기본값이 singleton이다
public PaymentService paymentService() {
    return new PaymentService(naverPayGateway());
}

@Bean("proto")
@Scope("prototype") // 요청할 때마다 새 인스턴스를 반환한다
public PaymentService paymentService2() {
    return new PaymentService(naverPayGateway());
}
```

| 스코프 | `getBean()` 결과 | 수업에서 정리한 특징 |
|---|---|---|
| singleton (기본값) | 항상 같은 인스턴스 | 메모리가 효율적이고, 같은 인스턴스라 동작을 예상하기 쉽다 |
| prototype | 요청할 때마다 새 인스턴스 | 수업에서 "환경오염의 주범"이라고 표현했다 |

### 왜 Bean의 필드에 상태를 두면 위험할까?

실습용 `PaymentService`에는 `orderId` 필드를 일부러 넣었다.

```java
public class PaymentService {
    private final PaymentInterface paymentInterface;
    private String orderId; // 상태를 가진 필드

    public boolean processPay(String orderId, int amount) {
        this.orderId = orderId; // 요청마다 필드를 덮어쓴다
        // ... 생략
    }

    public String getOrderId() {
        return this.orderId;
    }
}
```

singleton Bean은 하나뿐이라, 이 필드는 **모든 요청이 공유**한다. 요청 A가 `order-001`을 저장한 직후 요청 B가 `order-002`로 덮어쓰면 A는 B의 값을 읽게 된다. 수업의 결론은 두 가지였다.

- Bean(service, dao처럼 행위 중심 클래스)에는 상태 필드를 두지 않는다.
- 데이터를 저장해야 하면 요청마다 DTO를 따로 만들어 담는다.

### 실습 코드에서 놓친 부분

`Application`에서 singleton 공유를 확인하려고 `getBean("single")`을 두 번 호출했다.

```java
PaymentService single = context.getBean("single", PaymentService.class);
single.processPay("order-001", 3);
System.out.println("single 의 주문 ID = " + single.getOrderId());

PaymentService single2 = context.getBean("single", PaymentService.class);
System.out.println("single2 의 주문 ID = " + single2.getOrderId());
```

`single2`는 `processPay()`를 호출하지 않았는데도 `order-001`이 나올 것으로 예상한다. 같은 인스턴스를 가리키기 때문이다.

문제는 그다음 prototype 확인 부분이다.

```java
PaymentService proto = context.getBean("single", PaymentService.class);   // "proto"가 아니다
PaymentService proto2 = context.getBean("single", PaymentService.class);  // 여기도 "single"
```

변수 이름은 `proto`인데 꺼내는 Bean 이름이 `"single"`이다. 그래서 이 구간은 prototype이 아니라 singleton을 다시 확인하고 있다. 코드대로라면 `proto`와 `proto2`는 같은 인스턴스이고, 둘 다 `order-002`가 출력될 것으로 예상한다. (원본은 두 구간 모두 `proto.processPay("order-002", 3)`을 호출하고, `proto2`에는 `processPay()`를 호출하지 않는다.)

prototype의 차이를 보려면 이렇게 고쳐야 한다. 수정 후 결과는 `확인 필요`다.

```java
PaymentService proto = context.getBean("proto", PaymentService.class);
proto.processPay("order-002", 3);

PaymentService proto2 = context.getBean("proto", PaymentService.class);
// proto2는 새 인스턴스이므로 getOrderId()가 null일 것으로 예상한다
```

## 5. 정리

1. `new`로 구체 클래스를 직접 만들면 구현체를 바꿀 때마다 사용하는 쪽을 고쳐야 하고, 이것이 OCP 위반이다.
2. 인터페이스와 `@Configuration` + `@Bean`으로 객체 생성을 컨테이너에 맡기면 교체 지점이 설정 클래스로 모인다.
3. Bean은 기본이 singleton이므로 필드에 요청별 상태를 두지 않는다. 스코프를 확인하는 코드는 꺼내는 Bean 이름까지 맞는지 다시 본다.

## 더 학습하면 좋은 개념

- **의존성 주입(DI, Dependency Injection)** — 이번에 생성자로 `PaymentInterface`를 넘긴 방식이 DI다. IoC는 원칙이고 DI는 그 구현 방법이라는 관계를 정리해 볼 만하다.
- **`@Component`와 `@ComponentScan`** — `@Bean` 메서드를 일일이 쓰지 않고 클래스에 표시해서 자동 등록하는 방식이다.
- **`@Autowired`** — `AppConfig`에서 직접 연결하는 대신 컨테이너가 알아서 주입하게 하는 방법이다.
- **`@Configuration`의 프록시 동작** — `@Bean` 메서드끼리 호출할 때 새 객체가 만들어지는지 확인하면 3장의 `확인 필요`가 풀린다.
- **web 스코프(request, session)** — 요청마다 새 객체가 필요할 때 prototype 대신 쓰는 스코프다.

## 참고 자료

- [Spring Framework 공식 문서 - The IoC Container](https://docs.spring.io/spring-framework/reference/core/beans.html)
- [Spring Framework 공식 문서 - Bean Scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)
- [Spring Framework 공식 문서 - Using the @Configuration annotation](https://docs.spring.io/spring-framework/reference/core/beans/java/configuration-annotation.html)
