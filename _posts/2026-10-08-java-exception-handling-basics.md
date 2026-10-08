---
title: "예외 처리 기초: 예외가 나면 프로그램은 어떻게 되고, 무엇으로 막을까"
date: 2026-10-08
tags:
  - Java
---

배열의 없는 칸을 읽거나 `null`인 변수의 메소드를 부르면 프로그램은 그 줄에서 멈춘다.  
멈춘 줄 아래의 코드는 한 줄도 실행되지 않는다.  
예외가 났을 때 프로그램에 무슨 일이 생기는지 코드로 확인하고, `try - catch - finally`와 `throw`/`throws`, 사용자 정의 예외로 흐름을 제어하는 방법까지 정리했다.  
파일 입출력과 자원 반납(`try-with-resources`)은 [다음 글]({{ site.baseurl }}/java-file-io-try-with-resources.html)에서 이어서 다룬다.

> **TL;DR**
> - 예외를 처리하지 않으면 그 줄에서 프로그램이 종료되고, 아래 코드는 실행되지 않는다.
> - `catch`는 **타입이 맞는 예외만** 잡는다. 타입이 안 맞으면 `finally`만 실행된 채 예외가 위로 올라간다.
> - `Exception`을 상속한 예외는 처리를 강제한다. `throws`로 호출한 쪽에 넘기거나 `try - catch`로 직접 처리한다.

환경: Java (실습에 쓴 버전은 `확인 필요`). 아래 실습 코드의 `main`은 `public` 없이 `static void main(String[] args)`로 적혀 있는데, 이 형태로 실행하려면 이를 지원하는 최신 자바가 필요하다고 알고 있다.

## 1. 예외를 처리하지 않으면: 그 줄에서 멈춘다

```java
package com.wanted.a_exception.a_basic;

public class Application {
    static void main(String[] args) {
        System.out.println("프로그램 시작");

        int[] iarr = new int[5];
        System.out.println("6번째 인덱스 출력 : " + iarr[6]);

        String str = null;
        str.length();

        System.out.println("프로그램 종료");
    }
}
```

이 코드에는 예외가 날 곳이 두 군데 있다.

| 줄 | 왜 문제인가 | 발생하는 예외 |
|---|---|---|
| `iarr[6]` | 길이 5인 배열의 인덱스는 0~4까지라서 6번은 없다 | `ArrayIndexOutOfBoundsException` |
| `str.length()` | `str`이 `null`인데 메소드를 호출했다 | `NullPointerException` |

흐름을 따라가 보면 첫 번째 예외에서 프로그램이 멈춘다.  
`"프로그램 시작"`만 출력되고, `str.length()`와 `"프로그램 종료"`는 실행되지 않는다.  
`NullPointerException`은 코드에 적혀 있지만 한 번도 실행되지 않는다.

이 코드는 문법에는 문제가 없어서 **컴파일은 통과**한다.  
오류는 실행해야 드러난다.

| 구분 | 발생 시점 | 예시 |
|---|---|---|
| 컴파일 오류 | 코드를 작성하고 컴파일하는 단계 | 없는 변수 참조, 타입 불일치 |
| 런타임 오류 | 프로그램을 실행하는 도중 | `NullPointerException`, 배열 범위 초과 |

## 2. 오류(Error)와 예외(Exception)는 다르다

둘 다 실행 중인 프로그램을 멈출 수 있지만, 개발자가 대응할 수 있는지가 다르다.

| 구분 | 의미 | 예 | 처리 |
|---|---|---|---|
| 오류(Error) | 시스템 수준의 심각한 문제 | JVM 문제, 메모리 부족 | 개발자가 코드로 대응하기 어렵고, 보통 처리하지 않는다 |
| 예외(Exception) | 개발자가 미리 예측하고 처리할 수 있는 문제 | 0으로 나누기, `null` 참조, 배열 범위 초과 | `try - catch`로 흐름을 제어할 수 있다 |

예외는 개발자가 흐름을 컨트롤할 수 있어서, 프로그램을 종료할 수도 있고 이어서 실행시킬 수도 있다.  
예외를 처리하면 코드의 안정성과 신뢰성이 올라가고, 예외 메시지로 원인과 위치를 알 수 있어서 디버깅에도 도움이 된다.

## 3. 예외 클래스의 계층: 처리를 강제하는 예외와 아닌 예외

오류와 예외는 모두 `Throwable`을 상속받는다.  
`Throwable` 아래에서 `Error`와 `Exception`으로 갈라지고, `Exception` 아래에 `RuntimeException`이 있다.

