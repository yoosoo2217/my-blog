---
title: "MySQL VIEW 정리"
date: 2026-10-13
tags:
  - SQL
---

분석팀은 매일 '과정별 등록 학생 수'를 확인하려고 `enrollments` 테이블에 `LEFT JOIN`과 `GROUP BY`가 들어간 긴 쿼리를 매번 작성한다.  
한편 마케팅팀에는 사용자의 전체 정보를 넘기고 싶지 않고, 실제로 쓰는 이메일과 이름만 전달하고 싶다.  
두 문제를 한 번에 풀어 주는 것이 **뷰(View)**, 즉 쿼리에 이름을 붙여 저장해 둔 가상의 테이블이다.

> **TL;DR**
> - 뷰는 `create view 뷰이름 as 쿼리문`으로 만들고, 이후에는 테이블처럼 `select`로 조회한다.
> - 뷰를 쓰는 이유는 편의성, 보안성, 가독성이다. 조회 속도가 빨라진다는 설명은 `확인 필요`다.
> - 삭제는 `drop view`, 수정은 `create or replace view`로 한다.

환경: MySQL (버전 `확인 필요`). 실습 테이블은 `courses`, `enrollments`이고, 쿼리 실행 결과는 이 글에 옮기지 않았다.

## 1. 뷰는 왜 필요할까

뷰는 쿼리문을 이름 붙여 저장해 두고, 테이블처럼 꺼내 쓰는 가상의 테이블이다. 수업에서 사용한 시나리오는 아래와 같다.

| 팀 | 필요한 것 | 뷰로 해결하는 방법 |
|------|-----------|-------------------|
| LMS 데이터 분석팀 | '과정별 등록 학생 수' 통계를 매일 확인한다 | 통계 쿼리를 뷰로 만들어 두고 `select`만 한다 |
| LMS 마케팅팀 | 사용자 전체 정보가 아니라 이메일과 이름만 필요하다 | 이메일과 이름 컬럼만 담은 뷰를 전달한다 |

수업에서 정리한 뷰를 쓰는 이유는 세 가지다.

| 이유 | 설명 | 비고 |
|------|------|------|
| 편의성 | 복잡한 쿼리를 뷰로 만들면 이후에는 하나의 간단한 테이블처럼 조회할 수 있다 | - |
| 보안성 | 원본 테이블의 민감한 정보를 숨기고, 허용된 컬럼으로만 구성한 뷰를 제공해 테이블 접근을 숨길 수 있다 | - |
| 가독성과 속도 | 사용 빈도가 높은 컬럼만 담을 수 있어 가독성이 높고, 모든 컬럼을 조회할 필요가 사라져 조회 속도가 빨라진다 | 속도는 `확인 필요` |

