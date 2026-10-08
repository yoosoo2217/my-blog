---
title: "제네릭 타입 제한과 와일드카드"
date: 2026-10-07
tags:
  - Java
---

토끼 농장 클래스에 `T`만 붙여 두면 포유류나 뱀도 들어올 수 있다.  
토끼와 그 자식 클래스만 받으려면 `T`를 어떻게 제한해야 할까?  
그리고 그 농장을 메소드의 매개변수로 받을 때는 `Bunny` 이하만, 혹은 `Bunny` 이상만 받도록 또 어떻게 제한할까?  
토끼 클래스 계층으로 타입 제한(`extends`)과 와일드카드(`?`)를 실험했다.  
제네릭의 기본은 [이전 글]({{ site.baseurl }}/java-generic-basics.html)에서 정리했다.

> **TL;DR**
> - `T extends Rabbit`처럼 쓰면 `T`에 `Rabbit`과 그 자식 클래스만 들어올 수 있다.
> - 제네릭 객체를 매개변수로 받을 때는 와일드카드 `?`로 범위를 정한다. `<?>`는 제한 없음, `<? extends Bunny>`는 `Bunny`와 자식(상한), `<? super Bunny>`는 `Bunny`와 부모(하한)다.
> - `<? super Bunny>`는 이 예제에서 `DrunkenBunny`를 받지 못하고, `<? extends Bunny>`는 `Rabbit`을 받지 못한다.

## 1. 실험에 쓴 클래스 계층

`Animal` 인터페이스 아래에 포유류와 파충류가 있고, 포유류 아래에 토끼가 이어진다.  
코드의 주석이 설명한 상속 관계는 다음과 같다.  
`Mammal` 클래스의 코드는 이번 글에 붙여 넣지 않았다.

```text
Animal (인터페이스)
├── Mammal (포유류)
│   └── Rabbit
│       └── Bunny
│           └── DrunkenBunny
└── Reptile (파충류)
    └── Snake
```

`Rabbit`, `Bunny`, `DrunkenBunny`는 모두 `cry()`를 갖고, 자식이 부모의 `cry()`를 오버라이딩한다.  
아래 코드는 모두 `com.wanted.a_generic.b_use` 패키지에 있는 별도 파일이다.

```java
// Animal.java
public interface Animal {

    // 해당 인터페이스를 상속 받는
    // Mammal (포유류) 클래스 생성

}

// Reptile.java
// 파충류
public class Reptile implements Animal {
}

// Snake.java
public class Snake extends Reptile{
}

// Rabbit.java
// Animal 을 상속 받는 Mammal 을 상속 받는 Rabbit
public class Rabbit extends Mammal{

    public void cry() {
        System.out.println("토끼가 울부짖습니다. 끾끾!");
    }

}

// Bunny.java
public class Bunny extends Rabbit{

    @Override
    public void cry() {
        System.out.println("바니바니 당근당근");
    }
}

// DrunkenBunny.java
public class DrunkenBunny extends Bunny {

    @Override
    public void cry() {
        System.out.println("ㅂ아ㅏ니ㅏㅂ아ㅣ니ㅣ 당근..근당근");
    }
}
```

## 2. T extends Rabbit으로 들어올 타입을 제한한다

`RabbitFarm`은 `Rabbit`, `Bunny`, `DrunkenBunny` 중 어떤 토끼가 들어올지 몰라서 제네릭으로 만들었다.  
`T`만 쓰면 포유류, 파충류, 뱀이 전부 들어올 수 있다.  
그래서 `T extends Rabbit`으로 제한했다.

```java
package com.wanted.a_generic.b_use;

/* comment.
*   해당 클래스는 토끼들의 농장이며
*   Rabbit , Bunny , DrunkenBunny 어떤 토끼가
*   들어올지 몰라 제네릭으로 생성
*   T -> 타입변수에는 어떤 값이 들어올 지 모르는 상태이다.
*   그래서 포유류, 파충류 , 뱀 등이 전부 들어올 수 있다.
*   T extends Rabbit 을 지정하면
*   Rabbit 또는 Rabbit 을 상속 받는 클래스만 T 에
*   들어올 수 있게 된다.
*  */
public class RabbitFarm<T extends Rabbit> {

    private T animal;

    public T getAnimal() {
        return animal;
    }

    public void setAnimal(T animal) {
        this.animal = animal;
    }

    // 기본 생성자.
    public RabbitFarm() {}

    // 매개변수가 있는 생성자.
    public RabbitFarm(T animal) {
        this.animal = animal;
    }
}
```

