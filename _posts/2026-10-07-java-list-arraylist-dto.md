---
title: "List와 ArrayList, DTO 기초"
date: 2026-10-07
tags:
  - Java
---

책 5권을 변수 5개에 따로 담으면 책이 늘어날 때마다 변수를 새로 선언해야 한다.  
배열은 크기를 한 번 정하면 바꿀 수 없다.  
자바의 컬렉션(Collection) 중 `List`를 구현한 `ArrayList`로 책 목록을 담고, 책 한 권의 데이터를 나르는 `BookDTO` 클래스를 함께 만들었다.  
이전에 정리한 [제네릭 기초]({{ site.baseurl }}/java-generic-basics.html)를 `List<String>`, `List<BookDTO>`에 그대로 적용해 본 실습이다.

> **TL;DR**
> - `List`는 순서가 있고 중복을 허용하는 컬렉션이며, 인터페이스라서 `new ArrayList<>()`처럼 구현체로 객체를 만든다.
> - `List`에 타입을 지정하지 않으면 `String`, `int`, `Date` 등 무엇이든 들어간다. `List<BookDTO>`처럼 지정하면 그 타입만 담는다.
> - `BookDTO`는 필드, 생성자 2개, getter, setter, `toString()`으로만 이루어진 데이터 운반용 클래스(DTO)다.

## 1. 컬렉션은 세 가지로 나뉜다

코드의 주석은 컬렉션을 `List`, `Set`, `Map` 세 가지로 구분했다.

| 종류 | 순서 | 중복 | 설명 |
|---|---|---|---|
| `List` | 있음 | 허용 | 순서가 있는 데이터의 집합 |
| `Set` | 없음 | 허용하지 않음 | 순서가 없는 데이터의 집합 |
| `Map` | - | key만 허용하지 않음 | 키와 값 하나가 쌍을 이루는 데이터의 집합 |

이번 실습은 `List`만 다뤘고, `Set`은 [다음 글]({{ site.baseurl }}/java-set-hashset-treeset.html)에서 정리한다.  
`Map`은 컬렉션 프레임워크에 포함되지만 `Collection` 인터페이스를 상속받지 않고 별도 계층을 이룬다.  
공식 튜토리얼도 `Map`을 엄밀한 의미의 컬렉션이 아니라고 설명한다.

## 2. List는 인터페이스라서 ArrayList로 객체를 만든다

`List`는 인터페이스라서 생성자를 쓸 수 없고, 객체를 직접 만들 수 없다.  
그래서 `List`를 구현한 클래스인 `ArrayList`로 객체를 만들고 변수 타입은 `List`로 둔다.  
`ArrayList`는 가장 많이 쓰이는 구현체이고, 내부적으로 배열의 특징을 갖는다.  
인터페이스를 타입으로 쓰는 이유는 [인터페이스 기초 글]({{ site.baseurl }}/java-interface-basics.html)에서 정리했다.

## 3. 타입을 지정하지 않은 List 실험

```java
package com.wanted.b_collection.a_list.run;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

public class Application01 {

    public static void main(String[] args) {

        /* comment. 컬렉션
        *   1. List
        *   - 순서가 있는 데이터의 집합. 중복을 허용한다.
        *   2. Set
        *   - 순서가 없는 데이터의 집합. 중복을 허용하지 않는다.
        *   3. Map
        *   - 키와 값 하나의 쌍으로 이루어지는 데이터 집합
        *   - key 값은 Set 으로 구현되어 있어 중복을 허용하지 않는다.
        *  */

        // 인터페이스는 생성자를 작성할 수 없다.
        // == 즉 인터페이스는 객체를 생성할 수 없다.
        // List 를 상속받은 클래스를 통해 객체를 생성한다.
        // ArrayList 는 List 를 상속받아 구현을 한 구현체이다.
        // 가장 많이 사용이 되며, 내부적으로 배열의 특징을 갖는다.
        List list = new ArrayList();

        list.add("apple");
        list.add(1);
        list.add(123.123);
        list.add(true);
        list.add(new Date());

        System.out.println("list = " + list);
        System.out.println("list.size() = " + list.size());

        System.out.println("1번 공간에 있는 값 = " + list.get(1));
        
        // 배열의 단점 : 고정크기 , 기존 값 수정
        list.add(1, "banana");
        System.out.println("list = " + list);
        
        list.remove(2);
        System.out.println("list = " + list);

        System.out.println("======================");
        List<String> strings = new ArrayList<>();
        strings.add("a");
        strings.add("c");
        strings.add("b");
        strings.add("d");
        System.out.println("strings = " + strings);
        // 클래스명 변수명 = new 클래스명();
        // 변수명.메소드명();
        Collections.sort(strings);
        System.out.println("strings = " + strings);
    }

}
```

