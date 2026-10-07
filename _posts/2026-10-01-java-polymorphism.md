---
title: "다형성과 오버라이딩, 형변환"
date: 2026-10-01 12:00:00
tags:
  - Java
---

`Car` 타입 배열 하나에 `Sonata`, `Morning`, `Porter`를 모두 담고, `move()` 한 번으로 각자의 방식대로 움직이게 할 수 있는 이유는 무엇일까? [이전 글]({{ site.baseurl }}/java-abstraction-interfaces.html)에서 추상클래스와 인터페이스가 "다형성 적용을 위한 부모 타입 역할"을 한다고 했는데, 그 **다형성(Polymorphism)** 자체를 정리한다.

> **TL;DR**
> - 다형성은 하나의 인스턴스가 여러 타입을 가질 수 있는 성질이며, 여러 객체를 하나의 타입으로 다루게 해 확장성을 높이고 결합도를 낮춘다.
> - 컴파일 타임에는 참조 타입의 메서드로 보이지만, 오버라이딩된 메서드는 런타임에 실제 인스턴스의 것이 호출된다(동적 바인딩).
> - 업캐스팅은 묵시적, 다운캐스팅은 명시적이며, 다운캐스팅 전에는 `instanceof`로 타입을 확인한다.

## 1. 다형성(Polymorphism)이란 무엇일까?

**하나의 인스턴스**가 **여러 가지 타입**을 가질 수 있는 것을 의미한다. 그래서 하나의 타입으로 여러 타입의 인스턴스를 처리할 수도 있고, 하나의 메서드 호출로 객체별로 각기 다른 방법으로 동작하게 할 수도 있다. 다형성은 객체지향 프로그래밍의 3대 특징(캡슐화, 상속, 다형성) 중 하나이고, 객체지향의 꽃이라고 불릴 정도로 활용성이 높다.

### 1-1. 다형성이 필요한 네 가지 이유

**1. 여러 타입의 객체를 하나의 타입으로 관리할 수 있어서 유지보수성과 생산성이 증가한다.**

```java
// 자동차 5대를 담기 위한 Car 타입의 배열
Car[] carr = new Car[5];

// 다형성이 적용되어 Car 타입의 배열에 할당될 수 있음
carr[0] = new Sonata();    // Sonata는 Sonata 타입이면서 동시에 Car 타입이기도 함
carr[1] = new Morning();
carr[2] = new Avante();
carr[3] = new Grandure();
carr[4] = new Porter();

// 모든 차들아~ 움직여라~
for (Car car : carr) {
    car.move();
}
```

**2. 상속 기반 기술이라서, 상속 관계에 있는 모든 객체는 동일한 메시지를 수신할 수 있다.** 동일한 메시지를 받아 처리하는 내용을 객체별로 다르게 할 수 있어서, 기능이 늘어나도 관리해야 하는 메시지 종류가 줄어든다.

```java
/* 다형성 미적용 : 모든 메시지를 다 기억하고 사용해야 한다. */
carr[0].moveSonata();
carr[1].moveMorning();
carr[2].moveAvante();

/* 다형성 적용 : 관리해야 하는 메시지 수가 줄어든다. */
for (Car car : carr) {
    car.move();
}
```

**3. 확장성이 좋은 코드를 작성할 수 있다.**

```java
move(new Sonata());
move(new Morning());

// 새로운 차량 추가 시, 새로운 차량만을 위한 move 메서드를 더 만들지 않아도 되고
// 기존 move 메서드를 재사용하면 됨.
move(new Santafe()); // moveSantafe()를 제작할 필요 없음

public void move(Car car) {
    car.move();
}
```

**4. 결합도를 낮춰서 유지보수성을 증가시킬 수 있다.**

```java
/* 결제수단이 현금에서 카드로 바뀌면, 그 수만큼 메서드를 따로 만들어야 함 */
public void pay(현금) { 현금.결제진행(); }
public void pay(카드) { 카드.결제진행(); }

/* 카드결제든 현금결제든 어느 한쪽에 의존하지 않도록 만듦.
 * 현금, 카드, 기타 등등이 결제수단을 상속받으면 됨. */
public void pay(결제수단) {
    결제수단.결제진행();
}
```