| 구분 | 어디에 속하는가 | 처리 강제 | 처리하지 않으면 |
|---|---|---|---|
| Checked 예외 | `Exception`의 자식(단, `RuntimeException` 계열은 제외) | 강제한다 | 컴파일 오류 |
| Unchecked 예외 | `RuntimeException`의 자식 | 강제하지 않는다 | 실행 중 발생하면 프로그램이 종료된다 |

Checked 예외는 `throws`로 넘기거나 `try - catch`로 처리해야 컴파일이 된다.  
Unchecked 예외는 컴파일러가 처리를 강제하지 않지만, 실행 중에 발생했는데 잡지 않으면 위로 전달되다가 프로그램이 종료된다.

대표적인 `RuntimeException` 계열 예외는 아래와 같다.

| 예외 | 발생 상황 | 예시 코드 |
|---|---|---|
| `ArithmeticException` | 0으로 나눌 때 | `3 / 0` |
| `ArrayIndexOutOfBoundsException` | 배열 범위를 넘어 참조할 때 | `new int[5]`의 `[8]` |
| `NullPointerException` | `null`인 참조로 접근할 때 | `int[] a = null; a[0]` |
| `ClassCastException` | 맞지 않는 타입으로 형변환할 때 | `Object`(`String`)를 `Integer`로 변환 |
| `NegativeArraySizeException` | 배열 크기를 음수로 지정할 때 | `new int[-1]` |

### 계층과 Checked/Unchecked를 코드로 확인하기

위 표를 코드에 그대로 적용해 본다.  
(예시 코드이고, 결과는 코드를 따라가 적은 것이라 직접 실행해 확인하지는 않았다.)

먼저 예외 객체에서 부모를 따라 올라가면 계층이 그대로 나온다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
try {
    int[] arr = new int[5];
    arr[8] = 1;
} catch (ArrayIndexOutOfBoundsException e) {
    Class<?> type = e.getClass();
    while (type != null) {
        System.out.println(type.getSimpleName());
        type = type.getSuperclass();
    }
}
// ArrayIndexOutOfBoundsException
// IndexOutOfBoundsException
// RuntimeException
// Exception
// Throwable
// Object
```

`RuntimeException`이 중간에 있으니 이 예외는 Unchecked다.  
다음은 `RuntimeException` 표의 다섯 예외를 한 번에 일으키는 코드다.  
`RuntimeException`으로 한꺼번에 잡아서 어떤 예외가 났는지 이름만 출력한다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
static void check(String label, Runnable action) {
    try {
        action.run();
    } catch (RuntimeException e) {
        System.out.println(label + " -> " + e.getClass().getSimpleName());
    }
}

public static void main(String[] args) {
    int zero = 0;
    int[] arr = new int[5];
    String str = null;
    Object obj = "문자열";
    int size = -1;

    check("0으로 나누기", () -> System.out.println(3 / zero));
    check("배열 범위 초과", () -> System.out.println(arr[8]));
    check("null 참조", () -> System.out.println(str.length()));
    check("잘못된 형변환", () -> System.out.println((Integer) obj));
    check("음수 배열 크기", () -> System.out.println(new int[size]));
}
// 0으로 나누기 -> ArithmeticException
// 배열 범위 초과 -> ArrayIndexOutOfBoundsException
// null 참조 -> NullPointerException
// 잘못된 형변환 -> ClassCastException
// 음수 배열 크기 -> NegativeArraySizeException
```

Checked와 Unchecked의 차이는 `throws`를 쓰지 않았을 때 컴파일이 되는지로 드러난다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
static void uncheckedCase() {
    throw new IllegalArgumentException("잘못된 값");   // throws 없이도 컴파일된다
}

static void checkedCase() throws IOException {
    throw new IOException("파일 문제");   // throws를 빼면 컴파일 오류
}

public static void main(String[] args) {
    uncheckedCase();   // 처리하지 않아도 컴파일된다 (실행하면 프로그램이 종료된다)

    try {
        checkedCase();   // 처리하지 않으면 컴파일 오류라서 try - catch가 필요하다
    } catch (IOException e) {
        System.out.println(e.getMessage());
    }
}
```

오류(Error)는 `Exception`의 자식이 아니라서 `catch (Exception e)`로 잡히지 않는다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
static void recurse() {
    recurse();   // 끝없이 자기 자신을 부른다
}

try {
    recurse();
} catch (Exception e) {
    System.out.println("실행되지 않는다");
}
// StackOverflowError는 Error 계열이라 위 catch를 지나쳐 프로그램이 종료된다
```

