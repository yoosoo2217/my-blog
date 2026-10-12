---
title: "데이터베이스 첫 시간 확인 문제 5개: JVM 메모리, 파일 저장, 트랜잭션"
date: 2026-10-12
tags:
  - SQL
---

메모리와 DB의 차이를 읽고 나면 이해한 것 같지만, 문제로 풀면 헷갈리는 곳이 드러난다.  
[DB가 필요한 이유]({{ site.baseurl }}/database-why-needed.html)를 정리한 글의 내용을 다섯 문제로 확인한다.  
각 문제의 정답과 해설은 `정답 보기`를 눌러 확인한다.

> **TL;DR**
> - 지역변수, 객체, `static` 변수는 모두 JVM이 꺼지면 사라진다.
> - 서버마다 저장소가 따로 있으면 데이터가 나뉘고, 하나의 DB를 공유하면 해결된다.
> - 트랜잭션은 "전부 성공 아니면 전부 취소"를 보장하고, 객체 하나는 테이블의 행 하나에 대응한다.

## 문제 1. 지역변수는 언제 사라질까

메서드 안에서 선언한 지역변수는 언제 사라질까?

1. 메서드 실행이 끝날 때
2. GC가 실행될 때
3. JVM이 종료될 때
4. 사라지지 않는다

<details markdown="1">
<summary>정답 보기</summary>

**정답: 1번**

지역변수는 Stack의 프레임 안에 살고, 메서드가 끝나 프레임이 제거될 때 함께 사라진다.  
GC는 Heap의 객체를 회수하는 것이어서 Stack의 지역변수와는 관계가 없다.

</details>

## 문제 2. static 리스트에 담은 회원은 재시작 후 어떻게 될까

회원 목록을 `static List<Member>`에 저장했다. 새 버전을 배포하며 서버를 재시작하면 어떻게 될까?

1. `static`이라서 그대로 남는다
2. JVM이 종료되면서 함께 사라진다
3. 자동으로 파일에 저장된다
4. GC 대상이 아니므로 남는다

<details markdown="1">
<summary>정답 보기</summary>

**정답: 2번**

`static` 변수는 오래 살지만 수명의 끝은 JVM 종료다.  
JVM이 꺼지면 OS가 메모리를 전부 회수하므로, 재시작한 JVM의 리스트는 비어 있다.

</details>

## 문제 3. 서버 2대가 각자 파일에 저장하면 어떤 문제가 생길까

서버 2대가 각자 자기 파일에 회원을 저장하면 어떤 문제가 생길까?

1. 파일 저장 속도가 너무 빨라진다
2. 서버 A에서 가입한 회원이 서버 B에서는 없는 회원이 된다
3. 컴파일 에러가 난다
4. 아무 문제 없다

<details markdown="1">
<summary>정답 보기</summary>

**정답: 2번**

서버마다 저장소가 따로 있으면 데이터가 나뉜다.  
모든 서버가 하나의 DB에 접속해 함께 쓰면 이 문제가 해결된다.

</details>

## 문제 4. 계좌이체 도중 서버가 멈춰도 보장되는 기능은

계좌이체 도중 서버가 멈춰도 "전부 성공 아니면 전부 취소"를 보장하는 DB 기능은?

1. 인덱스(Index)
2. 트랜잭션(Transaction)
3. 정렬(`ORDER BY`)
4. 반복문(`for`)

<details markdown="1">
<summary>정답 보기</summary>

**정답: 2번**

트랜잭션은 여러 작업을 하나로 묶는다.  
끝까지 성공하면 `COMMIT`으로 확정하고, 중간에 실패하면 `ROLLBACK`으로 되돌린다.

</details>

## 문제 5. 객체 하나는 DB에서 무엇에 해당할까

Java의 객체(인스턴스) 하나는 DB 테이블에서 무엇에 해당할까?

1. 테이블
2. 컬럼(Column)
3. 행(Row)
4. 데이터베이스

<details markdown="1">
<summary>정답 보기</summary>

**정답: 3번**

클래스는 테이블, 필드는 컬럼, 객체 하나는 행 하나에 대응한다.

</details>

## 정리

- 틀린 문제가 있으면 [이전 글]({{ site.baseurl }}/database-why-needed.html)의 해당 절을 다시 읽는다.
- 1, 2번은 JVM 메모리 영역의 수명, 3, 4번은 DBMS가 해결하는 문제, 5번은 객체와 테이블의 대응이다.

다음에 볼 것은 [SELECT 기초]({{ site.baseurl }}/mysql-select-basics.html)다.

## 참고 자료

- [MySQL 8.4 Reference Manual - START TRANSACTION, COMMIT, and ROLLBACK](https://dev.mysql.com/doc/refman/8.4/en/commit.html)
- [Oracle - The Java Virtual Machine Specification: Run-Time Data Areas](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5)
