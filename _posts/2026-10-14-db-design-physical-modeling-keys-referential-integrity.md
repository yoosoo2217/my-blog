---
title: "데이터베이스 설계 5-2: 기본키·외래키·UNIQUE 구현과 참조 무결성 옵션 CASCADE·SET NULL·RESTRICT"
date: 2026-10-14
tags:
  - SQL
---

부모 테이블의 등급 20번을 지웠더니, 그 등급을 가진 회원 행은 어떻게 될까. 에러가 날 수도, 회원이 함께 사라질 수도, 등급만 비워질 수도 있다. 결과는 외래키의 **참조 무결성 옵션**이 정한다.

> **TL;DR**
> - 기본키는 단일(`AUTO_INCREMENT`), 복합, UUID 중에서 고르되 프로젝트 안에서 생성 방식을 통일한다.
> - 외래키와 `UNIQUE`에는 이름을 붙이고, 외래키는 InnoDB에서만 동작한다.
> - 부모가 바뀌거나 지워질 때 `CASCADE`는 자식도 따라 바꾸고, `SET NULL`은 연결만 끊고, `RESTRICT`는 막는다.

환경: MySQL 8.0 (InnoDB). 앞 글인 [테이블 이름·타입·기본값]({{ site.baseurl }}/db-design-physical-modeling-table-types.html)에서 이어진다. 시뮬레이터 실행 결과는 이 글에 옮기지 않았고, 수업 자료의 설명 범위만 정리했다.

## 1. 기본키는 어떤 방식으로 구현할까?

기본키는 각 행을 고유하게 식별하는 컬럼으로, 자동으로 `NOT NULL` + `UNIQUE`가 적용된다.

| 전략 | 설명 | 예시 |
|------|------|------|
| 단일 키 | `AUTO_INCREMENT`로 시스템 내부 식별자 생성 | `user_id INT AUTO_INCREMENT PRIMARY KEY` |
| 복합 키 | 교차 엔티티에서 두 개 이상의 컬럼을 조합해 고유성 부여 | `PRIMARY KEY (order_id, menu_id)` |
| UUID | 전역적으로 고유한 식별이 필요할 때. MySQL엔 UUID 전용 타입이 없어 `BINARY(16)`으로 저장 | `user_id BINARY(16) DEFAULT (UUID_TO_BIN(UUID()))` |
| 생성 방식 통일 | 프로젝트 전체에서 PK 생성 방식을 하나로 정한다 | 프로젝트 내 일관성 확보 |

실무에서 참고할 점은 다음과 같다.

- MySQL에서 단일 키는 `AUTO_INCREMENT`가 표준적인 선택이다. 테이블당 한 컬럼에만 지정할 수 있고, 그 컬럼에는 반드시 인덱스(보통 기본키)가 있어야 한다. 나중에 배울 JPA의 `@GeneratedValue(strategy = GenerationType.IDENTITY)`와 연결된다.
- UUID를 기본키로 쓸 때는 `CHAR(36)` 문자열보다 `BINARY(16)`을 권장한다. 저장 공간이 절반 이하이고, `UUID_TO_BIN(UUID(), 1)`처럼 두 번째 인자를 1로 주면 시간 순서로 정렬되도록 바이트를 재배치해 InnoDB 클러스터형 인덱스의 페이지 분할을 크게 줄여 준다.

## 2. 외래키와 UNIQUE는 어떻게 구현할까?

| 전략 | 설명 | 예시 |
|------|------|------|
| 즉시 참조 | 테이블 생성 시 `FOREIGN KEY`를 직접 명시 | `FOREIGN KEY (category_id) REFERENCES category (category_id)` |
| 지연 참조 | 테이블을 먼저 만들고 `ALTER TABLE`로 외래키 추가. 생성 순서 제약을 피함 | `ALTER TABLE menu ADD CONSTRAINT fk_category FOREIGN KEY ...` |
| 옵션 지정 | `ON DELETE` / `ON UPDATE`로 의도치 않은 삭제·갱신 방지 | `ON DELETE RESTRICT`, `ON UPDATE CASCADE` |
| 이름 부여 | 제약조건에 이름을 붙여 유지보수 용이 | `CONSTRAINT fk_order_menu FOREIGN KEY ...` |

테이블이 많아지면 외래키 이름을 명시하는 것이 디버깅과 관리에 유리하다. 시뮬레이터의 오류 메시지에도 `fk_user_grade`라는 이름이 찍혀서 어느 제약조건이 막았는지 알 수 있다고 한다.

고유키(`UNIQUE`)는 이렇게 구현한다.

