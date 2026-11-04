---
title: "메뉴 등록 카테고리 조회 오류"
date: 2026-11-04
tags:
  - project
  - Java
  - Spring
  - JPA
---

신규 메뉴 등록 화면을 열었더니 카테고리 드롭다운이 텅 비어 있었다. DB에는 카테고리 데이터가 있고, 서버 로그에는 조회 SQL도 정상으로 찍혔다. 에러 화면도 없었다. 문제는 SQL도 DB도 아닌, Entity를 DTO로 바꾸는 `from()` 메서드 안에 있었다.

> **TL;DR**
> - 증상 : `/menu/regist`의 카테고리 `<select>`에 옵션이 0개였다.
> - 원인 : `CategoryDTO.from()`이 만든 객체를 반환하지 않고 `return null`을 하고 있었다. API 응답이 `[null, null, ...]`이 되었다.
> - 해결 : `new CategoryDTO(...)` 앞에 `return`을 붙였다. 옵션이 0개에서 9개로 바뀌었다.

환경: Java 21, Spring Boot 3.5.13, Spring Data JPA, Thymeleaf, MySQL 8.0.46, Gradle, Lombok. 아래 화면은 `./gradlew bootRun`으로 앱을 직접 실행해서 캡처했다. 수정 전 화면은 `from()`을 원래 코드로 잠깐 되돌려서 다시 재현한 것이다.

## 1. 증상 : 에러 없이 비어 있는 드롭다운

`http://localhost:8080/menu/regist`에 접속하면 카테고리 칸이 비어 있다. 화면만 봐서는 DB 문제인지, 서버 코드 문제인지, 화면 JS 문제인지 알 수 없다.

![수정 전 신규 메뉴 등록 화면, 카테고리 선택 칸이 비어 있다]({{ site.baseurl }}/assets/img/menu-regist-category-before.jpg)

이 화면의 카테고리 목록은 서버가 렌더링한 것이 아니다. 페이지가 열린 뒤 JS의 `fetch`가 `/menu/category`를 호출해서 채운다.

```html
<select name="categoryCode" id="categoryCode"></select>

<script>
    fetch('/menu/category')
        .then(res => res.json())
        .then(data => {
            const $categoryCode = document.getElementById("categoryCode");

            for (let index in data) {
                const $option = document.createElement("option");
                $option.value = data[index].categoryCode;
                $option.textContent = data[index].categoryName;

                $categoryCode.appendChild($option);
            }
        });
</script>
```

## 2. 어디서 끊겼는지 어떻게 찾았을까?

데이터는 아래 5단계를 거쳐 화면까지 간다. 어느 단계에서 값이 사라지는지 뒤쪽부터 확인하는 것이 빠르다고 판단했다.

| 단계 | 담당 | 확인 방법 | 결과 |
|---|---|---|---|
| 1 | DB(`tbl_category`) | `sql/menudb-script.sql`의 INSERT 확인 | 하위 카테고리 9건이 있어야 한다 |
| 2 | `CategoryRepository.findSubCategory()` | 서버 콘솔의 Hibernate SQL 로그 | `select * from tbl_category ... where ref_category_code is not null` 실행됨 |
| 3 | `CategoryDTO.from()` | 아래 3번에서 확인 | 문제 발견 |
| 4 | `MenuController.findCategoryList()` | `/menu/category`를 브라우저에서 직접 호출 | 응답 확인 |
| 5 | `regist.html`의 JS | 4단계 응답을 본 뒤 판단 | 응답이 이상하면 화면 문제가 아니다 |

화면을 거치지 않고 4단계 API를 브라우저 주소창에 직접 입력해 보니 응답이 이렇게 나왔다.

![수정 전 /menu/category 응답, null이 9개 나열되어 있다]({{ site.baseurl }}/assets/img/menu-category-json-before.jpg)

```text
[null,null,null,null,null,null,null,null,null]
```

Repository는 9건을 조회했고(null이 9개), 그 값이 DTO로 바뀌는 순간 전부 `null`이 되었다. 2번 단계의 SQL 로그가 정상이었던 것과 맞는 결과다. 그래서 DB와 쿼리는 의심 대상에서 빠졌다.

## 3. 원인 : 만든 객체를 버리고 null을 반환했다

Service는 조회한 Entity 목록을 `CategoryDTO::from`으로 변환한다.

```java
public List<CategoryDTO> findSubCategories() {
    List<Category> categoryList = categoryRepository.findSubCategory();

    return categoryList.stream()
            .map(CategoryDTO::from)
            .toList();
}
```

문제의 `from()`은 이랬다.

```java
public static CategoryDTO from(Category category) {
    new CategoryDTO(
            category.getCategoryCode(),
            category.getCategoryName(),
            category.getRefCategoryCode()
    );
    return null;
}
```

`new CategoryDTO(...)`는 객체를 만들기만 하고 어디에도 담지 않는다. 그 객체는 곧바로 버려지고, 메서드는 `null`을 반환한다. 이 코드는 컴파일이 되고 실행 중에도 예외가 나지 않는다. 그래서 에러 로그가 하나도 남지 않았다.

`stream().map()`에서 매핑 결과가 `null`이어도 스트림은 그대로 진행한다. 그 결과 `List<CategoryDTO>`는 `null` 9개가 든 리스트가 되고, Jackson이 이를 JSON 배열 `[null, ...]`로 바꿔서 응답한다.

