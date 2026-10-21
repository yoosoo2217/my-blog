---
title: "데이터베이스 필요성"
date: 2026-10-12
tags:
  - SQL
---

`ArrayList`에 회원 6명을 가입시킨 서비스를 재시작하면 `members.size()`가 0이 된다.  
메모리에 담은 데이터가 왜 사라지는지, 파일에 저장하면 충분하지 않은 이유는 무엇인지 따라가 보았다.  
JVM 메모리 구조는 [이전 글]({{ site.baseurl }}/java-jvm-memory-stack-heap.html)에서 정리했다.

> **TL;DR**
> - JVM 안의 모든 것(지역변수, 객체, `static` 변수)은 JVM이 꺼지면 사라진다. 가장 오래 사는 `static` 변수도 예외가 아니다.
> - 파일 저장은 영속성만 해결한다. 동시 수정, 빠른 검색, 여러 서버의 공유, 저장 도중의 장애는 직접 해결해야 한다.
> - 이 일을 전문으로 하는 프로그램이 DBMS이고, 이 시리즈에서 배울 MySQL이 그 예다.

환경은 Java와 MySQL(버전 `확인 필요`)이다. 코드는 개념 설명용 예시 코드이고 직접 실행해 확인하지는 않았다.

## 회원 목록을 ArrayList에 담으면 어떻게 될까

회원을 `List`에 담아 두는 서비스를 생각해 보자.

```java
public class MemberService {
    // 가입한 회원을 담아 두는 리스트 (Heap에 생성)
    private List<Member> members = new ArrayList<>();

    public void join(String name) {
        members.add(new Member(name));
    }

    public int count() {
        return members.size();
    }
}
```

`new ArrayList<>()`로 만든 리스트는 JVM 메모리(Heap)에 있는 객체다.  
서버를 재시작하면 새 JVM이 새 리스트를 만든다. 이전 JVM의 Heap에 있던 회원은 모두 사라지고 `members.size()`는 0이다.

## static 변수에 담으면 안 사라질까

처음에는 JVM 안에서 수명이 가장 긴 `static` 변수에 담으면 되겠다고 생각했다. 영역별 수명을 비교하면 이 생각이 왜 통하지 않는지 보인다.

| 영역 | 저장되는 것 | 생기는 때 | 사라지는 때 |
|---|---|---|---|
| Stack | 지역변수, 매개변수, 참조변수 | 메서드가 호출될 때 | 메서드가 끝날 때 |
| Heap | `new`로 만든 객체 | `new`를 실행할 때 | 아무도 참조하지 않아 GC가 수거할 때 |
| Method Area | 클래스 정보, `static` 변수 | 클래스를 처음 사용할 때 | JVM이 종료될 때 |

`static` 변수가 셋 중 가장 오래 살지만 수명의 끝은 JVM 종료다.  
JVM 프로세스가 끝나면 OS가 메모리를 회수하고, RAM은 전원이 꺼지면 내용이 지워지는 휘발성 메모리다.

> 참고: JDK 8 이후의 HotSpot JVM에서는 `static` 변수의 실제 저장 위치가 Heap(클래스를 나타내는 `Class` 객체 안)으로 바뀌었다. 클래스마다 하나만 존재하고 JVM이 끝날 때까지 산다는 수명은 같아서, 입문 단계에서는 Method Area로 묶어 설명한다.

## 회원 정보는 JVM보다 얼마나 오래 살아야 할까

서비스 데이터가 살아야 하는 기간을 JVM 안의 수명과 나란히 놓으면 차이가 크다.

| 대상 | 수명 |
|---|---|
| 지역변수 | 메서드 한 번 실행 동안 (약 0.001초) |
| 요청 처리용 객체 | 요청 1건을 처리하는 동안 (약 0.2초) |
| 로그인 세션 객체 | 사용자가 접속해 있는 동안 (약 30분) |
| `static` 변수 | 다음 배포나 재시작까지 (보통 며칠~몇 주) |
| 회원 정보 | 가입부터 탈퇴까지 (수년) |
| 주문/결제 기록 | 법령상 보관 기간까지 (5년 이상) |

수치는 강의 자료의 예시값이다.  
회원 정보와 주문 기록은 JVM이 한 번도 꺼지지 않아야 버틸 수 있는 기간만큼 살아야 하는데, JVM 안의 어떤 것도 거기에 닿지 못한다.  
"서버를 절대 끄지 않으면 되지 않나?"라는 생각이 들 수 있다. 하지만 새 기능 배포, 장애, 보안 업데이트 때문에 서버는 생각보다 자주 재시작된다.

## 파일에 저장하면 어디까지 해결될까

회원을 `members.txt`에 저장하면 JVM이 꺼져도 데이터가 디스크에 남는다.

```java
// 회원 한 명을 members.txt 파일 끝에 한 줄로 추가 (예시 코드)
public void save(Member member) throws IOException {
    try (FileWriter fw = new FileWriter("members.txt", true)) {
        fw.write(member.getId() + "," + member.getName());
        fw.write(System.lineSeparator());
    }
}
```

영속성(Persistence, 프로그램이 꺼져도 데이터가 남는 성질)은 해결된다. 하지만 여러 사람이 동시에 쓰는 서비스에서는 문제가 남는다.

