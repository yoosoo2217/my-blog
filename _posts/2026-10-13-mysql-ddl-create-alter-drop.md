---
title: "MySQL DDL 정리: CREATE TABLE, 제약조건, ALTER, DROP과 TRUNCATE 차이"
date: 2026-10-13
tags:
  - SQL
---

테이블을 만들 때 컬럼 이름만 나열하면 끝일까? 규칙 없이 만든 테이블에는 '나이' 칸에 '스무살'이라는 글자도, 같은 이메일도, 존재하지 않는 회원의 글도 그대로 들어간다.  
그래서 DDL(Data Definition Language, 데이터 정의 언어)은 칸을 나누는 문법이 아니라 **데이터가 지켜야 할 규칙을 정하는 문법**이다.  
`CREATE`로 테이블을 만들고, `ALTER`로 구조를 바꾸고, `DROP`과 `TRUNCATE`로 지우는 흐름을 실습 쿼리와 함께 정리했다.

> **TL;DR**
> - 데이터 타입은 칸에 들어갈 값의 종류를, 제약조건은 값 사이의 논리적인 규칙을 DB가 직접 강제하게 만든다.
> - 외래키가 걸린 부모-자식 테이블은 자식(`tb2`)을 먼저 지워야 한다. 수업 코드는 `tb1`부터 지웠는데 이 순서는 `확인 필요`다.
> - `DROP`은 구조와 데이터를 모두 지우고, `TRUNCATE`는 구조를 남기고 데이터만 지운다.

환경: MySQL (버전 `확인 필요`). 실습에는 기존 `courses` 테이블과 새로 만든 `tb1`, `tb2`, `courses_temp`를 썼다. 각 쿼리의 실행 결과는 이 글에 옮기지 않았다.

## 1. 데이터 타입은 왜 필요할까

데이터 타입은 각 열(Column)에 **어떤 종류의 데이터만 저장할 수 있는지** 정하는 규칙이다. '나이' 열에 '스무살'이라는 글자가 들어가는 것을 처음부터 막아 데이터가 오염되는 것을 방지한다. 또 데이터 종류에 맞는 공간만 사용하므로 저장 효율도 높아진다.

| 데이터 타입 | 저장하는 값 | 예시 컬럼 |
|-------------|-------------|-----------|
| `INT` / `BIGINT` | 정수(Integer) | `user_id`, `author_id` |
| `VARCHAR(n)` | 최대 n글자의 변수 길이 문자열(Variable Character) | `email`, `name` |
| `TEXT` | 매우 긴 텍스트 | `description`, `content` |
| `DATE` | 날짜 (`YYYY-MM-DD`) | - |
| `DATETIME` / `TIMESTAMP` | 날짜와 시간 (`YYYY-MM-DD HH:MI:SS`) | `created_at` |

## 2. 제약조건은 왜 필요할까

데이터 타입만으로는 "이 칸은 비워두면 안 된다", "이 값은 중복되면 안 된다" 같은 **데이터 사이의 논리적인 규칙**을 지킬 수 없다. 제약조건(Constraints)은 이런 규칙을 DB가 스스로 검사하게 만든다. 수업에서는 이를 데이터의 정합성을 지키는 '자동 경찰'이라고 표현했다.

| 제약조건 | 하는 일 | 필요한 이유 |
|----------|---------|-------------|
| `NOT NULL` | 해당 열에 NULL이 들어올 수 없게 한다 | 필수 입력 값이 비어 저장되는 것을 막는다 |
| `UNIQUE` | 열의 모든 값이 테이블 안에서 유일하도록 보장한다 | 같은 이메일이 중복 가입되는 것을 막는다 |
| `PRIMARY KEY` (기본 키) | `NOT NULL`과 `UNIQUE`를 모두 가진 테이블의 대표 식별자다 | 행 하나를 정확히 가리킬 기준이 필요하다 |
| `FOREIGN KEY` (외래 키) | 다른 테이블의 기본 키를 참조해 테이블 간 관계를 맺는다 | 참조하는 값이 실제로 존재하도록 일관성을 보장한다 |
| `DEFAULT` | 값을 입력하지 않았을 때 쓸 기본값을 정한다 | 매번 같은 값을 직접 넣지 않아도 된다 |

