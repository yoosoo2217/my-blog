---
title: "제네릭 기초와 타입 변수 T"
date: 2026-10-07
tags:
  - Java
---

`setValue(1)`을 호출한 객체에 곧바로 `setValue("안녕하세요")`를 넣어도 컴파일이 된다면, 그 객체에서 꺼낸 값이 숫자인지 문자열인지 누가 보장할까?  
`GenericTest` 클래스로 제네릭 없이 쓴 경우와 `<T>`를 붙여 쓴 경우를 비교하며 제네릭이 이 문제를 어떻게 막는지 확인했다.

> **TL;DR**
> - 제네릭은 클래스나 메소드가 쓸 데이터 타입을 **컴파일 시점에 지정**하는 방법이다. 지정한 타입과 다른 값을 넣으면 컴파일 에러가 나서 타입 안정성이 높아진다.
> - 선언은 클래스 이름 뒤에 `<T>`를 붙인다. `T`는 타입 변수이고, 관례상 `T`라고 쓴다.
> - `<>` 안에는 기본 자료형을 쓸 수 없고, `Integer` 같은 Wrapper 클래스를 쓴다.

## 1. 제네릭이란

제네릭(Generic)은 데이터 타입을 일반화한다는 뜻이다.  
클래스나 메소드 안에서 쓸 타입을 코드를 작성하는 쪽이 아니라, **그 클래스를 사용하는 쪽이 컴파일 시점에 지정**하게 한다.  
컴파일러가 미리 타입을 검사하기 때문에 클래스나 메소드 내부에서 쓰는 객체의 타입 안정성이 높아진다.

## 2. 실험에 쓴 코드

값을 하나 담는 `GenericTest` 클래스를 만들었다.  
클래스 선언부 끝의 `<T>`가 제네릭을 설정하는 부분이다.

```java
package com.wanted.a_generic.a_basic;

public class GenericTest<T> {

    private T value;

    /*comment. getter 와 setter 메서드
    *  해당 메서드는 private으로 캡슐화가 된 필드를
    *  외부에서 조회하거나 (getter) 값을 초기화 (setter) 할 때 사용할 수 있는 메서드*/


    public T getValue() {
        return value;
    }

    public void setValue(T value) {
        this.value = value; // 전달받은 값으로 초기화하는 메소드
    }

    /*comment. toString()
    *  클래스 자료형은 기본적으로 참조 자료형이기 대문에
    *  변수 출력 시 주소값이 출력되게 한다.
    *  toString 메서드는 변수 내부에 들어있는 값을 주소 값으로 출력해주는
    *  것이 아닌 실제 값을 출력하는 역할을 한다.*/

    @Override
    public String toString() {
        return "GenericTest{" +
                "value=" + value +
                '}';
    }
    /*comment.
    *  제네릭을 설정하는 방법은 클래스 선언부 끝에
    *  <> 다이아몬드 연산자를 사용
    *  <T> T는 타입 변수를 불리우며 관례상 T라고 작성을 하게 된다.*/
}
```

사용하는 쪽은 `<>`를 붙이지 않은 경우, `String`을 지정한 경우, `Integer`를 지정한 경우를 차례로 만들었다.

