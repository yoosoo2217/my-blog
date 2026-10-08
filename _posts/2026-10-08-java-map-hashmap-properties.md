---
title: "Map은 왜 List, Set과 따로 있을까: HashMap과 Properties"
date: 2026-10-08
tags:
  - Java
---

학생 이름과 점수를 함께 저장하려면 어떻게 해야 할까?  
`List`에 넣으면 "민지의 점수"를 찾기 위해 처음부터 하나씩 훑어야 하고, `Set`은 값 하나만 담을 수 있어서 점수를 붙일 곳이 없다.  
이름표(키)를 붙여서 값을 저장하는 `Map`을 `HashMap` 코드로 확인하고, 설정 값을 다룰 때 쓰는 `Properties`까지 정리했다.  
컬렉션의 `Set`은 [이전 글]({{ site.baseurl }}/java-set-hashset-treeset.html)에서 정리했다.

> **TL;DR**
> - `Map`은 **키-값 한 쌍**으로 저장하고, 키로 값을 꺼낸다. 키는 중복될 수 없다.
> - 같은 키로 `put`하면 오류 없이 **나중 값이 앞의 값을 덮어쓴다**.
> - `Properties`는 키와 값이 모두 문자열인 `Map`이고, 설정 값을 다룰 때 쓴다.

환경: Java (실습에 쓴 버전은 `확인 필요`), `java.util` 패키지만 사용했다.

## 1. Map이 따로 있는 이유: 위치나 값이 아니라 이름표로 찾는다

컬렉션마다 요소를 찾는 방법이 다르다.

| 구분 | 요소를 찾는 기준 | 중복 | 예 |
|---|---|---|---|
| `List` | 인덱스(몇 번째인가) | 허용 | 학생 명단 |
| `Set` | 값 자체(들어 있는가) | 허용하지 않음 | 출석한 학생 |
| `Map` | 키(어떤 이름표인가) | 키는 허용하지 않음, 값은 허용 | 이름으로 조회하는 점수 |

같은 데이터에서 "민지의 점수"를 찾는 코드로 비교하면 차이가 분명하다.  
(예시 코드이고, 결과는 코드를 따라가 적은 것이라 직접 실행해 확인하지는 않았다.)

```java
// 예시 코드 (직접 실행해 확인하지 않음)

// List: 이름 목록과 점수 목록의 위치를 맞춰서 찾는다
List<String> names = List.of("민지", "수현");
List<Integer> scoreList = List.of(95, 88);

int idx = names.indexOf("민지");          // 처음부터 하나씩 훑어서 0을 찾는다
System.out.println(scoreList.get(idx));   // 95

// Set: 들어 있는지만 알 수 있고, 점수를 붙일 곳이 없다
Set<String> nameSet = Set.of("민지", "수현");
System.out.println(nameSet.contains("민지"));   // true

// Map: 이름표(키)로 값을 바로 꺼낸다
Map<String, Integer> scores = Map.of("민지", 95, "수현", 88);
System.out.println(scores.get("민지"));   // 95
```

`List`는 이름과 점수가 서로 다른 목록에 있어서 위치가 어긋나면 엉뚱한 점수가 나온다.  
`Map`은 이름과 점수가 한 쌍으로 묶여 있어서 그럴 일이 없다.

`Map`의 특징은 코드 주석에 두 가지로 적혀 있다.

1. **Key-Value** : 키-값 한 쌍으로 데이터를 저장한다.
2. **Key는 내부적으로 `Set` 방식으로 구성되어 있다** : 키는 중복될 수 없다.

두 번째 특징 때문에 "같은 키를 다시 넣으면 어떻게 될까?"가 이 글의 핵심 질문이 된다.

### Map은 Collection이 아니다

컬렉션 프레임워크 전체에서 `Map`이 어디에 서 있는지는 코드 주석으로 정리하는 편이 가장 빨리 읽힌다.  
(예시 코드이고, 결과는 코드를 따라가 적은 것이라 직접 실행해 확인하지는 않았다.)

