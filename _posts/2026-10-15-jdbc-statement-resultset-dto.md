---
title: "JDBC Statement와 ResultSet으로 조회하기"
date: 2026-10-15
tags:
  - Java
  - SQL
---

`SELECT * FROM TBL_MENU`를 실행해서 콘솔에 메뉴 이름과 가격을 출력하는 것까지는 금방 된다.  
그런데 출력만 하면 그 데이터로 다른 작업을 할 수 없다. 조회 결과를 Java 객체에 옮겨 담아야 정렬하고, 검색하고, 화면에 넘길 수 있다.  
`Statement`와 `ResultSet`으로 쿼리를 실행하는 법부터, 결과를 DTO와 `List`, `Map`에 담는 방법까지 정리했다.  
접속을 담당하는 `JDBCTemplate`은 [앞선 글]({{ site.baseurl }}/jdbc-connection-jdbctemplate.html)에서 만들었다.

> **TL;DR**
> - `Statement`는 SQL을 실행하고, `ResultSet`은 그 결과(행들)를 받는다. `rset.next()`로 한 행씩 이동한다.
> - 조회한 행은 DTO 객체 하나에 담고, 여러 행은 `List<DTO>`(순서대로) 또는 `Map<코드, DTO>`(코드로 바로 조회)에 담는다.
> - SQL에 입력값을 문자열로 이어 붙이면 SQL 조작에 취약하다. 이 글의 코드는 그 한계를 보여 주는 단계다.

환경: Java, MySQL(`menudb`, `employeedb`), MySQL Connector/J. 정확한 버전은 `확인 필요`.  
`main`을 `static void main(String[] args)`처럼 `public` 없이 쓴 예제가 있는데, 이는 최신 Java에서만 실행되는 문법이라 Java 버전 확인이 필요하다(`확인 필요`).  
이 글의 코드는 직접 작성한 코드이고, 결과 출력은 코드를 따라가 적었다.

## 1. JDBC의 핵심 인터페이스 2가지

| 인터페이스 | 역할 | 얻는 방법 |
|---|---|---|
| `Statement` | SQL 쿼리문을 저장하고 실행한다 | `con.createStatement()` |
| `ResultSet` | SQL 실행 결과를 결과집합(표)으로 받는다 | `stmt.executeQuery("SELECT ...")` |

`Connection`처럼 둘 다 인터페이스라서 `new`로 만들 수 없고, 앞 단계 객체의 메서드가 만들어 준다.  
`Connection` → `Statement` → `ResultSet` 순으로 하나씩 만들어진다.

## 2. 메뉴 전체 조회: 쿼리 실행부터 해제까지 (a_statements Application01)

```java
Connection con = getConnection();
Statement stmt = null;
ResultSet rset = null;

try {
    stmt = con.createStatement();
    rset = stmt.executeQuery("SELECT * FROM TBL_MENU");

    while (rset.next()) {
        System.out.println(
                rset.getString("MENU_NAME") + " 은/는 "
                        + rset.getString("MENU_PRICE") + "원 입니다. "
        );
    }
} catch (SQLException e) {
    throw new RuntimeException(e);
} finally {
    close(rset);
    close(stmt);
    close(con);
}
```

흐름은 다음과 같다.

1. `getConnection()`으로 접속한다.
2. `createStatement()`로 SQL을 실행할 객체를 만든다.
3. `executeQuery()`로 `SELECT`를 실행하면 `ResultSet`이 돌려진다.
4. `rset.next()`로 한 행씩 읽는다.
5. `finally`에서 `ResultSet`, `Statement`, `Connection` 순으로 닫는다.

### rset.next()는 어떻게 동작할까?

`ResultSet`은 처음에 **첫 번째 행의 앞**을 가리킨다. `next()`를 부르면 커서가 다음 행으로 움직이고, 행이 있으면 `true`, 더 없으면 `false`를 돌려준다.  
그래서 `while (rset.next())`는 모든 행을 처음부터 끝까지 읽는 반복문이 된다. 행이 하나뿐이거나 없을 수 있는 조회는 `if (rset.next())`를 쓴다.

