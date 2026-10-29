---
title: "Spring MVC 예외 처리"
date: 2026-10-29
tags:
  - Java
  - Spring
---

`/nullpointer`와 `/global-nullpointer`는 똑같이 NullPointerException을 던지고, 화면도 똑같이 나온다. 그런데 처리한 코드는 서로 다르다. 어느 쪽 핸들러가 동작했는지 화면만 봐서는 알 수 없다면, 어떻게 구분할 수 있을까?  
`@ExceptionHandler`와 `@ControllerAdvice` 실습 프로젝트를 직접 실행하면서, 예외 핸들러의 적용 범위와 우선순위, 그리고 실습 코드에서 발견한 함정 세 가지를 정리했다.

> **TL;DR**
> - `@ExceptionHandler`는 **선언한 컨트롤러 클래스 안에서만** 동작하고, `@ControllerAdvice` 클래스에 선언하면 **모든 컨트롤러**에 적용된다.
> - 같은 예외를 둘 다 처리하면 컨트롤러 내부 핸들러가 이긴다. 로그로 확인했다.
> - `Exception.class` 전역 핸들러는 404(`NoResourceFoundException`)까지 가로채서 **HTTP 200**으로 응답한다.
> - 실습 코드에는 `${Message}` 대소문자 오타와 `Throwable`을 상속한 사용자 예외도 있었다(6절).

환경: Windows 11, JDK 21(Eclipse Temurin 21.0.12), Spring Boot 4.1.2, 내장 Tomcat 11.0.27, Gradle, Thymeleaf.  
응답 결과는 앱을 직접 실행하고 `curl`로 요청해서 확인한 값이다. 코드는 실습 프로젝트(`chap04-exception-handler`)에서 가져왔고, import 문은 줄였다.

## 1. 예외 핸들러가 필요한 이유

컨트롤러 메서드 안에서 예외가 터지면, 메서드마다 `try-catch`로 감싸는 방법이 가장 먼저 떠오른다. 하지만 같은 예외 처리 코드가 메서드마다 반복되고, 정상 흐름과 예외 흐름이 한 메서드에 섞인다.

스프링 MVC는 예외를 컨트롤러 밖으로 던지게 두고, 별도의 메서드가 대신 받는 방식을 제공한다. 이 메서드에 `@ExceptionHandler`를 붙인다. 컨트롤러는 정상 흐름만 쓰고, 예외 흐름은 핸들러가 맡는다.

```mermaid
flowchart LR
    A[요청] --> B[컨트롤러 메서드]
    B -->|정상| C[뷰 이름 반환]
    B -->|예외 발생| D{같은 클래스에<br/>맞는 핸들러?}
    D -->|있음| E[컨트롤러 내부 핸들러]
    D -->|없음| F{@ControllerAdvice에<br/>맞는 핸들러?}
    F -->|있음| G[전역 핸들러]
    E --> H[예외 뷰 반환]
    G --> H
```

## 2. @ExceptionHandler: 한 컨트롤러 안에서 처리하기

`ExceptionTestController`에서 고의로 NullPointerException을 만든 뒤, 같은 클래스에 핸들러를 둔다.

```java
@Controller
public class ExceptionTestController {

    @GetMapping("nullpointer")
    public String nullPointer() {
        String str = null;
        System.out.println(str.toLowerCase(Locale.ROOT));   // 여기서 NPE 발생
        return "/";
    }

    @ExceptionHandler(NullPointerException.class)
    public String nullHandler(Model model, NullPointerException e) {
        model.addAttribute("key", e.getMessage());
        return "error/nullPointer";
    }

    // ... 생략: /userexception 에서 직접 만든 MemberNotFoundException("아프지 말자 우리")을 던지고,
    //     @ExceptionHandler(MemberNotFoundException.class) 핸들러가 같은 뷰로 보낸다 (6-3 참고)
}
```

`@ExceptionHandler`의 값은 처리할 예외 클래스다. 핸들러 메서드는 예외 객체를 파라미터로 받을 수 있고, 반환한 문자열은 일반 컨트롤러처럼 뷰 이름으로 쓰인다. 그래서 `templates/error/nullPointer.html`이 응답으로 나간다.

