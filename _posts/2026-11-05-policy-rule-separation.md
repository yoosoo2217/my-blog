---
title: "규칙 검증 위치 분리"
date: 2026-11-05
tags:
  - Java
  - Spring
  - JPA
---

메뉴 등록 기능에 "이름 중복 금지", "하위 카테고리에만 등록" 규칙을 넣으려고 `MenuService`에 `if` 문을 쌓았다. 규칙이 두 개인데도 정작 이 메서드가 무엇을 하는지는 보이지 않았다. 규칙 검사는 어디에 두어야 하고, 그 위치는 무엇으로 정할까?  
메뉴 관리 미니 프로젝트에서 규칙을 DTO, Entity, Policy 클래스로 나누며 정한 기준을 정리했다.

> **TL;DR**
> - 규칙은 "무엇을 알아야 판단할 수 있는가"로 위치를 정한다. 입력값만 보면 DTO, 자기 현재 상태를 보면 Entity, DB 조회나 다른 도메인 정보가 필요하면 Policy다.
> - Service는 규칙을 직접 판단하지 않고 "조회 → 규칙 확인 → 변경 → 저장" 순서만 조립한다.
> - 다른 팀 데이터가 필요한 규칙은 인터페이스를 Menu 쪽에 정의하고, 구현은 상대 팀이나 Fake가 맡는다.

환경: Java 21, Spring Boot 3.5.13, Spring Data JPA, Thymeleaf, Lombok, MySQL 8. 코드는 `module07-jpa-mini-project`에서 가져왔다. 긴 코드는 줄였고, 줄인 곳은 `// ... 생략`으로 표시했다.  
이 글은 소스 코드와 코드에 달린 주석, 프로젝트 README(PRD)를 기준으로 정리했다. 실행 결과 화면은 싣지 않았다.

## 1. Service에 if 문을 쌓으면 무엇이 문제일까?

처음 형태는 `registNewMenu()` 안에서 모든 규칙을 직접 검사하는 방식이다. 코드에 Before 예시로 남겨 둔 구조를 줄여서 옮겼다. (강의 자료의 예시 코드이고, 이 형태 그대로 실행한 결과는 확인하지 않았다)

```java
@Transactional
public int registNewMenu(MenuDTO registMenu) {

    // ① 이름 중복 금지
    if (menuRepository.existsByMenuName(registMenu.getMenuName())) {
        throw new BusinessException(ErrorCode.DUPLICATE_MENU_NAME);
    }

    // ② 하위 카테고리에만 등록
    Category category = categoryRepository.findById(registMenu.getCategoryCode())
            .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
    if (category.getRefCategoryCode() == null) {
        throw new BusinessException(ErrorCode.NOT_SUB_CATEGORY);
    }

    // ③ 정작 이 메서드의 할 일: 생성 → 저장 → 반환
    Menu menu = Menu.create(registMenu.getMenuName(), registMenu.getMenuPrice(), registMenu.getCategoryCode());
    menuRepository.save(menu);
    return menu.getMenuCode();
}
```

코드 주석이 짚은 문제는 네 가지다.

| 번호 | 문제 | 왜 곤란한가 |
|---|---|---|
| 1 | 이름 중복 규칙이 `modifyMenuName()`에도 복사된다 | 한쪽만 고치면 등록과 수정의 규칙이 달라진다 |
| 2 | Service가 "`refCategoryCode`가 `null`이면 상위 카테고리"라는 `Category`의 내부 사정을 안다 | `Category`의 구조가 바뀌면 Service도 고쳐야 한다 |
| 3 | 규칙이 늘수록 `if` 문이 쌓이고 ③ 흐름이 묻힌다 | 메서드가 무엇을 하는지 한눈에 안 보인다 |
| 4 | 규칙 하나만 테스트하려 해도 Service 전체를 준비해야 한다 | Repository 두 개가 필요하다 |

## 2. 규칙은 어디에 둘까? 세 가지 질문