`Date` 값은 실행한 시각에 따라 달라지므로 `<현재 시각>`으로 표시했다.  
나머지 출력은 코드를 따라가서 적은 것이고, 실행해서 확인하지는 않았다.

```text
list = [apple, 1, 123.123, true, <현재 시각>]
list.size() = 5
1번 공간에 있는 값 = 1
list = [apple, banana, 1, 123.123, true, <현재 시각>]
list = [apple, banana, 123.123, true, <현재 시각>]
======================
strings = [a, c, b, d]
strings = [a, b, c, d]
```

출력에서 확인한 점은 다음과 같다.

- `<>` 없이 만든 `List`에는 `String`, `int`, `double`, `boolean`, `Date`가 한꺼번에 들어갔다. [제네릭 기초 글]({{ site.baseurl }}/java-generic-basics.html)에서 본 것처럼 타입을 지정하지 않으면 어떤 값이든 받는다.
- `list.add(1, "banana")`는 1번 자리에 값을 끼워 넣고, 원래 1번 이후의 값들을 한 칸씩 뒤로 민다. 배열이라면 직접 해야 하는 작업이다.
- `list.remove(2)`는 2번 자리의 값 `1`을 지우고 뒤의 값들을 한 칸씩 당긴다. `remove`에 `int`를 넘기면 값이 아니라 **위치(인덱스)** 로 지운다. `List<Integer>`에서는 이 차이가 헷갈릴 수 있다.
- `List<String>`에 `a, c, b, d`를 넣고 `Collections.sort()`를 호출하면 `a, b, c, d` 순서로 정렬된다.

주석에 "배열의 단점 : 고정크기, 기존 값 수정"이라고 적어 둔 것처럼, `List`는 크기가 자동으로 늘고 중간 삽입과 삭제를 메소드 한 줄로 처리한다.

## 4. DTO는 데이터 운반만 하는 클래스다

`BookDTO`는 책 번호, 제목, 저자, 가격을 담는 클래스다.  
DTO(Data Transfer Object)는 행위(메소드)가 아니라 **데이터를 나르는 것**이 목적이라서, 필드와 그 필드를 다루는 기본 메소드로만 이루어진다.  
코드의 주석이 정리한 구성 요소는 6가지다.

| 번호 | 구성 요소 | `BookDTO`에서의 모습 |
|---|---|---|
| 1 | 필드 | `no`, `title`, `author`, `price` |
| 2 | 기본 생성자 | `public BookDTO() {}` |
| 3 | 모든 필드를 초기화하는 생성자 | `BookDTO(int no, String title, String author, int price)` |
| 4 | getter | `getNo()`, `getTitle()`, `getAuthor()`, `getPrice()` |
| 5 | setter | `setNo()`, `setTitle()`, `setAuthor()`, `setPrice()` |
| 6 | `toString()` | 필드 값을 `BookDTO{no=1, ...}` 형태의 문자열로 반환 |

