---
title: "HashSet과 TreeSet 정리"
date: 2026-10-07
tags:
  - Java
---

로또 번호 7개를 뽑는데 같은 숫자가 나오면 다시 뽑아야 한다. `List`에 넣는다면 `contains()`로 중복을 직접 검사해야 하지만, `Set`은 중복을 알아서 걸러낸다. `Set`의 구현체인 `HashSet`으로 중복 제거를 확인하고, `TreeSet`으로 정렬된 로또 번호 추첨기를 만들었다. 컬렉션의 `List`는 [이전 글]({{ site.baseurl }}/java-list-arraylist-dto.html)에서 정리했다.

> **TL;DR**
> - `Set`은 저장 순서를 유지하지 않고, 같은 요소의 중복 저장을 허용하지 않는다.
> - `HashSet`은 `Set`을 구현한 클래스 중 가장 많이 쓰이고, 출력 순서는 넣은 순서와 다를 수 있다.
> - `TreeSet`은 중복을 허용하지 않으면서 이진 검색 트리 구조로 **정렬된 상태**를 유지한다.

## 1. Set의 두 가지 특징

코드의 주석이 정리한 `Set` 자료구조의 특징은 두 가지다.

| 번호 | 특징 | 의미 |
|---|---|---|
| 1 | 요소의 저장 순서를 유지하지 않는다 | 넣은 순서대로 꺼낸다는 보장이 없다 |
| 2 | 같은 요소의 중복 저장을 허용하지 않는다 | 같은 값을 다시 `add`해도 하나만 남는다 |

`List`는 순서가 있고 중복을 허용했던 것과 정반대다. 인덱스로 요소를 꺼내는 `get(1)` 같은 메소드가 `Set`에 없는 것도 순서가 없기 때문이다.

## 2. HashSet으로 중복 제거 확인하기

```java
package com.wanted.b_collection.b_set;

import java.util.HashSet;
import java.util.Set;

public class Application01 {

    public static void main(String[] args) {

        /* comment. Set 자료구조 특징
        *   1. 요소의 저장 순서를 유지하지 않는다.
        *   2. 같은 요소의 중복 저장을 허용하지 않는다.
        *  */

        // Set 인터페이스를 구현한 HashSet 을 가장 많이 쓴다.
        Set<String> hset = new HashSet<>();

        hset.add("java");
        hset.add("db");
        hset.add("servlet");
        hset.add("spring");
        hset.add("jpa");
        // Set 자료형은 중복된 요소는 허용하지 않는다.
        hset.add("jpa");

        System.out.println("hset = " + hset);
        
    }

}
```

`"jpa"`를 두 번 `add`했지만 출력에는 한 번만 나온다. 요소 5개가 출력되고, 순서는 넣은 순서(`java, db, servlet, spring, jpa`)와 다를 수 있다. 실제 순서는 자바 버전과 실행 환경에 따라 달라질 수 있어서, 이번 글에는 출력 순서를 적지 않았다. 직접 실행해 확인한 출력이 필요하면 `확인 필요`다.

`Set`도 `List`처럼 인터페이스라서 구현체로 객체를 만든다. 가장 많이 쓰는 구현체가 `HashSet`이다. 변수 타입을 `Set<String>`으로 두고 `new HashSet<>()`으로 만드는 방식은 [`List`를 `ArrayList`로 만든 방식]({{ site.baseurl }}/java-list-arraylist-dto.html)과 같다.

## 3. TreeSet으로 정렬되는 로또 추첨기 만들기

`HashSet`과 달리 `TreeSet`은 이진 검색 트리 구조로 데이터를 저장해서 **정렬된 상태**를 유지한다. 중복을 허용하지 않는 점은 같다.

```java
package com.wanted.b_collection.b_set;

import java.util.Set;
import java.util.TreeSet;

public class Application02 {

    public static void main(String[] args) {

        /* comment. TreeSet
        *   TreeSet 을 활용한 로또 추첨기
        *   TreeSet 은 Set 처럼 중복을 허용하지 않는다.
        *   다만 HashSet 과의 차이는 이진 검색 트리 구조로
        *   데이터의 정렬을 보장한다.
        *   이진 검색 트리 구조의 장점은 데이터를 순회하면서
        *   조회 시 매우 빠르다 라는 장점이 있다.
        *   EX) 트리
        *  */

        Set<Integer> lotto = new TreeSet<>();
        
        while (lotto.size() < 7) {
            // (int)(Math.random() * 45) + 1
            // Math.random() -> 0~1 사이의 난수
            // * 45 -> 난수의 최대값 
            // + 1  -> 난수의 최솟값
            lotto.add((int)(Math.random() * 45) + 1);
        }

        System.out.println("lotto = " + lotto);

    }

}
```

