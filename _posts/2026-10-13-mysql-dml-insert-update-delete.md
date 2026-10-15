---
title: "MySQL DML 정리"
date: 2026-10-13
tags:
  - SQL
---

`users` 테이블에서 한 사람의 이름만 바꾸려고 `update`를 실행했는데, 모든 회원의 이름이 같은 값으로 바뀌어 버렸다면 어떻게 될까.  
수업에서 `WHERE` 없이 실행한 `update users set name='조평훈';` 한 줄이 바로 이 상황이다.  
데이터를 넣고(`INSERT`), 고치고(`UPDATE`), 지우는(`DELETE`) DML을 실습하면서 만난 에러와 위험한 쿼리를 정리했다.

> **TL;DR**
> - `INSERT`가 실패하면 쿼리 문법보다 먼저 테이블의 **제약조건**과 **데이터 타입**을 확인한다.
> - `UPDATE`와 `DELETE`는 `WHERE`가 없으면 전체 행이 대상이다. 조건은 PK나 UNIQUE 컬럼으로 1행을 식별하도록 건다.
> - 자식 테이블이 참조 중인 부모 테이블의 행은 삭제할 수 없다. 고아 데이터를 막기 위한 외래키 제약조건 때문이다.

환경: MySQL (버전 `확인 필요`). 실습 테이블은 `users`, `courses`이고, 쿼리 실행 결과와 에러 메시지 원문은 이 글에 옮기지 않았다. 에러는 종류만 적는다.

## 1. DML은 무엇이고, 왜 에러가 많이 날까

DML(Data Manipulation Language)은 데이터 조작 언어이다. 이 글에서는 `INSERT`, `UPDATE`, `DELETE` 세 가지를 다룬다.  
`SELECT`는 데이터를 읽기만 하지만 DML은 데이터를 바꾼다. 그래서 테이블에 걸어 둔 제약조건이 DML 실행 시점에 검사된다.

수업 코드의 주석에도 같은 말이 있다. 데이터를 삽입할 때 에러가 아주 많이 발생하고, 그때 확인할 것은 **테이블의 제약조건과 데이터 타입**이라는 내용이다.  
`desc users;`로 컬럼의 타입과 `NULL` 허용 여부, 키 정보를 먼저 보는 습관이 여기서 나온다.

## 2. INSERT: 기본 문법과 4가지 에러 케이스

기본 형태는 `insert into 테이블명 (컬럼명...) values (넣을 값...)`이다.

```sql
select * from users;
desc users;

insert into users (`email`, `name`)
values ('email@gmail.com', '조평훈');
```

컬럼 목록과 값 목록은 순서와 개수가 서로 대응해야 한다. 이제 같은 방식으로 일부러 문제를 일으켜 본 4가지 케이스를 본다.

### 케이스 1. UNIQUE 제약조건 위반

이미 들어 있는 이메일로 다른 사람을 넣으려는 경우이다. `email` 컬럼은 중복을 허용하지 않는다.

```sql
insert into users (`email`, `name`)
values ('email@gmail.com', '조평순');
```

### 케이스 2. NOT NULL 제약조건 위반

`name` 컬럼은 반드시 값이 있어야 한다. 컬럼 목록에서 `name`을 빼면 값이 비게 되므로 실패한다.

```sql
insert into users (`email`)
values ('email2@gmail.com');
```

### 케이스 3. 에러가 나지 않는 예외: 정수가 문자열로 바뀐다

이 케이스는 에러가 **나지 않는 것**이 문제이다. 이름 자리에 정수 `123`을 넣어도 DB가 `''`를 붙인 문자열로 자동 형변환해서 그대로 저장한다.

```sql
insert into users (`email`, `name`)
values ('email2@gmail.com', 123);
```

DB는 타입이 호환되면 조용히 바꿔서 넣는다. 이름에 숫자가 들어오는 상황을 막는 일은 DB가 아니라 프런트엔드와 백엔드의 입력 검증이 맡아야 한다는 것이 수업의 결론이었다.

### 케이스 4. 외래키 참조 무결성 위반

`courses`의 `author_id`는 `users`의 회원을 가리키는 외래키이다. `users`에 없는 회원 번호 999를 넣으면 실패한다.

```sql
-- 존재하는 회원(1)을 가리키는 경우
insert into courses (`author_id`, `title`, `description`)
values (1, 'SQL 제약조건!', '제약조건을 확인해보아요~');

-- 존재하지 않는 회원(999)을 가리키는 경우
insert into courses (`author_id`, `title`, `description`)
values (999, 'SQL 제약조건!', '제약조건을 확인해보아요~');
```

작성자가 없는 강의가 생기지 않도록 DB가 막아 주는 것이다. 이렇게 부모가 없는 자식 데이터를 **고아 데이터**라고 부르며, 외래키 제약조건은 이것을 방지한다.

### 증상, 원인, 해결 한눈에 보기

| 케이스 | 증상 | 원인 (제약조건 / 데이터 타입) | 해결 |
|--------|------|------------------------------|------|
| UNIQUE 위반 | 중복 이메일 삽입이 거부된다 | `email` 컬럼의 UNIQUE 제약조건 | 기존 값과 겹치지 않는 값을 넣는다 |
| NOT NULL 위반 | `name` 없이 삽입하면 거부된다 | `name` 컬럼의 NOT NULL 제약조건 | 컬럼 목록에 `name`을 포함하고 값을 채운다 |
| 정수 `123` 삽입 | 에러 없이 저장된다 | 문자열 컬럼에 정수가 들어오면 DB가 문자열로 자동 형변환한다 | 입력값 검증을 프런트엔드와 백엔드에서 한다 |
| 외래키 위반 | 없는 회원(999)을 가리키면 거부된다 | `author_id`의 외래키 참조 무결성 | `users`에 존재하는 `user_id`를 넣거나, 부모 행을 먼저 만든다 |