```bash
$ curl -s http://localhost:18081/nullpointer
```

```html
<h4>Cannot invoke &quot;String.toLowerCase(java.util.Locale)&quot; because &quot;str&quot; is null</h4>
```

화면에 나온 메시지는 JDK가 NPE에 붙여주는 상세 메시지다. 어느 변수가 null이었는지(`"str"`)까지 알려준다. JDK 14에서 도입되었고 JDK 15부터 기본으로 켜진다. 그보다 오래된 JDK에서는 `e.getMessage()`가 `null`일 수 있다.

## 3. 다른 컨트롤러의 예외는 왜 못 잡을까?

`GlobalTestController`에도 똑같이 NPE를 던지는 `/global-nullpointer`가 있다. 이 클래스에는 핸들러를 만들지 않았다. `ExceptionTestController`의 `nullHandler`가 이 예외도 잡아줄 것 같지만, 다른 클래스 안의 핸들러는 동작하지 않는다. 컨트롤러 안에 선언한 `@ExceptionHandler`는 선언된 클래스에서 나는 예외만 대상으로 하기 때문이다([공식 문서](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html) 기준).

그러면 컨트롤러가 열 개일 때 핸들러를 열 번 복사해야 할까? 여기서 `@ControllerAdvice`가 나온다.

## 4. @ControllerAdvice: 모든 컨트롤러에 적용하기