난수를 쓰기 때문에 실행할 때마다 값이 다르다. 다음은 출력 예시이고, 실제 실행 결과가 아니다. 어떤 값이 나오든 7개가 모두 다르고, 오름차순으로 정렬되어 나온다.

```text
lotto = [3, 11, 19, 24, 30, 38, 42]
```

### 난수 식이 1~45를 만드는 과정

`(int)(Math.random() * 45) + 1`은 한 단계씩 풀면 다음과 같다.

| 단계 | 식 | 값의 범위 |
|---|---|---|
| 1 | `Math.random()` | 0.0 이상 1.0 미만의 실수 |
| 2 | `Math.random() * 45` | 0.0 이상 45.0 미만의 실수 |
| 3 | `(int)(Math.random() * 45)` | 소수점을 버린 정수 0~44 |
| 4 | `(int)(Math.random() * 45) + 1` | 1~45 |

코드 주석은 `* 45`를 "난수의 최대값", `+ 1`을 "난수의 최솟값"이라고 적었다. 정확히는 `* 45`가 값이 나올 **범위의 크기(45가지)** 를 정하고, `+ 1`이 그 범위를 0~44에서 1~45로 **옮기는** 역할이다. 1.0은 포함되지 않아서 최댓값은 45이고 46은 나오지 않는다.

### 왜 while로 size를 검사할까

`while (lotto.size() < 7)`은 `for`로 7번 반복하는 것과 다르다. 같은 숫자가 나오면 `Set`이 `add`를 무시해서 `size()`가 늘지 않고, 서로 다른 숫자가 7개 모일 때까지 계속 반복한다. `List`였다면 중복 검사를 직접 작성해야 했을 부분을 `Set`의 중복 불허 특징이 대신 해준다.

## 4. HashSet, TreeSet, ArrayList 비교

| 구분 | `ArrayList` | `HashSet` | `TreeSet` |
|---|---|---|---|
| 중복 허용 | 허용 | 허용하지 않음 | 허용하지 않음 |
| 순서 | 넣은 순서 유지 | 유지하지 않음 | 정렬된 순서로 유지 |
| 내부 구조 | 배열 | 해시 테이블 | 이진 검색 트리 |
| 언제 쓰나 | 순서가 중요하고 중복이 가능한 목록 | 중복 없이 빠르게 담기만 할 때 | 중복 없이 정렬된 상태가 필요할 때 |

공식 API 문서는 `HashSet`이 해시 테이블(실제로는 `HashMap` 인스턴스)을 기반으로 하고, `TreeSet`이 `TreeMap`을 기반으로 한다고 설명한다.

## 5. 헷갈리기 쉬운 점: 트리의 장점은 "조회가 빠름"이 아니라 "정렬 유지"다

코드 주석에는 이진 검색 트리의 장점을 "데이터를 순회하면서 조회 시 매우 빠르다"고 적었다. 이 로또 예제에서 실제로 확인한 것은 조회 속도가 아니라, 번호를 넣은 순서와 상관없이 **항상 정렬되어 출력된다**는 점이다. 속도는 이 코드로 측정하지 않았다. 공식 문서는 `TreeSet`의 `add`, `remove`, `contains`가 데이터 개수 n에 대해 log(n) 시간이 보장된다고 설명한다. 해시 기반인 `HashSet`은 일반적으로 이보다 더 빠르지만 정렬을 보장하지 않는다. 정렬이 필요 없으면 `HashSet`, 필요하면 `TreeSet`을 고르는 식으로 구분한다.

## 6. Set의 메소드와 중복을 판단하는 기준

