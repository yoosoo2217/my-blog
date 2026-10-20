---
title: "MVC 계층 규칙을 지키며 리뷰 기능 만들기: Service는 결과를 enum으로 돌려준다"
date: 2026-10-20
tags:
  - Java
  - SQL
---

"이미 리뷰를 작성한 가게입니다" 같은 안내 문구는 어느 계층이 정해야 할까?  
팀 프로젝트의 평가 기준은 `DAO에 System.out`, `Controller에 SQL` 같은 계층 규칙 위반을 중점으로 본다. 그런데 리뷰 작성(F-07)에는 실패 이유가 여섯 가지나 있었다. DAO는 출력할 수 없고, Service도 `System.out`을 쓸 수 없다.  
맛집 리뷰 콘솔 프로그램에서 리뷰 작성, 상세 조회, 내 리뷰 수정·삭제를 맡아 만들면서 이 문제를 푼 과정을 정리했다. 개념 자체는 [Java MVC 패키지 구조 글]({{ site.baseurl }}/java-mvc-package-responsibility.html)에서 다뤘고, 이 글은 그것을 실제 기능에 적용한 기록이다.

> **TL;DR**
> - Service가 결과를 `enum`으로 돌려주고 View가 그 값을 문구로 바꾸면, Service에는 `Scanner`와 `System.out`이 없고 DAO에는 SQL만 남는다.
> - 평균 별점은 `LEFT JOIN` + `GROUP BY`로 한 번에 구한다. 리뷰가 없으면 `AVG`가 `NULL`이 되는데, 이것을 "평점 없음"으로 연결했다.
> - 수정·삭제는 SQL의 `WHERE`에 `member_id`를 같이 걸어서 남의 리뷰는 DB 단계에서 막았다.

환경: Java, MySQL 8.0, JDBC. 로컬에서 `javac`/`java`로 직접 실행했고 JDK는 OpenJDK 27, 드라이버는 Connector/J 8.4.0이었다. `build.gradle`에 선언된 드라이버는 9.1.0이다.  
코드는 실제 프로젝트 코드에서 가져왔고, 길이 때문에 일부를 줄였다. 실행 결과는 로컬 MySQL에 연결해서 실제로 돌린 출력이다.

## 1. 문제: 결과 메시지를 어디서 정할까?

기능 하나가 지나가는 길은 다음과 같다.

```text
메뉴 선택
  → ReviewController   : 흐름 제어
      → ReviewInputView  : 가게 번호, 별점, 내용 입력
      → ReviewService    : 검증, 중복 확인
          → ReviewDAO    : SQL 실행
      → ReviewOutputView : 결과 문구 출력
```

각 계층이 할 수 있는 일과 하면 안 되는 일은 아래처럼 나눴다.

| 계층 | 리뷰 기능에서 하는 일 | 하면 안 되는 일 |
|---|---|---|
| `ReviewInputView` | 가게 번호·별점·내용 입력받기 | SQL 실행, 업무 판단 |
| `ReviewController` | 로그인 회원 번호 붙이기, View와 Service 연결 | SQL 작성 |
| `ReviewService` | 별점 범위 검사, 중복 확인, 오류 코드 해석 | `Scanner`, `System.out` |
| `ReviewDAO` | SQL 실행, `ResultSet` → DTO 변환 | 사용자 입출력 |
| `ReviewOutputView` | 결과 문구 출력 | DB 접근 |

문제는 Service가 "별점이 범위를 벗어났다", "이미 쓴 리뷰가 있다"는 **사실은 알지만 화면에 출력할 수는 없다**는 점이다.

## 2. Service가 결과를 enum으로 돌려주기 (F-07)

반환 방식을 네 가지로 비교했다.

| 방식 | 장점 | 한계 |
|---|---|---|
| 문구(`String`) 반환 | 가장 단순하다 | Service가 화면 문구를 알게 되어 입출력 분리가 깨진다 |
| `boolean` 반환 | 코드가 짧다 | 별점 오류, 중복, 없는 가게를 구분할 수 없다 |
| 예외 던지기 | 성공 경로가 깔끔하다 | 실패 이유마다 `catch`가 필요하다 |
| `enum` 반환 (선택) | 이유를 구분하고, 문구는 View가 정한다 | 결과가 늘면 `enum`과 View의 `switch`를 같이 고친다 |

실패 이유가 여섯 가지로 정해져 있고 모두 "정상적으로 일어날 수 있는 결과"라서 `enum`으로 모으는 쪽을 택했다.

```java
public enum WriteResult {
    SUCCESS, INVALID_INPUT, INVALID_RATING, ALREADY_REVIEWED, RESTAURANT_NOT_FOUND, DB_ERROR
}
```

Service는 검증하고, DB 오류는 MySQL 오류 코드로 구분한다.