```java
package com.wanted.b_collection.a_list.dto;

public class BookDTO {

    // DTO (Data Transfer Object)
    // 행위(==메서드) 에 집중하는 클래스가 아닌
    // 단순 데이터 운반을 위한 클래스이다.
    // 메서드가 아닌 필드들로만 이루어져 있으며
    // DTO 에 포함되어 있는 값.
    // 1. 필드 , 2. 기본생성자 , 3. 모든 필드를 초기화 하는 생성자
    // 4. getter , 5. setter , 6. toString

    private int no; // 책 번호
    private String title; // 책 제목
    private String author; // 책 저자
    private int price;  // 책 가격

    public BookDTO() {}

    public BookDTO(int no, String title, String author, int price) {
        this.no = no;
        this.title = title;
        this.author = author;
        this.price = price;
    }

    public int getNo() {
        return no;
    }

    public void setNo(int no) {
        this.no = no;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public int getPrice() {
        return price;
    }

    public void setPrice(int price) {
        this.price = price;
    }

    @Override
    public String toString() {
        return "BookDTO{" +
                "no=" + no +
                ", title='" + title + '\'' +
                ", author='" + author + '\'' +
                ", price=" + price +
                '}';
    }
}
```

필드를 `private`으로 두고 getter와 setter로만 접근하는 방식은 [캡슐화를 다룬 글]({{ site.baseurl }}/java-encapsulation-immutable-objects.html)의 내용과 같다.  
`toString()`을 재정의했기 때문에 `System.out.println(book)`처럼 객체를 바로 출력해도 `BookDTO@해시코드`가 아니라 필드 값이 보인다.

## 5. `ArrayList<BookDTO>`로 책 5권을 담고 출력하기

```java
package com.wanted.b_collection.a_list.run;

import com.wanted.b_collection.a_list.dto.BookDTO;

import java.util.ArrayList;
import java.util.List;

public class Application02 {

    public static void main(String[] args) {

        /* comment. ArrayList 활용!
        *   - 책은 책번호, 제목, 저자, 가격이 있다.
        *   - 5권의 책을 하나의 변수에 저장을 한다.
        *   - 가격 오름차순으로 정렬을 해본다.
        *  */

//        BookDTO book1 = new BookDTO(1, "홍길동전", "허균", 50000);
//        BookDTO book2 = new BookDTO(2, "목민심서", "정약용", 45000);
//        BookDTO book3 = new BookDTO(3, "삼국지", "유비", 30000);
//        BookDTO book4 = new BookDTO(4, "마법천자문", "손오공", 20000);
//        BookDTO book5 = new BookDTO(5, "삼국유사", "일연", 58000);

        // BookDTO 타입의 객체를 저장할 수 있는 List
        List<BookDTO> bookList = new ArrayList<>();
        bookList.add(new BookDTO(1, "홍길동전", "허균", 50000));
        bookList.add(new BookDTO(2, "목민심서", "정약용", 45000));
        bookList.add(new BookDTO(3, "삼국지", "유비", 30000));
        bookList.add(new BookDTO(4, "마법천자문", "손오공", 20000));
        bookList.add(new BookDTO(5, "삼국유사", "일연", 58000));

        System.out.println("bookList = " + bookList);

        // 반복문을 활용해서 책 1개씩 출력
        for (int i = 0; i < bookList.size(); i++) {
            System.out.println((i+1) + "번째 책 : " + bookList.get(i));
        }

        // 향상된 for 문
        // for(컬렉션 반복 시 1개의 값을 담을 변수 : 컬렉션객체 )
        for (BookDTO book : bookList) {
            System.out.println(book.getNo() + "번째 책 : " + book);
        }

        
        // 각각의 변수에 책들이 들어있다.

        // 객체배열
//        BookDTO[] bookList = new BookDTO[] {
//                new BookDTO(1, "홍길동전", "허균", 50000),
//                new BookDTO(2, "목민심서", "정약용", 45000),
//                new BookDTO(3, "삼국지", "유비", 30000),
//                new BookDTO(4, "마법천자문", "손오공", 20000),
//                new BookDTO(5, "삼국유사", "일연", 58000)
//        };

    }

}
```