```java
// 예시 코드 (직접 실행해 확인하지 않음)

// [배열의 한계 → 컬렉션이 보완하는 것]
//  - 배열은 크기가 고정이라 늘리려면 새로 만들어 복사해야 한다   → 컬렉션은 크기가 자동으로 조절된다
//  - Object[]에 타입을 섞으면 꺼낼 때 ClassCastException이 난다   → 제네릭으로 컴파일 단계에서 막는다
//  - 추가/삭제/탐색을 직접 만들어야 한다                          → add, remove, contains 등을 제공한다
//
// [컬렉션 프레임워크 (JDK 1.2): 많은 데이터를 효과적으로 처리하는 클래스들을 일관된 구조로 모은 것]
//
//  Collection            단일 값들의 집합을 표현하는 최상위 인터페이스
//   ├─ List              순서 O, 중복 O      ArrayList, LinkedList, Vector
//   ├─ Set               순서 X, 중복 X      HashSet, TreeSet
//   └─ Queue             FIFO              LinkedList, PriorityQueue, ArrayDeque
//        └─ Deque        양쪽 끝에서 넣고 꺼낸다   ArrayDeque, LinkedList
//
//  Map                   키-값 쌍, 키 중복 X   HashMap, TreeMap, LinkedHashMap
//                        └ 요소가 값 하나가 아니라 한 쌍이라서 Collection을 상속하지 않는다
//
// [일관된 구조로 묶은 이유]
//  - 일관된 API  : 규격화된 메소드라 사용법이 쉽고 유지보수가 편하다
//  - 개발 비용 감소 : 만들어진 자료구조를 써서 밑바닥 알고리즘을 고민하지 않아도 된다
//  - 품질 향상   : 검증된 자료구조를 쓴다

List<Collection<String>> all = List.of(
        new ArrayList<>(), new HashSet<>(), new ArrayDeque<>());

for (Collection<String> c : all) {   // List, Set, Queue는 모두 Collection이라 한 타입으로 다룬다
    c.add("A");
    c.add("A");                      // 같은 값을 한 번 더 넣는다
    System.out.println(c.getClass().getSimpleName() + " : " + c.size());
}
// ArrayList : 2     (List는 중복을 허용한다)
// HashSet : 1       (Set은 중복을 허용하지 않는다)
// ArrayDeque : 2    (Queue/Deque는 중복을 허용한다)

Map<String, Integer> map = new HashMap<>();
// Collection<String> c = map;                 // 컴파일 오류: Map은 Collection이 아니다
Set<String> keys = map.keySet();               // Map → Set
Collection<Integer> values = map.values();     // Map → Collection

// [무엇을 고를까]
List<String> students = new ArrayList<>();     // 입력한 순서대로, 같은 이름도 허용한다 → List
Set<String> attendance = new HashSet<>();      // 학생당 한 번만 기록한다, 순서는 상관없다 → Set
Map<String, Integer> score = new HashMap<>();  // 이름으로 점수를 바로 조회한다 → Map

// [컬렉션끼리 변환]
Set<String> unique = new HashSet<>(List.of("A", "B", "A"));   // List → Set : 중복 제거
List<String> sorted = new ArrayList<>(unique);                // Set → List : 정렬하려면 List로 옮긴다
Collections.sort(sorted);

// [주의]
//  - 컬렉션이 크기를 자동으로 늘려 주는 것이지, 배열보다 빨라지는 것은 아니다
//  - HashSet/HashMap의 키는 equals()와 hashCode()로 같은 요소인지 판단한다
//    직접 만든 클래스는 두 메소드를 재정의하지 않으면 같은 값이어도 다른 객체라 중복이 제거되지 않는다
//  - ArrayList는 여러 스레드가 동시에 바꾸도록 설계되지 않았다
```

`add()`와 `size()`를 똑같이 불렀는데 `HashSet`만 1이 나오는 것이 `Set`의 중복 불허를 보여 준다.  
그리고 `Collection` 변수에 `map`을 담으려는 줄이 컴파일되지 않는 것이 `Map`이 별도 계열이라는 뜻이다.

`List`, `Set`, `Queue`는 모두 `Collection` 인터페이스를 상속받아 `add`, `remove`, `size` 같은 공통 메소드를 쓴다.  
`Map`은 `Collection`을 상속하지 않고 별도 계열로 존재한다.  
요소가 "값 하나"가 아니라 "키-값 한 쌍"이라서 같은 메소드로 묶기 어렵기 때문이다.