화면 쪽에서는 `for (let index in data)`의 첫 반복에서 `data[0].categoryCode`를 읽는다. `data[0]`이 `null`이라 이 줄에서 TypeError가 날 것이고, 그 때문에 `appendChild`까지 가지 못해 옵션이 0개로 남는다. 이 TypeError 메시지는 콘솔을 따로 캡처하지 않아서 코드로 추론한 것이다.

## 4. 해결 : return 한 단어

```java
public static CategoryDTO from(Category category) {
    return new CategoryDTO(
            category.getCategoryCode(),
            category.getCategoryName(),
            category.getRefCategoryCode()
    );
}
```

수정 후 같은 API를 호출하면 카테고리 9건이 JSON으로 나온다.

![수정 후 /menu/category 응답, 카테고리 9건의 JSON이 나온다]({{ site.baseurl }}/assets/img/menu-category-json-after.jpg)

등록 화면에서는 드롭다운에 첫 번째 항목인 `한식`이 선택된 채로 보인다.

![수정 후 신규 메뉴 등록 화면, 카테고리에 한식이 선택되어 있다]({{ site.baseurl }}/assets/img/menu-regist-category-after.jpg)

네이티브 `<select>`의 펼친 목록은 스크린샷에 잡히지 않는다. 아래 화면은 개발자 도구에서 `size` 속성을 임시로 줘서 옵션 전체를 펼쳐 놓은 것이다. 실제 화면 코드를 바꾼 것은 아니다.

![select의 size를 늘려 옵션 9개를 모두 펼친 화면]({{ site.baseurl }}/assets/img/menu-regist-category-after-open.jpg)

| 항목 | 수정 전 | 수정 후 |
|---|---|---|
| `/menu/category` 응답 | `null` 9개 | 카테고리 객체 9개 |
| 드롭다운 옵션 수 | 0개 | 9개 (한식, 중식, 일식, 퓨전, 커피, 쥬스, 기타, 동양, 서양) |
| 서버 에러 로그 | 없음 | 없음 |

## 5. 헷갈렸던 점과 다음에 쓸 방법

처음에는 `@Query`의 native SQL이나 Entity 매핑을 먼저 의심하기 쉽다. 이 프로젝트는 JPA 계층이 새로 배운 부분이라서 특히 그렇다. 하지만 SQL 로그가 정상이라면 그 앞 단계는 일단 통과한 것이다. 로그에서 쿼리가 나갔는지를 먼저 보면 의심 범위가 절반으로 줄어든다.

`@ResponseBody` API는 화면과 분리해서 직접 호출해 볼 수 있다. 화면 JS가 끼어 있으면 원인이 서버인지 화면인지 구분이 안 되지만, 응답 JSON을 직접 보면 바로 갈린다.

같은 실수를 줄이는 방법은 아래와 같다.

* `from()`처럼 변환만 하는 메서드는 한 줄 `return new ...`로 쓰고, 중간에 `return null`을 두지 않는다.
* IDE가 "생성한 객체를 사용하지 않음" 경고를 띄우는지 확인한다. 이 경고가 있으면 이번 같은 실수를 바로 잡을 수 있다. (사용하는 IDE에서 확인 필요)
* 변환 메서드는 작은 단위 테스트로 `null`이 아닌지 한 번 검증해 둔다.

## 정리

* 증상이 화면에 나와도 원인은 서버 응답에 있을 수 있다. API를 직접 호출해서 응답부터 본다.
* SQL 로그가 정상이면 DB와 Repository는 통과한 것이다. 그다음 단계인 변환 코드(`from()`)를 본다.
* `return` 없이 `new`만 쓰면 컴파일러는 막지 않는다. 에러 없이 `null`이 흘러가므로 로그에 단서가 남지 않는다.

다음에는 같은 프로젝트에서 아직 비어 있는 `registMenu()`를 구현해서, 이 드롭다운에서 고른 `categoryCode`로 메뉴를 실제로 저장해 볼 예정이다.

## 더 학습하면 좋은 개념

* **DTO 변환 패턴(정적 팩토리 메서드)** — `from()`처럼 변환 책임을 DTO에 두는 방식이다. Entity를 Controller까지 노출하지 않는 이유와 함께 보면 계층 구조가 잘 보인다.
* **`Stream.map()`과 null** — `map` 안에서 `null`을 반환해도 스트림은 에러를 내지 않는다. 이런 값이 어디서 걸러지는지 알아 두면 비슷한 증상을 빨리 의심할 수 있다.
* **Jackson 직렬화** — `@ResponseBody` 반환값이 JSON으로 바뀌는 과정이다. getter 기반으로 동작한다는 점을 알면 DTO에 `@Getter`가 필요한 이유가 설명된다.
* **Native Query와 JPQL** — 이번에 쓴 `@Query(nativeQuery = true)`와 JPQL의 차이다. 어떤 상황에 어느 쪽을 쓸지 정리해 두면 좋다.
* **Spring MVC 단위 테스트(MockMvc)** — 이번처럼 API 응답을 눈으로 확인하는 과정을 테스트로 자동화할 수 있다.

## 참고 자료

* [Spring Data JPA 공식 문서 - Query Methods](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)
* [Spring Framework 공식 문서 - @ResponseBody](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responsebody.html)
* [MDN - Fetch API 사용하기](https://developer.mozilla.org/ko/docs/Web/API/Fetch_API/Using_Fetch)