컬럼 값은 `getString("MENU_NAME")`처럼 컬럼 이름이나 `getInt(1)`처럼 컬럼 번호로 읽는다. 컬럼 타입에 맞는 `getXxx()`를 쓴다.

### 닫는 순서는 만든 순서의 반대로

수업 코드는 `close(con)`을 가장 먼저 부르고 `rset`, `stmt` 순으로 닫았다. 오류 없이 동작하기는 하지만, 연결을 먼저 닫으면 거기서 만든 자원도 같이 닫히는 것으로 알고 있다(`확인 필요`). 나머지 `close` 호출은 `isClosed()` 확인 덕분에 건너뛴다.  
자원은 **만든 순서의 반대(`ResultSet` → `Statement` → `Connection`)**로 닫는 것이 안전하고 읽기에도 자연스럽다. 위 코드는 그 순서로 고쳐 적었다.

## 3. 입력값으로 조회하기 (Application02)

실습 요구사항은 `Scanner`로 메뉴 이름을 받아 그 메뉴의 번호, 가격, 판매 상태를 출력하는 것이었다. (예: `날치알 스크류바의 정보 : 1, 3000원, Y`)

```java
Scanner sc = new Scanner(System.in);
System.out.print("메뉴 이름을 입력하세요 : ");
String menuName = sc.nextLine();

rset = stmt.executeQuery(
        "SELECT MENU_CODE, MENU_PRICE, ORDERABLE_STATUS FROM TBL_MENU WHERE MENU_NAME = '" + menuName + "'"
);

if (rset.next()) {
    System.out.println(
            menuName + "의 정보 : "
                    + rset.getString("MENU_CODE") + ", "
                    + rset.getString("MENU_PRICE") + "원, "
                    + rset.getString("ORDERABLE_STATUS")
    );
}
```

이름이 하나로 정해진 조회라서 `while`이 아니라 `if (rset.next())`로 한 행만 읽는다. 일치하는 메뉴가 없으면 아무것도 출력하지 않는다.

### 이 방식의 한계: 입력값을 문자열로 이어 붙였다

`"... WHERE MENU_NAME = '" + menuName + "'"`는 입력값이 SQL 문장의 일부가 된다.  
사용자가 `' OR '1'='1`을 입력하면 조건이 `MENU_NAME = '' OR '1'='1'`이 되어 **모든 행이 조건에 맞는다.** 이것이 SQL 인젝션(SQL Injection)의 가장 단순한 형태다.  
입력값을 SQL과 분리해서 전달하는 `PreparedStatement`로 해결할 수 있고, 이 내용은 다음에 정리한다.

## 4. 조회 결과를 객체로: DTO (Application03)

DTO(Data Transfer Object)는 **데이터를 담아 옮기는 용도의 객체**다. 테이블의 한 행이 DTO 객체 하나에 대응한다.  
수업에서 정리한 DTO의 기본 구성은 5가지다.

1. 필드 (컬럼에 대응)
2. 기본 생성자
3. 모든 필드를 초기화하는 생성자
4. Getter / Setter
5. `toString()`

```java
public class MenuDTO {
    private int menuCode;
    private String menuName;
    private int menuPrice;
    private int categoryCode;
    private char orderableStatus;

    public MenuDTO() {}

    public MenuDTO(int menuCode, String menuName, int menuPrice, int categoryCode, char orderableStatus) {
        this.menuCode = menuCode;
        this.menuName = menuName;
        this.menuPrice = menuPrice;
        this.categoryCode = categoryCode;
        this.orderableStatus = orderableStatus;
    }

    // Getter, Setter, toString() ... 생략
}
```

DB의 컬럼 타입과 Java 필드 타입이 이렇게 짝을 이룬다.

| 컬럼 | Java 필드 | `ResultSet`에서 읽는 메서드 |
|---|---|---|
| `MENU_CODE` | `int` | `getInt()` |
| `MENU_NAME` | `String` | `getString()` |
| `ORDERABLE_STATUS` (`Y`/`N`) | `char` | `getString().charAt(0)` |