`extends`는 여기서 클래스 상속이 아니라 "`T`의 상한(upper bound)"을 뜻한다.  
`Rabbit`이 클래스이든 인터페이스이든 제한할 때는 `extends`를 쓴다.  
이 제한 덕분에 `RabbitFarm` 안에서 `T` 타입의 값은 `Rabbit`으로 취급할 수 있다.

## 3. 같은 농장에도 부모는 못 넣는다

```java
package com.wanted.a_generic.b_use.run;

import com.wanted.a_generic.b_use.*;

public class Application01 {

    public static void main(String[] args) {

        // Mammal 은 Rabbit 을 상속받지 않았기 때문에 T 에
        // 들어갈 수 없어서 컴파일 에러가 발생한다.
//        RabbitFarm<Mammal> farm1 = new RabbitFarm();

        RabbitFarm<Rabbit> farm1 = new RabbitFarm<>();
        RabbitFarm<Bunny> farm2 = new RabbitFarm<>();
        RabbitFarm<DrunkenBunny> farm3 = new RabbitFarm<>();

        // farm2 는 Bunny 를 위한 농장인데
        // Rabbit 은 Bunny 의 부모이기 때문에
        // 들어갈 수 없다.
//        Rabbit rabbit = new Rabbit();
//        farm2.setAnimal(rabbit);

        DrunkenBunny drunkenBunny = new DrunkenBunny();
        farm2.setAnimal(drunkenBunny);
        farm2.getAnimal().cry();

    }

}
```

실행하면 `DrunkenBunny`의 울음소리가 출력된다.

```text
ㅂ아ㅏ니ㅏㅂ아ㅣ니ㅣ 당근..근당근
```

이 코드에서 확인한 것은 세 가지다.

| 코드 | 결과 | 이유 |
|---|---|---|
| `RabbitFarm<Mammal>` | 컴파일 에러 | `Mammal`은 `Rabbit`을 상속받지 않아서 `T`의 범위 밖이다 |
| `farm2.setAnimal(rabbit)` | 컴파일 에러 | `farm2`는 `RabbitFarm<Bunny>`라서 `T`가 `Bunny`로 정해졌고, `Rabbit`은 `Bunny`의 부모다 |
| `farm2.setAnimal(drunkenBunny)` | 정상 | `DrunkenBunny`는 `Bunny`의 자식이라서 `Bunny` 자리에 들어갈 수 있다 |

`farm2.getAnimal().cry()`가 `Bunny`의 소리가 아니라 `DrunkenBunny`의 소리를 내는 이유는 [다형성을 다룬 글]({{ site.baseurl }}/java-polymorphism.html)의 동적 바인딩 때문이다.  
변수의 타입은 `Bunny`지만 실제 객체가 `DrunkenBunny`라서 오버라이딩한 메소드가 호출된다.

## 4. 메소드 매개변수에서는 와일드카드로 제한한다

`RabbitFarm`을 메소드의 매개변수로 받을 때는 전달받는 객체의 타입 변수를 와일드카드(`?`)로 제한할 수 있다.  
`WildcardFarm`에 세 가지를 만들었다.

```java
package com.wanted.a_generic.b_use;

public class WildcardFarm {

    public void anyType(RabbitFarm<?> farm) {
        farm.getAnimal().cry();
    }

    public void extendsType(RabbitFarm<? extends Bunny> farm) {
        farm.getAnimal().cry();
    }

    public void superType(RabbitFarm<? super Bunny> farm) {
        farm.getAnimal().cry();
    }

}
```

| 선언 | 이름 | 받을 수 있는 `RabbitFarm`의 타입 변수 | 이 예제에서 못 받는 것 |
|---|---|---|---|
| `<?>` | 제한 없음 | 아무거나 (단, `RabbitFarm`의 `T extends Rabbit` 범위 안) | - |
| `<? extends Bunny>` | 상한 제한 | `Bunny`이거나 `Bunny`의 자식 | `Rabbit` |
| `<? super Bunny>` | 하한 제한 | `Bunny`이거나 `Bunny`의 부모 | `DrunkenBunny` |

세 메소드가 모두 `farm.getAnimal().cry()`를 호출할 수 있는 이유는 `RabbitFarm<T extends Rabbit>`의 제한 때문으로 보인다.  
`T`가 무엇이든 `Rabbit` 이하라는 사실이 정해져 있어서, 와일드카드로 받아도 꺼낸 값을 `Rabbit`으로 쓸 수 있다.  
제한이 없는 `Farm<T>`였다면 `Farm<?>`에서 꺼낸 값은 `Object`로만 쓸 수 있다.  
이 내용은 직접 확인하지 않았고, 와일드카드 캡처의 규칙(JLS 5.1.10)에서 가져온 설명이라 `확인 필요`다.

## 5. 세 가지 와일드카드 실행 결과

