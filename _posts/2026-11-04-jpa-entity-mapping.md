---
title: "JPA 엔티티 매핑"
date: 2026-11-04
tags:
  - Java
  - Spring
  - JPA
---

`Member` 클래스에 어노테이션 몇 개만 붙였는데 `tbl_member` 테이블이 저절로 만들어졌다. 어떤 어노테이션이 어떤 DDL이 되고, 어떤 설정은 아예 반영되지 않을까?  
회원 등록과 조회 예제를 만들면서 `@Entity`, `@Id`, `@GeneratedValue`, `@Column`, `@Enumerated`가 하는 일을 정리했다.

> **TL;DR**
> - 엔티티 매핑은 클래스와 필드를 테이블과 컬럼에 연결하는 설정이다. 이 설정은 SQL 생성과 테이블 생성(DDL)에 모두 쓰인다.
> - PK 생성 전략이 `IDENTITY`이면 `persist()` 시점에 INSERT가 바로 실행된다. `SEQUENCE`는 PK만 먼저 가져오고 INSERT는 flush 시점에 실행된다.
> - enum은 `EnumType.STRING`으로 매핑한다. `ORDINAL`은 enum 선언 순서가 바뀌면 이미 저장된 값의 의미가 달라진다.

환경: Java 21, Spring Boot 4.1.2, Gradle, MySQL(`menudb` 데이터베이스), Lombok. 프로젝트 이름은 `chap03-entity-mapping`이고, 코드는 이 실습 프로젝트에서 가져왔다.  
이 글은 소스 코드와 코드에 달린 주석을 기준으로 정리했다. 콘솔 실행 결과 화면은 싣지 않았다.

## 1. 실습 프로젝트는 어떻게 구성했을까?

`section01` 패키지 하나에 회원(`Member`) 등록과 조회를 계층별로 나눠 두었다.

| 클래스 | 계층 | 역할 |
|---|---|---|
| `Section01Application` | 실행 | 콘솔 메뉴로 회원 등록, 회원 번호로 조회 |
| `MemberController` | Controller | 입력받은 DTO를 Service에 전달 |
| `MemberService` | Service | DTO와 Entity 변환, 트랜잭션 관리 |
| `MemberRepository` | Repository | `EntityManager`로 Entity 저장, 조회 |
| `Member` | Entity | `tbl_member` 테이블과 매핑되는 클래스 |
| `MemberRegistDTO` | DTO | 계층 사이에 데이터를 옮기는 객체 |
| `MemberRole` | enum | 회원 권한(`ROLE_MEMBER`, `ROLE_ADMIN`) |

코드 주석에 따르면 JDBC의 DAO 계층을 Spring에서 JPA와 함께 쓸 때는 Repository라고 부른다. 이 글에서도 DAO와 Repository를 같은 계층으로 본다.

호출 순서는 `Controller → Service → Repository → EntityManager → tbl_member`다.

## 2. 클래스는 어떻게 테이블이 될까?

`Member`에는 `@Entity`와 `@Table`이 붙어 있다.

```java
@Entity
@Table(name = "tbl_member")
public class Member {
    // ... 필드 생략
}
```

| 어노테이션 | 하는 일 |
|---|---|
| `@Entity` | 이 클래스를 JPA가 관리하는 엔티티로 지정한다. 영속성 컨텍스트에 저장할 수 있게 된다. |
| `@Table(name = ...)` | 매핑할 테이블 이름을 지정한다. 생략하면 클래스 이름을 쓴다. |

`@Table`로 이름을 지정하지 않으면 테이블 이름이 `member`가 된다. 이 예제는 `tbl_` 접두사를 쓰는 기존 DB 이름 규칙에 맞추려고 직접 지정했다.

## 3. PK는 누가 만들까? `@GeneratedValue`

`memberNo`는 PK(Primary Key, 기본키)이고 값을 DB가 만들게 했다.

```java
@Id
@Column(name = "member_no")
@GeneratedValue(strategy = GenerationType.IDENTITY)
private int memberNo;
```

생성 전략은 네 가지다. 코드 주석의 설명을 표로 정리했다.

| 전략 | PK 생성 주체 | 대표 DB | INSERT 실행 시점 |
|---|---|---|---|
| `IDENTITY` | DB가 INSERT 때 생성 | MySQL(`AUTO_INCREMENT`) | `persist()` 호출 즉시 |
| `SEQUENCE` | DB 시퀀스 객체 | Oracle, PostgreSQL | flush 시점 |
| `TABLE` | 키 생성 전용 테이블 | DB 무관 | - |
| `AUTO` | DB에 맞춰 자동 선택(기본값) | - | 선택된 전략을 따름 |

### 왜 IDENTITY만 INSERT가 바로 실행될까?

영속성 컨텍스트는 엔티티를 PK로 구분해 관리한다. 그런데 `IDENTITY`는 INSERT를 실행해야 PK를 알 수 있다. 그래서 `persist()` 시점에 INSERT를 바로 실행해 PK를 받아 와야 한다. 이 경우에는 INSERT를 모아 두었다가 한꺼번에 실행하는 쓰기 지연이 적용되지 않는다.