출력은 다음과 같다.  
코드를 따라가서 적은 것이고, 같은 형태의 줄이 반복되는 부분은 생략했다.

```text
bookList = [BookDTO{no=1, title='홍길동전', author='허균', price=50000}, BookDTO{no=2, title='목민심서', author='정약용', price=45000}, BookDTO{no=3, title='삼국지', author='유비', price=30000}, BookDTO{no=4, title='마법천자문', author='손오공', price=20000}, BookDTO{no=5, title='삼국유사', author='일연', price=58000}]
1번째 책 : BookDTO{no=1, title='홍길동전', author='허균', price=50000}
2번째 책 : BookDTO{no=2, title='목민심서', author='정약용', price=45000}
# ... 3~5번째 책도 같은 형태로 출력
1번째 책 : BookDTO{no=1, title='홍길동전', author='허균', price=50000}
# ... 향상된 for 문도 2~5번째 책을 같은 형태로 출력
```

`for` 문 두 가지의 차이는 다음과 같다.

| 구분 | 코드 | 번호를 얻는 방법 |
|---|---|---|
| 일반 for 문 | `for (int i = 0; i < bookList.size(); i++)` | 반복 변수 `i`에 1을 더해 출력 |
| 향상된 for 문 | `for (BookDTO book : bookList)` | `book.getNo()`로 객체에 담긴 번호를 읽음 |

향상된 for 문은 인덱스를 관리하지 않아서 코드가 짧다.  
대신 몇 번째 요소인지가 필요하면 객체에 번호가 들어 있어야 한다.  
이 예제에서는 `BookDTO`에 `no` 필드가 있어서 `getNo()`로 해결했다.

## 6. 헷갈리기 쉬운 점: 정렬은 아직 구현하지 않았다

`Application02`의 주석에는 "가격 오름차순으로 정렬을 해본다"고 적혀 있지만, 이번 코드에는 정렬이 들어 있지 않다.  
출력도 가격이 아니라 넣은 순서(1번부터 5번)로 나온다.

`Application01`에서는 `List<String>`을 `Collections.sort()`로 정렬했다.  
`String`은 자바가 정렬 기준을 이미 정해 둔 타입이라서 가능한 것으로 알고 있다.  
`BookDTO`는 정렬 기준이 정해져 있지 않아서 같은 방식으로 `Collections.sort(bookList)`를 호출하면 컴파일되지 않는다.  
가격 오름차순 정렬은 기준을 따로 알려줘야 하고, 이 방법은 다음에 정리한다.  
이 설명은 대화에서 직접 확인하지 않아서 `확인 필요`다.

## 7. 컬렉션 프레임워크의 구조와 List의 주요 메소드

컬렉션들은 인터페이스를 중심으로 계층을 이룬다.  
`List`, `Set`, `Queue`는 모두 `Collection`의 하위 인터페이스이고, `Collection`은 `Iterable`을 상속받는다.  
향상된 for 문이 컬렉션에 쓰이는 것도 `Iterable` 덕분이다.  
`Map`만 이 계층 밖에 있다.

```text
Iterable
└── Collection
    ├── List  (ArrayList, LinkedList ...)
    ├── Set   (HashSet, LinkedHashSet, TreeSet ...)
    └── Queue

Map (별도 계층: HashMap, TreeMap ...)
```

이번 실습에서 쓴 `List`의 주요 메소드는 다음과 같다.

| 메소드 | 하는 일 | 이번 코드에서의 예 |
|---|---|---|
| `add(E e)` | 맨 뒤에 요소를 추가한다 | `list.add("apple")` |
| `add(int index, E e)` | 지정한 위치에 끼워 넣고 뒤의 요소를 밀어낸다 | `list.add(1, "banana")` |
| `get(int index)` | 지정한 위치의 요소를 반환한다 | `list.get(1)` |
| `remove(int index)` | 지정한 위치의 요소를 지우고 뒤의 요소를 당긴다 | `list.remove(2)` |
| `size()` | 요소의 개수를 반환한다 | `list.size()` |