```java
package com.wanted.a_generic.a_basic;

public class Application {
    static void main(String[] args) {
        /*comment. Generic이란?
        *  제네릭은 데이터 타입을 일반화 한다는 의미이다.
        *  클래스나 메소드에서 사용할 내부 데이터 타입을
        *  컴파일 시점에 지정하는 방법을 의미한다.
        *  컴파일 시점에 미리 타입에 대한 검사를 진행하며,
        *  클래스나 메소드 내부에서 사용되는 객체의 타입 안정성을 높일 수 있다. */

        GenericTest gt = new GenericTest();
        gt.setValue(1);
        System.out.println("gt = " + gt.getValue());
        System.out.println("======================");

        gt.setValue("안녕하세요");
        System.out.println("gt = " + gt.getValue());
        System.out.println("======================");
        // object: 모든 클래스의 부모
        // 빨간색 줄 : 오류 / 노란색 줄 : 권장 x

        GenericTest<String> gt2 = new GenericTest<>();
        gt2.setValue("문자열열열");
        System.out.println("gt2 = " + gt2.getValue());
//        gt2.setValue(1);
//        GenericTest<int> gt3 = new GenericTest<int>();
        /*comment.
        *  <> 제네릭의 다이아몬드 연산자 내부에는 기본자료형 x
        *  - Wrapper class
        *  - 기존 자료형 (int, char, boolean) 을
        *  인스턴스화(= 참조자료형 화) 한 객체라고 본다.
        *  - int -> Integer
        *  - byte -> Byte
        *  - short -> Short
        *  - boolean -> Boolean
        *  - char -> Character */

        GenericTest<Integer> gt3 = new GenericTest<Integer>();
//        gt3.setValue("문자열ㄴ");
        gt3.setValue(1);
    }
}
```

`Application`을 실행하면 출력은 다음과 같다.  
주석 처리된 줄은 실행되지 않는다.

```text
gt = 1
======================
gt = 안녕하세요
======================
gt2 = 문자열열열
```

## 3. 타입을 지정하지 않으면 무엇이 들어갈까

`GenericTest gt = new GenericTest();`처럼 `<>` 없이 쓰면 `setValue(1)`과 `setValue("안녕하세요")`가 모두 컴파일된다.  
코드의 주석처럼 `Object`가 모든 클래스의 부모라서, 타입을 지정하지 않으면 `T` 자리에 `Object`처럼 취급되어 어떤 값이든 받기 때문이다.  
이때 IDE에는 노란색 줄(권장하지 않음)이 뜬다.

문제는 값을 꺼낼 때 생긴다.  
`getValue()`가 돌려주는 값이 숫자인지 문자열인지 컴파일러가 알 수 없으므로, 개발자가 직접 타입을 기억하고 변환해야 한다.  
아래는 이 상황을 보이기 위한 예시 코드이고, 실행해서 확인하지는 않았다.

```java
GenericTest gt = new GenericTest();
gt.setValue("안녕하세요");
Integer number = (Integer) gt.getValue(); // 컴파일은 되지만 실행하면 ClassCastException
```

타입 오류가 컴파일 시점이 아니라 실행 중에 드러난다는 점이 위험하다.

## 4. 타입을 지정하면 컴파일러가 막아준다

`GenericTest<String> gt2`처럼 `<String>`을 지정하면 `T`가 `String`으로 정해진다.  
그러면 `setValue(String value)`처럼 동작하므로 `gt2.setValue(1)`은 컴파일 에러가 난다.  
코드에서 이 줄을 주석 처리해 둔 이유다.  
`GenericTest<Integer> gt3`도 마찬가지로 `gt3.setValue("문자열ㄴ")`이 막힌다.

| 구분 | 선언 | `setValue(1)` | `setValue("문자열")` |
|---|---|---|---|
| 타입 미지정 | `GenericTest gt` | 컴파일됨 | 컴파일됨 |
| `String` 지정 | `GenericTest<String> gt2` | 컴파일 에러 | 컴파일됨 |
| `Integer` 지정 | `GenericTest<Integer> gt3` | 컴파일됨 | 컴파일 에러 |

`new GenericTest<>()`처럼 오른쪽 `<>`를 비워도 된다.  
왼쪽에 `<String>`이 있으면 컴파일러가 오른쪽 타입을 추론하기 때문이다.  
이렇게 비워 쓰는 `<>`를 다이아몬드 연산자라고 부른다.

## 5. 제네릭에 int는 왜 못 쓸까

