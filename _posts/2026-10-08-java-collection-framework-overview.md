---
title: "배열의 한계와 컬렉션 프레임워크: List, Set, Map은 언제 쓸까"
date: 2026-10-08
tags:
  - Java
---

회원 수는 하루가 다르게 늘고 줄어드는데, 배열은 크기를 한 번 정하면 바꿀 수 없다.  
크기가 모자라면 더 큰 배열을 새로 만들어서 값을 옮겨 담아야 한다.  
이 불편함을 줄이려고 만들어진 자료구조 묶음이 자바 컬렉션 프레임워크(JCF, Java Collection Framework)다.  
배열이 어디서 막히는지부터 보고, `List`, `Set`, `Map`을 어떤 기준으로 고르는지 정리했다.

> **TL;DR**
> - 배열은 **크기 고정**, **타입 혼용 위험**, **편의 기능 부족**이라는 한계가 있고, 컬렉션이 이를 보완한다.
> - 순서가 있고 중복을 허용하면 `List`, 중복을 허용하지 않으면 `Set`, 키로 값을 찾으면 `Map`을 고른다.
> - `Map`은 `Collection`을 상속하지 않는 별도 계열이지만, `keySet()` 같은 메소드로 `Set`과 오갈 수 있다.

환경: Java 표준 라이브러리(`java.util`)만 사용했다.  
아래 코드는 개념 설명용 예시이고, 직접 실행해 확인하지는 않았다.

## 1. 배열은 어디서 막힐까

### 크기가 고정이라서 늘리려면 새로 만들어야 한다

```java
int[] nums = new int[5];
```

`nums`는 5칸으로 고정이다.  
6번째 값을 넣으려면 더 큰 배열을 만들고 기존 값을 복사해야 한다.

```java
int[] newNums = new int[10];
System.arraycopy(nums, 0, newNums, 0, nums.length);
```

회원 수나 게시글 목록처럼 데이터 개수를 미리 알 수 없고 수시로 추가·삭제되는 경우에는 이 작업이 계속 따라온다.

### 타입을 섞으면 실행할 때 오류가 난다

`Object[]`에는 무엇이든 넣을 수 있다.

```java
Object[] arr = new Object[3];

arr[0] = "문자열";
arr[1] = 123;   // 문제 없이 들어간다

String s = (String) arr[1];   // 실행 중 ClassCastException
```

넣을 때는 아무 문제가 없다가, 꺼내서 쓰는 순간 `ClassCastException`이 난다.  
컴파일러가 미리 알려 주지 않는 것이 문제다.

### 추가·삭제·정렬을 직접 만들어야 한다

중간에 값을 끼워 넣거나 지우려면 뒤의 요소를 직접 밀고 당겨야 한다.  
정렬, 중복 제거, 검색도 마찬가지다.

## 2. 컬렉션은 이 세 가지를 어떻게 보완할까

| 배열 | 컬렉션 |
|---|---|
| 고정 크기 | 크기가 자동으로 조절된다 |
| 타입 제한이 없다(`Object[]`로 우회 가능) | 제네릭으로 타입 안정성을 제공한다 |
| 편의 기능이 부족하다 | 추가, 삭제, 탐색 메소드를 제공한다 |

제네릭을 쓰면 위의 `ClassCastException`이 컴파일 단계에서 걸린다.

```java
List<String> list = new ArrayList<>();

list.add("hello");
list.add(123);   // 컴파일 오류
```

`ArrayList`는 내부적으로 배열을 쓰지만, 크기가 부족해지면 알아서 늘려 준다.  
다만 자동으로 처리해 준다는 뜻이지, 그만큼 빨라진다는 뜻은 아니다.

컬렉션이 기본으로 주는 메소드는 아래와 같다.

| 메소드 | 하는 일 |
|---|---|
| `add()`, `addAll()` | 요소를 추가한다 |
| `remove()`, `clear()` | 요소를 지운다 |
| `contains()` | 요소가 들어 있는지 확인한다 |
| `isEmpty()`, `size()` | 비었는지, 몇 개인지 확인한다 |

