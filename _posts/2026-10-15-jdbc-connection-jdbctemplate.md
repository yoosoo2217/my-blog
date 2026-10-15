---
title: "JDBC로 MySQL에 접속하기: Connection 생성부터 JDBCTemplate로 중복 제거까지"
date: 2026-10-15
tags:
  - Java
  - SQL
---

Java 코드에서 `menudb`에 접속하는 데 필요한 코드는 몇 줄이다.  
그런데 회원가입, 로그인, 정보 수정, 탈퇴처럼 DB에 접근하는 기능이 4개면 그 몇 줄을 4번 복사하게 된다.  
접속 코드를 한 번 작성하고, 접속 정보를 파일로 빼고, 반복되는 부분을 `JDBCTemplate` 클래스로 모은 과정을 정리했다.

> **TL;DR**
> - JDBC 접속에는 **driver, url, user, password** 4가지가 필요하고, `DriverManager.getConnection()`이 `Connection`을 돌려준다.
> - 접속 정보는 코드에 쓰지 않고 `.properties` 파일로 빼서 `Properties`로 읽는다.
> - 접속과 자원 해제 코드는 `JDBCTemplate`의 `static` 메서드로 모으면 호출 한 줄로 끝난다.

환경: Java, MySQL, MySQL Connector/J(`com.mysql.cj.jdbc.Driver`). 정확한 버전은 `확인 필요`.  
DB 서버 `localhost`에 `menudb` 데이터베이스가 있고, 접속 계정이 만들어져 있다고 가정한다.

## 1. JDBC 접속에 필요한 4가지

JDBC(Java Database Connectivity)는 Java에서 DB에 접속하고 SQL을 실행하기 위한 표준 API다.  
DB 종류마다 접속 방법이 다르지만, Java 코드는 JDBC 인터페이스만 보고 작성하고 실제 통신은 **DB 제조사가 제공하는 드라이버**가 맡는다.

| 필요한 것 | 이번 실습의 값 | 역할 |
|---|---|---|
| driver | `com.mysql.cj.jdbc.Driver` | MySQL과 통신하는 드라이버 클래스 |
| url | `jdbc:mysql://localhost/menudb` | 어느 서버의 어느 DB에 접속할지 |
| user | 접속 계정 | DB 사용자 이름 |
| password | 접속 비밀번호 | DB 사용자 비밀번호 |

url은 `jdbc:` + DB 종류(`mysql`) + `://` + 서버 주소(`localhost`) + `/` + DB 이름(`menudb`) 순서로 읽는다.  
포트를 생략하면 MySQL 기본 포트(3306)를 쓴다.

## 2. 가장 단순한 접속: 코드에 전부 적기 (Application01)

```java
Connection con = null;

try {
    Class.forName("com.mysql.cj.jdbc.Driver");

    con = DriverManager.getConnection(
            "jdbc:mysql://localhost/menudb",
            "wanted",
            "wanted"
    );
    System.out.println("con = " + con);   // 값이 출력되면 menudb에 접근 가능

} catch (ClassNotFoundException e) {
    throw new RuntimeException(e);
} catch (SQLException e) {
    throw new RuntimeException(e);
} finally {
    con = null;
}
```

처음에 헷갈린 부분이 두 가지 있었다.

**`Connection`은 인터페이스인데 어떻게 객체가 만들어질까?**  
`new Connection()`은 할 수 없다. `DriverManager.getConnection()`이 드라이버를 찾아 접속하고, 그 드라이버가 구현한 `Connection` 객체를 돌려준다.  
수업에서는 "인터페이스를 구현한 `DriverManager`를 통해 만든다"고 정리했는데, 정확히는 **`DriverManager`가 구현체를 만드는 것이 아니라 드라이버가 만든 구현체를 건네주는 것**이다.

**`finally`에서 `con = null`을 하면 연결이 닫힐까?**  
닫히지 않는다. 변수가 객체를 가리키던 참조를 끊을 뿐이고, DB와의 연결은 그대로 남는다.  
연결을 끝내려면 `con.close()`를 호출해야 하고, 이 문제는 4번에서 `close()` 메서드로 해결한다.

참고로 `Class.forName(...)`은 JDBC 4.0 이후 드라이버가 클래스패스에 있으면 `DriverManager`가 자동으로 찾아 주기 때문에 생략해도 동작하는 것으로 알고 있다. 이 실습에서 생략해 보지는 않았다(`확인 필요`).

## 3. 접속 정보를 코드에서 빼기: properties 파일 (Application02)

Application01의 문제는 계정과 비밀번호가 소스 코드에 그대로 적힌다는 점이다.  
코드를 Git에 올리면 비밀번호도 같이 올라간다. 그래서 접속 정보를 `.properties` 파일로 빼고 `Properties` 객체로 읽는다. (`Properties`는 [Map을 정리한 글]({{ site.baseurl }}/java-map-hashmap-properties.html)에서 다뤘다.)