> **속도 항목은 단정하지 않았다 (`확인 필요`).** 수업 자료에는 "조회 속도가 빨라진다"고 적혀 있다. 하지만 일반적인 뷰는 데이터를 따로 저장하지 않고 저장된 쿼리로 동작한다. 그래서 뷰를 만드는 것만으로 속도가 빨라진다고 보기는 어렵다. 필요한 컬럼만 조회해서 줄어드는 부분은 있을 수 있지만, 정확한 동작은 [MySQL 공식 문서](https://dev.mysql.com/doc/refman/8.0/en/create-view.html)로 확인해야 한다.

## 2. 뷰를 만들고 조회하기

뷰를 만드는 표현식은 아래와 같다.

```sql
create view 뷰이름 as 쿼리문;
```

분석팀의 '과정별 등록 학생 수' 쿼리를 뷰로 만들었다. 과정(`courses`)을 기준으로 수강 신청(`enrollments`)을 `left join`하고, 과정별로 묶어서 센다.

```sql
create view v_coureses_stats as
select
    c.course_id,
    c.title,
    count(e.enrollment_id) as '등록 학생 수'
from
    courses as c
left join
    enrollments as e on c.course_id = e.course_id
group by c.course_id, c.title;
```

> **주의: 뷰 이름 `v_coureses_stats`는 수업 코드의 오타다.** `courses`가 맞지만, 수업 코드와 맞추기 위해 이 글에서도 그대로 사용한다. 직접 만들 때는 `v_courses_stats`처럼 올바른 철자를 쓰는 편이 좋다.

만든 뒤에는 일반 테이블처럼 조회한다. 긴 쿼리를 다시 쓰지 않아도 된다.

```sql
select * from v_coureses_stats;
```

## 3. 뷰에 WHERE 조건 걸기

뷰도 테이블처럼 `where`를 걸 수 있다. 등록 학생 수가 3명 이상인 과정의 id, title, 학생 수를 조회하는 문제는 이렇게 푼다.

```sql
select
    *
from
    v_coureses_stats
where
    `등록 학생 수` >= 3;
```

뷰 안에서 `count(...) as '등록 학생 수'`로 붙인 별칭이 뷰의 컬럼 이름이 된다. 그래서 뷰를 조회할 때는 이 이름을 그대로 `where`에 쓸 수 있다. 컬럼 이름에 공백이 있으므로 백틱(`` ` ``)으로 감쌌다.

## 4. 뷰를 삭제하고 수정하기

뷰 삭제는 `drop view`로 한다.

```sql
drop view v_coureses_stats;
```

뷰 수정은 `create or replace view 뷰이름 as 쿼리문` 형태다. 같은 이름의 뷰가 있으면 새 쿼리로 바꾸고, 없으면 새로 만든다. 수업에서는 `c.status` 컬럼을 추가하는 수정을 했다.

```sql
create or replace view v_coureses_stats as
select
    c.course_id,
    c.title,
    c.status,
    count(e.enrollment_id) as '등록 학생 수'
from
    courses as c
left join
    enrollments as e on c.course_id = e.course_id
group by c.course_id, c.title;

select * from v_coureses_stats;
```

| 작업 | 문법 | 비고 |
|------|------|------|
| 생성 | `create view 뷰이름 as 쿼리문` | 같은 이름이 이미 있으면 에러가 날 수 있다 (`확인 필요`) |
| 삭제 | `drop view 뷰이름` | - |
| 수정 | `create or replace view 뷰이름 as 쿼리문` | 같은 이름이 있으면 교체한다 |

> **수정판 쿼리는 실행 가능 여부가 `확인 필요`다.** `c.status`를 `select`에 넣었는데 `group by`에는 `c.course_id, c.title`만 있다. MySQL의 `ONLY_FULL_GROUP_BY` 모드가 켜져 있으면 에러가 날 수 있다. 에러를 피하려면 `group by c.course_id, c.title, c.status`처럼 `status`를 `group by`에 포함하는 방법을 생각해 볼 수 있다. 이 변경도 직접 실행해서 확인하지는 않았다.

## 정리

1. 뷰는 쿼리를 저장해 둔 가상의 테이블이다. 만든 뒤에는 `select`와 `where`를 테이블처럼 쓴다.
2. 뷰를 쓰는 이유는 편의성(복잡한 쿼리 대신 조회 한 줄), 보안성(허용한 컬럼만 공개), 가독성이다. 속도 향상은 공식 문서로 확인이 필요하다.
3. 생성은 `create view`, 삭제는 `drop view`, 수정은 `create or replace view`다.

다음에 볼 것은 인덱스(Index)다. 뷰가 쿼리를 편하게 쓰기 위한 도구라면, 인덱스는 조회 성능 자체를 다루는 기능이다.

## 더 학습하면 좋은 개념

- **`ONLY_FULL_GROUP_BY` SQL 모드** — `select`에 있는 컬럼이 `group by`에 없을 때 MySQL이 어떻게 반응하는지를 결정한다. 수정판 뷰가 실행되는지 판단하려면 이 모드를 알아야 한다.
- **뷰 알고리즘(MERGE / TEMPTABLE)** — MySQL이 뷰를 어떻게 처리하는지 정하는 방식이다. 뷰가 성능에 미치는 영향을 단정하지 않고 판단하려면 필요하다.
- **갱신 가능한 뷰(Updatable View)** — 뷰를 통해 `insert`, `update`, `delete`를 할 수 있는 조건이다. 보안 목적으로 뷰를 줄 때 쓰기 권한까지 열리는지 알아야 한다.
- **권한 관리(`GRANT`)** — 뷰만 조회할 수 있고 원본 테이블은 조회할 수 없게 설정하는 방법이다. 뷰의 보안성은 권한을 함께 설정해야 의미가 있다.
- **인덱스(Index)** — 조회 속도를 실제로 좌우하는 기능이다. 뷰 대신 속도 문제를 해결하는 수단이 무엇인지 비교하려면 알아야 한다.

## 참고 자료

- [MySQL 8.0 Reference Manual - CREATE VIEW Statement](https://dev.mysql.com/doc/refman/8.0/en/create-view.html)
