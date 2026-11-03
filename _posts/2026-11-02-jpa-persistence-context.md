---
title: "JPA 영속성 컨텍스트"
date: 2026-11-02
tags:
  - Java
  - Spring
  - JPA
---

같은 PK로 `find()`를 두 번 호출했는데 SELECT가 한 번만 나간다. `setMenuName()`만 호출했는데 UPDATE가 저절로 실행된다. 이 두 현상은 모두 `EntityManager` 뒤에 있는 **영속성 컨텍스트(Persistence Context)** 가 만든다.  
앞선 글에서 [CRUD]({{ site.baseurl }}/jpa-entity-manager-crud.html)와 [엔티티 생명주기]({{ site.baseurl }}/jpa-entity-lifecycle.html)를 각각 다뤘고, 이번에는 그 코드들에 흩어져 있던 영속성 컨텍스트의 기능을 한 곳에 모아 정리한다.

> **TL;DR**
> - 영속성 컨텍스트는 엔티티를 보관하고 관리하는 공간이고, `EntityManager`를 통해서만 접근한다. 엔티티 매니저 하나가 영속성 컨텍스트 하나를 가진다.
> - 이 공간 덕분에 1차 캐시, 동일성 보장, 쓰기 지연, 변경 감지 네 가지 동작이 가능하다.
> - 네 기능은 따로 노는 것이 아니라 `find()`로 엔티티를 담는 순간부터 `flush()`로 SQL을 내보내는 순간까지 한 흐름으로 이어진다.

환경: Java 21, Spring Boot 4.1.2, Gradle, MySQL 8.0.46(`menudb` 데이터베이스), Lombok. 프로젝트 이름은 `chap02-persistence-context`이다.  
소스 코드와 주석을 기준으로 정리하고, 예제를 직접 실행해서 콘솔 결과로 확인했다. 실습 데이터가 바뀌지 않도록 조회와 rollback으로 끝나는 항목만 실행했고, 등록·수정·삭제(`section01`)는 실행하지 않았다. 실행하지 않은 부분은 `(확인 필요)`로 표시했다.

## 1. 영속성 컨텍스트는 어디에 있을까?

영속성 컨텍스트를 직접 만드는 코드는 없다. `EntityManagerFactory`에서 `EntityManager`를 만들면 그 매니저가 영속성 컨텍스트를 하나 가지고, `close()`를 호출하면 함께 끝난다.

```java
EntityManager manager = factory.createEntityManager(); // 영속성 컨텍스트 시작
// ... find, persist, remove ...
manager.close();                                       // 영속성 컨텍스트 종료
```

`section01`의 주석은 엔티티 매니저를 기능 1개당 1개씩 만들고, 필드로 공유하지 말라고 한다. 영속성 컨텍스트가 매니저 안에 있으므로, 매니저를 공유하면 엔티티와 변경 내용도 함께 섞인다고 읽을 수 있다(추론이며 주석에는 규칙만 있다).

## 2. 영속성 컨텍스트는 무엇을 해줄까?

| 기능 | 한 줄 설명 | 확인할 수 있는 코드 |
|---|---|---|
| 1차 캐시 | `find()`로 읽은 엔티티를 컨텍스트 안에 보관한다 | `managedState` |
| 동일성 보장 | 같은 PK는 같은 객체를 돌려준다 | `managedState`의 `foundMenu == newMenu` |
| 쓰기 지연 | `persist`, `remove`, 값 변경의 SQL을 모아 두었다가 나중에 보낸다 | `registMenu`, `removedState` |
| 변경 감지 | 처음 읽은 상태와 비교해서 바뀐 엔티티의 UPDATE를 만든다 | `modifyMenuName` |

아래에서 기능마다 코드를 하나씩 확인한다.

## 3. 같은 PK를 두 번 조회하면 SELECT는 몇 번 나갈까?

`section02`의 `managedState`는 같은 PK로 `find()`를 두 번 호출한다.

```java
System.out.println("===== 첫 번째 조회 =====");
Menu foundMenu = manager.find(Menu.class, menuCode);
System.out.println("===== 두 번째 조회 =====");
Menu newMenu = manager.find(Menu.class, menuCode);

System.out.println("foundMenu == newMenu : " + (foundMenu == newMenu));
```