그래도 `Set`과는 서로 오갈 수 있다.  
`Map`의 키만 모아서 `Set`으로 꺼내는 `keySet()`이 대표적이다.

## 2. 같은 키로 put하면 덮어쓴다: HashMap 실습

`Map`은 인터페이스라서 객체를 만들려면 구현한 클래스가 필요하다.  
가장 자주 쓰는 구현체인 `HashMap`으로 확인했다.

```java
package com.wanted.b_collection.c_map;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class Application01 {

    public static void main(String[] args) {

        // Map 은 인터페이스이므로 상속받은 클래스로 객체를 생성한다.
        Map map = new HashMap();

        map.put("one" , new Date());
        map.put(12 , "apple");
        // key 는 중복되면 나중에 작성한 값으로 덮어씌워진다.
        map.put(12 , "banana");

        System.out.println("map = " + map);

        // banana
        System.out.println("banana 값 출력하기 : " + map.get(12));

        Map<String , String> map2 = new HashMap<>();
        // Map 의 Key 값은 암묵적으로 String 타입으로 하는 것이 일반적이다.
        map2.put("one", "java");
        map2.put("two", "javascript");
        map2.put("three", "python");

        System.out.println("map2 = " + map2);
        map2.remove("three");
        System.out.println("map2 = " + map2);
    }

}
```

### 타입 없는 Map: 키와 값이 뒤섞인다

`new HashMap()`처럼 `<>` 없이 만들면 키와 값에 어떤 타입이든 넣을 수 있다.  
이 코드에서도 키가 문자열 `"one"`이기도 하고 정수 `12`이기도 하며, 값은 `Date`와 문자열이 섞여 있다.

| 호출 | 키 | 값 | 이후 `map`의 상태 |
|---|---|---|---|
| `put("one", new Date())` | `"one"` | 현재 시각 | 키 1개 |
| `put(12, "apple")` | `12` | `"apple"` | 키 2개 |
| `put(12, "banana")` | `12` | `"banana"` | 키 `12`가 이미 있어서 값만 `"apple"`에서 `"banana"`로 바뀐다. 키는 2개 그대로 |

그래서 `map.get(12)`는 `"banana"`를 돌려준다.  
`Map`의 `put`은 키가 이미 있어도 예외를 던지지 않는다.  
Java API 문서에 따르면 `put`은 그 키에 연결되어 있던 이전 값을 반환하고(없었다면 `null`), 값은 새 값으로 바뀐다.

`"map = ..."`로 출력되는 줄은 `Date` 값이 실행한 시각마다 달라져서 출력 예시를 적지 않았다.

### 타입을 지정한 Map: 컴파일러가 실수를 막는다

`Map<String, String>`은 키와 값을 모두 문자열로 제한한다.  
다른 타입을 넣으려고 하면 컴파일 단계에서 오류가 난다.

| 호출 | 호출 후 `map2`의 키 |
|---|---|
| `put("one", "java")` | `one` |
| `put("two", "javascript")` | `one`, `two` |
| `put("three", "python")` | `one`, `two`, `three` |
| `remove("three")` | `one`, `two` |

`remove("three")`는 키를 기준으로 한 쌍을 통째로 지운다.  
두 번째 `println`에는 `three`가 나오지 않는다.  
`HashMap`은 키의 출력 순서를 보장하지 않아서, `one`과 `two`가 어떤 순서로 나오는지는 적지 않았다.

실제 코드에서는 첫 번째처럼 타입 없는 `Map`보다 `Map<String, String>`처럼 타입을 적는 쪽이 안전하다.  
타입 없는 `Map`에서 꺼낸 값은 `Object` 타입이라서, 문자열로 쓰려면 직접 형변환을 해야 한다.

## 3. 키-값 한 쌍을 다루는 메소드

위 코드는 `put`, `get`, `remove`만 썼다.  
`HashMap`이 제공하는 주요 메소드는 아래와 같다. (Java API 문서의 `Map` 설명으로 정리했고, 이번 실습 코드에는 없다.)

