---
title: "데이터베이스 설계 5-1: 물리적 모델링"
date: 2026-10-14
tags:
  - SQL
---

`CREATE TABLE order ( ... );`를 실행했더니 문법 오류가 났다. 이름이 자연스럽다고 해서 DB가 받아 주는 것은 아니다. 논리 모델을 MySQL 8.0에서 실제로 동작하는 테이블로 옮기는 **물리적 모델링**에서는 이름, 타입, 기본값을 하나하나 정해야 한다.

> **TL;DR**
> - 테이블명은 소문자 `snake_case` 단수형으로 짓고, 예약어 충돌은 접두어(`tbl_`)나 백틱으로 피한다.
> - 상태값은 `ENUM` 대신 `CHAR(1)` + `CHECK`나 코드 테이블로, 시간이 필요한 컬럼은 `DATETIME`을 기본으로 한다.
> - `DEFAULT`에 함수를 쓸 때는 괄호가 필요하고(`DEFAULT CURRENT_TIMESTAMP`만 예외), `TEXT`/`BLOB`은 기본값을 가질 수 없다.

환경: MySQL 8.0 (InnoDB). 예시 DB는 수업에서 쓰는 `menudb`다. 논리 모델링 이후 단계이며, 키와 외래키 구현은 [다음 글]({{ site.baseurl }}/db-design-physical-modeling-keys-referential-integrity.html)에서 이어진다.

## 1. 테이블 이름은 어떤 규칙으로 지을까?

일관된 이름은 유지보수성과 가독성을 높이고, 협업할 때 혼동을 줄이며, JPA 같은 ORM과의 연동도 매끄럽게 한다. 업무 엔티티를 중심으로 의미 있게 짓되 불필요한 축약은 피한다.

| 항목 | 규칙 |
|------|------|
| 소문자 사용 | MySQL은 OS와 `lower_case_table_names` 설정에 따라 테이블명 대소문자 구분이 달라진다(Windows는 구분 안 함, Linux는 구분함). 환경을 옮겨도 깨지지 않게 소문자로 통일한다 |
| 단어 구분 | `snake_case` 사용 (`order_menu`, `user_info`) |
| 단수형 | 테이블명은 단수형으로 (`order_detail`, `menu`) |
| 접두어 | `tbl_`, `t_` 같은 접두어는 팀 컨벤션에 따라 선택 |

수업의 이름 검사기에는 이런 이름들이 나왔다. 위 규칙으로 보면 이렇게 정리된다.

| 이름 | 판단 | 이유 |
|------|------|------|
| `order_detail` | 규칙에 맞음 | 소문자, `snake_case`, 단수형 |
| `tbl_order` | 규칙에 맞음 | 접두어는 팀 컨벤션에 따라 선택 |
| `TBL_USERINFO` | 규칙 위반 | 대문자 사용, 단어 구분 없음 |
| `OrderDetails` | 규칙 위반 | 대문자 사용, `snake_case` 아님, 복수형 |
| `menus` | 규칙 위반 | 복수형 |
| `user-info` | 규칙 위반 | 하이픈은 `snake_case`가 아니다 |
| `order`, `user` | 주의 | 예약어와 충돌할 수 있다 |

> 검사기의 정확한 판정 문구는 옮기지 않았고, 위 판단은 규칙표를 기준으로 정리했다. `user`가 예약어인지는 `확인 필요`.

### 헷갈렸던 점: 단수형을 지키면 왜 예약어와 부딪힐까?

단수형 이름을 쓰다 보면 가장 자연스러운 이름이 DBMS의 예약어(Reserved Word)와 겹치는 경우가 있다. MySQL에서는 `order`가 대표적이다(`ORDER BY`의 그 `ORDER`).

```sql
-- 예약어와 충돌하여 문법 오류 발생
CREATE TABLE order ( ... );

-- 백틱으로 감싸면 쓸 수는 있지만, 모든 쿼리에서 매번 감싸야 함
CREATE TABLE `order` ( ... );
SELECT * FROM `order` WHERE `order`.order_id = 1;
```