```properties
driver=com.mysql.cj.jdbc.Driver
url=jdbc:mysql://localhost/menudb
user=wanted
password=****
```

```java
Properties prop = new Properties();
prop.load(new FileReader("src/main/java/com/wanted/a_connection/jdbc-config.properties"));

String driver = prop.getProperty("driver");
String url = prop.getProperty("url");
String user = prop.getProperty("user");
String password = prop.getProperty("password");

Class.forName(driver);
con = DriverManager.getConnection(url, user, password);
```

### 실수한 지점: url 오타

처음 만든 properties 파일의 url이 `jdbcmysql://localhost/menudb`였다. `jdbc:`의 콜론이 빠졌다.  
코드는 문제가 없는데 접속이 안 되는 상황이라 원인을 찾기 어렵다. 콜론이 없으면 `DriverManager`가 이 url을 처리할 드라이버를 찾지 못해 `SQLException`이 날 것이다(실제 에러 메시지는 `확인 필요`).  
접속이 안 될 때는 코드보다 **properties 값부터 확인**한다.

### 경로는 실행 위치 기준이다

`new FileReader("src/main/java/...")`는 상대 경로라서 **프로그램을 실행한 위치**를 기준으로 파일을 찾는다.  
IntelliJ에서 프로젝트 루트를 기준으로 실행하면 동작하지만, 다른 위치에서 실행하면 `FileNotFoundException`이 난다.

## 4. 반복되는 코드 모으기: JDBCTemplate (b_template)

접속 코드를 매번 쓰면 이런 부분이 반복된다.

1. `Properties` 객체 생성과 파일 읽기
2. `Connection` 생성
3. 사용한 `Connection` 해제

이 코드를 `static` 메서드로 모으면 호출하는 쪽은 한 줄이 된다.

```java
public class JDBCTemplate {

    public static Connection getConnection() {
        Connection con = null;
        Properties prop = new Properties();

        try {
            prop.load(new FileReader("src/main/java/com/wanted/config/jdbc-config.properties"));

            Class.forName(prop.getProperty("driver"));
            con = DriverManager.getConnection(
                    prop.getProperty("url"),
                    prop.getProperty("user"),
                    prop.getProperty("password")
            );
        } catch (IOException | ClassNotFoundException | SQLException e) {
            throw new RuntimeException(e);
        }
        return con;
    }

    public static void close(Connection con) {
        try {
            if (con != null && !con.isClosed()) {
                con.close();
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    // close(Statement), close(ResultSet)도 같은 모양 ... 생략
}
```

수업 코드는 `catch`를 예외마다 따로 썼고, 위 코드는 같은 처리를 하나로 합친 것이다.

`close`는 `Connection`, `Statement`, `ResultSet`을 받는 **같은 이름의 메서드 3개(오버로딩)**로 만들었다. 호출하는 쪽은 타입에 상관없이 `close(x)`만 쓰면 된다.  
`con != null && !con.isClosed()`로 확인하는 이유는, `null`이거나 이미 닫힌 객체에 `close()`를 부르면 `NullPointerException`이나 불필요한 예외가 날 수 있기 때문이다.

호출하는 쪽은 `static import`를 쓰면 클래스 이름도 생략할 수 있다.

```java
import static com.wanted.b_template.JDBCTemplate.close;
import static com.wanted.b_template.JDBCTemplate.getConnection;

Connection con = getConnection();
// con 활용 -> 회원가입 진행
close(con);
```

| 구분 | Application01 | JDBCTemplate 사용 |
|---|---|---|
| 접속 정보 | 코드에 직접 작성 | properties 파일에서 읽음 |
| 접속 코드 | DB 접근마다 반복 | `getConnection()` 한 줄 |
| 연결 해제 | `con = null` (연결은 안 닫힘) | `close(con)` |

## 5. DB가 2개일 때: getConnection 오버로딩

`menudb` 말고 `employeedb`에도 접속해야 했다. 설정 파일 경로가 `getConnection()` 안에 고정되어 있어서 `employeedb`에는 쓸 수 없다.  
설정 파일 경로를 **매개변수로 받는 `getConnection(String configPath)`**를 추가하고, 기존 `getConnection()`은 `menudb`용 경로를 넣어 그 메서드를 호출하게 했다.

```java
public static Connection getConnection() {
    return getConnection("src/main/java/com/wanted/config/jdbc-config.properties");
}

public static Connection getConnection(String configPath) {
    // prop.load(new FileReader(configPath)) 이후는 4번과 동일 ... 생략
}
```

```java
Connection con = getConnection("src/main/java/com/wanted/config/employee-config.properties");
```

기존에 `getConnection()`을 쓰던 코드는 하나도 바꾸지 않아도 된다. 새 요구사항이 생겨도 호출부를 건드리지 않는 것이 메서드를 오버로딩해서 얻는 이점이다.