이 외에 요소를 바꾸는 `set(int, E)`, 값으로 지우는 `remove(Object)`, 포함 여부를 확인하는 `contains(Object)`, 비었는지 확인하는 `isEmpty()`, 모두 지우는 `clear()`도 자주 쓴다.  
이 메소드들은 이번 실습에서 사용하지 않았고, 공식 API 문서에서 확인한 것이다.

## 8. ArrayList는 내부에서 어떻게 동작할까

공식 API 문서는 `ArrayList`를 크기를 조절할 수 있는 배열(resizable-array) 구현이라고 설명한다.  
요소가 늘어 내부 배열이 가득 차면 자동으로 용량을 늘리기 때문에, 배열의 단점인 고정 크기를 개발자가 신경 쓰지 않아도 된다.

| 작업 | 시간 특성 (공식 문서 기준) | 이유 |
|---|---|---|
| `get(index)`, `set(index, e)` | 데이터 개수와 무관하게 일정 | 배열은 위치로 바로 접근한다 |
| 맨 뒤에 `add(e)` | 평균적으로 일정 | 용량이 가득 차면 늘리는 비용이 가끔 든다 |
| 중간에 `add(index, e)`, `remove(index)` | 개수에 비례해 느려질 수 있음 | 뒤의 요소를 한 칸씩 밀거나 당겨야 한다 |

3절의 `add(1, "banana")`와 `remove(2)`가 편해 보여도, 내부에서는 뒤의 요소를 옮기는 작업이 일어난다.  
중간 삽입과 삭제가 아주 잦다면 다른 구현체가 더 맞을 수 있다.  
변수 타입을 `List`로 두면 `new ArrayList<>()`를 다른 구현체로 바꿔도 나머지 코드는 그대로 쓸 수 있다.

## 9. 정리

- `List`는 순서가 있고 중복을 허용하는 컬렉션이다. 인터페이스라서 `ArrayList` 같은 구현체로 객체를 만들고, `add`, `get`, `remove`, `size`로 다룬다.
- 타입을 지정하지 않은 `List`는 아무 값이나 받는다. `List<BookDTO>`처럼 타입을 지정하면 그 타입만 담을 수 있어서 안전하다.
- DTO는 필드, 생성자 2개, getter, setter, `toString()`으로 이루어진 데이터 운반용 클래스다. 가격 오름차순 정렬은 아직 구현하지 않았다.
- `ArrayList`는 크기가 자동으로 늘어나는 배열이다. 위치로 꺼내기는 빠르지만, 중간에 넣거나 지우면 뒤의 요소를 옮기는 비용이 든다.

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **Comparable과 Comparator** — 가격 오름차순 정렬처럼 객체의 정렬 기준을 정하는 방법이다. `BookDTO` 정렬을 구현하려면 알아야 한다.
- **Set과 Map** — 오늘은 `List`만 다뤘다. 중복을 허용하지 않는 `Set`과 key-value 구조인 `Map`을 쓰면 `List`로 하기 불편한 작업이 쉬워진다.
- **ArrayList와 LinkedList의 차이** — 둘 다 `List`의 구현체지만 내부 구조가 달라서 중간 삽입, 삭제, 조회 속도가 다르다. 어떤 구현체를 고를지 판단하는 기준이 된다.
- **향상된 for 문의 동작 원리(Iterator)** — 향상된 for 문은 컬렉션을 순회하는 방식의 하나다. 순회 중에 요소를 지울 때 생기는 문제를 이해하는 데 필요하다.

## 참고 자료
- [Oracle - Collections (The Java Tutorials)](https://docs.oracle.com/javase/tutorial/collections/index.html)
- [Oracle - Introduction to Collections](https://docs.oracle.com/javase/tutorial/collections/intro/index.html)
- [Java SE API - List](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html)
- [Java SE API - ArrayList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html)
- [Java SE API - Collections.sort](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html)
- [Java Language Specification - 14.14.2. The enhanced for statement](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.14.2)