```java
package com.wanted.a_generic.b_use.run;

import com.wanted.a_generic.b_use.*;

public class Application02 {

    public static void main(String[] args) {

        /* comment.
        *   와일드카드  ?
        *   제네릭 클래스 타입의 객체를 메소드의
        *   매개변수로 전달 받을 때, 그 객체의 타입 변수를
        *   제한할 수 있다.
        *   <?> : 제한 없다. 아무거나 들어와도 된다.
        *   <? extends Type> : 와일드카드 상한 제한
        *   <? super Type> : 와일드카드 하한 제한
        *  */

        WildcardFarm wildcardFarm = new WildcardFarm();

        wildcardFarm.anyType(new RabbitFarm<Rabbit>(new Rabbit()));
        wildcardFarm.anyType(new RabbitFarm<Bunny>(new Bunny()));
        wildcardFarm.anyType(new RabbitFarm<DrunkenBunny>(new DrunkenBunny()));

        System.out.println("===================와일드 카드 상한제한====================");
        // <? extends Bunny> : Bunny 이거나 Bunny 의 자식만 전달 받을 수 있다.
//        wildcardFarm.extendsType(new RabbitFarm<Rabbit>(new Rabbit()));
        wildcardFarm.extendsType(new RabbitFarm<Bunny>(new Bunny()));
        wildcardFarm.extendsType(new RabbitFarm<DrunkenBunny>(new DrunkenBunny()));
        System.out.println("===================와일드 카드 상한제한====================");

        System.out.println("===================와일드 카드 하한제한====================");
        wildcardFarm.superType(new RabbitFarm<Rabbit>(new Rabbit()));
        wildcardFarm.superType(new RabbitFarm<Bunny>(new Bunny()));
        // <? super Bunny> : Bunny 이거나, Bunny 의 부모만 전달 받을 수 있다.
//        wildcardFarm.superType(new RabbitFarm<DrunkenBunny>(new DrunkenBunny()));
        System.out.println("===================와일드 카드 하한제한====================");

    }

}
```

주석 처리된 두 줄은 컴파일 에러가 나는 줄이다.  
이 두 줄을 제외하고 실행하면 출력은 다음과 같다.  
같은 메소드를 호출해도 전달한 객체의 실제 타입에 따라 `cry()`의 결과가 달라진다.

```text
토끼가 울부짖습니다. 끾끾!
바니바니 당근당근
ㅂ아ㅏ니ㅏㅂ아ㅣ니ㅣ 당근..근당근
===================와일드 카드 상한제한====================
바니바니 당근당근
ㅂ아ㅏ니ㅏㅂ아ㅣ니ㅣ 당근..근당근
===================와일드 카드 상한제한====================
===================와일드 카드 하한제한====================
토끼가 울부짖습니다. 끾끾!
바니바니 당근당근
===================와일드 카드 하한제한====================
```

## 6. 헷갈리기 쉬운 점: 상한과 하한은 방향이 반대다

`extends`는 "이 타입 이하(자식 방향)", `super`는 "이 타입 이상(부모 방향)"이다.  
그래서 `<? super Bunny>`에는 부모인 `Rabbit`은 들어오지만 자식인 `DrunkenBunny`는 들어오지 못한다.  
처음에 "`super`면 더 많은 타입이 들어오니까 `DrunkenBunny`도 되겠지"라고 생각하기 쉬운데, 방향이 반대라서 주석 처리된 마지막 줄이 컴파일 에러가 된다.

## 7. `RabbitFarm<Bunny>`는 `RabbitFarm<Rabbit>`의 자식이 아니다

`Bunny`는 `Rabbit`의 자식이지만, 그렇다고 `RabbitFarm<Bunny>`가 `RabbitFarm<Rabbit>`의 자식이 되지는 않는다.  
제네릭 타입은 타입 인자가 상속 관계여도 서로 다른 타입으로 취급한다.  
이 성질을 불변성(invariance)이라고 한다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
RabbitFarm<Bunny> bunnyFarm = new RabbitFarm<>();
RabbitFarm<Rabbit> rabbitFarm = bunnyFarm; // 컴파일 에러
```

`Rabbit` 농장 자리에 `Bunny` 농장을 넣을 수 있다면, 그 농장에 `Rabbit`을 넣는 코드가 컴파일되고 `Bunny` 농장 안에 `Bunny`가 아닌 객체가 들어갈 수 있기 때문이다.  
앞에서 `farm2.setAnimal(rabbit)`을 막은 것과 같은 이유다.  
그래서 "`Bunny` 농장도 받는 메소드"가 필요할 때 와일드카드를 쓴다.  
공식 튜토리얼도 이 구조를 "Wildcards and Subtyping" 항목에서 설명한다.

## 8. 와일드카드로 받은 농장에는 값을 넣을 수 있을까

이번 `WildcardFarm`의 세 메소드는 모두 값을 꺼내기(`getAnimal()`)만 했다.  
와일드카드로 받은 객체에 값을 넣는 `setAnimal()`을 호출하면 허용 여부가 갈린다.  
아래는 이 규칙을 보이기 위한 예시 코드이고, 직접 실행해 확인하지는 않았다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
public void putToExtends(RabbitFarm<? extends Bunny> farm) {
    farm.setAnimal(new Bunny()); // 컴파일 에러
}

public void putToSuper(RabbitFarm<? super Bunny> farm) {
    farm.setAnimal(new Bunny()); // 가능
}
```