식별자를 감싸는 인용 문자는 DBMS마다 다르다. MySQL은 백틱(`` ` ``)을, 표준 SQL과 PostgreSQL은 큰따옴표를 쓴다. 이런 번거로움 때문에 팀에 따라 접두어를 붙이기도 한다.

- `tbl_order`, `tbl_user`처럼 쓰면 예약어 충돌이 원천적으로 사라진다.
- 테이블 목록이 한곳에 모이고, 뷰(`v_`)나 프로시저(`sp_`) 같은 다른 객체와 구분하기 쉽다.
- 반대로 이름이 길어지고 `tbl_` 자체는 아무 정보도 주지 않는다는 비판도 있다.

정답이 있는 영역은 아니다. 프로젝트 안에서 하나의 규칙을 정하고 끝까지 지키는 것이 중요하다. 수업의 `menudb`는 `tbl_menu`, `tbl_order`처럼 접두어 컨벤션을 적용한 사례다.

## 2. 컬럼 타입은 무엇으로 고를까?

| 항목 유형 | MySQL 8.0 권장 타입 | 비고 |
|-----------|---------------------|------|
| 고유번호(ID) | `INT AUTO_INCREMENT`, `BIGINT AUTO_INCREMENT` | 자동 증가 (기본키용) |
| 숫자 | `INT`, `DECIMAL(P,S)` | 금액은 `DECIMAL` (`NUMERIC`은 동의어) |
| 문자열 | `VARCHAR(n)`, `TEXT` | 길이 제한이 있으면 `VARCHAR` |
| 날짜/시간 | `DATE`, `DATETIME`, `TIMESTAMP` | 시간 포함 여부와 타임존 처리 방식으로 선택 |
| 상태값 | `CHAR(1)` + `CHECK` | 'Y', 'N' 등 |

```sql
menu_code        INT AUTO_INCREMENT PRIMARY KEY,
menu_name        VARCHAR(30) NOT NULL,
menu_price       INT CHECK (menu_price >= 0),
orderable_status CHAR(1) CHECK (orderable_status IN ('Y', 'N'))
```

`CHECK` 제약조건은 MySQL 8.0.16부터 실제로 강제된다. 그 이전 버전에서는 문법만 통과하고 조용히 무시되므로, 예전 자료나 구버전 환경에서는 잘못된 값이 그대로 들어간다.

### 상태값에 ENUM을 지양하는 이유

MySQL에는 `payment_type ENUM('현금', '카드', '이체')` 같은 네이티브 `ENUM` 타입이 있다. 문법이 간결하고 값 범위도 확실히 제한되지만 실무에서는 다음 이유로 지양하는 편이다.

| 이유 | 설명 |
|------|------|
| 스키마 변경 필요 | 값을 하나 추가하려면 `ALTER TABLE`이 필요하다. 운영 중인 대용량 테이블에는 부담이 큰 작업이다 |
| 이식성 | MySQL 전용 타입이라 다른 DBMS로 옮기기 어렵다 |
| 의미 변질 위험 | 내부적으로 정수 순번으로 저장되어, 정의 순서를 잘못 바꾸면 기존 데이터의 의미가 달라질 수 있다 |

대안은 `CHAR(1)`/`VARCHAR` + `CHECK` 조합이다. 값의 종류가 자주 늘어난다면 코드 테이블(참조 테이블)로 분리한다. `menudb`에서 `tbl_category`를 별도 테이블로 둔 것이 후자의 사례다.

## 3. 날짜는 DATETIME과 TIMESTAMP 중 무엇을 쓸까?

| 타입 | 저장 방식 | 표현 범위 | 크기 |
|------|-----------|-----------|------|
| `DATE` | 날짜만 (시분초 없음) | 1000-01-01 ~ 9999-12-31 | 3바이트 |
| `DATETIME` | 입력한 값을 그대로 저장. 타임존 변환 없음 | 1000-01-01 ~ 9999-12-31 | 5바이트 |
| `TIMESTAMP` | 저장 시 UTC로 변환, 조회 시 세션 타임존으로 재변환 | 1970-01-01 ~ 2038-01-19 | 4바이트 |

수업 실습은 서울(+09:00)에서 같은 시각을 두 컬럼에 저장해 두고 비교했다.

```sql
CREATE TABLE event_log (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    created_dt DATETIME,
    created_ts TIMESTAMP
);
SET time_zone = '+09:00';
INSERT INTO event_log (created_dt, created_ts)
    VALUES ('2026-10-14 09:00:00', '2026-10-14 09:00:00');
```

저장할 때와 같은 타임존(+09:00)에서 조회하면 두 컬럼이 똑같이 `2026-10-14 09:00:00`으로 보인다. 하지만 `TIMESTAMP` 쪽은 내부적으로 UTC `2026-10-14 00:00:00`으로 저장되어 있다. 세션 타임존을 UTC(+00:00)나 뉴욕(-05:00)으로 바꿔 같은 행을 다시 조회하면 `TIMESTAMP` 컬럼만 값이 달라 보인다는 것이 실습의 요점이다. `DATETIME`은 넣은 값 그대로 나온다.

> 타임존을 바꿨을 때 표시되는 정확한 값은 이 글에서 직접 계산하지 않았고 `확인 필요`.

### 2040년 만료일은 왜 TIMESTAMP에 못 넣을까?

10년 구독 상품의 만료일을 저장하는 실습에서는 두 컬럼에 같은 값 `2040-01-01 00:00:00`을 넣었다.

```sql
INSERT INTO subscription (expire_dt) VALUES ('2040-01-01 00:00:00');
-- Query OK, 1 row affected
INSERT INTO subscription (expire_ts) VALUES ('2040-01-01 00:00:00');
-- ERROR 1292 (22007): Incorrect datetime value: '2040-01-01 00:00:00' for column 'expire_ts' at row 1
```

`TIMESTAMP`의 한계는 UTC 2038-01-19 03:14:07(서울 시각 12:14:07)이다. 그래서 시간까지 필요한 컬럼의 기본값은 `DATETIME`을 권장한다. 이유는 세 가지다.

1. **범위 제한이 없다.** `TIMESTAMP`는 내부적으로 1970년부터의 초를 32비트 정수로 저장해서 2038년 1월 19일까지만 표현한다(2038년 문제). 구독 만료일, 보증 기간, 예약일처럼 미래 날짜를 다루는 컬럼에서는 지금도 문제가 된다.
2. **값이 조용히 바뀌지 않는다.** `TIMESTAMP`는 서버나 세션의 `time_zone` 설정이 달라지면 같은 행이 다른 값으로 보인다. `DATETIME`은 넣은 값 그대로 나오므로 디버깅과 데이터 이관이 단순하다.
3. **저장 공간 차이가 미미하다.** 5바이트와 4바이트, 1바이트 차이로 위 두 위험을 감수할 이유가 없다.

그렇다면 `TIMESTAMP`는 언제 쓸까? 여러 타임존 사용자가 같은 데이터를 보는 글로벌 서비스에서 DB가 타임존을 알아서 바꿔 주길 원할 때 유용하다. 다만 실무에서는 이 경우에도 "DB에는 항상 UTC로 저장하고, 변환은 애플리케이션에서"라는 원칙으로 `DATETIME`을 쓰는 팀이 많다.

### 날짜를 VARCHAR로 선언해도 될까?

수업 자료 중에는 주문일자와 주문시간을 `VARCHAR`로 선언한 테이블(`menudb`의 `tbl_order`)이 있다. 무조건 잘못된 설계라기보다 요구사항에 따라 선택이 달라지는 영역이다.

| 구분 | 내용 |
|------|------|
| `VARCHAR`의 문제 | 날짜 연산(`DATE_ADD`, 기간 계산)마다 형변환이 필요하다. 정렬과 비교가 문자열 기준이다. `'2026-13-45'` 같은 말이 안 되는 값도 저장된다. 인덱스를 걸어도 범위 검색 효율이 떨어진다 |
| 그래도 쓰는 경우 | 외부 시스템에서 받은 값을 원본 그대로 보존해야 할 때. `'20260817'` 같은 포맷 문자열 자체가 업무상 식별자일 때. 연·월만 저장하는 등 날짜보다 코드에 가까울 때 |

원칙은 "날짜는 날짜 타입으로"다. 다만 설계는 정답을 외우는 것이 아니라 요구사항에 근거해 선택하고 그 근거를 설명할 수 있는 것이 핵심이다.

## 4. 기본값은 어떻게 지정할까?

```sql
add_date         DATE     DEFAULT (CURRENT_DATE),
created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
orderable_status CHAR(1)  DEFAULT 'Y'
```

`NOT NULL` + `DEFAULT` 조합은 값 누락을 막으면서도 데이터 흐름을 단순하게 만든다.

| 주의점 | 내용 |
|--------|------|
| 괄호 규칙 | `DATETIME`/`TIMESTAMP` 컬럼의 `DEFAULT CURRENT_TIMESTAMP`는 예외적으로 괄호 없이 쓴다. 그 외 함수나 수식은 괄호로 감싼다(`DEFAULT (CURRENT_DATE)`, `DEFAULT (UUID())`) |
| 버전 | 표현식 기본값은 8.0.13 이상에서만 지원된다 |
| `ON UPDATE` | `ON UPDATE CURRENT_TIMESTAMP`는 행이 수정될 때마다 시각을 자동 갱신하는 MySQL 고유 기능이다. `updated_at` 컬럼에 유용하다 |
| 제한 | `TEXT`와 `BLOB` 계열 컬럼은 기본값을 가질 수 없다 |

## 정리

1. 테이블명은 소문자 `snake_case` 단수형으로 짓고, 예약어 충돌은 접두어나 백틱으로 피한다. 규칙은 프로젝트 안에서 하나로 통일한다.
2. 상태값은 `ENUM` 대신 `CHAR(1)` + `CHECK`나 코드 테이블로 둔다. 시간까지 필요하면 범위 제한과 타임존 변환이 없는 `DATETIME`이 기본 선택이다.
3. `DEFAULT`는 괄호 규칙과 버전(8.0.13 이상)을 확인하고, `NOT NULL`과 함께 쓰면 값 누락을 막는다.

다음에 볼 것은 기본키, 외래키, 고유키 구현 전략과 참조 무결성 옵션이다.

## 더 학습하면 좋은 개념

- **`lower_case_table_names` 설정** — OS별 테이블명 대소문자 구분이 달라지는 원인이다. 개발 환경(Windows)과 운영 환경(Linux)이 다를 때 필요하다.
- **2038년 문제** — 32비트 정수로 시간을 저장하는 방식의 한계다. `TIMESTAMP`를 피하는 이유를 시스템 수준에서 이해할 수 있다.
- **세션 타임존(`time_zone`)** — `TIMESTAMP` 조회 결과가 바뀌는 원인이다. 글로벌 서비스의 시간 처리 설계와 연결된다.
- **`DECIMAL`과 부동소수점** — 금액에 `DECIMAL`을 쓰는 이유를 이해하려면 알아야 한다.
- **코드 테이블(참조 테이블)** — `ENUM` 대신 값 목록을 데이터로 관리하는 방법이다. 값이 자주 늘어나는 업무에서 유용하다.

## 참고 자료

- [MySQL 8.0 Reference Manual - Data Type Default Values](https://dev.mysql.com/doc/refman/8.0/en/data-type-defaults.html)
- [MySQL 8.0 Reference Manual - The DATE, DATETIME, and TIMESTAMP Types](https://dev.mysql.com/doc/refman/8.0/en/datetime.html)
- [MySQL 8.0 Reference Manual - Keywords and Reserved Words](https://dev.mysql.com/doc/refman/8.0/en/keywords.html)
- [MySQL 8.0 Reference Manual - The ENUM Type](https://dev.mysql.com/doc/refman/8.0/en/enum.html)
