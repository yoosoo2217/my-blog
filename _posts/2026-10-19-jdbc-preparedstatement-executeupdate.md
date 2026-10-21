---
title: "JDBC PreparedStatement 조회와 수정"
date: 2026-10-19
tags:
  - Java
  - SQL
---

`Statement`로 메뉴를 조회할 때는 SQL 문자열에 입력값을 `"'" + menuName + "'"`처럼 이어 붙였다.  
따옴표 하나만 빠져도 오류가 나고, 입력값에 따라 SQL 자체가 바뀔 수 있다는 한계도 있었다.  
`PreparedStatement`의 `?`(placeholder)로 값을 따로 채우는 방법, SQL을 XML 파일로 분리하는 방법, `INSERT`/`UPDATE`/`DELETE`에 쓰는 `executeUpdate()`까지 실습 코드 4개로 정리했다.  
앞 단계는 [Statement와 ResultSet 글]({{ site.baseurl }}/jdbc-statement-resultset-dto.html)에서 다뤘다.

> **TL;DR**
> - `PreparedStatement`는 SQL의 값 자리를 `?`로 비워 두고 `setXxx(번호, 값)`으로 채운다. 문자열 이어 붙이기가 필요 없다.
> - 조회(`SELECT`)는 `executeQuery()`로 `ResultSet`을 받고, 수정(`INSERT`/`UPDATE`/`DELETE`)은 `executeUpdate()`로 영향받은 행의 수(`int`)를 받는다.
> - 실습 코드에 `setString(1, "menuName")`처럼 변수가 아닌 문자열을 넣은 실수가 있었다. 에러 없이 결과만 비는 버그라 찾기 어려웠다.

환경: Java, MySQL(`TBL_MENU`), MySQL Connector/J, 직접 만든 `JDBCTemplate`(`getConnection()`, `close()`) 사용. 정확한 버전은 `확인 필요`.  
예제의 `static void main(String[] args)`는 `public` 없이 쓴 형태라 최신 Java에서만 실행된다. 사용한 Java 버전 확인이 필요하다(`확인 필요`).  
코드는 실습 때 작성한 것이고, 출력 결과는 코드를 따라가며 적었다. 실행 결과를 캡처한 것이 아니다.

## 0. JDBC는 Java와 DB 사이에서 무엇을 할까?

수업 판서를 다시 그리면 이렇다. JDBC는 Java 애플리케이션과 DB(MySQL)를 연결해 주는 API이고, 실제 연결은 `build.gradle`로 추가한 드라이버가 맡는다. 드라이버가 `url`, `user`, `password`로 DB에 연결하면 `Connection`이 만들어지고, 그 위로 SQL을 보내 결과를 돌려받는다.

![JDBC Intro 판서: Application의 JDBC가 드라이버와 Connection을 거쳐 MySQL(menudb)과 연결되는 그림]({{ site.baseurl }}/assets/img/jdbc-intro-overview.png)

`Statement`, `PreparedStatement`, `ResultSet`, `Connection`이 이 흐름에서 가장 자주 쓰는 타입이다.

## 1. Statement 대신 PreparedStatement를 쓰는 이유

| 비교 기준 | `Statement` | `PreparedStatement` |
|---|---|---|
| 값 넣는 방법 | SQL 문자열에 변수를 이어 붙인다 | `?` 자리에 `setXxx()`로 채운다 |
| 문자열 따옴표 | 직접 `'`를 붙여야 한다 | 자동으로 처리된다 |
| SQL 구조 | 입력값이 SQL 구조를 바꿀 수 있다 | 값은 값으로만 취급된다 |
| 같은 SQL 반복 | 매번 SQL 전체를 전송한다 | 틀을 재사용할 수 있다 (아래 참고) |