`GenericTest<int> gt3 = new GenericTest<int>();`는 컴파일되지 않는다.  
`<>` 안에는 참조 자료형만 쓸 수 있기 때문이다.  
기본 자료형은 객체가 아니라서, 객체로 감싼 **Wrapper 클래스**를 대신 쓴다.

| 기본 자료형 | Wrapper 클래스 |
|---|---|
| `int` | `Integer` |
| `byte` | `Byte` |
| `short` | `Short` |
| `long` | `Long` |
| `float` | `Float` |
| `double` | `Double` |
| `boolean` | `Boolean` |
| `char` | `Character` |

`char`의 Wrapper는 `Character`이고, 이름이 `Char`가 아니라는 점을 주의한다.  
원래 코드 주석에는 `character`(소문자 시작)로 적혀 있었는데, 실제 클래스 이름은 대문자로 시작하는 `Character`다.

## 6. getter, setter, toString은 제네릭과 어떻게 만날까

`value`는 `private` 필드라서 외부에서 직접 접근할 수 없다.  
그래서 값을 조회하는 `getValue()`와 값을 넣는 `setValue()`를 `public`으로 열어 두었다.  
이 방식은 [캡슐화를 다룬 글]({{ site.baseurl }}/java-encapsulation-immutable-objects.html)에서 정리한 내용과 같다.  
제네릭에서 달라지는 점은 반환 타입과 매개변수 타입이 `T`라는 것뿐이다.  
`GenericTest<String>`이면 `getValue()`는 `String`을 돌려준다.

`toString()`은 객체를 출력할 때 쓰는 메소드다.  
직접 정의하지 않으면 `System.out.println(gt2)`는 필드 값이 아니라 `클래스이름@해시코드` 형태의 문자열을 출력한다.  
코드의 주석은 이를 "주소값"이라고 설명했는데, 정확히는 `Object`의 기본 `toString()`이 만드는 문자열이다.  
`GenericTest`처럼 재정의하면 `GenericTest{value=문자열열열}` 형태로 필드 값이 출력된다.  
이번 `Application`에서는 `toString()`을 호출하지 않았다.  
따라서 위 출력 예시에 이 결과는 없다.

## 7. 제네릭은 왜 생겼을까

제네릭은 자바 5에서 도입됐다.  
그 전에는 `T` 자리에 `Object`를 쓰는 수밖에 없었다.  
어떤 값이든 담을 수 있지만, 꺼낼 때마다 개발자가 타입을 기억해서 직접 변환(캐스팅)해야 했고, 틀리면 실행 중에야 `ClassCastException`이 났다.  
제네릭은 이 검사를 **컴파일 시점으로 앞당기는** 기능이다.

| 구분 | 제네릭 이전 (`Object` 사용) | 제네릭 사용 |
|---|---|---|
| 값을 넣을 때 | 어떤 타입이든 허용 | 지정한 타입만 허용 |
| 값을 꺼낼 때 | 직접 캐스팅이 필요 | 캐스팅 없이 지정한 타입으로 반환 |
| 타입 오류가 드러나는 시점 | 실행 중 | 컴파일 시점 |

## 8. 제네릭에서 쓰는 용어

같은 `<T>`와 `<String>`도 위치에 따라 부르는 이름이 다르다.

| 용어 | 뜻 | 이 글의 예 |
|---|---|---|
| 타입 매개변수(타입 변수) | 클래스를 선언할 때 쓰는 `<T>` | `GenericTest<T>`의 `T` |
| 타입 인자 | 클래스를 사용할 때 넣는 실제 타입 | `GenericTest<String>`의 `String` |
| 매개변수화 타입 | 타입 인자를 지정한 타입 | `GenericTest<String>` |
| 원시 타입(raw type) | 타입 인자 없이 쓴 제네릭 클래스 | `GenericTest gt`처럼 쓴 경우 |

타입 매개변수의 이름은 관례가 있다.  
공식 튜토리얼은 한 글자의 대문자를 권한다.