`SEQUENCE`는 시퀀스에서 PK만 먼저 받아 오면 되므로 INSERT를 flush까지 미룰 수 있다.

실제로 `registMember()`는 `memberRepository.save(member)` 직후 `member.getMemberNo()`를 반환한다. PK가 `persist()` 안에서 채워지기 때문에 가능하다.

## 4. 컬럼 설정은 어디까지 반영될까? `@Column`

```java
@Column(name = "member_id", nullable = false,
        unique = true, columnDefinition = "varchar(10)")
private String memberId;

@Column(name = "address", length = 900)
private String address;
```

| 속성 | 의미 | 기본값 |
|---|---|---|
| `name` | 매핑할 컬럼 이름 | 필드 이름 |
| `nullable` | `false`이면 `NOT NULL` 제약조건 | `true` |
| `unique` | `UNIQUE` 제약조건 추가 | `false` |
| `length` | 문자열 컬럼 길이 | 255 |
| `columnDefinition` | 자료형과 기본값 등을 DDL 문장으로 직접 작성 | - |

코드 주석이 강조하는 점은 이 속성들이 **테이블을 생성(DDL)할 때만** 쓰인다는 것이다. `nullable = false`를 줘도 JPA가 `persist()` 전에 null 검사를 대신 해 주는 것은 아니다. DDL로 만든 `NOT NULL` 제약이 DB에서 걸릴 뿐이다.  
테이블을 이미 직접 만들어 둔 상태에서 `ddl-auto: none`으로 실행하면 `@Column`의 제약 속성은 효과가 없다. 이 부분은 주석을 기준으로 정리했고 직접 실험하지는 않았다. (확인 필요)

### columnDefinition과 length를 같이 쓰면?

`memberId`는 `columnDefinition = "varchar(10)"`을, `address`는 `length = 900`을 썼다. `columnDefinition`은 컬럼 정의 전체를 직접 쓰는 방식이라 자료형을 통째로 지정한다. 그래서 같은 필드에 `length`를 함께 줄 필요가 없다. 반대로 `status`처럼 `columnDefinition = "char(1) default 'Y'"`를 쓰면 기본값까지 DDL에 넣을 수 있다.

## 5. 날짜는 어떻게 저장할까?

```java
@Column(name = "enroll_date")
private LocalDateTime enrollDate;
```

| 타입 | 저장 내용 |
|---|---|
| `LocalDate` | 날짜만(`yyyy-MM-dd`) |
| `LocalDateTime` | 날짜와 시간(`yyyy-MM-dd HH:mm:ss`) |

코드 주석에 따르면 Hibernate 5 이상은 `java.time` 패키지를 자동으로 지원한다. 예전처럼 `@Temporal`을 붙이지 않아도 된다.

## 6. enum은 숫자로 저장할까, 문자열로 저장할까? `@Enumerated`

```java
@Column(name = "member_role")
@Enumerated(EnumType.STRING)
private MemberRole memberRole;
```

| 항목 | `ORDINAL` | `STRING` |
|---|---|---|
| 저장 값 | 선언 순서(0, 1, ...) | 이름(`ROLE_MEMBER`) |
| 장점 | 저장 공간이 작다 | 값만 봐도 의미를 알 수 있다 |
| 단점 | 가독성이 떨어지고, 순서를 바꾸거나 값을 중간에 추가하면 기존 데이터의 의미가 달라진다 | 숫자보다 용량이 크다 |

`MemberRole`이 `ROLE_MEMBER, ROLE_ADMIN` 순서로 선언되어 있다고 하자. `ORDINAL`로 저장하면 일반 회원은 `0`, 관리자는 `1`이다. 나중에 `ROLE_GUEST`를 맨 앞에 추가하면 이미 저장된 `0`이 갑자기 `ROLE_GUEST`로 읽힌다. 이 때문에 실무에서는 `STRING`을 쓴다. 용량 차이는 크지 않다.

코드 주석에 따르면 Hibernate 6와 MySQL 조합에서 `STRING`으로 매핑하면 컬럼이 `enum('ROLE_ADMIN','ROLE_MEMBER')` 타입으로 만들어진다. `varchar`로 만들고 싶다면 `columnDefinition = "varchar(20)"`처럼 직접 지정한다.  
`ORDINAL`로 바꿔서 DDL과 저장 값을 비교해 보라는 과제도 주석에 있다. 이 글을 쓰는 시점에는 `ORDINAL`로 실행한 결과를 확인하지 않았다. (확인 필요)

## 7. 테이블은 누가 만들까? `ddl-auto`

`application.yaml`에서 `ddl-auto`를 `create`로 두었다.

```yaml
spring:
  jpa:
    show-sql: true
    hibernate:
      ddl-auto: create
    properties:
      hibernate:
        format_sql: true
```

| 값 | 동작 |
|---|---|
| `create` | 앱 실행 시 테이블을 새로 생성한다 |
| `create-drop` | 실행 시 생성하고, 종료 시 삭제한다 |
| `update` | 개발 중 바뀐 테이블 구조를 반영한다 |
| `none` | 미리 준비한 DDL 스크립트로만 진행한다 |

