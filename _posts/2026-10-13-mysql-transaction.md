---
title: "MySQL 트랜잭션 정리"
date: 2026-10-13
tags:
  - SQL
---

홍길동 계좌에서 3000원을 빼는 `UPDATE`까지 실행했는데, 김짱구 계좌에 3000원을 넣기 전에 은행 서버가 정전으로 멈췄다고 하자.  
돈은 홍길동 계좌에서 사라졌고 김짱구 계좌에는 들어가지 않았다. 이런 반쪽짜리 상태를 막는 장치가 **트랜잭션(transaction)** 이다.  
DB가 왜 필요한지, 트랜잭션이 왜 나오는지는 [이전 글]({{ site.baseurl }}/database-why-needed.html)에서 한 줄로 짚었고, 이 글에서는 계좌이체 실습으로 직접 다룬다.

> **TL;DR**
> - 트랜잭션은 여러 작업을 하나의 논리적 작업 단위로 묶는 것이다. 하나라도 잘못되면 전부 되돌리는 것이 핵심이다.
> - `start transaction`으로 시작하고, 모두 성공하면 `commit`, 일부라도 문제가 생기면 `rollback`한다.
> - 커밋 전에 `select`로 보이는 값은 영구 반영된 값이 아니다.

환경: MySQL (버전 `확인 필요`). 실습 테이블은 `accouts`이다.

> **주의**: 테이블명 `accouts`는 수업 코드의 오타(`accounts`)다. 이 글에서는 실습 코드를 그대로 쓰기 위해 `accouts`로 적는다. 직접 따라 할 때는 `accounts`로 만들어도 된다.

## 1. 왜 계좌이체는 하나의 작업으로 묶어야 할까

계좌이체는 논리적으로는 "이체" 하나지만, DB 안에서 실제로 동작하는 작업은 `UPDATE` 두 번이다.

| 순서 | 작업 | 하는 일 |
|------|------|---------|
| 1 | 홍길동 계좌 차감 | `balance`에서 3000을 뺀다 |
| 2 | 김짱구 계좌 증액 | `balance`에 3000을 더한다 |

1번과 2번 사이에 문제(정전 같은)가 생기면 돈이 사라진다.  
그래서 두 작업을 하나로 묶고, **둘 중 하나라도 잘못되면 처음 상태로 되돌려야** 한다. 이것이 트랜잭션의 핵심이다.

## 2. 실습 준비: 테이블과 초기 데이터

```sql
create table accouts(
    id int primary key,
    owner varchar(50),
    balance decimal(10,2)
);

insert into accouts(id, owner, balance)
values (1, '홍길동', 10000.00), (2, '김짱구', 5000.00);
```

시작 잔액은 홍길동 10000, 김짱구 5000이다.

## 3. 트랜잭션을 제어하는 세 가지 명령

| 명령 | 역할 |
|------|------|
| `start transaction` | 트랜잭션을 시작한다 |
| `commit` | 지금까지의 작업을 모두 성공으로 보고 반영한다 |
| `rollback` | 시작 시점의 상태로 되돌린다 |

## 4. 정상 흐름: 둘 다 성공하면 commit

```sql
start transaction;

-- 홍길동 계좌 3000원 차감
update accouts
set balance = balance - 3000
where id = 1;

-- 김짱구 계좌 3000원 증액
update accouts
set balance = balance + 3000
where id = 2;

-- 중간 확인 (영구 반영이 아니다)
select * from accouts;

-- 모든 작업이 성공했으므로 반영
commit;

select * from accouts;
```

흐름을 단계로 보면 다음과 같다.

1. `start transaction`으로 트랜잭션을 시작한다.
2. 홍길동 계좌를 차감한다. (10000 → 7000)
3. 김짱구 계좌를 증액한다. (5000 → 8000)
4. `select`로 중간 확인을 한다. 7000, 8000으로 보이지만 아직 확정된 값이 아니다.
5. `commit`으로 확정한다. 이후 `select`의 7000, 8000은 영구 반영된 값이다.

### 헷갈리기 쉬운 점: 중간 select는 영구 반영이 아니다

수업 코드의 주석에도 "주의: 영구 반영이 아니다"라고 적혀 있다.  
`commit` 전의 `select` 결과는 트랜잭션 안에서 본 임시 상태다. `rollback`을 하면 그 값은 사라진다. 중간에 값이 바뀐 것을 봤다고 해서 저장이 끝났다고 판단하면 안 된다.