## 4. try - catch - finally: 어떤 예외를 어디서 잡을까

```java
package com.wanted.a_exception.b_solved;

public class Application {
    static void main(String[] args) {

        System.out.println("프로그램 시작됨..");

        try {
            int result = 10 / 0;
            String str = null;
            str.length();
        } catch (NullPointerException e) {
            System.out.println("예외 메시지=" + e.getMessage());
            System.out.println("예외발생  ");
        } finally {
            System.out.println("끝.");
        }

        try {
            checkAge(-5);
        } catch (IllegalArgumentException e) {
            System.out.println("e.getMessage() = " + e.getMessage());
        }

        System.out.println("-----------------------------------");
    }

    public static void checkAge(int age) {
        if (age < 0) {
            throw new IllegalArgumentException("나이는 음수일 수 없습니다.");
        }
        System.out.println("전달 받은 " + age + " 는 유효한 나이입니다.");
    }
}
```

| 블록 | 역할 | 실행 시점 |
|---|---|---|
| `try` | 예외가 날 수 있는 코드를 둔다 | 항상 먼저 실행된다 |
| `catch` | 특정 예외 타입을 잡아서 처리한다 | 해당 타입의 예외가 났을 때만 실행된다 |
| `finally` | 정리 작업을 둔다 | 예외가 났든 안 났든 항상 실행된다 |

### 이 코드의 catch는 예외를 잡지 못한다

`catch (NullPointerException e)`를 달았으니 `str.length()`의 예외가 잡힐 것 같지만 그렇지 않다.  
`try`의 첫 줄 `10 / 0`에서 `ArithmeticException`이 먼저 나기 때문이다.

1. `10 / 0`에서 `ArithmeticException`이 난다.  
   이 줄에서 `try` 블록이 끝나고, 아래의 `str.length()`는 실행되지 않는다.
2. `catch`는 `NullPointerException`만 잡는다.  
   타입이 달라서 이 예외는 잡히지 않는다.
3. `finally`는 항상 실행되므로 `"끝."`이 출력된다.
4. 잡히지 않은 예외는 위로 올라가고, 프로그램은 오류 메시지와 함께 종료된다.

그래서 `checkAge(-5)`가 있는 두 번째 `try`는 실행되지 않는다.  
이 결과는 코드를 읽고 따라간 것이고, 직접 실행해 확인하지는 않았다.

고치는 방법은 두 가지다.  
`10 / 0`을 `try` 밖으로 빼거나, `ArithmeticException`을 잡는 `catch`를 하나 더 단다.  
모든 예외의 부모인 `Exception`을 잡으면 한꺼번에 잡히지만, 어떤 문제인지 구분하기 어려워서 구체적인 타입을 적는 편이 낫다.

### catch가 여러 개일 때 순서

여러 `catch`를 이어서 쓸 수 있다.  
이때 **구체적인(하위) 예외를 먼저, 넓은(상위) 예외를 나중에** 적어야 한다.  
상위 타입을 먼저 적으면 그 아래 `catch`에는 도달할 수 없어서 컴파일 오류가 난다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
try {
    int[] arr = new int[5];
    arr[8] = 1;
} catch (ArrayIndexOutOfBoundsException e) {   // 구체적인 예외를 먼저
    System.out.println("배열 범위를 넘었다");
} catch (RuntimeException e) {                  // 그다음 넓은 예외
    System.out.println("그 밖의 실행 중 예외");
}
// 배열 범위를 넘었다