| 메소드 | 하는 일 |
|---|---|
| `put(K key, V value)` | 키-값 쌍을 넣는다. 키가 이미 있으면 값을 바꾼다 |
| `get(Object key)` | 키에 연결된 값을 반환한다. 키가 없으면 `null`이다 |
| `remove(Object key)` | 키와 연결된 쌍을 지운다 |
| `containsKey(Object key)` | 그 키가 있는지 확인한다 |
| `containsValue(Object value)` | 그 값이 있는지 확인한다 |
| `keySet()` | 모든 키를 `Set`으로 반환한다 |
| `values()` | 모든 값을 `Collection`으로 반환한다 |
| `entrySet()` | 모든 키-값 쌍을 `Map.Entry`의 `Set`으로 반환한다 |

표의 메소드를 한 코드에서 차례로 써 보면 아래와 같다.  
(예시 코드이고, 결과는 코드를 따라가 적은 것이라 직접 실행해 확인하지는 않았다.)

```java
// 예시 코드 (직접 실행해 확인하지 않음)
Map<String, Integer> map = new HashMap<>();

System.out.println(map.put("Alice", 90));   // null (이전 값이 없었다)
System.out.println(map.put("Alice", 95));   // 90 (덮어쓰면서 이전 값을 돌려준다)
map.put("Bob", 85);

System.out.println(map.get("Alice"));         // 95
System.out.println(map.get("Carol"));         // null (없는 키)
System.out.println(map.containsKey("Bob"));   // true
System.out.println(map.containsValue(100));   // false

Set<String> keys = map.keySet();              // Alice, Bob (순서는 보장되지 않는다)
Collection<Integer> values = map.values();    // 95, 85 (순서는 보장되지 않는다)

map.remove("Bob");
System.out.println(map.size());   // 1
```

`put`의 반환값이 위 설명(이전 값을 반환하고, 없었다면 `null`)을 그대로 보여 준다.  
`get`이 `null`을 돌려주는 경우는 "키가 없다"일 수도 있고 "값으로 `null`을 넣었다"일 수도 있어서, 키가 있는지가 중요하면 `containsKey`로 확인한다.

`Map` 전체를 반복문으로 돌 때는 `entrySet()`을 쓴다.  
아래는 위 메소드를 보이기 위한 예시 코드이고, 직접 실행해 확인하지는 않았다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 90);
scores.put("Bob", 85);

for (Map.Entry<String, Integer> entry : scores.entrySet()) {
    System.out.println(entry.getKey() + " : " + entry.getValue());
}
```

`Map.Entry`는 키-값 한 쌍을 나타내고, `getKey()`와 `getValue()`로 각각 꺼낸다.  
출력되는 순서는 `HashMap`이 정하므로 코드와 같은 순서라는 보장이 없다.

## 4. Properties: 문자열만 저장하는 설정용 Map

접속할 데이터베이스 주소나 계정 같은 설정 값은 코드 밖의 파일에 `이름=값` 형태로 적어 두는 경우가 많다.  
주석에 적힌 `.env` 예시(`DATABASE_URL=...`)가 그런 모양이다.  
이런 설정 값을 코드에서 다룰 때 쓰는 클래스가 `Properties`다.

```java
package com.wanted.b_collection.c_map;

import java.util.Properties;

public class Application02 {

    public static void main(String[] args) {

        Properties prop = new Properties();
        prop.setProperty("driver", "cj.jdbc.driver.mysql");
        prop.setProperty("url", "jdbc:mysql://localhost/menudb");
        prop.setProperty("username", "wanted");
        prop.setProperty("password", "wanted");

        System.out.println("prop = " + prop);

    }

}
```

`Properties`는 `Map`처럼 키-값을 저장하지만, **키와 값이 모두 `String`**이라는 점이 다르다.  
그래서 값을 넣을 때도 `put`이 아니라 문자열 전용인 `setProperty`를 쓴다.  
Java API 문서는 `Properties`가 `Hashtable`을 상속해서 `put`도 쓸 수는 있지만, 문자열이 아닌 값이 들어갈 수 있어서 권장하지 않는다고 설명한다.

| 키 | 값 | 뜻 |
|---|---|---|
| `driver` | `cj.jdbc.driver.mysql` | JDBC 드라이버 이름 |
| `url` | `jdbc:mysql://localhost/menudb` | 접속할 데이터베이스 주소 |
| `username` | `wanted` | 접속 계정 |
| `password` | `wanted` | 접속 비밀번호 |