한 행을 DTO에 담는 코드는 이렇다.

```java
MenuDTO menu = null;

if (rset.next()) {
    menu = new MenuDTO();
    menu.setMenuCode(rset.getInt("MENU_CODE"));
    menu.setMenuName(rset.getString("MENU_NAME"));
    menu.setMenuPrice(rset.getInt("MENU_PRICE"));
    menu.setCategoryCode(rset.getInt("CATEGORY_CODE"));
    menu.setOrderableStatus(rset.getString("ORDERABLE_STATUS").charAt(0));
}
```

### 실수하기 쉬운 지점: SELECT에 없는 컬럼을 읽으면 오류가 난다

Application03은 Application02의 쿼리를 그대로 가져왔다. 그 쿼리는 `SELECT MENU_CODE, MENU_PRICE, ORDERABLE_STATUS`만 조회하는데, 아래에서는 `MENU_NAME`과 `CATEGORY_CODE`도 읽는다.  
조회하지 않은 컬럼 이름을 `getString`에 넘기면 `SQLException`(해당 컬럼이 없다는 오류)이 난다. 일치하는 행이 있을 때만 그 줄에 도달하므로, 값을 입력해야 오류를 확인할 수 있다(코드를 읽고 판단한 내용이고 실행해 보지는 않았다).  
DTO의 모든 필드를 채울 때는 `SELECT * FROM TBL_MENU WHERE ...`로 바꾸거나 필요한 컬럼을 모두 적는다.

## 5. 여러 행을 담기: Map과 List (Application04, 05)

이번에 숙제로 받은 것이 **메뉴 전체 조회 결과를 Java 객체에 옮겨 담기**였다. 행이 여러 개이므로 DTO를 컬렉션에 담는다. `Map`과 `List` 두 가지로 모두 해 봤다.

```java
// Application04: 메뉴 코드를 키로 하는 Map
Map<Integer, MenuDTO> menuMap = new LinkedHashMap<>();

while (rset.next()) {
    MenuDTO menu = new MenuDTO(
            rset.getInt("MENU_CODE"),
            rset.getString("MENU_NAME"),
            rset.getInt("MENU_PRICE"),
            rset.getInt("CATEGORY_CODE"),
            rset.getString("ORDERABLE_STATUS").charAt(0)
    );
    menuMap.put(menu.getMenuCode(), menu);
}

System.out.println("1번 메뉴 = " + menuMap.get(1));
```

```java
// Application05: 순서대로 쌓는 List
List<MenuDTO> menuList = new ArrayList<>();

while (rset.next()) {
    menuList.add(new MenuDTO(/* 위와 같은 5개 값 */));
}

for (MenuDTO menu : menuList) {
    System.out.println(menu);
}
```

| 구분 | `List<MenuDTO>` | `Map<Integer, MenuDTO>` |
|---|---|---|
| 찾는 기준 | 순서(인덱스) | 메뉴 코드(키) |
| 한 메뉴 찾기 | 처음부터 훑어야 함 | `get(코드)`로 바로 |
| 전체를 순서대로 쓰기 | 자연스럽다 | `entrySet()`으로 순회 |
| 어울리는 경우 | 목록 화면, 전체 출력 | 코드로 단건 조회가 잦을 때 |

`Map`은 `LinkedHashMap`으로 만들어야 **조회한 순서대로** 저장된다. 일반 `HashMap`은 순서를 보장하지 않는다.  
`List`를 쓰는 Application05에서는 변수 이름이 `menuMap`으로 남아 있다. 타입과 이름이 다르면 읽는 사람이 혼동하므로 `menuList`로 바꾼다.

## 6. 다른 DB에 적용하기: EmployeeDTO와 NULL 처리 (Application06)

숙제의 두 번째 요구사항은 `employeedb`에 접속해 조회 결과를 객체에 담는 것이었다.  
[앞 글]({{ site.baseurl }}/jdbc-connection-jdbctemplate.html)에서 만든 `getConnection(String configPath)`로 설정 파일만 바꿔서 접속했다.

