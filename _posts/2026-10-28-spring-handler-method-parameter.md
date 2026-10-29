---
title: "Spring 핸들러 메서드 파라미터"
date: 2026-10-28
tags:
  - Java
  - Spring
---

같은 폼 데이터를 받는데 메서드 모양이 세 가지로 달라진다. `request.getParameter()`로 하나씩 꺼내기도 하고, `@RequestParam`으로 받기도 하고, 객체 하나로 한꺼번에 받기도 한다.  
메뉴 등록·수정·검색 폼을 만들면서 세 방식을 비교하고, 어떤 상황에서 무엇을 쓰면 좋은지 정리했다.

> **TL;DR**
> - `WebRequest`는 파라미터를 문자열로 직접 꺼내고 직접 변환한다. 값이 없거나 숫자가 아니면 변환 코드에서 예외가 난다.
> - `@RequestParam`은 이름으로 값을 꺼내고 타입 변환까지 해 준다. 폼의 `name` 속성과 이름이 맞지 않으면 400 Bad Request가 발생한다.
> - `@ModelAttribute`는 파라미터 여러 개를 DTO 하나로 묶고, 그 객체를 뷰에서도 쓸 수 있게 Model에 담아 준다.

환경: Java 21, Gradle, Spring Boot 4.1.2, Thymeleaf, Lombok.  
코드는 이번 실습 프로젝트(`chap02-handler-method`)에서 가져왔고, import 문, 주석, 일부 출력문은 줄였다. 상태 코드와 예외는 앱을 띄우고(`--server.port=18080`) `curl`로 직접 요청해서 확인했다.

## 1. 핸들러 메서드가 요청을 받으려면 무엇이 필요할까?

핸들러 메서드(handler method)는 `@Controller` 클래스 안에서 요청 하나를 처리하는 메서드다. 어떤 요청을 받을지는 `@GetMapping`, `@PostMapping`이 정하고, 요청 값을 어떻게 받을지는 메서드의 **파라미터**가 정한다.

실습 컨트롤러는 클래스에 `@RequestMapping("/request/*")`를 붙이고, 메서드마다 `regist`, `modify`, `search` 경로를 맡는다. 화면을 보여 주는 GET과 폼을 처리하는 POST가 같은 경로를 쓴다.

| 요청 | 핸들러 메서드 | 반환 | 보여 주는 뷰 |
|---|---|---|---|
| `GET /request/regist` | `regist()` | `void` | `request/regist` |
| `POST /request/regist` | `registMenu(...)` | `String` | `request/printResult` |

반환 타입이 `void`인데 뷰가 보이는 이유가 처음에는 헷갈렸다. 코드 주석에 정리된 대로, `void`이면 기본 뷰 이름 선택이 적용되어, 요청 경로(`/request/regist`)에서 앞쪽 `/`를 뗀 `request/regist`가 뷰 이름이 된다. `String`을 반환하면 그 문자열이 뷰 이름이다.

## 2. WebRequest로 직접 꺼내기

첫 번째는 서블릿에서 `request.getParameter()`로 값을 꺼내던 방식과 가장 비슷하다. `WebRequest`는 서블릿 API를 직접 쓰지 않고도 요청 파라미터에 접근하게 해 주는 추상화다. 파라미터 타입을 `WebRequest`로 선언하면 요청 정보가 그 객체에 담겨서 들어온다.

```java
@PostMapping("regist")
public String registMenu(Model model, WebRequest request) {
    String menuName = request.getParameter("name");
    int menuPrice = Integer.parseInt(request.getParameter("price"));
    int categoryCode = Integer.parseInt(request.getParameter("categoryCode"));

    String message = menuName + " 을(를) 신규 메뉴 목록 " +
            categoryCode + "번 카테고리에 " + menuPrice +
            " 원으로 등록 했습니다!";

    model.addAttribute("message", message);
    return "request/printResult";
}
```

폼의 `name` 속성(`name`, `price`, `categoryCode`)이 `getParameter()`에 넘기는 문자열과 같아야 한다. `getParameter()`는 `String`(없으면 `null`)을 돌려주므로 숫자는 `Integer.parseInt()`로 직접 바꿔야 한다.

`model.addAttribute("message", message)`로 담은 값은 `printResult.html`에서 `th:text="${message}"`로 꺼낸다. `Model`이 컨트롤러에서 뷰로 값을 넘기는 통로다.

이 방식의 약점은 변환을 내가 책임진다는 점이다. 가격 칸을 비워 두고 등록하면 `getParameter("price")`가 빈 문자열을 돌려주고, `Integer.parseInt("")`에서 `NumberFormatException`이 난다. 이 예외를 따로 처리하지 않았으므로 사용자는 500 오류 화면을 보게 된다. 가격 파라미터를 아예 보내지 않아도 `NumberFormatException`(`Cannot parse null string`)과 500이 나온다. 실제로 `curl`로 확인했다.