## 3. UPDATE: WHERE 없이 실행하면 어떻게 될까

기본 형태는 `update 테이블명 set 컬럼명 = 수정할 값`이다. 수정과 삭제에서 가장 먼저 떠올려야 할 것은 `WHERE` 조건절이다.

```sql
-- 위험: WHERE가 없다
update users set `name` = '조평훈';
```

이 쿼리는 특정 행을 가리키지 않으므로 `users`의 **모든 행**의 `name`을 바꾼다. 의도가 한 명이었다면 데이터가 전부 망가진 것이다.

```sql
-- 안전: PK로 1행만 지정
update users set `name` = '조평순' where `user_id` = 1;
```

수업에서는 `WHERE`에 1개의 행을 식별할 수 있는 유일한 값, 즉 PK나 UNIQUE 컬럼으로 조건을 거는 것을 권장했다. `name`처럼 중복될 수 있는 컬럼으로 조건을 걸면 동명이인이 함께 바뀔 수 있기 때문이다.

한계도 있다. `WHERE`를 썼다고 해서 항상 안전한 것은 아니며, 조건이 맞는 행이 의도한 행인지는 먼저 `select`로 확인하는 편이 좋다. 이 확인 절차는 수업 코드에는 없는 보충 내용이다.

## 4. DELETE: 부모 테이블의 행은 왜 지워지지 않을까

기본 형태는 `delete from 테이블명`이고, 역시 `WHERE`가 핵심이다.

```sql
delete from users where email = 'email@gmail.com';
```

`WHERE`를 빼면 `UPDATE`와 마찬가지로 모든 행이 대상이 된다. 이메일은 UNIQUE이므로 이 조건은 1행만 가리킨다.

그런데 아래 쿼리는 거부된다.

```sql
delete from users where user_id = 1;

select * from courses;
```

`users.user_id`는 `courses.author_id`에 외래키로 주어지고 있고, 1번 회원이 쓴 강의가 `courses`에 남아 있기 때문이다. 부모의 행을 지우면 자식의 행이 가리킬 곳을 잃고 고아 데이터가 된다. DB는 이를 막기 위해 삭제를 거부한다.

### 부모 테이블과 자식 테이블

| 구분 | 의미 | 이 글의 예시 |
|------|------|-------------|
| 부모 테이블 | 외래키를 **주는** 테이블 (참조되는 쪽) | `users` (`user_id`) |
| 자식 테이블 | 외래키를 **받는** 테이블 (참조하는 쪽) | `courses` (`author_id`) |

이 관계로 정리하면 INSERT와 DELETE의 방향이 대칭이다.

| 작업 | 대상 | 거부되는 경우 |
|------|------|---------------|
| INSERT | 자식(`courses`) | 부모(`users`)에 없는 값을 넣을 때 |
| DELETE | 부모(`users`) | 자식(`courses`)이 아직 참조 중일 때 |

따라서 부모 행을 지우려면 먼저 그 행을 참조하는 자식 행을 정리해야 한다. 자식 행을 어떻게 정리할지는 이 글 범위 밖이다.

## 정리

1. `INSERT` 에러는 제약조건(UNIQUE, NOT NULL, 외래키)과 데이터 타입에서 찾는다. 타입이 호환되면 `123`처럼 조용히 형변환되므로, 이런 검증은 프런트엔드와 백엔드의 몫이다.
2. `UPDATE`와 `DELETE`는 `WHERE`를 먼저 쓴다. 조건은 PK나 UNIQUE처럼 1행을 가리키는 컬럼으로 건다.
3. 자식 테이블이 참조하는 부모 테이블의 행은 지울 수 없다. 외래키가 고아 데이터를 막아 준다.

다음에는 이 DML 위에서 동작하는 트랜잭션(`start transaction`, `commit`, `rollback`)을 정리한다.

## 더 학습하면 좋은 개념

- **트랜잭션(Transaction)** — 여러 DML을 하나의 작업 단위로 묶고, 문제가 생기면 `rollback`으로 되돌리는 기능이다. `WHERE` 실수 같은 사고에 대비하는 방법을 이해할 수 있다.
- **외래키의 ON DELETE 옵션** — 부모 행을 지울 때 자식 행을 어떻게 처리할지 정하는 옵션이다. 삭제가 거부되는 기본 동작 외의 선택지를 알아 두면 설계 폭이 넓어진다.
- **SQL 모드와 형변환(Strict mode)** — 타입이 맞지 않는 값을 DB가 허용할지 정하는 설정이다. `123`이 문자열로 들어간 이유를 DB 설정 관점에서 설명해 준다.
- **인덱스와 DML 성능** — 인덱스는 `SELECT`를 빠르게 하지만 `INSERT`, `UPDATE`, `DELETE`에서는 인덱스도 함께 고쳐야 해서 느려진다. DML이 많은 테이블에서 인덱스를 어디에 걸지 판단하는 기준이 된다.

## 참고 자료

- [MySQL 8.0 Reference Manual - INSERT Statement](https://dev.mysql.com/doc/refman/8.0/en/insert.html)
- [MySQL 8.0 Reference Manual - UPDATE Statement](https://dev.mysql.com/doc/refman/8.0/en/update.html)
- [MySQL 8.0 Reference Manual - DELETE Statement](https://dev.mysql.com/doc/refman/8.0/en/delete.html)
- [MySQL 8.0 Reference Manual - FOREIGN KEY Constraints](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html)
- [MySQL 8.0 Reference Manual - Constraints](https://dev.mysql.com/doc/refman/8.0/en/constraints.html)