## 2. 오버라이딩과 오버로딩은 무엇이 다를까?

| 오버라이딩 (overriding) | 오버로딩 (overloading) |
|---|---|
| 하위 클래스에서 메서드 정의 | 같은 클래스에서 메서드 정의 |
| 메서드 이름·매개변수(타입/개수/순서)·리턴 타입 모두 동일 | 메서드 이름 동일, 매개변수는 다름, 리턴 타입은 관계없음 |
| 자식 메서드의 접근제어자 범위가 부모 메서드보다 넓거나 같아야 함 | 접근제어자와 관계없음 |
| 자식 메서드의 예외처리 수가 부모 메서드보다 적거나 범위가 좁아야 함 | 예외처리와 관계없음 |

오버로딩은 [필드·생성자·static 키워드 글]({{ site.baseurl }}/java-fields-constructors-static.html)에서 이미 다뤘으니, 이번엔 오버라이딩에 집중한다.

### 2-1. 오버라이딩(overriding)이란

부모 클래스에서 상속받은 메서드를 **자식 클래스가 재정의(override)**하여 사용하기 위한 기술이다. 성립 조건은 다음과 같다.

1. 메서드명 동일
2. 메서드 리턴타입 동일
3. 매개변수의 타입, 개수, 순서가 동일
4. 부모 클래스의 `private` 메서드는 오버라이딩 불가능
5. 부모 클래스의 `final` 키워드가 사용된 메서드는 오버라이딩 불가능
6. 접근제어자는 부모 메서드와 같거나 더 넓은 범위여야 함
7. 예외처리는 같은 예외이거나 더 구체적(하위)인 예외를 처리해야 함

### 2-2. `@Override`를 붙이면 컴파일러가 검증해준다

메서드 앞에 붙여서 "부모 클래스 또는 인터페이스의 메서드를 재정의한다"는 걸 컴파일러에게 알려주는 어노테이션이다. Java 컴파일러가 이 어노테이션을 인식해서 메서드가 **정확히 오버라이딩되었는지 검증**해준다. `@Override`가 없으면 컴파일러는 조용히 넘어가고, 의도한 대로 동작하지 않을 수도 있다. 또 어노테이션이 명확히 보이기 때문에 유지보수나 리뷰 시 구현 위치를 빠르게 파악할 수 있다.

### 2-3. 동적 바인딩: 런타임에 실제 인스턴스의 메서드가 호출된다

컴파일 당시에는 해당 타입의 메서드와 연결되어 있다가, 런타임 시 실제 해당 인스턴스가 메서드(오버라이딩한 메서드)로 바인딩이 바뀌어 동작하는 것을 말한다. 상속 관계를 가지는 부모·자식 클래스에 오버라이딩된 메서드를 호출해야 성립한다.

```java
public class Animal {
    public void cry() {
        System.out.println("동물이 울음소리를 냅니다.");
    }
}

public class Tiger extends Animal {
    @Override
    public void cry() {
        System.out.println("호랑이가 울음소리를 냅니다. 어흥~~~~");
    }
}
```

```java
Animal animal = new Tiger();

// 컴파일 타임에 cry() 메서드 위에 마우스를 올려놓아 보면 Animal 클래스가 나온다.
// 하지만 런타임에 실제로는 Tiger 인스턴스의 cry()가 동작한다.
animal.cry(); // 호랑이가 울음소리를 냅니다. 어흥~~~
```

## 3. 자식 고유 기능은 어떻게 쓸까? 업캐스팅과 다운캐스팅

상속 관계에 있지만 오버라이딩한 게 아니라 후손 객체가 고유하게 가지는 확장된 기능을 쓰려면, 실제 인스턴스의 타입으로 **다운캐스팅(클래스 형변환)**을 해줘야 한다.