// 순서를 바꾸면 컴파일 오류가 난다
// catch (RuntimeException e) { ... }
// catch (ArrayIndexOutOfBoundsException e) { ... }   // 이미 앞에서 처리되어 도달할 수 없다
```

앞의 `catch`에서 잡히면 뒤의 `catch`는 건너뛴다.  
그래서 위 코드는 첫 번째 메시지만 출력한다.

### finally는 언제 쓸까

`finally`는 예외 여부와 상관없이 꼭 실행해야 하는 코드를 둔다.  
주로 `java.io`나 `java.sql` 패키지를 쓸 때 자원을 반납하는 용도다.  
이 반납을 더 간단하게 하는 문법이 `try-with-resources`이고, 다음 글에서 다룬다.

## 5. throw와 throws: 발생시키는 것과 넘기는 것

| 키워드 | 위치 | 하는 일 |
|---|---|---|
| `throw` | 메소드 본문 | 예외를 **발생시킨다** |
| `throws` | 메소드 선언부 | 이 메소드가 처리하지 않고 호출한 쪽으로 **넘긴다**고 선언한다 |

`checkAge()`는 나이가 음수일 때 `throw new IllegalArgumentException(...)`으로 예외를 만들어 던진다.  
예외가 던져지면 `checkAge()`의 나머지 코드는 실행되지 않고, 호출한 `main`으로 예외가 넘어간다.  
`main`의 `catch (IllegalArgumentException e)`가 이를 잡아서 메시지를 출력한다.  
앞의 `ArithmeticException` 때문에 이 부분까지 가지 못하지만, 앞의 `try`가 없다면 `e.getMessage() = 나이는 음수일 수 없습니다.`가 출력된다.

`IllegalArgumentException`은 Unchecked 예외라서 `throws`를 적지 않아도 된다.  
Checked 예외를 던지는 메소드는 반드시 `throws`를 적거나 안에서 `try - catch`로 처리해야 한다.

### 오버라이딩할 때 던질 수 있는 예외의 범위

부모의 메소드를 오버라이딩하는 자식은 부모보다 **넓은 Checked 예외를 던질 수 없다**.  
부모가 `throws IOException`이라면 자식은 이렇게 쓸 수 있다.

| 자식 메소드의 선언 | 가능 여부 | 이유 |
|---|---|---|
| `throws` 없음 | 가능 | 예외를 던지지 않는 것은 부모의 약속보다 좁다 |
| `throws IOException` | 가능 | 부모와 같다 |
| `throws FileNotFoundException` | 가능 | `IOException`의 자식이라 더 구체적이다 |
| `throws Exception` | 컴파일 오류 | `IOException`보다 넓다 |

부모 타입으로 호출하는 쪽은 부모가 선언한 예외만 대비하기 때문이다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
class Parent {
    void read() throws IOException { }
}

class Child1 extends Parent {
    @Override
    void read() { }                                 // 가능: 던지지 않는다
}

class Child2 extends Parent {
    @Override
    void read() throws FileNotFoundException { }    // 가능: IOException의 자식
}

class Child3 extends Parent {
    @Override
    void read() throws Exception { }                // 컴파일 오류: IOException보다 넓다
}

Parent p = new Child2();
try {
    p.read();            // 호출하는 쪽은 Parent가 선언한 IOException만 대비하면 된다
} catch (IOException e) {
    System.out.println(e.getMessage());
}
```

`Child3`가 허용된다면 위의 호출부는 `Exception`을 대비하지 않았는데 `Exception`이 날 수 있어서 `catch`가 모자라게 된다.

## 6. 사용자 정의 예외: 상황에 맞는 이름의 예외 만들기

JDK에 미리 만들어진 예외는 현실에서 생기는 상황을 담기에는 너무 추상적이다.  
그래서 상황에 맞는 이름의 예외를 직접 만든다.  
모든 예외의 부모인 `Exception`을 상속하고, 메시지를 부모에게 넘기는 생성자를 만들면 된다.

```java
package com.wanted.a_exception.c_userexception.exception;

public class ProductPriceNegativeException extends Exception {
    public ProductPriceNegativeException(String message) {
        super(message);
    }
}
```

같은 모양으로 세 개를 만들었다.

| 예외 클래스 | 쓰이는 상황 |
|---|---|
| `ProductPriceNegativeException` | 상품 가격이 음수일 때 |
| `MoneyNegativeException` | 가진 돈이 음수일 때 |
| `NotEnoughMoneyException` | 가진 돈이 상품 가격보다 적을 때 |

`NegativeException`도 같은 모양으로 만들어 두었지만 이번 코드에서는 쓰지 않았다.

### 예외를 던지는 쪽

```java
public class ExceptionTest {
    public void checkMoney(int productPrice, int money)
            throws ProductPriceNegativeException, MoneyNegativeException, NotEnoughMoneyException {
        // 상품 가격이 음수일 때
        if (productPrice < 0) {
            throw new ProductPriceNegativeException("상품의 가격은 음수일 수 없습니다");
        }
        // 가진 돈이 음수일 때
        if (money < 0) {
            throw new MoneyNegativeException("가진 돈이 음수일 수 없습니다...");
        }
        // 상품 가격이 내가 가진 돈보다 클 때
        if (money < productPrice) {
            throw new NotEnoughMoneyException("가진 돈보다 상품의 가격이 비쌉니다...");
        }
        System.out.println("가진 돈이 충분합니다. 즐거운 쇼핑 되세요");
    }
}
```