## 3. @RequestParam으로 이름 붙여 받기

두 번째는 파라미터마다 `@RequestParam`을 붙이는 방식이다. 값을 꺼내는 것과 타입 변환을 스프링이 대신 한다.

```java
@PostMapping("modify")
public String modifyMenu(Model model,
                         @RequestParam("modifyName") String name,
                         @RequestParam int modifyPrice) {
    System.out.println("name = " + name);
    System.out.println("modifyPrice = " + modifyPrice);
    return "request/printResult";
}
```

이 예제는 Model에 `message`를 담지 않아서, 결과 화면의 `<h3>`는 비어 있다.

두 파라미터의 이름 지정 방식이 다르다.

| 선언 | 요청에서 찾는 이름 | 이름이 다를 때 |
|---|---|---|
| `@RequestParam("modifyName") String name` | `modifyName` (괄호 안의 값) | 변수명(`name`)과 달라도 된다 |
| `@RequestParam int modifyPrice` | `modifyPrice` (변수명) | 폼의 `name` 속성과 다르면 400 |

괄호 안에 이름을 쓰지 않으면 변수명이 요청 파라미터 이름이 된다. 이 방식은 컴파일된 클래스에 파라미터 이름이 남아 있어야(`-parameters`) 동작한다. Spring Boot Gradle 플러그인이 이 옵션을 자동으로 켜 주므로 이 프로젝트에서는 변수명만으로 동작한다. 일반 Gradle·Maven 설정에서는 이름을 명시하는 편이 안전하다. 코드 주석에 적힌 "가장 주의해야 할 것"이 이 부분이다. `@RequestParam`은 기본값이 필수(`required=true`)라서, 폼의 `<input name="...">`과 이름이 맞지 않아 값이 없으면 **400 Bad Request**가 발생한다.

가격 칸을 비우면 빈 문자열을 `int`로 변환하지 못해서 역시 400이 된다. 같은 입력 실수를 `WebRequest` 방식에서는 500으로, `@RequestParam`에서는 400으로 처리한다. 사용자 입력이 잘못된 것이므로 400이 더 알맞은 응답이다.

`curl`로 확인한 결과는 다음과 같다.

| 요청 | 상태 코드 | 서버 로그 예외 |
|---|---|---|
| `modifyPrice=abc` | 400 | `MethodArgumentTypeMismatchException` |
| `modifyPrice=` (빈 값) | 400 | `MethodArgumentTypeMismatchException` |
| `modifyName` 생략 | 400 | `MissingServletRequestParameterException` |

## 4. @ModelAttribute로 객체 하나에 묶기

폼 항목이 네 개로 늘어나면(`name`, `price`, `categoryCode`, `orderableStatus`) 파라미터를 하나씩 선언하기가 번거롭다. 이때 값을 담을 DTO를 만들고 `@ModelAttribute`로 받는다.

```java
@Getter @Setter @ToString
@NoArgsConstructor @AllArgsConstructor
public class MenuDTO {
    private String name;
    private int price;
    private int categoryCode;
    private String orderableStatus;
}
```

```java
@PostMapping("search")
public String searchMenu(@ModelAttribute("menu") MenuDTO menu) {
    System.out.println("menu = " + menu);
    return "request/searchResult";
}
```

스프링은 요청 파라미터 이름과 같은 필드에 값을 채워 준다. 이 동작에는 두 가지 전제가 있다.

* 폼의 `name` 속성이 DTO 필드 이름과 같아야 한다. (`search.html`의 `name`, `price`, `categoryCode`, `orderableStatus`)
* 값을 채울 경로가 있어야 한다. 기본 설정에서는 생성자 바인딩과 setter 바인딩이 모두 적용된다. `MenuDTO`는 기본 생성자(`@NoArgsConstructor`)와 setter(`@Setter`)가 있어서 setter 방식으로 채워진다.

`@ModelAttribute`는 채운 객체를 Model에도 자동으로 담는다. 그래서 `model.addAttribute()`를 호출하지 않아도 `searchResult.html`에서 `menu`라는 이름으로 꺼낼 수 있다.

```html
<h3 th:text="${menu.getName()}"></h3>
<h3 th:text="${menu.getPrice()}"></h3>
<!-- ... 나머지 두 줄 생략 -->
```

`@ModelAttribute`에 이름을 주지 않으면 클래스 이름 `MenuDTO`의 첫 글자를 소문자로 바꾼 `menuDTO`가 이름이 된다. 이 실습에서는 `@ModelAttribute("menu")`로 이름을 지정했으므로 뷰에서도 `menu`를 쓴다.