| 문자 | 의미 |
|---|---|
| `T` | Type (타입) |
| `E` | Element (요소, 컬렉션에서 주로 사용) |
| `K` | Key (키) |
| `V` | Value (값) |
| `N` | Number (숫자) |

코드 주석에서 `T`를 관례라고 한 것처럼, `A`나 `Value`처럼 다른 이름을 써도 문법상 오류는 아니다.  
다만 다른 사람이 읽을 때 타입 변수임을 바로 알 수 있도록 관례를 따른다.

## 9. 컴파일이 끝나면 타입 정보는 어떻게 될까

공식 튜토리얼에 따르면 자바 컴파일러는 타입을 검사한 뒤, 제네릭 타입 정보를 `Object`(또는 지정한 상한 타입)로 바꿔서 지운다.  
이 과정을 타입 소거(Type Erasure)라고 한다.  
기본 자료형을 `<>`에 쓸 수 없는 이유도 여기서 이어진다.  
타입 변수가 결국 참조 타입인 `Object`로 바뀌기 때문에, 객체가 아닌 `int`는 들어갈 수 없다.  
이 연결은 공식 문서의 설명을 바탕으로 정리한 것이고, 직접 확인한 것은 아니라서 `확인 필요`다.

## 10. 정리

- 제네릭은 클래스나 메소드가 쓸 타입을 컴파일 시점에 지정해서 타입 안정성을 높인다. 타입을 지정하지 않으면 어떤 값이든 들어가고, 오류가 실행 중에야 드러난다.
- 클래스 선언부 끝에 `<T>`를 쓰고, 사용할 때 `<String>`, `<Integer>`처럼 구체적인 타입을 정한다. `T`는 타입 변수의 관례적인 이름이다.
- `<>` 안에는 기본 자료형 대신 Wrapper 클래스(`Integer`, `Character` 등)를 쓴다.
- 제네릭은 자바 5에서 도입됐고, `Object`로 받고 직접 캐스팅하던 방식의 타입 오류를 컴파일 시점에 잡기 위한 기능이다.

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **타입 소거(Type Erasure)** — 제네릭 타입 정보는 컴파일 후 바이트코드에서 대부분 지워진다고 알려져 있다. 이 때문에 타입 미지정(raw type) 코드와의 호환이나 `ClassCastException`이 실행 중에 나는 이유를 이해하려면 알아야 한다.
- **제네릭 메소드** — 오늘은 클래스에 `<T>`를 붙였지만, 메소드 하나에만 타입 변수를 두는 방식도 있다. 유틸리티 메소드를 만들 때 자주 쓰인다.
- **경계 타입(`extends`)과 와일드카드(`?`)** — `T`가 아무 타입이나 될 수 있는 대신 "`Number`의 자식만" 같은 제한을 걸 수 있다. 타입 안정성과 유연성을 함께 맞추는 다음 단계다.
- **오토박싱·언박싱** — `Integer`에 `int` 값을 대입하거나 꺼낼 때 자바가 자동으로 변환해 준다. Wrapper 클래스를 쓰는 코드의 동작을 이해하는 데 필요하다.

## 참고 자료
- [Oracle - Generics (The Java Tutorials)](https://docs.oracle.com/javase/tutorial/java/generics/index.html)
- [Oracle - Why Use Generics?](https://docs.oracle.com/javase/tutorial/java/generics/why.html)
- [Oracle - Generic Types (타입 매개변수 이름 관례)](https://docs.oracle.com/javase/tutorial/java/generics/types.html)
- [Oracle - Raw Types](https://docs.oracle.com/javase/tutorial/java/generics/rawTypes.html)
- [Oracle - Type Erasure](https://docs.oracle.com/javase/tutorial/java/generics/erasure.html)
- [Oracle - Primitive Data Types (Wrapper 클래스)](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html)
- [Java SE API - Object.toString()](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#toString())