PRD(README)는 규칙을 판단에 필요한 정보에 따라 세 종류로 나눈다. 규칙을 구현하기 전에 아래 질문을 순서대로 던져 위치를 정한다.

| 질문 | 종류 | 판단 위치 | 프로젝트의 예 |
|---|---|---|---|
| 입력값 자체만 보면 판단할 수 있는가? | 입력 정책 | `MenuDTO` (`@Valid`) | 이름 30자 이하, 가격 0원 이상 |
| 엔티티의 현재 상태를 봐야 하는가? | 도메인 정책 | Entity (`Menu`, `Category`) | 판매중인 메뉴는 삭제 불가 |
| DB 조회나 다른 도메인 정보가 필요한가? | 비즈니스 정책 | Policy 클래스 | 이름 중복, 주문 이력 확인 |

### 입력 정책: DTO와 `@Valid`

```java
public class MenuDTO {
    // ... 생략

    @NotBlank(message = "메뉴 이름은 필수랑")
    @Size(max = 30, message = "메뉴 이름은 30자 이하입니당당구리당당")
    private String menuName;

    @Min(value = 0, message = "메뉴 가격은 0원 이상 입력하셔야죠~!!!")
    private int menuPrice;

    @Positive(message = "카테고리를 선택해주세용")
    private int categoryCode;
}
```

이름의 30자 제한은 `tbl_menu.menu_name`이 `VARCHAR(30)`이라서 생겼다. 이런 규칙은 입력값만 있으면 판단할 수 있다. 검증 규칙은 DTO에 선언하고, 실행은 Controller 파라미터의 `@Valid`가 한다.

### 도메인 정책: Entity가 자기 상태로 판단

판매중인 메뉴는 삭제할 수 없다는 규칙은 메뉴의 현재 상태(`orderableStatus`)를 알아야 판단할 수 있다. DTO는 화면에서 넘어온 값만 알고 DB에 저장된 현재 상태는 모르므로 `@Valid`로는 검사할 수 없다. 그래서 `Menu`가 직접 판단한다.

```java
public class Menu {

    private static final String ON_SALE = "Y";
    private static final String STOPPED = "N";

    // ... 필드 생략

    public void validateDeletable() {
        if (this.orderableStatus.equals(ON_SALE)) {
            throw new BusinessException(ErrorCode.ON_SALE_MENU_CANNOT_DELETE);
        }
    }
}
```

`"Y"`라는 값이 무슨 뜻인지는 `Menu`만 안다. Service가 `"Y".equals(menu.getOrderableStatus())`처럼 내부 표현을 직접 비교하지 않아도 된다.

`Category`도 같은 방식으로 자기 값에 대한 질문에 스스로 답한다.

```java
public boolean isSubCategory() {
    return refCategoryCode != null;
}
```

1번 문제에서 본 `getRefCategoryCode() == null` 비교가 이 메서드 안으로 들어갔다. 다른 클래스는 "하위 카테고리인가?"만 물으면 된다.

### 비즈니스 정책: Policy 클래스

이름 중복은 다른 메뉴를 조회해야 판단할 수 있다. 그래서 Entity가 아닌 Policy 클래스가 맡는다. Entity는 Repository나 다른 Bean을 주입받지 않는다는 원칙이 있기 때문이다.

```java
@Component
@RequiredArgsConstructor
public class MenuNamePolicy {

    private final MenuRepository menuRepository;

    public void validateNewName(String menuName) {
        if (menuRepository.existsByMenuName(menuName)) {
            throw new BusinessException(ErrorCode.DUPLICATE_MENU_NAME);
        }
    }
}
```

Policy는 "된다 / 안 된다"만 판단한다. 위반하면 `BusinessException`을 던지고, 통과하면 아무것도 하지 않는다. `save` 호출이나 Entity 값 변경은 Policy가 하지 않고 Service의 몫이다.

`MenuCategoryPolicy`는 카테고리를 조회한 뒤 판단은 `Category`에게 맡긴다.