코드 주석에 따르면 첫 `find()`가 엔티티를 영속성 컨텍스트에 저장한다. 이것이 **1차 캐시**이다. 두 번째 `find()`는 DB에 SELECT를 보내지 않고 1차 캐시의 엔티티를 반환한다. 그래서 `foundMenu == newMenu`는 `true`가 되고, 이를 동일성 보장이라고 한다.

실제로 실행하면 SELECT는 `===== 첫 번째 조회 =====` 아래에 한 번만 찍히고, `===== 두 번째 조회 =====` 아래에는 아무것도 찍히지 않는다. 두 객체의 `hashCode()`도 같다. 자세한 출력은 7번 항목에 있다.

여기서 헷갈리기 쉬운 점이 있다. 변수 이름이 `newMenu`여도 `new`로 만든 객체가 아니다. 값이 같은 별개 객체를 만드는 `transientState`의 `newMenu`와는 다르다. 그쪽은 `==`이 `false`이고 영속 상태도 아니다.

한계도 있다. 1차 캐시는 엔티티 매니저 하나의 수명 동안만 존재한다. `section01`의 "메뉴 조회"를 같은 코드로 두 번 실행하면 매번 `createEntityManager()`로 새 매니저를 만들기 때문에 SELECT가 두 번 나갔다. 여러 요청이 공유하는 캐시가 아니다.

## 4. persist를 호출하면 INSERT는 언제 나갈까?

`section01`의 `registMenu`는 `persist()`와 `commit()`을 분리해서 호출한다.

```java
transaction.begin();
try {
    manager.persist(menu);
    transaction.commit();
    System.out.println("등록 된 메뉴 : " + menu);
} catch (Exception e) {
    transaction.rollback();
} finally {
    manager.close();
}
```

주석에 따르면 엔티티 매니저는 CUD 작업의 SQL을 DB에 바로 반영하지 않는다. **쓰기 지연 SQL 저장소**에 SQL을 모아 두었다가 `flush()` 시점에 DB로 보낸다. `commit()`이 호출되면 flush가 자동으로 실행되므로, 이 예제에서 INSERT는 `commit()` 때 나간다.

`section02`는 이 지연을 눈으로 확인하도록 구성되어 있다. 가격을 바꾸는 코드가 `===== flush =====` 출력보다 먼저 실행되어도 UPDATE 구문은 그 구분선 아래에 찍힌다. `remove()`와 DELETE 구문도 마찬가지다.

SQL을 모아서 보내면 DML을 하나씩 즉시 보내는 것보다 DB 왕복을 줄일 수 있을 것 같지만, 이 프로젝트의 코드와 주석만으로는 그 효과를 확인할 수 없다(확인 필요).

## 5. update 메서드 없이 어떻게 UPDATE가 나갈까?

`modifyMenuName`에는 `update()`를 호출하는 줄이 없다.

```java
Menu foundMenu = manager.find(Menu.class, menuCode);

transaction.begin();
try {
    foundMenu.setMenuName(menuName);   // setter만 호출
    System.out.println("=======commit 하기 전=========");
    transaction.commit();
} catch (Exception e) {
    transaction.rollback();
}
```

주석에 따르면 영속성 컨텍스트는 엔티티를 처음 조회하는 순간 그 상태를 **스냅샷**으로 보관한다. flush 때 스냅샷과 현재 엔티티를 비교하고, 바뀐 부분이 있으면 UPDATE 쿼리를 만들어 쓰기 지연 저장소에 등록한 뒤 DB로 보낸다. 이 과정이 **변경 감지(Dirty Checking)** 이다.

이 동작은 영속 상태일 때만 성립한다. `detachedState`처럼 `detach()`로 분리한 엔티티는 값을 바꿔도 UPDATE가 나가지 않는다.

실행해 보면 바꾼 컬럼이 하나여도 UPDATE는 `category_code`, `menu_name`, `menu_price`, `orderable_status` 네 컬럼을 모두 `set`에 넣는다. 이 프로젝트의 `Menu`에는 바뀐 컬럼만 보내게 하는 설정이 없고, 변경 감지는 "바뀐 엔티티"를 찾을 뿐 "바뀐 컬럼"만 골라 보내지는 않는다는 뜻이다.

