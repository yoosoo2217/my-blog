---
title: "사용자 정의 자료형, 생성자, 그리고 객체의 핵심 요소"
date: 2026-10-01 09:30:00
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-string-and-arrays.html)에서 String과 배열을 정리했고, 이번엔 지금까지 배운 자료형만으로는 담을 수 없는 정보를 묶는 **사용자 정의 자료형**, 그리고 객체를 만들 때 가장 먼저 호출되는 **생성자**를 정리한다.

## 1. 사용자 정의 자료형이 필요한 이유

회원 정보(아이디, 패스워드, 이름, 나이, 성별, 취미)를 관리하는 프로그램을 생각해보면, 지금까지 배운 기본 자료형과 배열만으로는 이 정보들을 묶을 방법이 없다.

```java
String id = "user01";
String pwd = "pass01";
String name = "raccoon";
int age = 20;
char gender = '남';
String[] hobby = {"괴롭히기", "웃기", "야구하이라이트 시청"};
```

배열은 **동일한 자료형**끼리만 묶을 수 있는데, 회원 정보는 `String`, `int`, `char`, `String[]`처럼 서로 다른 자료형이 섞여 있어서 배열 하나로 묶을 수 없다. 자료형을 하나로 묶지 못하면 세 가지 문제가 생긴다.

1. 변수명을 전부 따로 관리해야 한다.
2. 모든 회원 정보를 메서드 호출 시 인자로 전달하려면 전달인자와 매개변수가 너무 비대해진다.
3. 메서드의 `return`은 1개의 자료형만 반환할 수 있어서, 회원 정보를 묶어서 반환할 수 없다.

이 문제를 해결하는 게 **사용자 정의 자료형**, 즉 클래스다. 기존 자료형의 한계를 극복해서 서로 다른 자료형들을 하나로 묶을 수 있게 해준다.

```java
public class Member {
    String id;
    String pwd;
    String name;
    int age;
    char gender;
    String[] hobby;
}
```

클래스 내부에는 메서드만 작성할 수 있는 줄 알았는데, 이렇게 메서드 없이 변수만 선언할 수도 있다. 클래스 영역에서 선언한 이런 변수를 **전역변수**(필드)라고 부른다. (반대로 `main()` 메서드 내부에서 선언한 변수는 **지역변수**다.)

```java
Member member = new Member();
System.out.println("member의 이름 :" + member.name); // null
System.out.println("member의 나이 :" + member.age);  // 0

member.id = "user02";
member.hobby = new String[]{"야구시청"};
```

`new Member()`로 인스턴스를 만들어도 필드에 아직 값을 넣지 않았는데, `name`은 `null`, `age`는 `0`이 출력된다. Heap은 값이 비어있을 수 없어서 기본값으로 채워진다는 게 배열에서 본 것과 똑같이 적용된다. `member.id = "user02";`처럼 필드에 직접 접근해서 값을 넣을 수도 있다.

배열과 비교해보면 차이가 뚜렷하다. 배열은 `new int[5]`처럼 **같은 자료형의 칸**만 만들 수 있지만, 클래스는 `Member`처럼 **내가 원하는 자료형으로 자유롭게 필드를 세팅**할 수 있다.

## 2. 생성자 — 객체가 생성될 때 가장 먼저 동작하는 메서드

```java
Member member = new Member();
```

이 구문을 쓸 때 `Member()` 부분은 실제로 **생성자**라는 메서드를 호출하는 구문이다. 지금까지는 생성자를 직접 작성한 적이 없는데, 작성하지 않아도 JDK의 컴파일러가 매개변수 없는 생성자를 자동으로 추가해준다.

```java
public Member() {
    System.out.println("기본 생성자 동작함...............");
}

public Member(String id, String pwd, String name, int age, char gender, String[] hobby) {
    System.out.println("매개변수 있는 생성자 동작함...");
    this.id = id;
    this.pwd = pwd;
    this.name = name;
    this.age = age;
    this.gender = gender;
    this.hobby = hobby;
}
```

```java
Member member = new Member("user01", "pass01", "raccoon", 20, '남', new String[]{"탁구", "야구"});
```

생성자의 형식은 `접근제한자 클래스명([매개변수]) {}`이다. 생성자를 쓰는 목적은 두 가지다.

- 객체 생성 시점에 수행할 명령이 있을 때
- 생성 시점에 필드(변수)를 초기화할 때 — 매개변수가 없는 생성자는 기본값으로, 매개변수가 있는 생성자는 전달인자로 필드를 초기화한다.

**주의할 점**은, 클래스 내부에 매개변수가 있는 생성자를 하나라도 작성하면, 컴파일러는 더 이상 기본 생성자를 자동으로 만들어주지 않는다는 것이다. 그래서 위 코드에서는 매개변수 없는 생성자도 직접 작성해두었다.

필드 값을 확인하기 위해 `toString()`도 오버라이드했다.

