---
title: "다형성과 다운캐스팅: Animal 예제"
date: 2026-10-06
tags:
  - Java
---

`Animal` 타입 변수에 `Raccoon`을 담고 `bark()`를 호출하면 누구의 메서드가 실행될까? 그리고 `Raccoon`만의 `bite()`는 왜 바로 호출되지 않을까? [예전에 정리했던 다형성 개념]({{ site.baseurl }}/java-polymorphism.html)을 `Animal`-`Raccoon`-`Cat` 예제로 다시 실습하며 동적 바인딩과 다운캐스팅이 필요한 이유를 확인했다. 직전에는 [상속과 오버라이딩 글]({{ site.baseurl }}/java-inheritance-override.html)을 정리했다.

> **TL;DR**
> - 부모 타입 변수로 호출해도 런타임에는 실제 인스턴스가 재정의한 메서드가 실행된다(동적 바인딩).
> - 자식만의 고유 메서드는 부모 타입 변수로 호출할 수 없고, 다운캐스팅이 필요하다.
> - `Animal a1 = new Raccoon();`은 되고 `Raccoon r1 = new Animal();`은 안 된다(IS-A 관계).

## 1. 실습에 쓴 Animal, Raccoon, Cat 코드

부모 클래스 `Animal`은 `eat()`, `run()`, `bark()` 세 메서드를 가진다.

```java
package com.wanted.oop.d_polymorphism.Gami;

public class Animal {

    public void eat(){
        System.out.println("동물이 맘마를 먹습니다..");
    }

    public void run(){
        System.out.println("동물이 뛰어댕깁니다..");
    }

    public void bark(){
        System.out.println("동물이 울어요...");
    }

}
```

`Raccoon`과 `Cat`은 각각 `Animal`을 상속받아 세 메서드를 전부 재정의하고, 자신만의 고유 메서드도 하나씩 추가했다.

```java
package com.wanted.oop.d_polymorphism.Gami;

public class Raccoon extends Animal {
    @Override // overriding
    public void eat() {
        System.out.println("너구리가 너구리라면을 먹어요..");
    }

    @Override
    public void run() {
        System.out.println("너구리한마리몰고가라는말에토낍니다..");
    }

    @Override
    public void bark() {
        System.out.println("너구리출신이지!!!!!!!!!!!!!!");
    }

    public void bite() {
        System.out.println("앙앙!");
    }

}
```

```java
package com.wanted.oop.d_polymorphism.Gami;

public class Cat extends Animal {
    @Override
    public void eat() {
        System.out.println("고양이가 츄르를 먹습니다.");
    }

    @Override
    public void run() {
        System.out.println("고양이가 생선을 가지고 튑니다");
    }

    @Override
    public void bark() {
        System.out.println("고양이가 애처로운 눈빛으로 츄르를 얻으려고 웁니다.");
    }

    public void npunch() {
        System.out.println("고양이가 솜방망이로 개떄립니다.");
    }

}
```

`Application01`에서 세 클래스를 각각 인스턴스로 만들어 호출하고, 마지막엔 `Animal` 타입 변수에 `Raccoon` 인스턴스를 담아서 다형성을 직접 확인했다.

```java
package com.wanted.oop.d_polymorphism.Gami;

public class Application01 {
    static void main(String[] args) {
        /*comment
        *  다형성
        *   하나의 인스턴스가 여러가지 타입을 가질 수 있는 것
        *   그렇기 때문에 하나의 타입으로 여러 타입의 인스턴스를 처리할 수 있고
        *   하나의 메소드 호출로 객체 별 다흔 방법으로 동작하게 할 수 있다.*/

        System.out.println("=======================Animal======================");
        Animal animal = new Animal();
        animal.eat();
        animal.bark();
        animal.run();
        System.out.println("=======================Animal======================");
        System.out.println("                                                     ");

        System.out.println("======================Raccoon======================");
        Raccoon raccoon = new Raccoon();
        raccoon.bark();
        raccoon.bite();
        raccoon.eat();
        raccoon.run();
        System.out.println("======================Raccoon======================");
        System.out.println("                                                     ");


        System.out.println("========================Cat========================");
        Cat cat = new Cat();
        cat.bark();
        cat.eat();
        cat.run();
        cat.npunch();
        System.out.println("========================Cat========================");
        System.out.println("                                                     ");


        /*comment.
        *  - IS-A 관계
        *   너구리는 동물이다 (o)
        *   animal = raccoon (o)
        *   raccoon = animal (x)
        *   동물은 너구리다 (x) */

        Animal a1 = new Raccoon();

        /* comment. 동적 바인딩
            컴파일 시점에는 Animal 타입의 메소드와 연결이 되어 있다가,
            런타임 시점에 실제 인스턴스 (Raccoon) 가 가진 오버라이딩된 메서드로 변경되어 동작하는 것. */

        a1.bark();
        // 컴파일 시점에 a1 은 animal 타입이기 때문에 Raccoon의 고유 기능은 사용 불가능 하다.

        // 클래스 형 변환
        // 부모 자식 관계에서 사용 가능하다...
        ((Raccoon)a1).bite();



        // animal 값은 raccoon 공간에 들어갈 수 없다.
        // Raccoon r1 = new Animal();

    }
}
```