이 코드는 파일을 읽지 않고 `setProperty`로 값을 직접 넣은 뒤 출력만 한다.  
넣은 값은 `getProperty`로 꺼내는데, 키가 없을 때 쓸 기본값을 함께 줄 수 있다.  
(예시 코드이고, 결과는 코드를 따라가 적은 것이라 직접 실행해 확인하지는 않았다.)

```java
// 예시 코드 (직접 실행해 확인하지 않음)
System.out.println(prop.getProperty("username"));       // wanted
System.out.println(prop.getProperty("port"));           // null (없는 키)
System.out.println(prop.getProperty("port", "3306"));   // 3306 (없으면 기본값)
```


출력되는 키 순서는 정해져 있지 않아서 적지 않았다.

## 5. 헷갈리기 쉬운 점

### 같은 키로 put하면 오류가 아니라 덮어쓴다

`Set`은 같은 요소를 `add`하면 무시한다.  
`Map`은 같은 키를 `put`하면 **값이 새 값으로 바뀐다**.  
오류도 경고도 없어서, 키를 실수로 겹치게 쓰면 앞의 데이터가 조용히 사라진다.

### 설정 값을 그대로 출력하지 않는다

`Application02`는 `username`과 `password`까지 `println`으로 출력한다.  
연습 코드라서 문제가 없지만, 실제 서비스에서 비밀번호를 로그에 남기면 안 된다.  
이 글의 값(`wanted`)은 예제용 문자열이다.

### 드라이버 이름은 확인이 필요하다

코드의 `"cj.jdbc.driver.mysql"`은 MySQL 드라이버 클래스 이름과 달라 보인다.  
정확한 이름은 사용하는 MySQL 커넥터의 공식 문서로 확인해야 해서 `확인 필요`로 둔다.  
이 코드는 문자열을 저장하고 출력할 뿐이라서, 이름이 틀려도 실행에는 영향이 없다.

## 6. 정리

- `Map`은 키로 값을 찾는다.  
  위치(`List`)나 값 자체(`Set`)가 아니라 이름표로 접근할 때 쓴다.
- 같은 키로 `put`하면 값이 덮어씌워진다.  
  키 `12`에 `"apple"`을 넣고 `"banana"`를 다시 넣으면 `get(12)`는 `"banana"`다.
- `Properties`는 키와 값이 모두 문자열인 `Map`이고, 값은 `setProperty`로 넣는다.

다음에는 `Map`의 키가 `Set`처럼 동작하는 원리인 `hashCode()`와 `equals()`를 보면 좋다.

## 더 학습하면 좋은 개념

- **HashMap의 내부 동작(해시 테이블)** — 키로 값을 빠르게 찾는 원리와 출력 순서를 보장하지 않는 이유가 여기서 나온다.  
  `HashSet`이 내부적으로 `HashMap`을 쓴다는 점과도 이어진다.
- **LinkedHashMap과 TreeMap** — `Set`처럼 `Map`에도 넣은 순서를 유지하거나 키를 정렬하는 구현체가 있다.  
  어떤 상황에 무엇을 고를지 비교해 보면 좋다.
- **equals()와 hashCode()** — 직접 만든 클래스를 키로 쓰려면 "같은 키"를 판단하는 기준을 정해 줘야 한다.
- **List, Set, Map 사이의 변환** — `keySet()`처럼 `Map`에서 `Set`을 꺼내거나, `List`를 `Set`으로 바꿔 중복을 제거하는 식으로 컬렉션을 오가는 방법이다.
- **환경 설정 파일(.properties, .env)** — `Properties`로 파일을 읽고 쓰는 방법과, 비밀번호 같은 값을 코드에 직접 적지 않는 이유를 이해하면 실무에서 도움이 된다.

## 참고 자료
- [Oracle - The Map Interface (The Java Tutorials)](https://docs.oracle.com/javase/tutorial/collections/interfaces/map.html)
- [Java SE API - Map](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html)
- [Java SE API - HashMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
- [Java SE API - Properties](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Properties.html)