```java
public void validateRegistrable(int categoryCode) {
    Category category = categoryRepository.findById(categoryCode)
            .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

    if (!category.isSubCategory()) {
        throw new BusinessException(ErrorCode.NOT_SUB_CATEGORY);
    }
}
```

조회는 Policy가 하고 "하위인가?"의 판단은 Entity가 한다. Policy가 `refCategoryCode`를 직접 해석하지 않는다.

## 3. 분리하고 나니 Service는 어떻게 바뀔까?

```java
@Transactional
public int registNewMenu(MenuDTO registMenu) {
    // 1. 비즈니스 규칙 확인
    menuNamePolicy.validateNewName(registMenu.getMenuName());
    categoryPolicy.validateRegistrable(registMenu.getCategoryCode());

    // 2. Entity 생성
    Menu menu = Menu.create(
            registMenu.getMenuName(),
            registMenu.getMenuPrice(),
            registMenu.getCategoryCode()
    );

    // 3. 저장
    menuRepository.save(menu);

    return menu.getMenuCode();
}
```

Service에는 흐름만 남았다. 규칙이 바뀌면 Policy나 Entity를 고치고, Service는 그대로 둔다.

삭제는 도메인 규칙과 비즈니스 규칙이 한 유스케이스에 함께 나오는 예다.

```java
@Transactional
public void deleteMenu(int menuCode) {
    Menu found = menuRepository.findById(menuCode)
            .orElseThrow(() -> new BusinessException(ErrorCode.MENU_NOT_FOUND));

    found.validateDeletable();                          // 도메인 규칙: 판매중이면 불가
    menuDeletionPolicy.validateDeletable(menuCode);     // 비즈니스 규칙: 주문 이력이 있으면 불가

    menuRepository.delete(found);
}
```

순서도 의미가 있다. PRD는 판매중 여부(Menu 자신의 상태)를 먼저, 주문 이력(다른 팀에 질문)을 나중에 확인하도록 정했다. 비용이 싼 검사를 앞에 두고, 다른 팀에 묻는 검사는 뒤로 미룬다.

| 비교 | Before (Service가 직접 판단) | After (역할 분리) |
|---|---|---|
| 규칙 위치 | Service의 `if` 문 | DTO, Entity, Policy |
| 규칙 중복 | 등록과 수정에 복사 | Policy 메서드 하나를 재사용 |
| Entity 내부 구조 | Service가 해석 | Entity가 스스로 답변 |
| Service의 역할 | 규칙 판단과 흐름 | 흐름 조립 |

## 4. 다른 팀의 데이터가 필요하면 어떻게 할까?

주문 이력은 Order 팀이 가진 데이터다. 그렇다고 Order 팀의 Repository를 `import`하면 안 된다. Menu 팀이 인터페이스를 정의하고 Order 팀이 구현한다.

```java
public interface MenuOrderHistoryChecker {

    boolean hasOrdered(int menuCode);
}
```

```java
@Component
@RequiredArgsConstructor
public class MenuDeletionPolicy {

    private final MenuOrderHistoryChecker menuOrderHistoryChecker;

    public void validateDeletable(int menuCode) {
        if (menuOrderHistoryChecker.hasOrdered(menuCode)) {
            throw new BusinessException(ErrorCode.ORDERED_MENU_CANNOT_DELETE);
        }
    }
}
```

`MenuDeletionPolicy`는 인터페이스 타입만 알고, 실제 구현이 무엇인지 모른다. Spring이 구현체를 주입한다. Order 팀의 구현이 끝나기 전에는 Fake가 그 자리를 채운다.

```java
@Component
public class FakeMenuOrderHistoryChecker implements MenuOrderHistoryChecker {

    private static final Set<Integer> ORDERED_MENU_CODES = Set.of(1, 2, 3);

    @Override
    public boolean hasOrdered(int menuCode) {
        return ORDERED_MENU_CODES.contains(menuCode);
    }
}
```

> 위 `Fake`는 실습용으로 제공된 코드이고, 1, 2, 3번 메뉴에 주문 이력이 있다고 가정한 값이다.