```java
public WriteResult writeReview(ReviewDTO review) {
    if (review.getRating() < 1 || review.getRating() > 5) {
        return WriteResult.INVALID_RATING;
    }
    if (review.getContent() == null || review.getContent().isBlank()) {
        return WriteResult.INVALID_INPUT;
    }
    try {
        if (reviewDAO.existsByMemberAndRestaurant(review.getMemberId(), review.getRestaurantId())) {
            return WriteResult.ALREADY_REVIEWED;
        }
        reviewDAO.insert(review);
        return WriteResult.SUCCESS;
    } catch (SQLException e) {
        return switch (e.getErrorCode()) {
            case 1452 -> WriteResult.RESTAURANT_NOT_FOUND;  // 참조할 가게가 없음
            case 1062 -> WriteResult.ALREADY_REVIEWED;      // UNIQUE 위반
            default -> WriteResult.DB_ERROR;
        };
    }
}
```

문구는 `OutputView`가 `switch`로 정한다.

```java
public void printWriteResult(WriteResult result) {
    switch (result) {
        case SUCCESS -> System.out.println("리뷰 등록 완료");
        case ALREADY_REVIEWED -> System.out.println("이미 리뷰를 작성한 가게입니다");
        // ... 나머지 생략
    }
}
```

**중복을 두 번 막은 이유.** 먼저 `existsByMemberAndRestaurant`로 확인하고 `INSERT`하는데, 두 동작 사이에 같은 회원이 다시 쓰면 확인을 통과해 버린다. 그때는 `review` 테이블의 `UNIQUE (member_id, restaurant_id)`가 `1062` 오류로 막는다. 앞의 확인은 사용자에게 빨리 알려 주려는 용도이고, 마지막 방어선은 DB 제약이다.

## 3. 평균 별점은 SQL에서 구한다 (F-08)

상세 조회는 가게 정보, 평균 별점, 리뷰 수, 최신 리뷰 10개를 보여준다. 쿼리를 둘로 나눴다.

```java
String sql = "SELECT r.restaurant_id, r.member_id, r.name, r.address, r.region, r.category, r.created_at, "
        + "AVG(v.rating) AS avg_rating, COUNT(v.review_id) AS review_count "
        + "FROM restaurant r LEFT JOIN review v ON r.restaurant_id = v.restaurant_id "
        + "WHERE r.restaurant_id = ? "
        + "GROUP BY r.restaurant_id, r.member_id, r.name, r.address, r.region, r.category, r.created_at";
```

**왜 `JOIN`이 아니라 `LEFT JOIN`일까?** `JOIN`은 리뷰가 없는 가게의 행을 지워 버린다. 그러면 존재하는 가게인데도 "존재하지 않는 가게입니다"가 나온다. `LEFT JOIN`은 가게 행을 남기고, 리뷰가 없으면 `AVG`가 `NULL`이 된다. 이 `NULL`을 `Double avgRating = null`로 받아서 View에서 "평점 없음"으로 출력했다.

```java
restaurant.setAvgRating(rs.getObject("avg_rating") == null ? null : rs.getDouble("avg_rating"));
```

`getDouble()`은 `NULL`이면 `0.0`을 돌려주기 때문에, `getObject()`로 먼저 `NULL`인지 확인해야 한다.

**왜 리뷰 목록은 별도 쿼리일까?** 목록은 `LIMIT 10`으로 최신 10개만 가져온다. 집계 쿼리에 `LIMIT`을 섞으면 평균이 10개만으로 계산된다. 평균은 전체 리뷰 기준이어야 하므로 쿼리를 나눴다.

## 4. 내 리뷰만 바꾸게 하기 (F-09)

수정·삭제 SQL에는 리뷰 번호와 함께 `member_id`를 조건으로 걸었다.

```java
String sql = "UPDATE review SET rating = ?, content = ? WHERE review_id = ? AND member_id = ?";
return pstmt.executeUpdate();   // 반영된 행 수. 남의 리뷰면 0
```

`executeUpdate()`가 `0`을 돌려주면 "내 리뷰가 아니거나 없는 리뷰"로 처리한다.  
Service에서도 먼저 내 리뷰 목록에 그 번호가 있는지 확인한다. 이 확인은 사용자에게 "본인 리뷰만 선택할 수 있습니다"를 알려 주려는 것이고, SQL의 조건이 어긋났을 때 남의 데이터를 바꾸는 일을 막는 마지막 방어선이다.

## 5. 시행착오

**① 존재하지 않는 회원으로 테스트해서 "존재하지 않는 가게"가 나왔다.** 샘플 데이터의 회원은 4명뿐인데 5번 회원으로 로그인한 상태로 리뷰를 썼다. 1번 가게가 분명히 있는데도 "존재하지 않는 가게입니다"가 나와서 한참 헤맸다. `1452`는 "외래키가 가리키는 행이 없다"는 뜻이고, **오류 코드만으로는 어느 외래키 때문인지 구분할 수 없다.** (오류 메시지 문자열에는 제약조건 이름이 들어 있는 것으로 안다. `확인 필요`) 여기서는 회원이 없는 것이 원인이었다. 실제 프로그램에서는 로그인한 회원이 항상 존재하니 문제없지만, 테스트 데이터를 만들 때는 주의해야 한다.