| 상황 | 파일로 처리하면 |
|---|---|
| 재고 1개인 상품을 A, B가 거의 동시에 주문 | 두 스레드가 같은 재고 값을 읽은 뒤 각각 차감해 둘 다 주문이 성공할 수 있다 |
| 회원 100만 명 중에서 한 명을 찾기 | 처음부터 끝까지 한 줄씩 비교한다 |
| 서버가 2대 | 서버마다 자기 파일이 있어 서버 A에서 가입한 회원이 서버 B에는 없다 |
| 저장 도중 서버가 멈춤 | 반쪽만 쓰인 데이터가 남을 수 있다 |

이 문제를 모두 직접 해결하려면 결국 데이터베이스를 직접 만드는 셈이 된다.  
그래서 이 일을 전문으로 하는 프로그램인 **DBMS**(Database Management System)를 쓴다.

## DBMS는 파일의 문제를 어떻게 해결할까

| 개념 | 파일/메모리의 문제 | DBMS의 해결 | 관련 SQL |
|---|---|---|---|
| 영속성 | JVM이 꺼지면 데이터도 사라진다 | 디스크에 저장해 프로그램이 꺼져도 남긴다 | `INSERT`, `SELECT` |
| 공유 | 서버마다 메모리와 파일이 따로 있다 | 모든 서버가 네트워크로 같은 DB에 접속한다 | `CREATE DATABASE`, `USE` |
| 질의(Query) | 반복문, 조건문, 정렬 코드를 매번 직접 짠다 | 무엇이 필요한지만 적으면 DB가 찾아 준다 | `SELECT`, `WHERE`, `ORDER BY`, `JOIN` |
| 인덱스 | 처음부터 끝까지 하나씩 비교한다 | 색인으로 필요한 위치를 바로 찾는다 | `CREATE INDEX` |
| 무결성 | 검사 코드를 하나라도 빠뜨리면 잘못된 데이터가 들어간다 | 테이블에 규칙을 선언하면 DB가 어긴 데이터를 거부한다 | `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `CHECK` |
| 트랜잭션 | 중간에 멈추면 반쪽짜리 데이터가 남는다 | 전부 성공하거나 전부 취소한다 | `START TRANSACTION`, `COMMIT`, `ROLLBACK` |
| 동시성 제어 | 동시에 고치면 서로 덮어쓴다 | 잠금(Lock)으로 같은 데이터를 차례대로 고친다 | `SELECT ... FOR UPDATE` |
| 보안과 복구 | 파일은 실수로 지우거나 통째로 유출되기 쉽다 | 계정별 권한을 나누고 백업으로 복구한다 | `CREATE USER`, `GRANT` |

## DB가 생기면 Java는 무엇을 맡을까

DB가 생겼다고 Java가 필요 없어지는 것은 아니다. Java는 요청을 받아 데이터를 처리하고, DB는 데이터를 안전하게 보관한다.  
열람실 책상(JVM 메모리)과 서고(DB)에 비유할 수 있다. 책상 위는 문 닫을 때 치워지지만, 서고의 책은 규칙대로 오래 보관된다.

Java 객체와 DB 테이블은 이렇게 대응한다.

| Java | DB |
|---|---|
| 클래스 | 테이블 |
| 필드 | 컬럼(Column) |
| 객체 하나 | 행(Row) |

```java
class Member {
    Long id;
    String name;
    int age;
}
// new Member(1L, "김자바", 23), new Member(2L, "이디비", 31)
```

위 두 객체는 `member` 테이블에서 다음 두 행이 된다.

| id | name | age |
|---|---|---|
| 1 | 김자바 | 23 |
| 2 | 이디비 | 31 |

Java 서버는 JDBC(Java Database Connectivity, Java에서 DB에 접속하는 표준 API)로 MySQL에 접속해 회원을 저장하고 읽는다. 서버를 재시작해도 `member` 테이블의 행은 디스크에 남아 있으니, 재시작 후 `SELECT`로 다시 불러오면 된다.

## 정리

- 메모리의 데이터는 JVM 수명을 넘지 못하는데, 서비스 데이터는 그보다 훨씬 오래 살아야 한다.
- 파일은 영속성만 해결한다. 동시성, 검색, 공유, 장애 복구까지 한 번에 맡길 수 있는 것이 DBMS다.
- 클래스는 테이블, 필드는 컬럼, 객체는 행에 대응한다.

다음 글에서는 `SELECT`로 테이블의 데이터를 조회해 본다.

## 더 학습하면 좋은 개념

- **트랜잭션과 ACID** — 계좌이체처럼 "전부 성공 아니면 전부 취소"가 필요한 작업이 어떻게 보장되는지 이해하는 출발점이다.
- **인덱스(B-Tree)** — 100만 건 중에서 한 건을 바로 찾는 원리를 알면 쿼리 성능 문제를 설명할 수 있다.
- **JDBC** — Java 서버가 DB와 통신하는 표준 방법으로, 이후 ORM(JPA)을 이해하는 바탕이 된다.
- **동시성 제어와 락** — 재고 차감처럼 동시에 같은 데이터를 고칠 때 생기는 문제를 DB가 어떻게 막는지 알 수 있다.

## 참고 자료

- [MySQL 8.4 Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [Oracle - Java Tutorials: JDBC Basics](https://docs.oracle.com/javase/tutorial/jdbc/basics/index.html)
