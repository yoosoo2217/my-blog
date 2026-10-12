---
title: "MySQL SELECT 기초 정리: WHERE, ORDER BY, GROUP BY, JOIN까지"
date: 2026-10-12
tags:
  - SQL
---

`SELECT`는 SQL의 90% 이상을 차지한다고 할 만큼 자주 쓰는 문법이다.  
핵심은 두 가지다. 어떤 **열**을 가져올 것인가(정보의 종류), 어떤 **행**을 가져올 것인가(정보의 범위).  
실습한 쿼리를 이 두 질문에 맞춰 `SELECT`부터 `JOIN`까지 정리했다.  
DB가 왜 필요한지는 [이전 글]({{ site.baseurl }}/database-why-needed.html)에서 정리했다.

> **TL;DR**
> - 열은 `SELECT`로, 행은 `WHERE`로 고른다. 결과를 다듬는 것은 `ORDER BY`, `DISTINCT`, `LIMIT`이다.
> - 집계 함수는 `GROUP BY`로 묶어서 쓰고, 그룹을 거른 뒤의 조건은 `HAVING`에 쓴다.
> - 여러 테이블에 나뉜 데이터는 `JOIN`으로 합친다.

환경: MySQL (버전 `확인 필요`). 실습 테이블은 `tbl_menu`, `tbl_category`, `users`, `courses`, `grades`, `enrollments`, `user_auth_providers`이고, 각 쿼리의 결과는 이 글에 옮기지 않았다.

## 1. SELECT와 FROM: 어떤 열을 가져올까

```sql
-- 메뉴 테이블에서 메뉴 이름을 조회
select
    menu_name   -- 무엇을? (컬럼)
from
    tbl_menu;   -- 어디에서? (테이블)

-- 여러 컬럼은 쉼표로 구분
select menu_code, category_code, menu_price
from tbl_menu;

-- *는 모든 컬럼을 뜻한다
select * from tbl_menu;
```

`as`로 결과 컬럼에 별칭(Alias)을 붙일 수 있다.

```sql
select
    menu_name as '메뉴 이름',
    menu_price as '가격'
from tbl_menu;
```

테이블 없이 MySQL의 기본 함수를 바로 호출할 수도 있다.

```sql
select now();                 -- 현재 날짜와 시간
select concat('조', '평훈');   -- 문자열 합치기
```

## 2. ORDER BY: 결과를 정렬한다

`asc`는 오름차순(기본값), `desc`는 내림차순이다.

```sql
select menu_code, menu_name, menu_price
from tbl_menu
order by menu_price desc;
```

계산식에 별칭을 붙이고, 그 별칭으로 정렬할 수도 있다.

```sql
select
    menu_code,
    menu_price,
    menu_code * menu_price as `연산결과`
from tbl_menu
order by `연산결과` desc;
```

### NULL이 있는 컬럼은 어떻게 정렬될까

`tbl_category`의 `ref_category_code`에는 NULL이 있다.  
MySQL에서 NULL은 가장 작은 값으로 취급되어 `asc`에서는 맨 위에 온다. NULL을 맨 아래로 보내려면 `is null` 결과로 먼저 정렬한다.

```sql
select *
from tbl_category
order by ref_category_code is null asc, ref_category_code asc;
```

`ref_category_code is null`은 NULL이면 1, 아니면 0이라서, `asc`로 정렬하면 NULL이 아닌 행(0)이 먼저 오고 NULL 행(1)이 뒤로 간다.  
강의 코드에는 두 번째 정렬 기준이 없었는데, NULL이 아닌 행끼리도 오름차순으로 맞추려고 `ref_category_code asc`를 덧붙였다.

## 3. WHERE: 어떤 행을 가져올까

```sql
select menu_name, menu_price, orderable_status
from tbl_menu
where orderable_status = 'Y';
```

자주 쓰는 비교 연산자는 다음과 같다.

| 연산자 | 의미 |
|---|---|
| `=` | 같다 |
| `!=`, `<>` | 같지 않다 |
| `>`, `<` | 크다, 작다 |
| `>=`, `<=` | 크거나 같다, 작거나 같다 |
| `LIKE` | 특정 패턴을 포함한다 |
| `IN` | 목록 안의 값 중 하나와 일치한다 |
| `BETWEEN` | 두 값 사이의 범위에 있다 |
| `NOT` | 부정 |

### AND와 OR

`and`는 조건을 모두 만족해야 하고, `or`는 하나라도 만족하면 된다.

```sql
-- 판매 상태가 Y이거나 카테고리 코드가 10인 메뉴
select * from tbl_menu
where orderable_status = 'Y' or category_code = 10
order by category_code;

-- 판매 상태가 Y이고 카테고리 코드가 10인 메뉴
select * from tbl_menu
where orderable_status = 'Y' and category_code = 10;
```

