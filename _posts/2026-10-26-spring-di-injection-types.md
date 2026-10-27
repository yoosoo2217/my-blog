---
title: "Spring 의존성 주입 방식 3종"
date: 2026-10-26
tags:
  - Java
  - Spring
---

`PaymentService`가 `PaymentInterface`를 쓰려면 누군가 구현체를 넣어 줘야 한다. `AppConfig`에서 `@Bean` 메서드로 직접 연결하던 일을, 이번에는 컨테이너가 알아서 하게 했다.  
같은 결제 예제를 필드, 세터, 생성자 세 방식으로 주입해 보고, 방식마다 무엇이 달라지는지 정리했다.

> **TL;DR**
> - `@ComponentScan`과 `@Component`(`@Service`)로 Bean을 자동 등록하고, `@Autowired`로 의존성을 주입한다.
> - 주입 위치는 필드, 세터, 생성자 세 곳이다. 수업에서는 `final`로 불변성을 지키고 필수 의존성을 강제할 수 있는 **생성자 주입**이 Spring 공식 권장이라고 정리했다.
> - 필드 주입은 `final`을 쓸 수 없고, 세터 주입은 세터가 호출되지 않으면 `null`이 남는다.

환경: Java, Gradle, `org.springframework:spring-context:7.0.8`. 콘솔 출력은 코드에서 읽은 예상 결과이며 실제 실행은 `확인 필요`.  
코드는 이번 실습 프로젝트(section02)에서 가져왔고, import 문과 일부 주석은 줄였다.

## 1. 주입 전에 먼저 Bean으로 등록하기

기존 방식에서는 controller가 `Service s = new Service();`로, service가 `Dao d = new Dao();`로 다음 계층의 객체를 직접 만들었다. 의존성 주입(DI)은 이 `new`를 없애고, 컨테이너가 만들어 둔 객체를 필요한 곳에 넣어 주는 방식이다.

![기존 방식에서는 controller가 new Service(), service가 new Dao()로 객체를 직접 만들고, 의존성 주입에서는 @Controller, @Service, @Repository가 붙은 클래스가 IoC Container에 등록되는 판서]({{ site.baseurl }}/assets/img/spring-di-controller-service-dao.png)

판서에서 계층마다 붙인 `@Controller`, `@Service`, `@Repository`가 "이 클래스를 IoC 컨테이너에 등록하라"는 표시다. `@Autowired`는 컨테이너 안에 있는 Bean을 찾아서 넣어 주는 어노테이션이라, 넣을 대상이 먼저 Bean이어야 한다. 이번에는 `@Bean` 메서드 대신 클래스에 표시를 붙여서 등록했다.

| 어노테이션 | 붙이는 곳 | 역할 |
|---|---|---|
| `@Component` | 일반 클래스 | 컨테이너가 관리할 객체라고 표시한다. 이름은 클래스명의 앞글자를 소문자로 바꾼 값이다 |
| `@Service` | Service 계층 클래스 | `@Component`의 특수한 형태다. 수업에서는 MVC의 Service 계층 Bean에 붙인다고 정리했다 |
| `@ComponentScan` | 설정 클래스 | 지정한 패키지에서 `@Component` 계열이 붙은 클래스를 찾아 Bean으로 등록한다 |

```java
@Configuration
@ComponentScan(basePackages = "com.wanted.di.section02")
public class AppConfig {
}
```

`basePackages`를 지정하지 않으면 `@ComponentScan`이 달린 클래스와 같은 패키지까지만 스캔한다. 이번 예제는 `service`, `gateway` 같은 하위 패키지까지 필요해서 `basePackages`를 직접 적었다. 스캔에서 빼고 싶은 클래스는 `excludeFilters`로 클래스명, 어노테이션, 정규표현식 중 하나를 골라 제외할 수 있다.

```java
@Component
public class NaverPayGateway implements PaymentInterface {

    @Override
    public boolean processPay(String orderId, int amount) {
        System.out.println("네이버페이로 결제 시작! : 주문 ID = " + orderId + ", 수량 = " + amount);
        return true;
    }
}
```