`create`는 실행할 때마다 기존 테이블을 지우고 다시 만든다. 그래서 이 실습에서는 앱을 다시 켜면 이전에 등록한 회원이 사라진다. 운영 DB에서 `create`나 `create-drop`을 쓰면 데이터가 날아가므로 학습용 DB에서만 쓴다.  
`show-sql: true`와 `format_sql: true`는 JPA가 만든 SQL을 보기 좋게 콘솔에 출력한다. 어노테이션이 어떤 DDL이 되었는지 눈으로 확인할 수 있다.

## 8. 헷갈렸던 점: DTO를 왜 따로 둘까?

`MemberRegistDTO`와 `Member`는 필드가 거의 같다. 그래서 처음에는 Controller부터 Repository까지 `Member`를 그대로 넘기면 되지 않을까 싶었다. 나눈 이유는 다음과 같다.

| 구분 | DTO | Entity |
|---|---|---|
| 역할 | 계층 사이에 데이터 전달 | 테이블과 매핑, 영속성 컨텍스트가 관리 |
| 어노테이션 | `@Setter` 허용 | `@Setter` 없이 `@Getter` 중심 |

`Member`에는 `@Setter`가 없다. Entity가 외부에서 마음대로 바뀌지 않게 하려는 의도로 보인다. (확인 필요: 주석에는 이유가 적혀 있지 않다.)

`MemberService`가 DTO를 Entity로 바꿔 저장하고, 조회할 때는 Entity를 다시 DTO로 바꿔 돌려준다.

```java
@Transactional
public int registMember(MemberRegistDTO dto) {
    Member member = new Member(
            dto.getMemberId(), dto.getMemberPwd(), dto.getMemberName(),
            dto.getPhone(), dto.getAddress(), dto.getEnrollDate(),
            dto.getMemberRole(), dto.getStatus()
    );
    memberRepository.save(member);
    return member.getMemberNo();
}

@Transactional(readOnly = true)
public MemberRegistDTO findByMemberNo(int memberNo) {
    Member foundMember = memberRepository.findByMemberNo(memberNo);
    // ... Entity를 DTO로 변환해서 반환 (생략)
}
```

`@Transactional`은 메서드 시작 시 `begin()`, 정상 종료 시 `commit()`, 예외 발생 시 `rollback()`을 실행한다. 조회 메서드에는 `readOnly = true`를 붙였다. 코드 주석에 따르면 읽기 전용 트랜잭션은 불필요한 변경 감지를 하지 않는다.

## 9. 한계와 주의할 점

* 기본값 `AUTO`는 DB에 따라 전략이 달라질 수 있다. 어떤 전략이 쓰이는지 글 작성 시점에 확인하지 않았다. (확인 필요)
* `ddl-auto: create`로 만든 테이블은 개발 중에만 믿는다. 운영에서는 DDL 스크립트나 마이그레이션 도구로 관리한다.
* `Member`에는 전체 필드 생성자를 `@AllArgsConstructor`와 직접 작성한 생성자가 함께 있다. 두 생성자의 매개변수가 달라서(`memberNo` 포함 여부) 충돌하지 않는다.
* `application.yaml`의 DB 계정 정보는 이 글에서 마스킹했다. 실제 프로젝트에서는 환경 변수나 별도 설정 파일로 분리하는 편이 안전하다.

## 10. 정리

1. `@Entity`, `@Table`, `@Id`, `@Column`은 클래스와 필드를 테이블과 컬럼에 연결하고, 이 정보는 DDL 생성에도 쓰인다.
2. `IDENTITY`는 `persist()` 때 INSERT가 바로 실행되고, `SEQUENCE`는 flush까지 미룰 수 있다.
3. enum은 `STRING`으로 저장해야 enum 선언 순서를 바꿔도 기존 데이터가 안전하다.

다음에는 `ORDINAL`로 바꿔 실행해 DDL과 저장 값을 직접 비교하고, `@Transactional`의 예외별 동작과 전파 방식을 따로 정리할 예정이다.

## 더 학습하면 좋은 개념

* **영속성 컨텍스트와 flush** — `IDENTITY`와 `SEQUENCE`의 INSERT 시점 차이는 쓰기 지연과 flush를 알아야 이해된다.
* **`@Transactional` 전파와 롤백 규칙** — 체크 예외와 언체크 예외의 롤백 동작이 다르다.
* **`@Embedded`와 값 타입** — 주소처럼 여러 필드를 묶어 하나의 객체로 매핑하는 방법이다.
* **Flyway, Liquibase** — `ddl-auto` 대신 운영 DB의 스키마 변경을 이력으로 관리하는 도구다.

## 참고 자료

* [Hibernate ORM 6 User Guide - Entity types](https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#entity)
* [Hibernate ORM 6 User Guide - Identifiers](https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#identifiers)
* [Jakarta Persistence 3.2 명세](https://jakarta.ee/specifications/persistence/3.2/)
* [Spring Boot 공식 문서 - Data Initialization](https://docs.spring.io/spring-boot/how-to/data-initialization.html)