```java
Connection con = getConnection("src/main/java/com/wanted/config/employee-config.properties");
```

`menudb`와 다르게 `employeedb`의 컬럼에는 **NULL이 들어갈 수 있는 값**이 있었다. 여기서 헷갈린 부분이 있다.

| 컬럼 | 문제 | 처리 |
|---|---|---|
| `BONUS` | 보너스가 없으면 NULL인데, `getFloat()`는 NULL을 `0`으로 돌려준다. 보너스 0과 보너스 없음을 구분할 수 없다 | 필드를 `Float`(객체형)로 선언하고 `getObject("BONUS", Float.class)`로 읽는다 |
| `ENT_YN` | NULL이면 `charAt(0)`에서 `NullPointerException`이 난다 | `entYn == null ? 'N' : entYn.charAt(0)`으로 기본값을 준다 |

```java
emp.setBonus(rset.getObject("BONUS", Float.class));

String entYn = rset.getString("ENT_YN");
emp.setEntYn(entYn == null ? 'N' : entYn.charAt(0));
```

`float` 같은 기본형은 `null`을 담을 수 없다. **NULL이 가능한 컬럼은 `Float`, `Integer` 같은 래퍼 타입으로 선언**해야 "값이 없음"을 표현할 수 있다.  
`ENT_YN`이 NULL일 때 `N`으로 보는 것은 이번 실습에서 정한 규칙이고, 실제 업무에서는 데이터 정의에 따라 달라진다.

## 7. 정리

- `Statement`는 SQL을 실행하고 `ResultSet`은 결과를 받는다. `next()`로 행을 읽고, 자원은 만든 순서의 반대로 닫는다.
- 조회 결과는 출력에서 끝내지 않고 DTO에 담는다. 여러 행은 순서가 중요하면 `List`, 코드로 찾는다면 `Map`을 쓴다.
- SQL 문자열 이어 붙이기, `SELECT`에 없는 컬럼 읽기, NULL 컬럼 처리가 이번에 막히기 쉬웠던 곳이다.

다음에는 입력값을 안전하게 전달하는 `PreparedStatement`와, `INSERT`/`UPDATE`/`DELETE`를 실행하는 `executeUpdate()`를 보면 좋다.

## 더 학습하면 좋은 개념

- **PreparedStatement** — SQL 틀과 입력값을 분리해서 SQL 인젝션을 막는다. 이 글의 문자열 이어 붙이기 방식이 왜 위험한지 가장 직접적으로 해결해 준다.
- **try-with-resources** — `finally`에서 `close()` 3개를 부르는 대신 블록이 끝날 때 자동으로 닫는다. 닫는 순서와 예외 누락 문제를 함께 줄일 수 있다.
- **ResultSet의 커서 타입** — 기본 `ResultSet`은 앞으로만 이동한다. 스크롤이 가능한 `ResultSet`이 있다는 것을 알면 `next()` 동작의 전제를 정확히 이해할 수 있다.
- **ORM(JPA)과 MyBatis** — 컬럼을 하나씩 `setXxx(getXxx())`로 옮기는 반복 작업을 자동화하는 도구다. 이 글의 수동 매핑을 먼저 해 봐야 이 도구들이 해 주는 일이 보인다.
- **NULL 처리(`Optional`, 래퍼 타입)** — DB의 NULL을 Java에서 표현하는 방법이다. `getFloat()`의 `0` 반환 문제를 겪고 나면 타입 선택의 이유가 보인다.

## 참고 자료
- [Oracle - JDBC Basics: Retrieving and Modifying Values from Result Sets](https://docs.oracle.com/javase/tutorial/jdbc/basics/retrieving.html)
- [Java SE API - ResultSet](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/ResultSet.html)
- [Java SE API - Statement](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Statement.html)
- [Oracle - JDBC Basics: Using Prepared Statements](https://docs.oracle.com/javase/tutorial/jdbc/basics/prepared.html)