**② `No suitable driver found`.** Git Bash에서 `java -cp`에 `/c/Users/...` 형태의 경로를 넘겼더니 드라이버 jar를 못 찾았다. Windows용 `java`는 `C:\...` 형태를 기대한다. `cygpath -w`로 경로를 바꾸니 해결됐다. 코드나 드라이버 문제로 오해하기 쉬운 오류였다.

**③ 입력을 파이프로 넣다가 줄이 밀렸다.** 테스트를 자동화하려고 입력을 파일로 넘겼는데, 잘못된 별점을 넣은 다음에 "새 리뷰 내용" 입력 줄을 빼먹었다. 뒤의 입력이 한 칸씩 밀려서 엉뚱한 메뉴가 선택됐다. 앱 문제가 아니라 시나리오의 입력 줄 수가 틀린 것이었다.

## 6. 결과

실제로 로컬 MySQL에서 실행한 결과다. 리뷰가 3개인 1번 가게의 평균은 (5 + 5 + 4) ÷ 3 = 4.67이고 화면에는 소수 첫째 자리까지 `★4.7`로 나온다.

| 기능 | 입력 | 화면 |
|---|---|---|
| F-07 | 1번 가게에 첫 리뷰 | `리뷰 등록 완료` |
| F-07 | 같은 가게에 다시 작성 | `이미 리뷰를 작성한 가게입니다` |
| F-07 | 별점 7 | `별점은 1~5의 정수만 입력할 수 있습니다` |
| F-07 | 없는 99번 가게 | `존재하지 않는 가게입니다` |
| F-08 | 리뷰 3개인 1번 가게 | `평균 ★4.7 (리뷰 3개)` |
| F-08 | 리뷰가 없는 3번 가게 | `평점 없음`, `작성된 리뷰가 없습니다` |
| F-09 | 남의 리뷰 번호 선택 | `본인 리뷰만 선택할 수 있습니다` |
| F-09 | 별점 4, 새 내용으로 수정 | `수정 완료` (목록에서 ★5 → ★4 확인) |
| F-09 | 삭제에서 `N` / `y` | `취소되었습니다` / `삭제 완료` |

테스트로 넣은 리뷰는 매번 지워서 DB는 샘플 데이터 상태(리뷰 6건)로 돌려놨다.

배운 점은 두 가지다. 계층 규칙을 지키면 "이 문구는 누가 정하지?"가 코드 구조에서 바로 답이 나온다. 그리고 DB 제약(`UNIQUE`, 외래키)은 애플리케이션 검사가 놓친 경우를 막아 주는 마지막 방어선이라, 오류 코드를 해석하는 코드까지 같이 설계해야 한다.

## 더 학습하면 좋은 개념

- **예외 설계(checked / unchecked)** — 이 글에서는 `SQLException`을 Service에서 잡아 `enum`으로 바꿨다. 예외를 그대로 던지는 설계와 비교하면 계층 간 책임이 더 선명해진다.
- **트랜잭션(`commit` / `rollback`)** — F-07은 `INSERT` 한 번이라 필요 없었다. 여러 테이블을 함께 바꿔야 하는 기능(예: 대여 등록 + 재고 수정)에서 필요해진다. 개념은 [MySQL 트랜잭션 글]({{ site.baseurl }}/mysql-transaction.html)에 정리했다.
- **`GROUP BY`와 `ONLY_FULL_GROUP_BY`** — 이 글의 집계 쿼리는 `SELECT`한 컬럼을 모두 `GROUP BY`에 적었다. MySQL이 왜 이것을 요구하는지 이해하면 집계 쿼리 오류를 읽기 쉬워진다.
- **UNIQUE 제약과 동시성** — "확인 후 저장"이 왜 한 번으로는 부족한지, 경쟁 상태(race condition)와 함께 보면 좋다.
- **SQL 인젝션과 `PreparedStatement`** — 이 글의 모든 SQL이 `?`를 쓴다. 이유는 [PreparedStatement 글]({{ site.baseurl }}/jdbc-preparedstatement-executeupdate.html)에 정리했다.

## 참고 자료

- [MySQL 공식 문서 - Server Error Message Reference (1062, 1452)](https://dev.mysql.com/doc/mysql-errors/8.0/en/server-error-reference.html)
- [MySQL 공식 문서 - Aggregate Functions](https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html)
- [MySQL 공식 문서 - MySQL Handling of GROUP BY](https://dev.mysql.com/doc/refman/8.0/en/group-by-handling.html)
- [Java SE 문서 - SQLException](https://docs.oracle.com/en/java/javase/17/docs/api/java.sql/java/sql/SQLException.html)