## 5. 비정상 흐름: 일부가 잘못되면 rollback

이번에는 없는 계좌(`id = 99`)로 이체하는 상황이다. 앞의 정상 흐름이 끝난 뒤(홍길동 7000, 김짱구 8000)에 이어서 실행한다고 가정한다.

```sql
start transaction;

-- 홍길동 계좌 3000원 차감
update accouts
set balance = balance - 3000
where id = 1;

-- 중간 점검
select * from accouts;

-- 없는 계좌 3000원 증액
update accouts
set balance = balance + 3000
where id = 99;

-- 중간 확인 (영구 반영이 아니다)
select * from accouts;

-- 일부 작업에 문제가 있었으므로 되돌린다
rollback;

select * from accouts;
```

| 단계 | 홍길동(id 1) | 김짱구(id 2) | 설명 |
|------|-------------|-------------|------|
| 시작 전 | 7000 | 8000 | 정상 흐름이 끝난 상태 |
| 첫 번째 `update` 후 | 4000 | 8000 | 홍길동 계좌만 차감됨 |
| `id = 99` `update` 후 | 4000 | 8000 | 대상 행이 없어서 아무도 바뀌지 않음 |
| `rollback` 후 | 7000 | 8000 | 트랜잭션 시작 전 상태로 복구 |

### 에러가 나지 않는데 왜 rollback이 필요할까

`id = 99`인 계좌는 없으므로, 이 `update`는 에러가 아니라 **0 rows affected(적용된 행 0개)** 로 조용히 끝난다.  
DB 입장에서는 문제 없이 실행된 쿼리라서, 아무 조치를 하지 않으면 홍길동 계좌에서 3000원이 빠진 채로 남을 수 있다. 에러가 없어도 "이체가 의도대로 끝나지 않았다"고 판단하는 것은 결국 사용하는 쪽의 몫이고, 그때 `rollback`으로 되돌린다.

## 6. 처음의 정전 문제는 어떻게 되는가

정전 상황은 첫 번째 `update` 이후 `commit` 전에 작업이 끊기는 경우다. `commit`을 하지 않은 변경은 확정되지 않은 상태이므로, 두 `update`를 `start transaction`과 `commit`으로 묶어 두면 "차감만 반영된 상태"가 남지 않게 설계할 수 있다. 연결이 끊겼을 때 MySQL이 정확히 어떻게 처리하는지는 공식 문서에서 `확인 필요`다.

## 정리

- 계좌이체처럼 논리적으로 하나인 작업이 여러 `UPDATE`로 나뉠 때는 `start transaction`으로 묶는다.
- 모두 성공하면 `commit`, 일부라도 이상하면 `rollback`한다. 0 rows affected처럼 에러 없이 끝나는 문제도 있어서 결과를 확인하고 판단해야 한다.
- 커밋 전 `select` 결과는 영구 반영된 값이 아니다.

다음에는 아래 개념들을 이어서 보면 좋다.

## 더 학습하면 좋은 개념

- **ACID** — 트랜잭션이 보장해야 하는 네 가지 성질(원자성, 일관성, 격리성, 지속성)이다. 이 글의 "전부 성공 아니면 전부 취소"가 원자성이므로, 전체 그림을 이해하는 출발점이 된다.
- **격리 수준(Isolation Level)** — 동시에 실행되는 트랜잭션이 서로의 중간 상태를 얼마나 볼 수 있는지 정하는 설정이다. 커밋 전 값이 다른 사용자에게 어떻게 보이는지 이해하려면 필요하다.
- **데드락(Deadlock)** — 두 트랜잭션이 서로가 가진 잠금을 기다리며 멈추는 상황이다. 계좌이체처럼 여러 행을 수정하는 작업에서 실제로 마주칠 수 있다.
- **autocommit** — 트랜잭션을 명시하지 않으면 각 SQL 문이 즉시 커밋되는 MySQL의 동작이다. `start transaction` 없이 실행한 `update`가 왜 되돌려지지 않는지 설명해 준다.

## 참고 자료

- [MySQL 8.0 Reference Manual - START TRANSACTION, COMMIT, and ROLLBACK Statements](https://dev.mysql.com/doc/refman/8.0/en/commit.html)
- [MySQL 8.0 Reference Manual - InnoDB Autocommit, Commit, and Rollback](https://dev.mysql.com/doc/refman/8.0/en/innodb-autocommit-commit-rollback.html)