## 6. 네 기능은 어떤 순서로 이어질까?

한 번의 수정 요청 안에서 기능이 동작하는 순서를 `modifyMenuName` 기준으로 정리하면 아래와 같다.

| 순서 | 코드 | 영속성 컨텍스트에서 일어나는 일 |
|---|---|---|
| 1 | `manager.find(...)` | DB에서 읽어 1차 캐시에 보관하고 스냅샷을 저장한다 |
| 2 | `foundMenu.setMenuName(...)` | 객체의 값만 바뀐다. 아직 SQL은 없다 |
| 3 | `transaction.commit()` | flush가 자동 실행되어 스냅샷과 비교하고 UPDATE를 만든다 |
| 4 | flush 마무리 | 쓰기 지연 저장소의 SQL이 DB로 전송된 뒤 commit된다 |

flush가 호출되는 시점은 `section02` 주석에 세 가지로 나와 있다.

| 시점 | 호출 방식 |
|---|---|
| `transaction.commit()` 호출 | 자동 |
| `manager.flush()` 직접 호출 | 수동 |
| JPQL 쿼리 실행 직전 | 자동 (JPQL은 DB에서 조회하므로 변경 내용을 먼저 반영한다) |

## 7. 직접 실행하면 어떻게 나올까?

`section02`를 `1번 메뉴`를 기준으로 실행한 결과이다. 가운데 SELECT 구문은 컬럼 목록을 줄였고, 객체 해시값은 실행마다 달라진다.

**영속 상태 확인 (2번): 1차 캐시와 동일성**

```text
===== 첫 번째 조회 =====
Hibernate:
    select ... from tbl_menu m1_0 where m1_0.menu_code=?
===== 두 번째 조회 =====
foundMenu.hashCode() = 343594171
newMenu.hashCode()   = 343594171
foundMenu == newMenu : true
```

**비영속 상태 확인 (1번): 값이 같아도 다른 객체**

```text
foundMenu = Menu(menuCode=1, menuName=열무김치라떼, menuPrice=4500, categoryCode=8, orderableStatus=Y)
newMenu   = Menu(menuCode=1, menuName=열무김치라떼, menuPrice=4500, categoryCode=8, orderableStatus=Y)
foundMenu == newMenu : false
foundMenu 는 영속 상태인가? true
newMenu 는 영속 상태인가? false
```

**준영속 상태 확인 (3번): 영속 엔티티만 UPDATE**

두 메뉴의 가격을 모두 올렸지만 `===== flush =====` 아래에는 UPDATE가 한 번만 나왔다. 가격 변경 코드는 flush보다 먼저 실행되었으므로 쓰기 지연도 함께 확인된다.

```text
1번 메뉴는 영속 상태인가? true
2번 메뉴는 영속 상태인가? false
===== flush =====
Hibernate:
    update tbl_menu
    set category_code=?, menu_name=?, menu_price=?, orderable_status=?
    where menu_code=?
```

**삭제 상태 확인 (4번): remove 후 조회하면 null**

```text
삭제한 엔티티 객체 = Menu(menuCode=1, ...)
다시 조회한 결과 = null
삭제한 엔티티는 영속 상태인가? false
===== flush =====
Hibernate:
    delete from tbl_menu where menu_code=?
```

**병합 확인 (5번): merge는 SELECT 후 새 객체를 반환**

```text
===== merge =====
Hibernate:
    select ... from tbl_menu m1_0 where m1_0.menu_code=?
detachMenu.hashCode() = 1199044382
mergedMenu.hashCode() = 728153884
detachMenu == mergedMenu : false
detachMenu 는 영속 상태인가? false
mergedMenu 는 영속 상태인가? true
mergedMenu.getMenuName() = TESTNAME
===== flush =====
Hibernate:
    update tbl_menu set ... where menu_code=?
```