section01에서 구현체마다 달랐던 메서드 모양은 `PaymentInterface`로 통일했다. 이 글의 세 서비스는 모두 이 인터페이스 타입으로 의존성을 받는다.

## 2. 필드 주입은 어디가 아쉬울까?

가장 짧게 쓸 수 있는 방식이다. 필드 위에 `@Autowired`만 붙인다.

```java
@Service("field")
public class PaymentServiceField {

    @Autowired
    private PaymentInterface paymentInterface;

    public boolean processPay(String orderId, int amount) {
        System.out.println("결제 비즈니스 로직 시작! 주문 ID = " + orderId + ", 수량 = " + amount);

        boolean result = paymentInterface.processPay(orderId, amount);
        // ... 결과 출력 생략
        return result;
    }
}
```

`@Service("field")`처럼 이름을 직접 지정해서, `getBean("field", ...)`로 세 서비스를 구분해서 꺼낸다.

짧은 대신 수업에서 짚은 단점이 두 가지다.

- `final`을 쓸 수 없다. 필드가 선언 시점에 초기화되지 않으므로 컴파일러가 `final`을 허용하지 않는다.
- 메서드 안에서 `paymentInterface = new NaverPayGateway();`처럼 직접 대입해도 컴파일 에러가 나지 않는다. 컨테이너가 넣어 준 의존성을 코드가 조용히 덮어쓸 수 있다.

실습 코드의 `processPay()` 안에는 이 대입 줄이 주석으로 남아 있다. 일부러 써 보고 에러가 나는지 확인한 흔적으로 보인다.

## 3. 세터 주입은 언제 쓸까?

필드 대신 세터 메서드에 `@Autowired`를 붙인다.

```java
@Service("setter")
public class PaymentServiceSetter {

    private PaymentInterface paymentInterface;

    @Autowired
    public void setPaymentInterface(PaymentInterface paymentInterface) {
        this.paymentInterface = paymentInterface;
    }

    // ... processPay() 는 필드 주입 예제와 같다
}
```

| 구분 | 내용 |
|---|---|
| 장점 | 선택적 의존관계를 가질 수 있다 |
| 단점 1 | `final`을 쓸 수 없다 |
| 단점 2 | 세터가 호출되지 않으면 필드가 `null`인 상태로 남는다 |

단점 2가 선택적 의존관계의 뒷면이다. 의존성이 없어도 객체는 만들어지지만, 그 상태로 `processPay()`를 호출하면 `NullPointerException`이 날 수 있다. `@Autowired`의 기본 동작은 주입할 Bean이 없으면 실패하는 것이므로, 정말 "없어도 되는" 의존성인지 설계 단계에서 먼저 정해야 한다. (`required` 옵션과 `Optional` 처리는 `확인 필요`)

## 4. 생성자 주입이 공식 권장인 이유

생성자에 `@Autowired`를 붙이고, 필드는 `final`로 선언한다.

```java
@Service("constructor")
public class PaymentServiceConstructor {

    private final PaymentInterface paymentInterface;

    @Autowired
    public PaymentServiceConstructor(PaymentInterface paymentInterface) {
        this.paymentInterface = paymentInterface;
    }

    // ... processPay() 는 필드 주입 예제와 같다
}
```

수업에서 정리한 장점은 두 가지다.

1. **불변성 보장**: `final` 필드라서 생성자가 끝난 뒤 의존성을 바꿀 수 없다. 2장에서 컴파일 에러가 나지 않던 `paymentInterface = new NaverPayGateway();` 대입은 `final`이 있으면 컴파일 에러가 된다.
2. **필수 의존성 강제**: `final`은 반드시 초기화해야 하고, 생성자로 받으면 객체가 만들어지는 시점에 의존 관계가 정해진다. 의존성 없는 객체가 만들어질 수 없다.

생성자가 하나뿐이면 `@Autowired`를 생략해도 주입된다. 실습 코드에는 `@Autowired`가 붙어 있지만 생략해도 같은 결과가 나온다. 위 두 장점 때문에 수업에서는 생성자 주입을 Spring 공식 권장 방식이라고 정리했다.

### 세 방식 비교