| 전략 | 설명 | 예시 |
|------|------|------|
| 단일 컬럼 고유성 | 이메일, 전화번호 등 중복되면 안 되는 값 | `email VARCHAR(50) UNIQUE` |
| 다중 컬럼 조합 | 여러 컬럼의 조합이 중복되지 않게 | `UNIQUE (order_id, menu_id)` |
| 대체키 보호 | 기본키로 채택되지 않은 후보키의 고유성 유지 | 사용자명, 주민번호 → `UNIQUE` |
| 업무 규칙 반영 | "같은 카테고리 안에서는 메뉴명이 겹치면 안 된다" 같은 규칙 | `UNIQUE (category_id, menu_name)` |

`UNIQUE`를 정의한 컬럼에는 인덱스가 자동으로 만들어지므로 쓰기 성능에 영향을 준다. 꼭 필요한 곳에만 걸고, 제약조건에 이름을 붙여 두면 이후 삭제·변경·디버깅이 쉽다.

## 3. 부모 행을 지우면 자식 행은 어떻게 될까?

참조 무결성(Referential Integrity)은 두 테이블 간의 관계가 항상 일관되게 유지되도록 보장하는 규칙이다. 외래키는 부모 테이블(PK를 가진 테이블)에 없는 값을 허용하지 않고, 참조 무결성 옵션은 부모의 값이 바뀌거나 삭제될 때 자식 테이블이 어떻게 반응할지를 정한다.

수업 시뮬레이터의 테이블 구성은 다음과 같다. `user_grade`가 부모, `tbl_user`가 자식이다.

```sql
CREATE TABLE tbl_user (
    user_no    INT PRIMARY KEY,
    user_name  VARCHAR(20) NOT NULL,
    grade_code INT,
    CONSTRAINT fk_user_grade
        FOREIGN KEY (grade_code) REFERENCES user_grade (grade_code)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
) ENGINE=InnoDB;
```

예제 데이터는 이렇다.

| user_grade (부모) | grade_name |
|-------------------|------------|
| 10 | 일반회원 |
| 20 | 우수회원 |
| 30 | 특별회원 |
| 40 | 프리미엄회원 |

| tbl_user (자식) user_no | user_name | grade_code |
|--------------------------|-----------|------------|
| 1 | 홍길동 | 10 |
| 2 | 유관순 | 20 |
| 3 | 이순신 | 20 |
| 4 | 강감찬 | 30 |

시뮬레이터에서는 `ON DELETE`와 `ON UPDATE` 옵션을 바꿔 가며 "등급 20 삭제", "등급 20 → 25 변경", "등급 40 삭제(회원 없음)", "등급 50인 회원 추가"를 실행해 볼 수 있다. 옵션별로 기대되는 동작은 아래 표와 같다.

| 옵션 | 동작 | 활용 시점과 주의 |
|------|------|------------------|
| `CASCADE` | 부모가 변경/삭제되면 자식도 함께 변경/삭제 | 게시글 삭제 시 댓글, 주문 삭제 시 주문 상세처럼 함께 사라져야 할 때. 대량 데이터 유실에 주의 |
| `SET NULL` | 부모가 변경/삭제되면 자식의 외래키를 NULL로 | 자식은 남기고 연결만 끊을 때. 외래키 컬럼이 NULL 허용이어야 함 |
| `RESTRICT` | 참조 중인 부모는 변경/삭제 불가 | 기본 안전 설정. 아무 옵션도 쓰지 않으면 이 동작 |

등급 20을 삭제하는 경우를 옵션별로 적용하면 다음과 같다. 아래 결과는 위 표의 동작 정의를 예제 데이터에 적용한 것이고, 시뮬레이터에서 직접 확인한 출력은 아니다.

| 옵션 | 예상 결과 |
|------|-----------|
| `RESTRICT` | 유관순, 이순신이 20을 참조 중이므로 삭제가 거부된다 |
| `CASCADE` | 등급 20과 함께 유관순, 이순신 행도 삭제된다 |
| `SET NULL` | 등급 20이 삭제되고, 유관순과 이순신의 `grade_code`는 NULL이 된다 |

반면 회원이 없는 등급 40은 어떤 옵션에서도 삭제될 것이다. 등급 50인 회원을 추가하는 경우는 부모에 50이 없으므로, 옵션과 무관하게 외래키가 입력을 막는다.

### MySQL에서 주의할 점