```java
@Override
public String toString() {
    return "Member{" +
            "id='" + id + '\'' +
            ", pwd='" + pwd + '\'' +
            ", name='" + name + '\'' +
            ", age=" + age +
            ", gender=" + gender +
            ", hobby=" + Arrays.toString(hobby) +
            '}';
}
```

```java
System.out.println("member = " + member);
```

```text
매개변수 있는 생성자 동작함...
member = Member{id='user01', pwd='pass01', name='raccoon', age=20, gender=남, hobby=[탁구, 야구]}
```

## 3. 클래스와 객체의 관계

### 3-1. 클래스(Class)

- **개념적 의미**: 객체를 추상화한 것으로, 인스턴스를 생성할 목적으로 정의해놓은 소스 코드 작성 단위다. 즉 클래스는 파일 시스템상 존재하는 **아직 파일일 뿐**이다.
- **문법적 의미**: 서로 다른 타입의 데이터와 메서드를 정의해서 **사용자 정의의 타입**을 만들 수 있는데, 이것이 클래스다. 즉 클래스는 **사용자 정의의 자료형**이다.

### 3-2. 객체(Object)

- **개념적 의미**: 현실에 존재하는 독립적이면서 하나로 취급되는 사물이나 개념.
- **문법적 의미**: 클래스에 정의된 대로 `new` 연산자를 통해 JVM의 Heap 영역에 할당된 공간, 즉 **인스턴스**.

`new` 연산자와 함께 생성자를 호출하면, Heap 메모리 공간에 서로 다른 자료형의 데이터가 연속적으로 나열·할당된 인스턴스 공간이 만들어진다. 클래스는 자동차의 설계도, 객체는 그 설계도로 공장에서 찍어낸 자동차라고 생각하면 이해하기 쉽다.

## 4. 객체 간의 협력과 메시지 전달

객체는 자신의 책임(Role)을 수행하다가, 필요하면 **다른 객체에게 메시지를 보내 협력**한다.

```java
class Order {
    void pay(PaymentProcessor processor) {
        processor.processPayment();
    }
}

class PaymentProcessor {
    void processPayment() {
        System.out.println("결제를 처리합니다.");
    }
}

Order order = new Order();
PaymentProcessor processor = new PaymentProcessor();

order.pay(processor); // Order가 PaymentProcessor에게 메시지를 보냄
```

객체지향에서 **메서드 호출은 곧 메시지 전달**이다. 하나의 객체가 다른 객체에게 행동을 요청하는 방식으로 동작한다.

```java
alice.sendMessage("안녕!", chatRoom);
// alice 객체가 chatRoom 객체에 "안녕!"이라는 메시지를 전달함
// chatRoom은 메시지를 받아 적절히 반응(출력, 저장 등)함
```

## 오늘 정리

- 기본 자료형과 배열만으로는 서로 다른 자료형의 정보를 하나로 묶을 수 없어서, **사용자 정의 자료형(클래스)**이 필요하다는 걸 회원 정보 예시로 확인했다.
- 클래스 영역에 선언한 변수는 전역변수(필드), `main()` 내부에 선언한 변수는 지역변수로 구분한다.
- **생성자**는 객체가 생성되는 시점에 가장 먼저 동작하는 메서드로, 필드를 초기화하는 역할을 한다. 매개변수 있는 생성자를 작성하면 기본 생성자는 자동으로 만들어지지 않는다는 점을 주의해야 한다.
- 클래스는 인스턴스를 만들기 위한 설계도(파일)이고, 객체는 `new`로 Heap에 실제로 할당된 인스턴스라는 개념·문법적 의미를 정리했다.
- 객체지향에서는 메서드 호출이 곧 객체 간의 메시지 전달이라는 걸 `Order`→`PaymentProcessor` 예시로 확인했다.

## 더 학습하면 좋은 개념

- **`this` 키워드** — 생성자 안에서 `this.id = id;`처럼 쓴 `this`가 정확히 무엇을 가리키는지(매개변수와 필드 이름이 같을 때 구분하는 역할) 더 짚어보고 싶다.
- **생성자 오버로딩** — 오늘은 기본 생성자와 매개변수 있는 생성자 두 개만 만들었는데, 매개변수 구성이 다른 생성자를 여러 개 만드는 경우(오버로딩)도 궁금해졌다.
- **접근제어자(캡슐화)** — 오늘은 필드에 `member.id = "user02";`처럼 직접 접근했는데, 실무에서는 필드를 `private`으로 막고 메서드로만 접근하게 한다고 들었다. 왜 그렇게 하는지 다음에 알아보고 싶다.

## 참고 자료
- [Oracle - Classes](https://docs.oracle.com/javase/tutorial/java/javaOO/classes.html)
- [Oracle - Providing Constructors for Your Classes](https://docs.oracle.com/javase/tutorial/java/javaOO/constructors.html)