### BETWEEN, LIKE, IN, NULL

```sql
-- 10000 이상 20000 이하 (양 끝값 포함)
select * from tbl_menu
where menu_price between 10000 and 20000;

-- 범위 밖
select * from tbl_menu
where menu_price not between 10000 and 20000;

-- '마늘'을 포함하는 이름
select menu_name, menu_price from tbl_menu
where menu_name like '%마늘%';

-- 카테고리 코드가 4, 5, 6이 아닌 메뉴
select menu_name, category_code from tbl_menu
where category_code not in (4, 5, 6);

-- NULL은 = 로 비교할 수 없고 is null / is not null을 쓴다
select * from tbl_category
where ref_category_code is not null;
```

`LIKE`의 `%`는 위치에 따라 의미가 달라진다.

| 패턴 | 의미 |
|---|---|
| `'%단어'` | 단어로 끝나는 데이터 |
| `'단어%'` | 단어로 시작하는 데이터 |
| `'%단어%'` | 단어를 포함하는 데이터 |

강의 코드의 주석은 "마늘을 포함하는 메뉴"인데 실제 패턴은 `'생마늘%'`(생마늘로 시작)이었다. 주석의 의도에 맞게 `'%마늘%'`로 바꿔 적었다.

## 4. DISTINCT: 중복을 없앤다

```sql
-- 중복 제거 전
select category_code from tbl_menu order by category_code;

-- 중복 제거 후
select distinct category_code
from tbl_menu
order by category_code;
```

## 5. LIMIT: 개수를 제한한다

수백만 건을 한 번에 조회하면 시스템에 큰 부하가 걸린다.  
`limit`은 "상위 5개만", "한 페이지에 10개만" 같은 조회에 쓰고, 웹 앱의 페이징 구현에 필요하다.

```sql
-- limit [offset,] row_count : offset은 건너뛸 행 수 (0부터 시작)
select *
from tbl_menu
order by menu_price desc
limit 1, 5;
```

`limit 1, 5`는 정렬된 결과에서 **1행을 건너뛰고 그다음 5행**을 가져온다. 가장 비싼 메뉴를 빼고 2위부터 6위까지가 나온다.  
강의 코드에는 `from tbl_menutbl_menu`로 테이블 이름이 겹쳐 적혀 있었는데, 오타라서 `tbl_menu`로 고쳤다.

## 6. GROUP BY: 그룹으로 묶어 집계한다

우리 서비스의 총 사용자 수나 가장 신고를 많이 당한 사람 같은 질문은 집계 함수로 구한다.

| 함수 | 역할 |
|---|---|
| `count(컬럼)` | 데이터 개수 (NULL 제외, `count(*)`는 행 수) |
| `sum(컬럼)` | 합계 |
| `avg(컬럼)` | 평균 |
| `max(컬럼)` | 최댓값 |
| `min(컬럼)` | 최솟값 |

```sql
-- 전체 사용자 수
select count(*) as '총 사용자 수' from users;

-- 과정을 등록한 교육자 수 (중복 없이)
select count(distinct author_id) as '과정 등록 교육자 수'
from courses;

-- 모든 제출물의 총점과 평균
select sum(score) as '총점', avg(score) as '평균'
from grades;
```

### 왜 name과 count(*)를 같이 쓰면 에러가 날까

```sql
select name, count(*) as '총 사용자 수'
from users;
```

`count(*)`는 전체를 하나로 묶어 숫자 하나를 만드는데, `name`은 행마다 값이 다르다. 어떤 `name`을 그 숫자와 함께 보여줘야 할지 정할 수 없기 때문이다.  
MySQL 5.7부터 기본으로 켜진 `ONLY_FULL_GROUP_BY` 모드에서 에러가 나고, 이 모드를 끄면 임의의 값이 나올 수 있다(`확인 필요`: 실습 환경의 설정).

### GROUP BY로 그룹 기준을 정한다

```sql
-- 상태(status)별 사용자 수
select status, count(*) as '사용자 수'
from users
group by status;

-- 교육자별 개설 강좌 수
select
    author_id as '교육자 번호',
    count(*) as '개설 강좌 수'
from courses
group by author_id;
```

### HAVING은 WHERE와 무엇이 다를까

둘 다 조건을 쓰지만 적용 시점이 다르다.

| 구분 | 필터링 시점 | 조건에 쓸 수 있는 것 |
|---|---|---|
| `WHERE` | 그룹으로 묶기 **전** (행 단위) | 컬럼 값 |
| `HAVING` | 그룹으로 묶은 **후** (그룹 단위) | 집계 함수 결과 |