실습 때 받아 적은 설명은 이랬다. `Statement`는 실행할 때마다 DB가 SQL을 파싱하고 컴파일하지만, `PreparedStatement`는 같은 SQL을 다시 요청하면 처음 컴파일한 것을 재사용해서 빨라진다.  
다만 **이 성능 이점은 DB와 드라이버 설정에 따라 다르다.** MySQL Connector/J는 기본 설정에서 `PreparedStatement`를 클라이언트 쪽에서 처리하는 것으로 알고 있어서, 위 설명이 그대로 적용되는지는 `확인 필요`하다(공식 문서의 `useServerPrepStmts` 옵션 참고).  
성능보다 확실한 이유는 값을 SQL과 분리해서 문자열 연결의 번거로움과 SQL 조작 위험을 줄이는 것이다.

## 2. 전체 조회: Statement와 거의 같다 (Application01)

```java
Connection con = getConnection();
PreparedStatement pstmt = null;
ResultSet rset = null;

try {
    pstmt = con.prepareStatement("SELECT * FROM TBL_MENU");
    rset = pstmt.executeQuery();

    while (rset.next()) {
        System.out.println(
                rset.getString("MENU_NAME") + " 은/는 "
                        + rset.getString("MENU_PRICE") + "원 입니다. ");
    }
} catch (SQLException e) {
    throw new RuntimeException(e);
} finally {
    close(con);
    close(rset);
    close(pstmt);
}
```

차이는 두 가지다. SQL을 `executeQuery()`가 아니라 `prepareStatement(sql)`에 먼저 넘기고, `executeQuery()`에는 인자가 없다.  
`rset.next()`는 다음 행이 있으면 `true`, 없으면 `false`를 돌려주므로 `while`로 한 행씩 읽는다.

`PreparedStatement`는 `Statement`를 상속한 인터페이스라서 `close()`, `executeQuery()` 같은 기본 기능을 그대로 물려받는다. 그래서 `Statement` 타입으로 다루든 `PreparedStatement` 타입으로 다루든 같은 객체 하나를 닫는 것이다. `Statement`를 닫으면 `PreparedStatement`도 따라 닫히는 것이 아니라, 둘이 원래 같은 객체를 가리키는 것이다. 이 객체가 닫히면 딸린 `ResultSet`도 함께 닫힌다.

> 닫는 순서에 주의할 점이 있다. 위 코드는 `con` → `rset` → `pstmt` 순으로 닫는다. 자원은 **만든 순서의 반대**(`rset` → `pstmt` → `con`)로 닫는 것이 일반적인 관례다. `Connection`을 먼저 닫으면 그에 딸린 자원도 함께 닫히는 것으로 알고 있지만 `확인 필요`하고, 어느 쪽이든 관례대로 쓰는 편이 안전하다.

## 3. placeholder: ?에 값 채우기 (Application02)

```java
pstmt = con.prepareStatement(
        "SELECT MENU_CODE, MENU_PRICE, ORDERABLE_STATUS FROM TBL_MENU WHERE MENU_NAME = ? ");
pstmt.setString(1, menuName);
rset = pstmt.executeQuery();
```

- `?`는 값이 들어갈 위치를 잡아 두는 자리표시자다.
- `setString(parameterIndex, 값)`의 번호는 **1부터** 시작하고, `?`가 나온 순서를 따른다.
- `?`는 실행 전에 반드시 `setXxx()`로 모두 채워야 한다. 비어 있으면 `SQLException`이 난다.
- `setXxx()`의 반환 타입은 `void`다. 값을 채울 뿐 돌려받는 것이 없어서 변수에 담지 않는다.

처음에는 `setString(1, menuName)`의 `1`이 "`menuName`의 첫 번째 글자"인지 헷갈렸다. **`1`은 문자열의 위치가 아니라, SQL 안에서 첫 번째로 나오는 `?`의 번호**다. 값(`menuName`)과 자리(`1`)를 짝지어 주는 호출이라고 읽으면 된다.

### 겪은 실수: 변수 대신 문자열을 넣었다

처음 작성한 코드는 이랬다.

```java
pstmt.setString(1, "menuName");   // 변수 menuName이 아니라 문자열 "menuName"
```