## 3. CREATE TABLE: 부모 테이블 tb1 만들기

컬럼명, 데이터 타입, 제약조건 순서로 적는다. `comment`로 컬럼과 테이블에 설명을 남길 수 있다.

```sql
create table tb1(
    user_id int primary key,
    user_pwd varchar(12) not null comment '사용자 비밀번호',
    email varchar(30) not null unique comment '이메일',
    user_status varchar(10) default 'active' comment '계정 활성 상태',
    created_at timestamp not null default current_timestamp comment '가입 일시'
) comment '서비스 유저 정보 테이블';

describe tb1;
```

| 컬럼 | 적용한 규칙 | 의미 |
|------|-------------|------|
| `user_id` | `int primary key` | 정수 대표 식별자 |
| `user_pwd` | `varchar(12) not null` | 최대 12글자, 비워둘 수 없음 |
| `email` | `varchar(30) not null unique` | 비워둘 수 없고 중복 불가 |
| `user_status` | `default 'active'` | 입력이 없으면 `active` |
| `created_at` | `timestamp not null default current_timestamp` | 입력이 없으면 현재 시각 |

`describe tb1;`로 만들어진 구조를 확인한다.

## 4. 외래키: 자식 테이블 tb2 만들기

`tb2`는 `tb1`을 부모로 삼는다. `author_id` 컬럼을 외래키로 지정하고 `tb1`의 `user_id`를 참조하게 했다.

```sql
create table tb2(
    user_id int primary key,
    author_id int not null comment 'tb1 에서 전달 받는 외래키',
    user_pwd varchar(12) not null comment '사용자 비밀번호',
    email varchar(30) not null unique comment '이메일',
    user_status varchar(10) default 'active' comment '계정 활성 상태',
    created_at timestamp not null default current_timestamp comment '가입 일시',
    foreign key(`author_id`) references `tb1`(`user_id`)
) comment '서비스 유저 정보 테이블2';

describe tb2;
```

마지막 줄의 의미는 두 부분으로 나뉜다.

* `foreign key(author_id)` : `tb2`의 `author_id` 컬럼을 외래키로 지정한다.
* `references tb1(user_id)` : 이 외래키는 부모 테이블 `tb1`의 `user_id`를 참조한다.

부모 테이블에 없는 `user_id`를 자식 테이블에 입력하려고 하면 DB가 자동으로 차단한다. 이것이 **참조 무결성**을 지키는 방식이다. 용어는 외래키를 주는 `tb1`이 부모 테이블, 받는 `tb2`가 자식 테이블이다.

## 5. tb1을 먼저 drop하면 안 되는 이유

수업 코드는 아래 순서로 테이블을 지웠다.

```sql
-- tb1 테이블은 tb2 테이블에 user_id 라는 컬럼을 제공하고 있다.
drop table tb1;

drop table tb2;
```

여기에는 짚어야 할 점이 있다. `tb2`가 `tb1`의 `user_id`를 참조하고 있으므로, 부모인 `tb1`을 먼저 지우면 자식이 가리키는 대상이 사라진다. 참조 무결성 규칙을 생각하면 **자식 `tb2`를 먼저 지우고 부모 `tb1`을 나중에 지우는 것**이 맞는 순서다.

```sql
-- 외래키 관계를 고려한 순서 (확인 필요: 실제 실행 결과는 수업에서 기록하지 않았다)
drop table tb2;
drop table tb1;
```

수업 코드의 순서대로 실행했을 때 어떤 결과가 나왔는지는 기록이 없어서 `확인 필요`로 남긴다. 같은 이유로 DML 실습에서도 부모 테이블의 값을 삭제하면 자식 테이블 데이터가 고아 데이터가 되기 때문에 삭제가 거부되는 사례가 나온다.

## 6. ALTER TABLE: 만들어 둔 테이블의 구조 바꾸기

`alter table`은 이미 만들어진 테이블을 수정하는 명령어다. 실습하려고 기존 `courses` 테이블을 복제한 임시 테이블 `courses_temp`를 먼저 만들었다. 원본을 건드리지 않고 연습하기 위해서다.

```sql
-- courses 테이블을 복제한 임시 테이블 생성
create table courses_temp as select * from courses;

desc courses_temp;
```