```sql
-- 개설 강좌가 3개 이상인 교육자
select author_id as '교육자 번호', count(*) as '개설 강좌 수'
from courses
group by author_id
having count(*) >= 3;

-- 수강 상태가 completed인 과정 중, 2명 이상이 등록한 과정과 학생 수
select course_id, count(*) as '학생 수'
from enrollments
where status = 'completed'
group by course_id
having count(*) >= 2;
```

두 번째 쿼리는 `where`로 `completed` 행만 먼저 남기고, 그 행들을 과정별로 묶어 센 뒤, `having`으로 2명 이상인 그룹만 남긴다.

쿼리가 처리되는 논리적인 순서는 다음과 같다.

1. `FROM` : 대상 테이블을 정한다
2. `WHERE` : 행을 거른다
3. `GROUP BY` : 그룹으로 묶는다
4. `HAVING` : 그룹을 거른다
5. `SELECT` : 열을 고른다
6. `ORDER BY` : 정렬한다
7. `LIMIT` : 개수를 제한한다

## 7. JOIN: 나뉜 테이블을 합친다

실제 DB는 비슷한 의미의 데이터를 테이블별로 나눠 저장한다.  
`courses.author_id`는 `users.user_id`를 가져온 값인데, 이런 컬럼을 외래키(FK)라고 한다. `JOIN`은 이렇게 공통된 값을 기준으로 테이블을 합쳐 하나의 결과로 만든다.

```sql
-- 과정 제목과 그 과정을 만든 교육자 이름
select
    c.title as '과정 제목',
    u.name as '교육자 이름'
from courses as c
join users as u
on c.author_id = u.user_id;
```

`join`만 쓰면 양쪽 테이블에 짝이 있는 행만 나온다(INNER JOIN).  
`LEFT JOIN`은 왼쪽 테이블을 기준으로 출력하고, 오른쪽에 짝이 없으면 오른쪽 컬럼을 NULL로 채운다. `RIGHT JOIN`은 반대다.

```sql
-- 모든 사용자를 출력하고, 소셜 로그인 정보가 없으면 NULL
select
    u.name as '사용자 이름',
    uap.provider as '소셜 로그인 제공자'
from users as u
left join user_auth_providers as uap
on u.user_id = uap.user_id;

-- 모든 소셜 로그인 정보를 출력하고, 짝이 없는 사용자 쪽은 NULL
select
    u.name as '사용자 이름',
    uap.provider as '소셜 로그인 제공자'
from users as u
right join user_auth_providers as uap
on u.user_id = uap.user_id;
```

| 종류 | 결과 |
|---|---|
| `JOIN` (INNER) | 양쪽에 모두 짝이 있는 행만 |
| `LEFT JOIN` | 왼쪽 테이블의 모든 행 + 짝이 있으면 오른쪽 값 |
| `RIGHT JOIN` | 오른쪽 테이블의 모든 행 + 짝이 있으면 왼쪽 값 |

강의에서는 SELF JOIN, OUTER JOIN도 종류로 소개했는데, 이번 실습에서는 다루지 않았다.

## 정리

- 열은 `SELECT`, 행은 `WHERE`로 고르고, `ORDER BY`, `DISTINCT`, `LIMIT`으로 결과를 다듬는다.
- NULL은 `=`가 아니라 `is null`로 비교하고, 정렬에서는 `asc` 기준 맨 앞에 온다.
- 집계 후 조건은 `HAVING`, 여러 테이블은 `JOIN`으로 합친다.

다음에 볼 것은 SELF JOIN과 서브쿼리다.

## 더 학습하면 좋은 개념

- **SQL 실행 순서(FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY)** — `where`에서는 `select`의 별칭을 못 쓰는데 `order by`에서는 쓸 수 있는 이유를 설명해 준다.
- **외래키(FK)와 참조 무결성** — `JOIN`의 기준이 되는 컬럼이 DB에서 어떻게 보호되는지 알 수 있다.
- **INNER / OUTER / SELF JOIN의 차이** — 데이터에 짝이 없을 때 결과가 어떻게 달라지는지 정확히 구분해야 한다.
- **인덱스와 페이징 성능** — `limit`의 offset이 커질수록 느려지는 이유와 대안(커서 방식)으로 이어진다.

## 참고 자료

- [MySQL 8.4 Reference Manual - SELECT Statement](https://dev.mysql.com/doc/refman/8.4/en/select.html)
- [MySQL 8.4 Reference Manual - JOIN Clause](https://dev.mysql.com/doc/refman/8.4/en/join.html)
- [MySQL 8.4 Reference Manual - MySQL Handling of GROUP BY](https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html)