정렬과 중복 제거는 컬렉션의 종류와 도구를 고르는 방식으로 해결한다.  
정렬은 `List`의 `sort()`나 `Collections.sort()`로 하고, 중복 제거는 `Set`에 담아서 하며, 조건에 맞는 요소만 골라내는 필터링은 스트림(Stream) API로 한다.

## 3. 컬렉션 프레임워크의 구조: Map만 따로 서 있다

컬렉션(Collection)은 많은 데이터를 효과적으로 처리하는 방법을 제공하는 클래스들의 집합이고, 이를 모은 개념이 JDK 1.2에서 정의된 컬렉션 프레임워크다.

| 인터페이스 | 한 줄 정의 | 대표 구현체 |
|---|---|---|
| `Collection` | 단일 값들의 집합을 표현하는 최상위 인터페이스 | - |
| `List` | 순서가 있고 중복을 허용한다 | `ArrayList`, `LinkedList`, `Vector` |
| `Set` | 순서가 없고 중복을 허용하지 않는다 | `HashSet`, `TreeSet` |
| `Queue` | 먼저 넣은 것을 먼저 꺼낸다(FIFO) | `LinkedList`, `PriorityQueue`, `ArrayDeque` |
| `Deque` | 양쪽 끝에서 넣고 꺼낼 수 있는 큐 | `ArrayDeque`, `LinkedList` |
| `Map` | 키-값 쌍으로 저장한다. 키는 중복될 수 없다 | `HashMap`, `TreeMap`, `LinkedHashMap` |

`List`, `Set`, `Queue`는 `Collection`을 상속받아서 `add(E e)`, `remove(Object o)`, `size()`, `isEmpty()`, `iterator()` 같은 공통 메소드를 쓴다.  
`Map`은 요소가 값 하나가 아니라 키-값 한 쌍이라서 `Collection`을 상속하지 않고 별도로 존재한다.

### 왜 일관된 구조로 묶었을까

| 이점 | 내용 |
|---|---|
| 일관된 API | 규격화된 메소드를 쓰므로 사용법을 익히기 쉽고 유지보수가 편하다 |
| 개발 비용 감소 | 이미 만들어진 자료구조를 쓰므로 밑바닥 알고리즘을 직접 고민하지 않아도 된다 |
| 품질 향상 | 검증된 자료구조를 쓰므로 개발 속도와 품질을 기대할 수 있다 |

## 4. 어떤 컬렉션을 고를까: 요구사항으로 판단하기

세 가지 요구사항으로 비교했다.

### 학생 명단을 입력한 순서대로 관리한다

- 순서가 유지되어야 하고, 같은 이름이 여러 번 들어올 수 있다. → **`List<String>`**

```java
List<String> students = new ArrayList<>();

students.add("민지");
students.add("수현");
students.add("지훈");
```

### 출석 기록은 한 학생당 한 번만 남긴다

- 같은 이름이 여러 번 들어와도 한 번만 기록하고, 순서는 중요하지 않다. → **`Set<String>`**

```java
Set<String> attendance = new HashSet<>();

attendance.add("민지");
attendance.add("수현");
attendance.add("민지");   // 중복이라 무시된다
```

### 이름으로 점수를 바로 조회한다

- 이름과 점수를 한 쌍으로 관리하고, 이름으로 점수를 찾는다. → **`Map<String, Integer>`**

```java
Map<String, Integer> scores = new HashMap<>();

scores.put("민지", 95);
scores.put("수현", 88);
```

| 구분 | 순서 | 중복 | 요소를 찾는 기준 |
|---|---|---|---|
| `List` | 유지한다 | 허용 | 인덱스 |
| `Set` | 보장하지 않는 경우가 많다 | 허용하지 않음 | 값 자체 |
| `Map` | 보장하지 않는 경우가 많다 | 키는 허용하지 않음, 값은 허용 | 키 |

각 컬렉션의 자세한 동작은 [List와 ArrayList]({{ site.baseurl }}/java-list-arraylist-dto.html), [HashSet과 TreeSet]({{ site.baseurl }}/java-set-hashset-treeset.html), [Map과 HashMap]({{ site.baseurl }}/java-map-hashmap-properties.html) 글에서 정리했다.