`Set`은 `List`와 달리 위치(인덱스)가 없어서 `get(int)`이 없다. 대신 요소의 포함 여부를 묻는 메소드를 주로 쓴다. `add`는 요소가 새로 들어갔는지를 `boolean`으로 알려준다. 아래는 이 동작을 보이기 위한 예시 코드이고, 직접 실행해 확인하지는 않았다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
Set<String> set = new HashSet<>();
System.out.println(set.add("jpa")); // true  : 새로 들어감
System.out.println(set.add("jpa")); // false : 이미 있어서 들어가지 않음
```

| 메소드 | 하는 일 |
|---|---|
| `add(E e)` | 요소를 추가한다. 이미 있으면 추가하지 않고 `false`를 반환한다 |
| `remove(Object o)` | 요소를 지운다 |
| `contains(Object o)` | 요소가 들어 있는지 확인한다 |
| `size()` | 요소의 개수를 반환한다 |
| `isEmpty()`, `clear()` | 비었는지 확인하거나 모두 지운다 |

"같은 요소"를 어떻게 판단하는지는 구현체마다 다르다.

| 구현체 | 같은 요소를 판단하는 기준 |
|---|---|
| `HashSet` | `hashCode()`와 `equals()` |
| `TreeSet` | 정렬 기준(`compareTo()` 또는 `Comparator`)의 비교 결과가 0인지 |

`String`과 `Integer`는 이 메소드들이 이미 구현되어 있어서 `"jpa"` 중복이 걸러졌다. 직접 만든 클래스를 넣을 때는 이 기준을 직접 만들어 줘야 한다.

## 7. Set 구현체 비교

`Set` 인터페이스의 대표 구현체는 세 가지다. 이번에 코드로 확인한 것은 `HashSet`과 `TreeSet`이고, `LinkedHashSet`은 API 문서를 보고 정리했다.

| 구현체 | 순서 | `null` 저장 | 특징 |
|---|---|---|---|
| `HashSet` | 보장하지 않음 | 1개 허용 | 해시 테이블 기반, 정렬이 필요 없을 때 기본 선택 |
| `LinkedHashSet` | 넣은 순서 유지 | 1개 허용 | `HashSet`에 순서를 기억하는 기능을 더한 구현체 |
| `TreeSet` | 정렬된 순서 | 자연 순서(`Comparable`)를 쓰면 불가 | 이진 검색 트리 기반, 정렬 상태 유지 |

## 8. 정리

- `Set`은 순서를 유지하지 않고 중복을 허용하지 않는다. `HashSet`에 `"jpa"`를 두 번 넣어도 한 번만 저장된다.
- `TreeSet`은 중복을 허용하지 않으면서 항상 정렬된 상태를 유지한다. 로또 번호처럼 중복 없이 정렬된 값이 필요할 때 쓸 수 있다.
- `(int)(Math.random() * 45) + 1`은 1~45의 정수를 만든다. `Set`의 `size()`로 반복 횟수를 정하면 중복 검사 코드를 따로 쓰지 않아도 된다.
- 같은 요소의 판단 기준은 `HashSet`이 `hashCode()`와 `equals()`, `TreeSet`이 정렬 기준의 비교 결과다. `add`는 새로 들어갔으면 `true`, 중복이면 `false`를 반환한다.

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **equals()와 hashCode()** — `HashSet`은 요소가 같은지 판단할 때 이 두 메소드를 쓴다. `String`은 이미 구현되어 있어서 `"jpa"` 중복이 걸러졌지만, 직접 만든 클래스(`BookDTO` 등)를 `Set`에 넣으려면 재정의가 필요하다.
- **Comparable과 Comparator** — `TreeSet`이 정렬하려면 요소의 정렬 기준이 필요하다. `Integer`와 `String`은 기준이 정해져 있어서 동작하지만, 기준이 없는 클래스를 넣으면 실행 중에 오류가 난다고 알려져 있다.
- **Map과 HashMap** — `HashSet`이 내부적으로 `HashMap`을 쓴다는 점에서 `Set`과 `Map`은 이어진다. 다음에 `Map`을 정리할 때 `Set`과 어떻게 연결되는지 함께 보면 좋다.
- **이진 검색 트리와 레드-블랙 트리** — `TreeSet`이 정렬을 유지하면서도 log(n) 시간을 보장하는 이유를 이해하려면 트리 구조의 균형 개념이 필요하다.

## 참고 자료
- [Oracle - The Set Interface (The Java Tutorials)](https://docs.oracle.com/javase/tutorial/collections/interfaces/set.html)
- [Java SE API - Set](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html)
- [Java SE API - HashSet](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html)
- [Java SE API - TreeSet](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeSet.html)
- [Java SE API - Math.random()](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html#random())