클래스 형변환은 **상위 타입 형변환(up-casting)**과 **하위 타입 형변환(down-casting)**이 있다. 상위 타입 형변환은 묵시적으로 일어나고, 하위 타입 형변환은 명시적으로 작성해야 한다.

```java
public class Animal {}

public class Tiger extends Animal {
    public void bite() {
        System.out.println("호랑이가 물어 뜯습니다. 앙~");
    }
}
```

```java
/* 업캐스팅(up-casting) */
/* 명시적으로 적을 수도 있지만 */
// Animal animal = (Animal) new Tiger();
/* 보통은 묵시적으로 일어난다 */
Animal animal = new Tiger();

// 다운캐스팅(down-casting) : 묵시적 불가, 명시적으로만 가능함
// 컴파일 시 animal의 타입은 Animal이기 때문에 Tiger 클래스의 멤버에 접근이 불가능하다.
// animal.bite();
// 멤버가 존재하는 타입으로 다운캐스팅 해 주어야 한다.
((Tiger) animal).bite();
```

```text
호랑이가 물어 뜯습니다. 앙~
```

### 3-1. `instanceof`로 다운캐스팅을 안전하게 하기

클래스 형변환은 런타임 시 존재하는 타입과 형변환하려는 타입이 일치하지 않으면 `ClassCastException`이 발생한다. 그래서 더 안전한 형변환을 위해 `instanceof` 연산자를 쓸 수 있다. `instanceof`는 레퍼런스 변수가 실제로 어떤 클래스 타입의 인스턴스인지 확인해서 `true`/`false`를 반환한다. 이 연산자로 다운캐스팅을 수행하기 전에 실제 타입 검사를 해서 타입 안전성을 확보할 수 있다.

```java
if (레퍼런스 변수 instanceof 클래스 타입) {
    // true일 때 처리할 내용, 해당 클래스 타입으로 down-casting할 것
}
```

```java
Car car = new Sonata();

if (car instanceof Sonata) {
    ((Sonata) car).moveSonata();
} else if (car instanceof Avante) {
    ((Avante) car).moveAvante();
} else if (car instanceof Grandure) {
    ((Grandure) car).moveGrandure();
}
```

## 정리: 핵심 3가지와 다음에 볼 것

- 다형성은 하나의 인스턴스가 여러 타입을 가질 수 있게 해줘서, 여러 객체를 하나의 타입(배열, 메서드 매개변수 등)으로 관리하고 확장성·결합도를 개선한다.
- 오버라이딩은 부모 메서드를 자식이 재정의하는 것이며, 같은 클래스 안에서 매개변수만 다른 오버로딩과는 조건이 다르다. `Animal animal = new Tiger();`에서는 컴파일 타임에 `Animal` 타입으로 보이지만 런타임에 `Tiger`의 메서드가 호출된다(동적 바인딩).
- 업캐스팅은 묵시적, 다운캐스팅은 명시적이다. 다운캐스팅 전에 `instanceof`로 타입을 확인해야 `ClassCastException`을 피할 수 있다.
- 다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 정리했다.

## 더 학습하면 좋은 개념

- **`ClassCastException`** — 오늘은 `instanceof`로 미리 막는 법만 배웠는데, 실제로 이 예외가 발생하는 상황을 직접 코드로 만들어보면서 확인해보고 싶다.
- **캡슐화** — 다형성과 함께 객체지향 3대 특징으로 묶이는 캡슐화를 아직 제대로 안 배워서, 다음 글에서 이어서 정리할 예정이다.
- **상속** — 오늘 다형성 예시에 계속 등장한 `Car`-`Sonata`-`Avante` 같은 상속 구조 자체는 아직 제대로 안 배웠는데, 캡슐화 다음으로 이어서 보고 싶다.

## 참고 자료
- [Oracle - Overriding and Hiding Methods](https://docs.oracle.com/javase/tutorial/java/IandI/override.html)
- [Oracle - Polymorphism](https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html)