## 5. 컬렉션끼리 변환하기

컬렉션은 서로 변환해서 쓰는 경우가 많다.

| 변환 | 목적 |
|---|---|
| `List` → `Set` | 중복을 제거할 때 |
| `Set` → `List` | 순서를 주거나 정렬할 때 |
| `Map` → `Set` | `keySet()`, `entrySet()`으로 키나 쌍을 `Set`으로 꺼낼 때 |
| `List` → `Map` | id 같은 속성을 키로 삼아 빠르게 찾을 때 |

```java
// List -> Set (중복 제거)
List<String> rawList = List.of("A", "B", "A", "C");
Set<String> uniqueSet = new HashSet<>(rawList);

// Set -> List (정렬이 필요할 때)
Set<String> nameSet = Set.of("홍길동", "김철수", "이영희");
List<String> nameList = new ArrayList<>(nameSet);
Collections.sort(nameList);

// Map -> Set (키만 꺼내기)
Map<String, Integer> map = Map.of("A", 1, "B", 2);
Set<String> keys = map.keySet();
```

`Set`은 순서가 없어서 정렬하려면 `List`로 옮겨야 한다.  
이런 변환이 가능한 이유가 `List`와 `Set` 모두 `Collection`이고, `Map`이 `Set`을 꺼내 주는 메소드를 갖고 있기 때문이다.

## 6. 헷갈리기 쉬운 점

### 컬렉션이 자동으로 늘어난다고 빠른 것은 아니다

크기 조절을 자동으로 해 주는 것이지, 속도가 빨라지는 것이 아니다.  
배열이 더 빠를 수 있다는 점을 알고 쓴다.

### 중복을 판단하는 기준은 직접 만든 클래스에는 따로 필요하다

`HashSet`은 `equals()`와 `hashCode()`로 같은 요소인지 판단한다.  
`String`처럼 이미 구현된 타입은 중복이 걸러지지만, 직접 만든 클래스는 두 메소드를 재정의하지 않으면 같은 값이어도 다른 객체로 취급해서 중복이 제거되지 않는다.

### List는 스레드 안전하지 않다

`ArrayList`는 여러 스레드가 동시에 접근하도록 설계되지 않았다.  
동시에 데이터를 바꾸면 데이터가 훼손될 수 있어서, 이런 경우에는 다른 방법이 필요하다.

## 7. 정리

- 배열은 크기가 고정이고, 타입을 섞으면 실행 중에 오류가 나며, 편의 기능을 직접 만들어야 한다.  
  컬렉션은 이 세 가지를 보완한다.
- 순서가 있고 중복을 허용하면 `List`, 중복을 허용하지 않으면 `Set`, 키로 값을 찾으면 `Map`을 고른다.
- `Map`은 `Collection` 계열이 아니지만, `keySet()` 등으로 `Set`과 오갈 수 있다.

다음에는 각 컬렉션이 내부에서 데이터를 어떻게 저장하는지 보면 선택 기준이 더 분명해진다.

## 더 학습하면 좋은 개념

- **제네릭(Generics)** — 컬렉션이 타입 안정성을 제공하는 바탕이다.  
  `List<String>`이 컴파일 단계에서 타입을 걸러 주는 원리를 이해할 수 있다.
- **Iterator와 향상된 for문** — 컬렉션의 요소를 하나씩 꺼내는 공통 방법이다.  
  `Collection`이 `iterator()`를 제공하는 이유와 이어진다.
- **LinkedList와 ArrayList의 차이** — 같은 `List`라도 중간 삽입·삭제와 조회의 성능 특성이 다르다.
- **스트림(Stream) API** — 필터링, 변환, 집계를 컬렉션 위에서 간결하게 하는 방법이다.
- **Collections 유틸리티 클래스** — 정렬, 검색, 동기화된 컬렉션 만들기를 도와주는 도구 모음이다.

## 참고 자료
- [Oracle - Lesson: Introduction to Collections (The Java Tutorials)](https://docs.oracle.com/javase/tutorial/collections/intro/index.html)
- [Java SE API - Collection](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collection.html)
- [Java SE API - Map](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html)