## 2. a1.bark()는 왜 "너구리출신이지"를 출력할까

`Animal a1 = new Raccoon();`은 **업캐스팅**이다. `a1`의 컴파일 타임 타입은 `Animal`이지만, 실제로 메모리에 만들어진 인스턴스는 `Raccoon`이다. 이 상태에서 `a1.bark()`를 호출하면, 컴파일 시점에는 `Animal.bark()`와 연결돼 있는 것처럼 보이지만 실제 실행 시점(런타임)에는 `a1`이 가리키는 진짜 인스턴스인 `Raccoon`의 `bark()`가 호출된다. 그래서 `a1.bark()`의 결과는 `Animal`의 "동물이 울어요..."가 아니라 `Raccoon`이 재정의한 "너구리출신이지!!!!!!!!!!!!!!"가 출력된다. 이게 **동적 바인딩**이다 — `eat()`, `run()`도 마찬가지로 `Animal` 타입 변수를 통해 호출하더라도, 실제 인스턴스가 재정의한 메서드가 호출된다.

## 3. bite()는 왜 다운캐스팅해야 호출될까

반면 `a1.bite()`는 바로 호출할 수 없다. `bite()`는 `Animal`에는 없고 `Raccoon`에만 있는 고유 메서드이기 때문이다. `a1`의 컴파일 타임 타입이 `Animal`인 이상, 컴파일러는 `a1`을 `Animal`이 가진 멤버(`eat`, `run`, `bark`)로만 다룰 수 있다고 판단하고, `Animal`에 없는 `bite()`는 애초에 존재하지 않는 멤버로 취급해서 컴파일 에러를 낸다. 그래서 `((Raccoon) a1).bite();`처럼 **다운캐스팅**으로 "이 변수는 사실 `Raccoon`이야"라고 명시적으로 알려줘야, 그제서야 `Raccoon`만의 `bite()`에 접근할 수 있다.

같은 `a1`이라는 변수 하나로도 호출 결과가 갈린다.

| 호출 | 가능 여부 | 이유 |
|---|---|---|
| `a1.bark()` | 가능 (다운캐스팅 불필요) | `bark()`는 `Animal`에도 있는 메서드라서, 동적 바인딩으로 `Raccoon`의 재정의 버전이 호출됨 |
| `a1.bite()` | 불가능 (컴파일 에러) | `bite()`는 `Animal`에 없는, `Raccoon`만의 고유 메서드 |
| `((Raccoon) a1).bite()` | 가능 | 다운캐스팅으로 컴파일러에게 실제 타입이 `Raccoon`임을 알려줬기 때문 |

## 4. 정리

- `Animal a1 = new Raccoon();`처럼 부모 타입 변수에 자식 인스턴스를 담는 업캐스팅을 하면, `a1.bark()`는 컴파일 타임 타입(`Animal`)이 아니라 런타임의 실제 타입(`Raccoon`)이 재정의한 메서드를 호출한다(동적 바인딩).
- `Animal`에 없는 `Raccoon` 고유 메서드(`bite()`)는 `((Raccoon) a1).bite()`처럼 다운캐스팅을 해야만 접근할 수 있다.
- `Raccoon`은 `Animal`이지만 `Animal`이 `Raccoon`은 아니다. 그래서 `Animal a1 = new Raccoon();`은 되고 `Raccoon r1 = new Animal();`은 안 된다.

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **`instanceof`로 다운캐스팅 전에 타입 안전성 확인하기** — 오늘은 `a1`이 실제로 `Raccoon`이라는 걸 미리 알고 있어서 바로 다운캐스팅했지만, 실제 상황에서는 `instanceof`로 먼저 확인한 뒤 다운캐스팅해야 `ClassCastException`을 피할 수 있다는 걸 이전 글에서 배웠으니, 다음엔 `Cat`이 섞여 있는 배열에서 타입을 확인하며 다운캐스팅하는 코드로 연습해보고 싶다.
- **`List<Animal>`로 여러 동물을 한 번에 순회하기** — 오늘은 `Animal`, `Raccoon`, `Cat`을 각각 변수로 따로 선언해서 호출했는데, 컬렉션에 담아서 반복문 하나로 `eat()`을 전부 호출해보면 다형성의 장점이 더 잘 보일 것 같다.
- **추상 메서드로 bark() 재정의를 강제하기** — 지금은 `Animal.bark()`가 구현부("동물이 울어요...")를 가지고 있어서, `Raccoon`이나 `Cat`이 `bark()`를 재정의하지 않아도 컴파일은 된다. `Animal`을 추상 클래스로 바꾸고 `bark()`를 추상 메서드로 선언하면 자식 클래스가 반드시 재정의하도록 강제할 수 있다고 들었는데, 그 차이를 직접 코드로 비교해보고 싶다.

## 참고 자료
- [Oracle - Polymorphism](https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html)
- [Oracle - Overriding and Hiding Methods](https://docs.oracle.com/javase/tutorial/java/IandI/override.html)