- **InnoDB에서만 동작한다.** 외래키 제약조건은 InnoDB 스토리지 엔진에서만 동작한다. MyISAM 테이블에서는 문법이 통과하더라도 조용히 무시되므로, 테이블 생성 시 엔진을 반드시 확인한다.
- **`SET DEFAULT`는 지원하지 않는다.** 표준 SQL의 `SET DEFAULT`는 InnoDB에서 문법은 파싱되지만 테이블 생성이 거부된다.
- **`NO ACTION`은 `RESTRICT`와 같다.** 표준 SQL에서는 검사를 트랜잭션 끝으로 미룬다는 뜻이지만, InnoDB는 `RESTRICT`처럼 즉시 검사한다.
- **`SET NULL`은 NULL 허용 컬럼에만 쓴다.** `NOT NULL` 컬럼에 지정하면 테이블 생성 자체가 실패한다.
- **`CASCADE`는 트랜잭션으로 묶어 본다.** `START TRANSACTION`과 `COMMIT`으로 묶어 두면 결과가 의도와 다를 때 `ROLLBACK`으로 되돌릴 수 있다. 다만 `CREATE`/`ALTER`/`DROP` 같은 DDL은 실행 즉시 진행 중인 트랜잭션을 자동 커밋하므로, 보호할 작업은 DML로만 구성한다.

수업 자료는 위 주의점을 시뮬레이터에서 재현해 볼 수 있다고 안내한다. 시뮬레이터에는 "`grade_code` NULL 허용"과 "`START TRANSACTION`으로 묶기" 선택 항목이 있다. 자료가 제안한 실험은 두 가지다.

1. `ON DELETE`를 `SET NULL`로 두고 "NULL 허용"을 끈다. `NOT NULL` 컬럼에는 `SET NULL`을 쓸 수 없다는 점을 확인하는 실험이다.
2. `CASCADE`로 부모를 지운 뒤 트랜잭션 안에서 되돌려 본다. `ROLLBACK`으로 삭제를 취소할 수 있는지 확인하는 실험이다.

> 두 실험의 실제 출력은 이 글에서 확인하지 않았다. 직접 실행해서 확인해야 한다.

### 헷갈렸던 점: 옵션을 안 쓰면 어떻게 될까?

옵션을 하나도 쓰지 않으면 `RESTRICT`처럼 동작한다. 그래서 아무 옵션 없이 외래키를 걸어 두고 부모 행을 삭제하면 에러가 나는 것은 오류가 아니라 기본 안전 설정이 작동한 결과다. 의도적으로 함께 지우거나 연결만 끊고 싶을 때만 `CASCADE`나 `SET NULL`을 명시한다.

## 정리

1. 기본키는 `AUTO_INCREMENT` 단일 키가 표준이고, 교차 엔티티는 복합 키, 전역 식별이 필요하면 `BINARY(16)` UUID를 쓰되 방식은 프로젝트 안에서 통일한다.
2. 외래키와 `UNIQUE`에는 이름을 붙이고, 외래키는 InnoDB에서만 동작한다는 점을 엔진으로 확인한다.
3. `CASCADE`는 함께 정리, `SET NULL`은 연결만 해제, `RESTRICT`는 삭제 차단이라는 목적으로 고른다.

물리 설계는 이후 인덱싱, 성능 최적화, JPA 매핑과 이어진다. 요구사항 분석부터 DDL까지의 흐름을 직접 프로젝트 도메인으로 한 바퀴 돌려 보는 것이 다음 과제다.

## 더 학습하면 좋은 개념

- **InnoDB 클러스터형 인덱스** — 기본키 순서대로 데이터가 저장되는 구조다. UUID 기본키가 페이지 분할을 일으키는 이유를 설명한다.
- **트랜잭션과 자동 커밋(DDL)** — `CASCADE` 삭제를 되돌릴 수 있는 범위를 정한다. DDL이 트랜잭션을 끝내는 이유를 이해해야 한다.
- **JPA의 `GenerationType.IDENTITY`** — `AUTO_INCREMENT` 기본키가 ORM에서 어떻게 쓰이는지 연결해 준다.
- **코드 테이블 설계** — `ENUM` 대신 값 목록을 참조 테이블로 두면 외래키로 값을 제한할 수 있다.
- **인덱스와 `UNIQUE`의 쓰기 비용** — `UNIQUE`를 남발하면 안 되는 이유를 성능 관점에서 설명한다.

## 참고 자료

- [MySQL 8.0 Reference Manual - FOREIGN KEY Constraints](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html)
- [MySQL 8.0 Reference Manual - AUTO_INCREMENT Handling in InnoDB](https://dev.mysql.com/doc/refman/8.0/en/innodb-auto-increment-handling.html)
- [MySQL 8.0 Reference Manual - UUID Functions](https://dev.mysql.com/doc/refman/8.0/en/miscellaneous-functions.html)