### 이전 버전과 현재 버전은 무엇이 다를까?

`JDBCTemplate`은 두 번 만들었다. 처음 만든 `b_template.JDBCTemplate`이 이전 버전이고, `employeedb`를 위해 고친 `common.JDBCTemplate`이 현재 버전이다.

| 구분 | 이전 버전 (`b_template`) | 현재 버전 (`common`) |
|---|---|---|
| 접속 가능한 DB | `menudb` 하나 | `menudb`, `employeedb` 모두 |
| `getConnection()` | 설정 파일 경로가 메서드 안에 고정 | 기본 경로를 넣어 `getConnection(String)`을 호출 |
| `getConnection(String configPath)` | 없음 | 있음 (경로를 매개변수로 받음) |
| 경로 상수 | 없음 | `MENU_CONFIG`, `EMPLOYEE_CONFIG` 선언 |
| `close()` 3종 | `Connection`, `Statement`, `ResultSet` | 동일 (바뀐 것 없음) |
| 기존 호출 코드 | - | `getConnection()`은 그대로 써도 된다 |

바뀐 곳은 `getConnection` 쪽뿐이고, 자원을 해제하는 `close` 3종은 두 버전이 같다.

`common` 패키지 파일에는 현재 클래스 아래에 **주석 처리된 같은 이름의 클래스**가 하나 더 있다. 붙여 넣은 코드를 비교해 보니 이 주석 블록은 현재 버전과 내용이 같았다(들여쓰기 같은 모양만 다르다). 따라서 위 표의 "이전 버전"은 주석 블록이 아니라 `b_template` 쪽이다. 주석 블록은 지워도 되고, 이전 상태는 Git 기록에 남는다.

현재 버전에서 고칠 점도 하나 있다. 경로 상수를 선언했는데 `getConnection()`은 같은 문자열을 다시 직접 적고 있다. `getConnection(MENU_CONFIG)`로 바꾸면 경로가 한 곳에서만 관리된다.

### 한계: 접속 정보가 콘솔에 찍힌다

`getConnection`에 `System.out.println("prop = " + prop)`이 있어서 **비밀번호까지 콘솔에 출력**된다. 확인용으로는 편하지만 서버 로그에 남을 수 있으니 실습이 끝나면 지운다.  
properties 파일도 Git에 올리면 비밀번호가 공개되므로 `.gitignore`에 넣는 것을 고려한다.

## 6. 정리

- JDBC 접속은 driver, url, user, password로 `DriverManager.getConnection()`을 부르는 것이다.
- 접속 정보는 properties 파일로 분리하고, url 오타(`jdbc:`의 콜론)나 상대 경로처럼 **코드 밖의 값**이 접속 실패의 원인일 수 있다.
- 반복되는 접속·해제 코드는 `JDBCTemplate`에 모으고, 변하는 값(설정 파일 경로)은 매개변수로 받는다.

다음에는 이렇게 만든 `Connection`으로 SQL을 실행하는 `Statement`와 `ResultSet`을 [다음 글]({{ site.baseurl }}/jdbc-statement-resultset-dto.html)에서 정리한다.

## 더 학습하면 좋은 개념

- **try-with-resources** — `Connection`, `Statement`, `ResultSet`은 `AutoCloseable`이라 `close()`를 직접 부르지 않아도 블록이 끝나면 자동으로 닫을 수 있다. `finally`에서 `close()`를 일일이 부르는 방식의 문제(예외 누락)를 줄여 준다.
- **커넥션 풀(HikariCP 등)** — `getConnection()`을 부를 때마다 새로 접속하는 방식은 비용이 크다. 연결을 미리 만들어 두고 빌려 쓰는 구조를 이해하면 `close()`가 "닫기"가 아니라 "반납"이 되는 이유를 알 수 있다.
- **JDBC 드라이버 자동 로딩(ServiceLoader)** — `Class.forName`이 없어도 드라이버가 등록되는 원리다.
- **설정 값 외부화(환경 변수, `.env`)** — properties 파일을 Git에서 제외하는 것 이상으로, 비밀번호를 코드 저장소 밖에서 주입하는 방법이다.
- **싱글톤 / 의존성 주입** — `static` 메서드 모음인 `JDBCTemplate`의 한계를 알고, Spring의 `JdbcTemplate`이 이를 어떻게 확장했는지 비교해 볼 수 있다.

## 참고 자료
- [Oracle - JDBC Basics: Establishing a Connection](https://docs.oracle.com/javase/tutorial/jdbc/basics/connecting.html)
- [Java SE API - DriverManager](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/DriverManager.html)
- [MySQL Connector/J - Connection URL Syntax](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-jdbc-url-format.html)
- [Java SE API - Properties](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Properties.html)