| 선언 | 꺼내기 (`get`) | 넣기 (`set`) | 이유 |
|---|---|---|---|
| `<? extends Bunny>` | 가능 (`Bunny`로 취급) | 불가 (`null` 제외) | 실제 농장이 `RabbitFarm<DrunkenBunny>`일 수 있어서 `Bunny`를 넣으면 타입이 어긋난다 |
| `<? super Bunny>` | 가능 (이 예제에서는 `Rabbit`으로 취급) | `Bunny`와 그 자식만 가능 | 실제 농장이 `Bunny`이거나 그 부모 타입이라서 `Bunny`는 항상 들어갈 수 있다 |

정리하면 상한(`extends`)은 **꺼내는 쪽**, 하한(`super`)은 **넣는 쪽**에 맞는다.  
이를 "Producer Extends, Consumer Super"(PECS)라고 부른다.  
농장이 값을 만들어 내는 생산자(Producer)이면 `extends`, 값을 받아들이는 소비자(Consumer)이면 `super`를 쓴다는 뜻이다.

## 9. 정리

- `T extends Rabbit`은 타입 변수 `T`에 들어올 수 있는 타입을 `Rabbit`과 그 자식 클래스로 제한한다. `RabbitFarm<Mammal>`은 컴파일되지 않는다.
- `RabbitFarm<Bunny>`에는 `Rabbit`을 넣을 수 없다. `T`가 `Bunny`로 정해지면 부모 타입은 들어갈 수 없다.
- 와일드카드는 제네릭 객체를 매개변수로 받을 때 쓴다. `<?>`는 제한 없음, `<? extends Bunny>`는 `Bunny` 이하, `<? super Bunny>`는 `Bunny` 이상이다.
- `RabbitFarm<Bunny>`는 `RabbitFarm<Rabbit>`의 자식이 아니다(불변성). 상한 와일드카드는 꺼내기에, 하한 와일드카드는 넣기에 맞는다(PECS).

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **JDK 메소드 시그니처에서 보는 PECS** — 8절에서 정리한 규칙이 `Collections`나 `List`의 실제 메소드 선언에 어떻게 쓰였는지 찾아보면, 상한과 하한을 언제 고르는지 감이 잡힌다.
- **타입 소거(Type Erasure)** — 제네릭 타입 정보가 컴파일 후 대부분 지워진다고 알려져 있다. 제한 타입의 `T`가 컴파일 후 어떤 타입으로 바뀌는지 이해하는 데 필요하다.
- **제네릭 메소드와 다중 제한(`&`)** — 클래스가 아니라 메소드 하나에 `<T extends Rabbit>`를 쓰는 방식과, `T extends A & B`처럼 여러 제한을 거는 방식이 있다. 이번에 쓴 `extends` 제한을 메소드 단위로 넓혀 쓸 때 필요하다.
- **배열의 공변성과 제네릭의 불변성** — 배열은 `Bunny[]`를 `Rabbit[]`에 대입할 수 있는 것으로 알고 있는데, 제네릭은 7절처럼 안 된다. 둘이 다르게 설계된 이유를 알아두면 제네릭의 제약이 왜 필요한지 이해하기 쉽다.

## 참고 자료
- [Oracle - Bounded Type Parameters](https://docs.oracle.com/javase/tutorial/java/generics/bounded.html)
- [Oracle - Wildcards](https://docs.oracle.com/javase/tutorial/java/generics/wildcards.html)
- [Oracle - Upper Bounded Wildcards](https://docs.oracle.com/javase/tutorial/java/generics/upperBounded.html)
- [Oracle - Lower Bounded Wildcards](https://docs.oracle.com/javase/tutorial/java/generics/lowerBounded.html)
- [Oracle - Wildcards and Subtyping](https://docs.oracle.com/javase/tutorial/java/generics/subtyping.html)
- [Oracle - Generics, Inheritance, and Subtypes](https://docs.oracle.com/javase/tutorial/java/generics/inheritance.html)
- [Java Language Specification - 5.1.10. Capture Conversion](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html#jls-5.1.10)