따옴표 때문에 사용자가 입력한 값이 아니라 글자 그대로 `menuName`이라는 메뉴를 찾게 된다. 문법 오류도 예외도 없고 `rset.next()`가 `false`라서 **아무것도 출력되지 않을 뿐**이다.  
"입력은 맞는데 결과가 안 나온다"면 SQL보다 먼저 `setXxx()`에 넘긴 값이 변수인지 확인하면 된다. 올바른 코드는 `pstmt.setString(1, menuName);`이다.

## 4. 긴 SQL은 XML 파일로 분리한다 (Application03)

한 줄짜리 SQL은 문자열로 써도 괜찮다. 하지만 `JOIN`이나 긴 `WHERE`가 붙으면 문자열을 `+`로 이어 붙이는 코드가 금방 읽기 어려워진다. 그래서 SQL을 XML 파일로 빼고, 코드에서는 `key`로 꺼내 쓴다.

`menu-query.xml`:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">

<properties>
    <entry key="findMenuByMenuName">
        SELECT * FROM TBL_MENU WHERE MENU_NAME = ?
    </entry>

    <entry key="modifyMenuPriceByMenuName">
        UPDATE TBL_MENU SET MENU_PRICE = ? WHERE MENU_NAME = ?
    </entry>
</properties>
```

`DOCTYPE`을 `properties`로 선언하면 이 파일을 `java.util.Properties`로 읽을 수 있다.  
Java에서는 이렇게 읽는다.

```java
Properties prop = new Properties();
prop.loadFromXML(new FileInputStream(
        "src/main/java/com/wanted/b_preparedstatements/menu-query.xml"));

String query = prop.getProperty("findMenuByMenuName");
pstmt = con.prepareStatement(query);
pstmt.setString(1, menuName);
rset = pstmt.executeQuery();
```

조회된 한 행은 DTO에 담는다.

```java
if (rset.next()) {
    menu = new MenuDTO();
    menu.setMenuCode(rset.getInt("MENU_CODE"));
    menu.setMenuName(rset.getString("MENU_NAME"));
    menu.setMenuPrice(rset.getInt("MENU_PRICE"));
    menu.setCategoryCode(rset.getInt("CATEGORY_CODE"));
    menu.setOrderableStatus(rset.getString("ORDERABLE_STATUS").charAt(0));
}
```

- `ORDERABLE_STATUS`는 `Y`/`N` 문자열이라 `charAt(0)`으로 첫 글자만 꺼내 `char`에 담았다. 이 컬럼이 NULL이면 `NullPointerException`이 날 수 있다(`확인 필요`: 컬럼 제약).
- 이 방식의 이점은 SQL을 고칠 때 Java 코드를 다시 컴파일하지 않고 XML만 고치면 된다는 점이다. 단점은 파일 경로가 틀리면 `FileNotFoundException`이 나는 점이다. 실습에서는 상대 경로 `src/main/java/...`를 썼는데, 실행 위치에 따라 못 찾을 수 있다.
- 예외가 4개 갈래(`SQLException`, `FileNotFoundException`, `InvalidPropertiesFormatException`, `IOException`)로 잡혀 있지만 모두 `IOException`의 하위 타입이거나 같은 처리라서, 처리 방식이 같다면 `IOException` 하나로 묶어도 된다.

## 5. 조회와 수정은 실행 메서드가 다르다 (Application04)

CRUD 중 조회(Read)는 `SELECT`이고, 나머지 `INSERT`(Create), `UPDATE`, `DELETE`는 **DML**(데이터 조작 언어)이다.

| 구분 | 실행 메서드 | 반환 | `ResultSet` |
|---|---|---|---|
| `SELECT` | `executeQuery()` | `ResultSet` | 필요하다 |
| `INSERT` / `UPDATE` / `DELETE` | `executeUpdate()` | `int` (영향받은 행의 수) | 필요 없다 |

```java
String query = prop.getProperty("modifyMenuPriceByMenuName");
pstmt = con.prepareStatement(query);
pstmt.setInt(1, price);          // 첫 번째 ? : 새 가격
pstmt.setString(2, menuName);    // 두 번째 ? : 메뉴 이름