| 항목 | 필드 주입 | 세터 주입 | 생성자 주입 |
|---|---|---|---|
| `@Autowired` 위치 | 필드 | 세터 메서드 | 생성자 (생성자가 하나면 생략 가능) |
| `final` 사용 | 불가 | 불가 | 가능 |
| 주입 누락 시 | `null` 가능 | 세터 미호출 시 `null` | 객체 생성 자체가 실패 |
| 의존성 덮어쓰기 | 컴파일 에러 없음 | 세터로 가능 | `final`이면 컴파일 에러 |
| 수업에서 정리한 특징 | 코드가 가장 짧다 | 선택적 의존관계 가능 | 공식 권장 |

"주입 누락 시" 행의 필드 주입과 생성자 주입 칸은 수업 정리에 직접 없는 내용이라 `확인 필요`로 둔다.

## 5. 실행 흐름과 놓치기 쉬운 부분

```mermaid
flowchart LR
    A[AppConfig @ComponentScan] -->|section02 패키지 스캔| B[IoC 컨테이너]
    B -->|Bean 등록| C[naverPayGateway]
    B -->|Bean 등록| D["field / setter / constructor 서비스"]
    C -->|@Autowired 주입| D
    E[Application] -->|getBean| B
```

```java
ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);

PaymentServiceField pay = context.getBean("field", PaymentServiceField.class);
pay.processPay("order-003", 3);

PaymentServiceSetter pay2 = context.getBean("setter", PaymentServiceSetter.class);
pay2.processPay("order-003", 3);
```

코드대로라면 두 호출 모두 `네이버페이로 결제 시작! : 주문 ID = order-003, 수량 = 3`이 출력될 것으로 예상한다. 실제 출력은 `확인 필요`다.

실습 코드에서 눈에 띈 점이 두 가지다.

- **생성자 주입 서비스는 `Application`에서 호출하지 않았다.** 필드와 세터만 꺼내서 실행했다. 세 방식을 비교하려면 `getBean("constructor", PaymentServiceConstructor.class)` 호출도 추가해야 한다.
- **`KakaoPayGateway`가 통째로 주석 처리되어 있다.** `@Component`가 붙은 `PaymentInterface` 구현체가 `NaverPayGateway` 하나뿐이어서 주입 대상이 정해진다. 구현체가 둘이면 어느 쪽을 넣을지 컨테이너가 고를 수 없을 텐데, 이 부분은 수업에서 다루지 않아 `확인 필요`로 남긴다.

## 6. 정리

1. `@ComponentScan`과 `@Component`/`@Service`로 Bean을 자동 등록하고, `@Autowired`로 주입하면 `AppConfig`에서 일일이 연결하지 않아도 된다.
2. 필드 주입은 짧지만 `final`을 쓸 수 없고 의존성을 덮어써도 컴파일러가 막지 못한다. 세터 주입은 선택적 의존관계에만 어울린다.
3. 필수 의존성은 `final` 필드와 생성자로 받는다. 이것이 수업에서 정리한 공식 권장 방식이다.

## 더 학습하면 좋은 개념

- **`@Autowired`의 동작 순서(타입 → 이름)** — 같은 타입의 Bean이 둘일 때 어떤 기준으로 고르는지 알아야 `KakaoPayGateway`를 다시 켤 수 있다.
- **`@Primary`와 `@Qualifier`** — 같은 인터페이스의 구현체가 여러 개일 때 주입 대상을 지정하는 방법이다.
- **순환 참조(circular dependency)** — A가 B를, B가 A를 의존할 때 주입 방식에 따라 결과가 달라진다는 점이 방식 선택의 근거가 된다.
- **의존성 주입과 단위 테스트** — 생성자 주입이면 스프링 없이 `new`로 가짜 객체를 넣을 수 있다. 필드 주입과 비교해 볼 만하다.

## 참고 자료

- [Spring Framework 공식 문서 - Dependency Injection](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)
- [Spring Framework 공식 문서 - Using @Autowired](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html)
- [Spring Framework 공식 문서 - Classpath Scanning and Managed Components](https://docs.spring.io/spring-framework/reference/core/beans/classpath-scanning.html)