| 확인한 내용 | 결과 |
|---|---|
| 같은 PK를 같은 매니저에서 두 번 `find()` | SELECT 1번, `==`은 `true` |
| 값이 같은 `new` 객체 | `==`은 `false`, 영속 아님 |
| `detach()`한 엔티티의 값 변경 | UPDATE 안 나감 |
| `remove()`한 뒤 `find()` | `null`, DELETE는 flush 때 전송 |
| `merge()` | `===== merge =====` 직후 SELECT, 반환 객체만 영속 |
| 3~5번 실행 후 1번 메뉴 | 삭제 테스트 뒤에도 다시 조회됨 (rollback으로 DB 유지) |

앞선 글에서 `(확인 필요)`로 남겨 둔 "`merge()` 시점에 SELECT가 나갈 것"이라는 추정도 이 출력으로 확인된다.

## 8. 헷갈리기 쉬운 점

| 오해 | 실제 |
|---|---|
| `flush()`를 하면 영속성 컨텍스트가 비워진다 | 비워지지 않는다. 1차 캐시는 그대로 유지된다. 비우는 것은 `clear()`이다 |
| `flush()`는 commit이다 | SQL을 전송할 뿐이다. 그 뒤에 `rollback()`하면 취소된다 |
| `persist()`를 호출하면 INSERT가 바로 나간다 | 쓰기 지연 저장소에 등록되고, flush 때 전송된다 |
| `merge()`에 넘긴 객체가 영속이 된다 | 값이 복사된 다른 객체가 반환되고, 영속이 되는 쪽은 반환값이다 |

`modifyMenuName`과 `removeMenu`는 commit 뒤에 `manager.find()`를 한 번 더 호출한다. 이 호출이 DB로 가는지 1차 캐시에서 끝나는지는 데이터를 실제로 바꾸는 예제라 실행하지 않았다(확인 필요).

## 정리

1. 영속성 컨텍스트는 엔티티 매니저 안에서 엔티티를 보관하고, 매니저를 닫으면 함께 끝난다.
2. 1차 캐시와 동일성 보장은 조회에서, 쓰기 지연과 변경 감지는 수정에서 나타나며, 모두 flush 시점과 연결된다.
3. 이 기능들은 영속 상태의 엔티티에만 적용되므로, 엔티티가 지금 어떤 상태인지를 먼저 구분해야 동작을 예측할 수 있다.

다음에는 데이터를 바꾸는 `section01`의 등록·수정·삭제를 테스트 데이터로 실행해서, 남은 `(확인 필요)` 항목을 지워 나갈 예정이다.

## 더 학습하면 좋은 개념

- **플러시 모드(FlushModeType)** — JPQL 실행 직전 자동 flush의 조건을 알면 SQL이 나가는 시점을 정확히 예측할 수 있다.
- **`@DynamicUpdate`** — 실행 결과에서 UPDATE가 모든 컬럼을 포함했다. 바뀐 컬럼만 보내게 하는 방법과 그 비용을 알아 두면 컬럼이 많은 엔티티를 설계할 때 판단 기준이 생긴다. (확인 필요)
- **트랜잭션 범위와 영속성 컨텍스트 범위** — Spring이 트랜잭션 단위로 컨텍스트를 관리하는 방식과 이 글의 직접 생성 방식을 비교하면 `@Transactional`의 역할이 보인다. (확인 필요)
- **N+1 문제와 지연 로딩** — 1차 캐시는 PK 조회에서만 효과가 있다. 연관 관계를 조회할 때 캐시가 왜 도움이 안 되는지 이해하려면 먼저 알아야 한다. (확인 필요)
- **엔티티 동일성과 동등성(`equals`, `hashCode`)** — `==`이 보장되는 범위가 컨텍스트 안으로 한정된다는 점이, 컨텍스트 밖에서 비교 기준을 정해야 하는 이유로 이어진다.

## 참고 자료

- [Jakarta Persistence 공식 사이트](https://jakarta.ee/specifications/persistence/)
- [Jakarta Persistence 3.2 API - EntityManager](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html)
- [Hibernate ORM User Guide - Persistence Context](https://docs.hibernate.org/orm/current/userguide/html_single/Hibernate_User_Guide.html#pc)
- [Hibernate ORM User Guide - Flushing](https://docs.hibernate.org/orm/current/userguide/html_single/Hibernate_User_Guide.html#flushing)