핸들러를 `@ControllerAdvice`가 붙은 별도 클래스로 옮기면 모든 컨트롤러에 적용된다. 여러 컨트롤러에 공통으로 필요한 코드를 한곳에 모은 클래스다. 이름은 AOP에서 공통 코드를 가리키는 Advice에서 따온 것으로 보인다(`확인 필요`).

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NullPointerException.class)
    public String nullHandler(Model model, NullPointerException e) {
        System.out.println("전역 예외처리 핸들러 동작!!!");
        model.addAttribute("key", e.getMessage());
        return "error/nullPointer";
    }

    @ExceptionHandler(Exception.class)
    public String defaultException(Model model, Exception e) {
        model.addAttribute("class", e.getClass());
        model.addAttribute("message", e.getMessage());
        return "error/default";
    }
}
```

`Exception.class` 핸들러는 NPE 같은 구체적인 핸들러가 없는 모든 예외를 받는 기본 핸들러 역할을 한다. 실습에서 `/global-default`는 `new int[0]`의 1번 칸을 읽어 `ArrayIndexOutOfBoundsException`을 만든다.

## 5. 어느 핸들러가 이겼을까? 실행으로 확인하기

화면만으로는 구분이 안 되어서, 전역 핸들러에 `System.out.println`을 넣어 두었다. 서버를 포트 18081로 띄우고 다섯 개 주소를 차례로 요청했다.

| 요청 주소 | 발생한 예외 | 처리한 핸들러 | 응답 코드 | 확인 근거 |
|---|---|---|---|---|
| `/nullpointer` | NullPointerException | 컨트롤러 내부 `nullHandler` | 200 | 전역 핸들러의 출력 없음 |
| `/userexception` | MemberNotFoundException | 컨트롤러 내부 `userException` | 200 | 화면에 던질 때 넣은 메시지 "아프지 말자 우리" 출력 |
| `/global-nullpointer` | NullPointerException | 전역 `nullHandler` | 200 | 서버 로그에 전역 핸들러 출력 1회 |
| `/global-default` | ArrayIndexOutOfBoundsException | 전역 `defaultException` | 200 | 화면에 예외 클래스명 출력 |
| `/global-userexception` | NoResourceFoundException | 전역 `defaultException` | 200 | 화면에 예외 클래스명 출력 |

NPE 요청은 두 번인데 전역 핸들러의 출력은 한 번만 찍혔다. 그러니 `/nullpointer`는 컨트롤러 내부 핸들러가, `/global-nullpointer`는 전역 핸들러가 처리했다. 같은 예외에 핸들러가 둘 다 있으면 같은 클래스 내부 핸들러가 전역 핸들러보다 먼저 적용된다는 것을 실행으로 확인했다.

## 6. 실습 코드에서 발견한 함정 세 가지

### 6-1. 404가 200이 되었다

표의 마지막 줄이 이상하다. `static/index.html`(실습용 메뉴 페이지)의 "전역 - 사용자 정의의 예외" 버튼은 `global-userexception`으로 이동하는데, 이 주소에 대응하는 컨트롤러 매핑이 없다. 원래라면 404가 나와야 하는데 응답 코드는 200이고, "Default 예외 페이지"가 나왔다.

원인은 `Exception.class` 전역 핸들러다. 매핑이 없는 주소로 요청하면 스프링은 `NoResourceFoundException`을 던지고, 이 예외도 `Exception`의 하위 타입이라 기본 핸들러가 잡아 버린다. 존재하지 않는 주소 `/nothing`도 똑같이 200을 돌려주었다.

| 구분 | 핸들러가 없을 때 | `Exception.class` 전역 핸들러가 있을 때 |
|---|---|---|
| 없는 주소 요청 | 404(기본 동작) | 200 + 기본 예외 페이지(실행 확인) |

화면은 에러처럼 보이지만 HTTP 상태 코드는 "성공"이라서, 상태 코드로 오류를 판단하는 모니터링에서는 정상으로 집계될 수 있다. 핸들러에서 상태 코드를 직접 지정하는 방법(`@ResponseStatus` 등)이 대안이지만, 이 프로젝트에서는 실행해 보지 않았다(`확인 필요`).

### 6-2. 모델 키 오타는 에러 없이 null이 된다

`default.html`에는 `${Message}`라고 쓰여 있는데, 핸들러가 담은 키는 소문자 `message`다. 오류가 나지 않고 화면에 `원인: null`이 출력되었다. `${Message}`를 `${message}`로 고치면 해결된다. 값이 안 나올 때 가장 먼저 키의 대소문자를 의심하는 편이 빠르다.

### 6-3. 사용자 정의 예외가 Throwable을 상속하고 있다

```java
public class MemberNotFoundException extends Throwable {
    public MemberNotFoundException(String message) { super(message); }
}
```

이 클래스는 `Exception`이 아니라 `Throwable`을 상속한다. 컨트롤러 내부의 `@ExceptionHandler(MemberNotFoundException.class)`가 이 클래스를 직접 지정해서 `/userexception`은 정상 동작했다. `Exception.class` 전역 핸들러가 이 예외를 잡는지는 실행으로 확인하지 못했다(`확인 필요`). 관례대로 `RuntimeException`이나 `Exception`을 상속하는 편이 안전하다. 위 발췌에서는 생성자 파라미터 이름을 `message`로 바꿨다(원본은 한글 이름이다).

## 정리

1. `@ExceptionHandler`는 선언한 클래스 안에서만, `@ControllerAdvice`는 전체 컨트롤러에서 동작한다.
2. 같은 예외를 둘 다 처리하면 클래스 내부 핸들러가 우선한다.
3. `Exception.class` 핸들러는 404까지 삼키므로 상태 코드를 별도로 다뤄야 한다.

다음에 볼 것: `@RestControllerAdvice`로 JSON 에러 응답 만들기, `@ResponseStatus`로 상태 코드 지정하기.

## 더 학습하면 좋은 개념

- **`@ResponseStatus`와 `ResponseStatusException`** — 6-1의 200 문제처럼 핸들러가 응답 상태 코드를 직접 정해야 할 때 쓴다.
- **`@RestControllerAdvice`와 `ResponseEntity`** — 뷰 대신 JSON 에러 본문과 상태 코드를 함께 돌려주는 API 서버에서 필요하다.
- **`@ControllerAdvice`의 적용 범위 지정(`basePackages`, `assignableTypes`)** — 전역 핸들러를 일부 컨트롤러에만 적용할 때 쓴다.
- **`HandlerExceptionResolver`** — `@ExceptionHandler`가 내부에서 어떻게 호출되는지 이해하는 출발점이다.

## 참고 자료

- [OpenJDK - JEP 358: Helpful NullPointerExceptions](https://openjdk.org/jeps/358)
- [Spring Framework 공식 문서 - @ExceptionHandler](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html)
- [Spring Framework 공식 문서 - Controller Advice](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-advice.html)