`Exception`을 상속한 예외는 Checked 예외라서 `throws`를 빼면 컴파일 오류가 난다.  
위에서부터 차례로 검사하고, 하나라도 걸리면 거기서 던지고 끝난다.

### 예외를 받는 쪽

```java
public class Application {
    static void main(String[] args) {

        ExceptionTest et = new ExceptionTest();

        try {
            et.checkMoney(-5000, 30000);
        } catch (ProductPriceNegativeException e) {
            System.out.println(e.getMessage());
        } catch (MoneyNegativeException e) {
            System.out.println(e.getMessage());
        } catch (NotEnoughMoneyException e) {
            System.out.println(e.getMessage());
        }
    }
}
```

`checkMoney(-5000, 30000)`은 상품 가격이 `-5000`이라서 첫 번째 검사에 걸린다.  
`ProductPriceNegativeException`이 던져지고, 첫 번째 `catch`가 `상품의 가격은 음수일 수 없습니다`를 출력한다.  
나머지 검사와 `즐거운 쇼핑 되세요`는 실행되지 않는다.

세 예외가 서로 부모-자식이 아니라서 `catch` 순서는 상관없다.  
예외마다 `catch`를 따로 달았기 때문에 상황별로 다르게 처리할 수 있다.  
이번 코드는 세 곳 모두 메시지만 출력한다.

## 7. 헷갈리기 쉬운 점

### throw는 위임이 아니라 발생이다

코드의 주석에는 `throw`가 "처리를 호출한 쪽에 위임한다"고 적혀 있었다.  
정확히는 `throw`는 예외를 발생시키는 키워드이고, 처리를 호출한 쪽에 넘긴다고 선언하는 것은 선언부의 `throws`다.

### catch의 타입이 맞아야 잡힌다

`catch (NullPointerException e)`는 그 타입(과 자식 타입)만 잡는다.  
`try`에서 다른 예외가 먼저 나면 그 `catch`는 실행되지 않는다.

### finally는 예외를 잡지 못해도 실행된다

예외가 잡히지 않아도 프로그램이 종료되기 전에 `finally`는 실행된다.  
그래서 정리 작업은 `finally`에 둔다.

### 예외를 잡고 아무것도 하지 않으면 원인을 잃는다

`catch` 안을 비워 두면 예외가 조용히 사라져서 디버깅하기 어렵다.  
최소한 예외 메시지를 출력하거나 로그를 남긴다.

## 8. 정리

- 예외를 처리하지 않으면 예외가 난 줄에서 프로그램이 종료되고, 그 아래 코드는 실행되지 않는다.
- `catch`는 타입이 맞는 예외만 잡고, `finally`는 예외 여부와 상관없이 항상 실행된다.  
  `Exception`을 상속한 예외는 `throws`나 `try - catch`로 반드시 처리해야 한다.
- `throw`는 예외를 발생시키고, `throws`는 처리를 호출한 쪽에 넘긴다고 선언한다.

다음에는 파일 입출력에서 `IOException`을 처리하고 자원을 안전하게 반납하는 방법을 본다.

## 더 학습하면 좋은 개념

- **try-with-resources** — `finally`로 `close()`를 부르던 자원 반납을 자동으로 처리하는 문법이다.  
  다음 글에서 다룬다.
- **예외 체이닝(cause)** — 원래 예외를 감싸서 다시 던지는 방법이다.  
  원인을 잃지 않고 계층 사이에서 예외 종류를 바꿀 수 있다.
- **스택 트레이스 읽기** — 잡히지 않은 예외가 출력하는 메시지에서 어느 줄이 원인인지 찾는 방법이다.
- **예외 처리 설계** — 어떤 예외를 던지고 어디서 잡을지, 예외를 삼키지 않는 방법과 로깅을 함께 익히면 유지보수에 도움이 된다.

## 참고 자료
- [Oracle - Lesson: Exceptions (The Java Tutorials)](https://docs.oracle.com/javase/tutorial/essential/exceptions/)
- [Oracle - Unchecked Exceptions — The Controversy](https://docs.oracle.com/javase/tutorial/essential/exceptions/runtime.html)
- [Java SE API - Throwable](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html)
- [Java SE API - Exception](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Exception.html)
- [Java SE API - RuntimeException](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/RuntimeException.html)