int result = pstmt.executeUpdate();
```

`UPDATE ... SET MENU_PRICE = ? WHERE MENU_NAME = ?`에서 `?`의 순서는 SQL에 나오는 순서다. 가격이 1번, 이름이 2번이다. 순서를 바꿔 넣으면 타입이 맞지 않아 오류가 난다.

결과는 이렇게 판단한다.

```java
if (result > 0) {
    System.out.println(menuName + " 메뉴 가격 수정 성공! (영향 받은 행 : " + result + ")");
} else {
    System.out.println(menuName + " 메뉴 가격 변경 실패. 메뉴 이름 재확인 필요");
}
```

`result`가 `0`이면 SQL은 오류 없이 실행됐지만 조건(`WHERE`)에 맞는 행이 없었다는 뜻이다. 메뉴 이름을 잘못 입력한 경우가 여기에 해당한다. 예외가 나지 않아도 실패일 수 있으므로 **영향받은 행의 수를 꼭 확인**한다.

### 코드에서 고칠 곳

- `Scanner`로 `nextInt()`를 쓴 뒤에 `nextLine()`을 이어서 쓰면 줄바꿈이 남아 입력이 건너뛰어질 수 있다. 이 코드는 `nextLine()` 다음에 `nextInt()`를 써서 문제가 없었지만, 순서가 바뀌면 문제가 된다(`확인 필요`).
- 성공/실패 메시지의 띄어쓰기가 한쪽은 `menuName + " 메뉴 ..."`, 다른 쪽은 `menuName + "메뉴 ..."`로 달랐다. 출력 문구는 일관되게 맞추는 편이 좋다.

## 6. 정리

- `PreparedStatement`는 `?`와 `setXxx(번호, 값)`으로 값을 SQL과 분리한다. 번호는 1부터, 순서는 `?`가 나온 순서다.
- 조회는 `executeQuery()`(`ResultSet`), 수정은 `executeUpdate()`(영향받은 행의 수)를 쓴다. 수정 후에는 `result > 0`인지 확인한다.
- 이번에 막혔던 곳은 `setString(1, "menuName")`에 문자열을 넣은 실수, 닫는 순서, XML 파일 경로였다.

다음에는 `try-with-resources`로 `close()`를 자동화하는 것과, `INSERT`/`DELETE` 실습을 보면 좋다.

## 더 학습하면 좋은 개념

- **SQL 인젝션(SQL Injection)** — 입력값이 SQL 구조를 바꾸는 공격이다. `?`를 쓰는 가장 큰 이유이므로 `Statement` 방식과 비교해 보면 차이가 선명해진다.
- **try-with-resources** — `finally`에서 `close()`를 손으로 호출하는 대신 블록이 끝날 때 자동으로 닫는다. 이 실습 코드의 닫는 순서 문제를 구조적으로 없앤다.
- **Properties와 설정 분리** — SQL뿐 아니라 DB 접속 정보도 파일로 분리하면 코드에 비밀번호를 쓰지 않아도 된다.
- **트랜잭션과 `commit`/`rollback`** — `executeUpdate()`는 기본 설정에서 자동 커밋될 수 있다. 여러 DML을 하나로 묶어야 하는 상황에서 필요하다(`확인 필요`: `autoCommit` 설정).
- **MyBatis** — XML에 SQL을 분리하는 이 방식을 본격적으로 확장한 도구다. 수동으로 해 보면 MyBatis가 줄여 주는 반복이 보인다.

## 참고 자료
- [Oracle - JDBC Basics: Using Prepared Statements](https://docs.oracle.com/javase/tutorial/jdbc/basics/prepared.html)
- [Java SE API - PreparedStatement](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html)
- [Java SE API - Properties (loadFromXML)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Properties.html)
- [MySQL Connector/J - Prepared Statements 관련 설정](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-performance-extensions.html)