입력 실수는 이렇게 처리됐다. 가격 파라미터를 보내지 않으면 `price`가 기본값 0으로 남아서 200이 나오고, `price=abc`처럼 변환할 수 없는 값을 보내면 바인딩 오류로 400이 나온다. 둘 다 `curl`로 확인했다.

## 5. 세 방식 비교

| 비교 기준 | `WebRequest` | `@RequestParam` | `@ModelAttribute` |
|---|---|---|---|
| 값을 꺼내는 주체 | 내가 `getParameter()` 호출 | 스프링 | 스프링 |
| 타입 변환 | 직접 (`parseInt`) | 자동 | 자동 |
| 값이 없을 때 | 변환 코드에서 예외 (500) | 400 (기본 필수) | 필드가 기본값으로 남음 (`int`는 0) |
| 변환할 수 없는 값 | `parseInt`에서 예외 (500) | 400 | 바인딩 오류 (400) |
| 뷰로 넘기기 | `model.addAttribute()` 직접 호출 | `model.addAttribute()` 직접 호출 | Model에 자동 등록 |
| 어울리는 경우 | 요청 정보를 세밀하게 다룰 때 | 값이 한두 개일 때 | 값이 여러 개이고 한 덩어리일 때 |

세 방식 중 하나만 정답인 것은 아니다. 값이 한두 개이면 `@RequestParam`이 가장 짧고, 항목이 늘어나면 DTO로 묶는 편이 메서드 시그니처를 읽기 쉽게 해 준다. `WebRequest`는 값을 꺼내는 과정이 그대로 보여서 동작 원리를 이해하기에는 좋지만, 변환과 예외 처리 코드를 직접 써야 한다.

## 6. 아직 연결되지 않은 부분

실습 프로젝트에는 핸들러가 없는 화면 요소가 두 곳 있다. 둘 다 아직 구현 전이다.

| 위치 | 요소 | 상태 |
|---|---|---|
| `index.html` | `@RequestBody 이용` 버튼 (`/request/body`) | 컨트롤러에 `body` 매핑이 없다 |
| `modify.html` | 메뉴 수정 폼2 (`modifyAll`, `modifyName2`, `modifyPrice2`) | 컨트롤러에 `modifyAll` 매핑이 없다 |

두 요소 모두 요청하면 404 Not Found가 나온다. `@RequestBody`는 요청 본문(JSON 등)을 객체로 바꿔 받는 어노테이션이라, 폼 전송이 아니라 `fetch` 같은 호출과 함께 쓰는 방식이다. 다음 실습에서 다룰 주제로 남겨 둔다.

## 세 방식 선택 기준 정리

1. 요청 값을 받는 방식은 `WebRequest`(직접), `@RequestParam`(이름으로 하나씩), `@ModelAttribute`(객체로 한꺼번에) 세 가지로 나뉜다.
2. 폼의 `name` 속성과 컨트롤러 쪽 이름이 맞아야 값이 들어온다. 이름이 어긋나면 `@RequestParam`은 400을 낸다.
3. `@ModelAttribute`는 값 바인딩과 Model 등록을 한 번에 한다.

다음에 볼 것은 `@RequestBody`와 `@RequestParam`의 `required`, `defaultValue` 옵션이다.

## 더 학습하면 좋은 개념

- **`@RequestParam`의 `required`, `defaultValue`** — 값이 없을 때 400 대신 기본값으로 처리하는 방법이다. 입력이 선택 사항인 폼을 만들 때 필요하다.
- **`@RequestBody`와 `HttpMessageConverter`** — JSON 요청 본문을 객체로 바꾸는 방식이다. 이 글에서 구현하지 않은 네 번째 버튼이 이 주제다.
- **`BindingResult`와 검증(`@Valid`)** — 바인딩 오류를 400 화면 대신 직접 처리하는 방법이다. `@ModelAttribute`에서 `price=abc`가 400이 된 이유와 이어진다.
- **데이터 바인딩 보안(`@InitBinder`, `allowedFields`)** — 폼에 없는 필드까지 요청으로 채워질 수 있는 문제를 막는 설정이다. DTO 바인딩을 쓸 때 알아 두어야 한다.
- **`RequestToViewNameTranslator`** — `void` 반환 시 요청 경로에서 뷰 이름을 만드는 기본 규칙이다.

## 참고 자료

- [Spring Framework 공식 문서 - Method Arguments](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/arguments.html)
- [Spring Framework 공식 문서 - @RequestParam](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestparam.html)
- [Spring Framework 공식 문서 - @ModelAttribute](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/modelattrib-method-args.html)
- [Spring Framework 공식 문서 - Return Values](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/return-types.html)
- [Spring Framework API - @ModelAttribute](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/ModelAttribute.html)
- [Spring Framework 공식 문서 - @RequestBody](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestbody.html)
