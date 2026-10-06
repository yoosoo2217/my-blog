---
title: "인터페이스는 구현체 없이 어떻게 타입이 될까"
date: 2026-10-06
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-polymorphism-animal-example.html)에서 `Animal`-`Raccoon`-`Cat`으로 상속과 다형성을 실습했는데, 오늘 마지막으로는 [추상클래스·인터페이스 글]({{ site.baseurl }}/java-abstraction-interfaces.html)에서 정리했던 인터페이스를 `Animal` 인터페이스와 `Raccooon` 구현체로 다시 실습해봤다. 특히 "인터페이스는 왜 직접 인스턴스를 만들 수 없는지", "구현부를 비워둬도 왜 컴파일이 되는지" 두 가지를 중심으로 확인했다.

## 1. 실제 작성한 테스트 코드

이번엔 `Animal`이 클래스가 아니라 **인터페이스**다.

```java
package com.wanted.oop.d_polymorphism.a_interface;

public interface Animal {
    /*comment. interface
        Can-do
        해당 인터페이스를 상속받는 클래스들이 해야하는 메소드(Can - do)를 강제한다.
    */

    // 인터페이스는 생성자를 사용하지 못 한다.
    // public Animal() {}

    // 인터페이스는 구현부(중괄호)가 있는 메소드를 못 쓴다.
    // public void test() {}

    void run();

    void eat();

    void bark();


}
```

`Raccooon`은 `implements`로 `Animal`을 구현한다.

```java
package com.wanted.oop.d_polymorphism.a_interface;


    // 인터페이스를 상속 받을 때에는 extends가 아닌 implements로 하게 된다
    public class Raccooon implements Animal{
        @Override
        public void run() {
            System.out.println("너구리가 뛰다보니 치타를 이겻어요");

        }

        @Override
        public void eat() {
            System.out.println("냠냠");

        }

        @Override
        public void bark() {

        }



}
```

```java
package com.wanted.oop.d_polymorphism.a_interface;

public class Applicatioin {
    static void main(String[] args) {
        // 인터페이스는 구현체가 없다.
        // 즉, new 키워드로 객체를 생성할 수 없다는 의미다.
        // Animal animal = new Animal();

        // 인터페이스는 해당 인터페이스를 상속 받는 클래스를 통해 객체를 생성하게 된다.
        Animal animal = new Raccooon();
    }
}
```

## 2. 인터페이스는 왜 직접 인스턴스를 만들 수 없을까

`Animal animal = new Animal();`은 주석으로 막아뒀다. 인터페이스는 메서드의 몸체(구현부, `{}`) 없이 선언부(`void run();`처럼 시그니처만 있고 세미콜론으로 끝나는 형태)만 가지고 있어서, 그 자체로는 "무엇을 해야 하는지"만 정의할 뿐 "어떻게 할지"는 전혀 담고 있지 않다. 그래서 자바는 인터페이스를 **구현이 없는 불완전한 타입**으로 취급해서 `new`로 인스턴스를 만드는 걸 막는다. 실제로 동작하는 인스턴스를 만들려면, `Raccooon`처럼 `implements`로 모든 메서드를 구현한 클래스를 통해서만 가능하다.

`Animal animal = new Raccooon();`처럼 인터페이스 타입의 변수에 구현 클래스의 인스턴스를 담을 수 있는 것도, [이전 다형성 글]({{ site.baseurl }}/java-polymorphism-animal-example.html)에서 본 업캐스팅과 같은 원리다. 클래스 상속에서 `Animal animal = new Raccoon();`이 가능했던 것처럼, 인터페이스도 "구현 클래스는 그 인터페이스 타입이기도 하다"는 관계가 성립해서 똑같이 업캐스팅할 수 있다.

## 3. bark()를 비워놔도 컴파일이 되는 이유

`Raccooon.bark()`는 `{}` 안에 아무 코드도 없다. 호출해도 아무 일도 일어나지 않지만, 이것도 엄연히 "구현은 했다"고 인정된다. 인터페이스가 강제하는 건 딱 하나, **메서드가 그 이름·매개변수·반환타입 그대로 존재해야 한다는 것**뿐이다. 그 메서드 안에서 실제로 의미 있는 동작을 하는지는 인터페이스가 관여하지 않는다. 그래서 `run()`, `eat()`처럼 실제로 출력문을 넣은 메서드와, `bark()`처럼 몸체를 비워둔 메서드 모두 컴파일러 입장에서는 똑같이 "`Animal`을 구현했다"고 본다.

## 오늘 정리

- 인터페이스는 메서드의 선언부만 가지고 구현부가 없어서, `new Animal()`처럼 직접 인스턴스를 만들 수 없고 `Raccooon`처럼 `implements`로 모든 메서드를 구현한 클래스를 통해서만 인스턴스를 만들 수 있다는 걸 확인했다.
- `Animal animal = new Raccooon();`처럼 인터페이스 타입 변수에 구현체 인스턴스를 담는 것도, 클래스 상속에서 봤던 업캐스팅과 같은 원리로 동작한다는 걸 연결해서 이해했다.
- `bark()`처럼 메서드 몸체를 비워둬도 컴파일이 된다는 걸 직접 확인했다 — 인터페이스는 "메서드가 존재해야 한다"는 것만 강제하지, 그 안의 동작까지 강제하지는 않는다는 걸 배웠다.

## 더 학습하면 좋은 개념

- **빈 구현의 설계 리스크** — `bark()`처럼 아무 동작 없이 비워두면 컴파일은 되지만, 호출하는 쪽에서는 "분명히 구현했는데 왜 아무 일도 안 일어나지?" 하고 혼란스러울 수 있다. 의도적으로 비워둘 땐 `// TODO` 주석이나 `UnsupportedOperationException` 같은 명시적 표시가 필요하다고 들었는데, 다음엔 그 방식도 직접 써보고 싶다.
- **인터페이스 다중 구현(`implements A, B`)** — 오늘은 `Animal` 하나만 구현했는데, 클래스가 여러 인터페이스를 동시에 구현할 수 있다는 게 인터페이스의 핵심 장점 중 하나라고 배웠으니, 두 개 이상의 인터페이스를 한 클래스가 구현하는 코드로 연습해보고 싶다.
- **`default` 메서드** — Java 8부터는 인터페이스에도 구현부가 있는 `default` 메서드를 쓸 수 있다고 들었는데, 오늘 배운 "인터페이스는 구현부를 못 쓴다"는 규칙과 어떻게 공존하는지 다음에 비교해보고 싶다.

## 참고 자료
- [Oracle - Defining an Interface](https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html)
- [Oracle - Implementing an Interface](https://docs.oracle.com/javase/tutorial/java/IandI/interfaceDef.html)