컬럼 추가, 수정, 삭제를 차례로 실행하고 매번 `desc`로 구조를 확인했다.

| 작업 | 쿼리 |
|------|------|
| 컬럼 추가 | `alter table courses_temp add column price int not null default 0;` |
| 컬럼 수정 | `alter table courses_temp modify column price varchar(200) not null default '0원';` |
| 컬럼 삭제 | `alter table courses_temp drop column price;` |

```sql
-- price 컬럼을 추가
alter table courses_temp
add column price int not null default 0;

-- price 컬럼을 수정 (int -> varchar(200), 기본값 '0원')
alter table courses_temp
modify column price varchar(200) not null default '0원';

-- price 컬럼을 삭제
alter table courses_temp
drop column price;
```

수정 단계에서는 타입(`int` → `varchar(200)`)과 기본값(`0` → `'0원'`)이 함께 바뀐다. `modify`는 컬럼 정의 전체를 다시 적는 방식이다.

## 7. DROP과 TRUNCATE: 지운다는 말의 두 가지 의미

둘 다 테이블 데이터를 제거하지만 남는 것이 다르다.

| 항목 | `DROP` | `TRUNCATE` |
|------|--------|------------|
| 테이블 구조 | 삭제된다 | 남는다 |
| 테이블 데이터 | 삭제된다 | 삭제된다 |
| 삭제 후 상태 | 테이블 자체가 없다 | 빈 테이블이 남는다 |
| 장점 | 매우 빠르다 | 구조는 그대로 두고 데이터만 비운다 |
| 주의점 | 롤백이 불가능하므로 신중히 써야 한다 | - |

```sql
select * from courses_temp;

-- 구조는 남기고 데이터만 삭제
truncate table courses_temp;

-- 데이터와 구조 자체를 영구 삭제
drop table courses_temp;
```

`truncate` 후에는 `courses_temp`가 빈 테이블로 남고, `drop` 후에는 테이블이 사라진다. 임시 테이블 실습이 끝나면 마지막에 `drop`으로 정리했다.

## 정리

* 테이블을 만든다는 것은 데이터 타입과 제약조건으로 **데이터가 지킬 규칙을 설계하는 일**이다.
* 외래키는 부모를 참조하므로 부모-자식 관계의 테이블은 **자식부터 지우는 순서**를 지켜야 한다. 수업 코드의 순서는 `확인 필요`다.
* `ALTER`는 구조를 바꾸고, `DROP`은 구조까지, `TRUNCATE`는 데이터만 지운다.

다음에는 데이터를 넣고 고치고 지우는 DML(`INSERT`, `UPDATE`, `DELETE`)을 정리한다.

## 더 학습하면 좋은 개념

- **참조 무결성과 외래키 옵션 (`ON DELETE`, `ON UPDATE`)** — 부모 행을 지우거나 바꿀 때 자식 행을 어떻게 처리할지 정하는 설정이다. 삭제가 거부되는 이유와 대안을 이해할 수 있다.
- **트랜잭션과 롤백** — `DROP`이 롤백되지 않는 이유를 이해하려면 DML과 DDL이 트랜잭션에서 어떻게 다른지 알아야 한다.
- **`DELETE`와 `TRUNCATE`의 차이** — 둘 다 행을 지우지만 동작 방식이 달라서, 데이터를 비울 때 어떤 것을 쓸지 판단하는 기준이 된다.
- **인덱스 (`PRIMARY KEY`, `UNIQUE`와 인덱스의 관계)** — 제약조건이 조회 성능과 어떻게 연결되는지 이해하는 데 필요하다.
- **데이터 타입 선택 기준 (`VARCHAR` 길이, `TIMESTAMP`와 `DATETIME`)** — 타입 선택이 저장 공간과 데이터 품질에 영향을 주므로 설계 단계에서 근거를 갖고 고를 수 있다.

## 참고 자료

- [MySQL 8.0 Reference Manual - CREATE TABLE Statement](https://dev.mysql.com/doc/refman/8.0/en/create-table.html)
- [MySQL 8.0 Reference Manual - ALTER TABLE Statement](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html)
- [MySQL 8.0 Reference Manual - Data Types](https://dev.mysql.com/doc/refman/8.0/en/data-types.html)