인터페이스를 Menu 쪽에 두는 이유는 의존 방향 때문이다. Order는 메뉴 가격을 알아야 하므로 이미 Menu에 의존한다. 이때 Menu가 Order를 직접 의존하면 서로를 참조하는 순환 의존이 생긴다. 인터페이스를 Menu 쪽에 두면 의존 방향이 Order → Menu 한 방향으로 유지된다. Order 팀의 구현이 완성되면 Fake만 삭제하고, Menu 팀 코드는 바뀌지 않는다.

## 5. 헷갈렸던 점과 한계

* **DTO 검증으로 충분하지 않을까?** 이름 중복처럼 DB 조회가 필요한 규칙은 `@Valid`로 막을 수 없다. DTO는 DB에 저장된 값을 모르기 때문이다. 반대로 빈 값이나 길이처럼 입력값만 보면 되는 규칙은 DTO에서 먼저 막는 편이 싸다.
* **화면에서 하위 카테고리만 보여주는데 서버가 다시 검사해야 할까?** 해야 한다. 요청은 화면을 거치지 않고도 보낼 수 있다. 화면 제한은 편의 기능이고, 서버 검증이 실제 방어선이다.
* **Policy로 나누면 중복 등록이 완전히 막힐까?** 막히지 않는다. 코드 주석에 따르면 두 사람이 동시에 같은 이름을 등록하면 둘 다 조회 단계를 통과할 수 있다(조회와 저장 사이의 간격). 운영 환경에서는 `menu_name` 컬럼에 `unique` 제약조건을 함께 붙여 DB에서 마지막으로 막아야 한다.
* **이 글 작성 시점의 구현 범위**: 이름 수정 시 중복 검사(`validateRename`)와 판매중지·재개(`stopSelling`, `resumeSelling`)는 아직 구현하지 않았다. 위 예시는 구현을 마친 등록과 삭제 흐름만 다뤘다.

## 6. 정리

1. 규칙의 위치는 판단에 필요한 정보로 정한다. 입력값은 DTO, 자기 상태는 Entity, 조회나 다른 도메인 정보는 Policy다.
2. Service는 규칙을 직접 판단하지 않고 흐름만 조립한다. 규칙이 `if` 문으로 쌓이기 시작하면 Entity나 Policy로 옮길 신호다.
3. 다른 팀의 데이터가 필요하면 필요한 쪽이 인터페이스를 정의하고, 구현이 없으면 Fake로 먼저 개발한다.

다음에는 남은 `validateRename`과 `stopSelling` 구현을 마치고, `GlobalExceptionHandler`가 `BusinessException`을 상태코드별 에러 화면으로 바꾸는 과정을 따로 정리할 예정이다.

## 더 학습하면 좋은 개념

* **Bean Validation(`@Valid`, `@NotBlank`, `@Size`)** — DTO 검증이 어떤 시점에 실행되고, 실패하면 어떤 예외가 발생하는지 알아야 한다.
* **풍부한 도메인 모델(Rich Domain Model)** — Entity에 상태 변경 규칙을 두는 설계다. setter 대신 `changeMenuName()` 같은 이름 있는 메서드를 쓰는 이유와 이어진다.
* **의존성 역전 원칙(DIP)** — 인터페이스를 필요한 쪽에 두어 의존 방향을 바꾸는 원칙이다. `MenuOrderHistoryChecker`가 이 원칙의 사례다.
* **DB unique 제약조건과 동시성** — 애플리케이션 검사만으로 막을 수 없는 중복을 DB 수준에서 막는 방법이다.
* **`@ControllerAdvice` 예외 처리** — `BusinessException`을 한 곳에서 에러 화면으로 바꾸는 방법이다.

## 참고 자료

* [Spring Framework 공식 문서 - Java Bean Validation](https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html)
* [Spring Data JPA 공식 문서 - Query Methods](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)
* [Jakarta Bean Validation 3.0 명세](https://jakarta.ee/specifications/bean-validation/3.0/)
