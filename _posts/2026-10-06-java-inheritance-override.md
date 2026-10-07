---
title: "상속과 오버라이딩: Car와 CapsCar"
date: 2026-10-06
tags:
  - Java
---

경찰차도 차인데, 달리기와 경적 메서드를 `Car`에서 복사해 다시 쓰는 게 맞을까? 상속받은 메서드를 그대로 쓰는 경우와 `@Override`로 재정의하는 경우가 실제로 어떻게 다르게 동작하는지 `Car`와 `CapsCar`(경찰차) 예제로 확인했다. 앞선 주제는 [이전 글]({{ site.baseurl }}/java-final-keyword.html)에 정리해뒀다.

> **TL;DR**
> - `extends`로 상속받으면 부모 메서드를 다시 작성하지 않고 쓸 수 있고, 다르게 동작할 메서드만 `@Override`한다.
> - 자식 생성자가 실행되기 전에 부모의 기본 생성자가 암묵적으로 먼저 호출된다.
> - 오버라이딩한 메서드에서 `super`를 호출하지 않으면 부모 메서드의 동작(필드 변경 포함)도 함께 사라진다.

## 1. 상속과 IS-A 관계

상속은 부모 클래스가 가진 멤버(필드, 메서드)를 자식 클래스가 물려받아 자신의 것처럼 쓸 수 있게 하는 문법이다. `CapsCar extends Car`처럼 "경찰차는 차다"라는 **IS-A 관계**가 성립할 때 상속을 쓴다. 반복되는 메서드를 부모 클래스에 한 번만 정의해두면, 자식 클래스는 그 메서드를 다시 작성하지 않고 그대로 물려받아 쓰고, 다르게 동작해야 하는 메서드만 `@Override`로 재정의하면 된다.

## 2. Car, CapsCar, Application 코드

부모 클래스 `Car`는 달리기·경적 울리기·정지 기능을 가지고 있다.

```java
package com.wanted.oop.c_inheritance.extend;

public class Car {

    // 달리는 상태 체크
    private boolean runningStatus;

    public Car() {
        System.out.println("Car 클래스의 기본생성자 호출됨...");
    }

    public void run() {
        runningStatus = true;
        System.out.println("자동차가 달려갑니다~~~~~~");
    }

    // 달리는 상태를 반환해주는 메소드
    public boolean isRunning() {
        return runningStatus;
    }

    // 경적을 울리는 메소드
    public void soundHorn() {
        if (isRunning()) {
            System.out.println("빵~~~~~~~~빵!!");
        } else {
            System.out.println("주행 중이 아니여서 경적을 울릴 수 없습니다.");
        }
    }

    public void stop() {
        runningStatus = false;
        System.out.println("자동차가 멈춥니다...");
    }

}
```

`CapsCar`는 `Car`를 상속받아서, `run()`과 `soundHorn()`만 경찰차답게 재정의하고, `stop()`은 `Car`의 것을 그대로 쓰고, 자신만의 메서드(`무전하기()`)도 추가로 가진다.

```java
package com.wanted.oop.c_inheritance.extend;

// 경찰차는 차다. IS-A 성립된다.
public class CapsCar extends Car{

    // 경찰차도 차이기 때문에
    // 달리는 기능 , 경적을 울리는 기능 모두를 가지고 있다.
    // 그렇다는 건 같은 메소드를 여기에다가도 똑같이 작성하는
    // 것이 아닌, 부모의 메소드를 재활용하면 좋지 않을까?
    // 라는 생각을 가지고 나온 개념이 상속이라는 개념이다.

    /* comment. Override
     *   메소드를 재정의 하는 것을 의미한다.
     *   부모가 가지는 메소드 선언부를 그대로 사용하면서
     *   자식 클래스가 정의한 메소드 대로 동작할 수 있도록
     *   구현 몸체를 새롭게 작성하는 것을 의미한다.
     * */

    public CapsCar() {
        System.out.println("CapsCar 의 기본 생성자 호출됨..");
    }


    @Override
    public void run() {
        // this -> 자기 자신의 인스턴스 주소
        // super -> 부모의 인스턴스 주소
//        super.run();
        System.out.println("🚙경찰차는 삐용삐용~~ 하면서 달립니다!!🚙");
    }

    @Override
    public void soundHorn() {
        System.out.println("❌삐~~~~~~~~~용~~~~~~~~~~~~~삐~~~~~~~~❌");
    }

    // 부모의 메소드를 재정의할 수 있고
    // 본인만의 고유한 필드/메소드도 작성 가능하다.
    public void 무전하기() {
        System.out.println("치지지ㅣ...412호에 성원몬 등장");
    }

}
```

이 둘을 호출하는 코드는 `Application`에 작성했다.

```java
package com.wanted.oop.c_inheritance.extend;

public class Application {

    /* comment.
     *   extends -> 현실세계에서 상속의 개념을 갖는다.
     *   부모의 돈은 내 돈이고 , 내 돈은 내 돈이다.
     *   부모의 돈(필드 , 메서드) 을/를 자식이 물려받는다.
     *  */

    public static void main(String[] args) {
        // 부모 객체 생성
        Car car = new Car();
        car.soundHorn();
        car.run();
        car.soundHorn();
        car.isRunning();
        car.stop();
        car.soundHorn();
        System.out.println("============================");

        // Car 를 상속 받은 CapsCar 객체 생성
        CapsCar capsCar = new CapsCar();
        capsCar.run();
        capsCar.soundHorn();
        capsCar.stop();
        capsCar.무전하기();

        /* comment.
         *   상속 개념을 통해 얻을 수 있는 것.
         *   - 반복되는 메서드를 부모 클래스에 정의 후
         *   - 자식 클래스에서는 상속만 받는다.
         *   - 자식 클래스에서는 다르게 동작해야 하는 메서드만
         *   - Override 해서 재정의를 한다.
         *
         *  */
    }

}
```

## 3. 부모 생성자가 먼저 호출된다

`car`는 `Car`의 메서드를 그대로 쓰기 때문에, `isRunning()`의 결과에 따라 경적 소리 메시지가 달라진다.

```text
Car 클래스의 기본생성자 호출됨...
주행 중이 아니여서 경적을 울릴 수 없습니다.
자동차가 달려갑니다~~~~~~
빵~~~~~~~~빵!!
자동차가 멈춥니다...
주행 중이 아니여서 경적을 울릴 수 없습니다.
============================
```

`CapsCar`를 생성할 때는 `CapsCar`의 생성자가 실행되기 전에 **부모 클래스 `Car`의 기본 생성자가 먼저 자동으로 호출**된다. `CapsCar()` 생성자 코드 어디에도 `super()`를 직접 쓰지 않았지만, 컴파일러가 생성자 맨 앞에 `super()` 호출을 암묵적으로 추가해주기 때문이다. 그래서 두 생성자의 출력 메시지가 순서대로 찍힌다.

```text
Car 클래스의 기본생성자 호출됨...
CapsCar 의 기본 생성자 호출됨..
```

## 4. super.run()을 호출하지 않으면 부모의 동작이 사라진다

`CapsCar.run()`을 보면 `super.run()`이 주석으로 막혀 있다. `Car.run()`은 `runningStatus = true;`로 "달리는 상태"를 기록하는데, `CapsCar.run()`은 이 코드를 호출하지 않고 메시지 출력으로 완전히 덮어썼다. 즉, `capsCar.run()`을 호출해도 `capsCar`의 `runningStatus`는 여전히 `false`로 남아 있다.

다만 이번 코드에서는 `capsCar.soundHorn()`도 함께 재정의돼 있어서, `Car.soundHorn()`의 `isRunning()` 체크 로직 자체가 아예 실행되지 않는다. 그래서 `runningStatus`가 `false`로 남아 있어도 `capsCar.soundHorn()`은 항상 "❌삐~~~~~~~~~용~~~~~~~~~~~~~삐~~~~~~~~❌"만 출력한다. 반대로 만약 `CapsCar`가 `soundHorn()`은 재정의하지 않고 `run()`만 재정의했다면, `capsCar.soundHorn()`을 호출해도 `runningStatus`가 계속 `false`라서 "주행 중이 아니여서 경적을 울릴 수 없습니다."가 나왔을 것이다. **오버라이딩은 메서드 단위로 동작을 통째로 바꾸는 것**이라서, `super`를 호출하지 않으면 부모 메서드가 원래 하던 부수효과(필드 변경 등)는 함께 사라진다는 걸 이 케이스로 확인했다.

```text
Car 클래스의 기본생성자 호출됨...
CapsCar 의 기본 생성자 호출됨..
🚙경찰차는 삐용삐용~~ 하면서 달립니다!!🚙
❌삐~~~~~~~~~용~~~~~~~~~~~~~삐~~~~~~~~❌
자동차가 멈춥니다...
치지지ㅣ...412호에 성원몬 등장
```

`capsCar.stop()`은 `CapsCar`에 따로 재정의하지 않았기 때문에 `Car.stop()`이 그대로 호출되고, `무전하기()`는 `CapsCar`만 가진 고유 메서드라서 `Car` 타입 변수로는 호출할 수 없다.

## 5. 정리

- `extends`로 상속받으면 부모의 메서드를 그대로 쓸 수 있고, 다르게 동작해야 하는 메서드만 `@Override`로 재정의한다.
- 자식 생성자가 실행되기 전에 부모 생성자가 암묵적으로 먼저 호출된다. `super()`를 직접 쓰지 않아도 두 생성자 메시지가 순서대로 출력됐다.
- 오버라이딩한 메서드 안에서 `super.메서드명()`을 호출하지 않으면 부모 메서드의 동작은 실행되지 않고 완전히 대체된다. `CapsCar.run()`이 `runningStatus`를 바꾸지 않는 경우가 그 예다.

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **다형성(Polymorphism)** — 오늘은 `CapsCar` 타입 변수로만 호출해봤는데, `Car car2 = new CapsCar();`처럼 부모 타입 변수에 자식 인스턴스를 담아서 호출하면 어떤 메서드(부모 것, 자식 것)가 실제로 실행되는지 이어서 확인해보고 싶다.
- **생성자에서의 super() 명시적 호출** — 오늘은 매개변수 없는 기본 생성자라 컴파일러가 자동으로 `super()`를 넣어줬는데, 부모 생성자가 매개변수를 받는 경우엔 자식 생성자에서 `super(인자)`를 직접 써줘야 한다고 들었다. 그 경우까지 직접 만들어보고 싶다.
- **접근 제한자와 상속** — `Car.runningStatus`가 `private`인데도 `CapsCar.run()`에서 그 값을 직접 건드리지 못하고 `super.run()`을 통해서만 바꿀 수 있다는 걸 오늘 코드로 체감했다. `private`/`protected`가 상속 관계에서 각각 어디까지 보이는지 정리하면 좋을 것 같다.

## 참고 자료
- [Oracle - Overriding and Hiding Methods](https://docs.oracle.com/javase/tutorial/java/IandI/override.html)
- [Oracle - Using the Keyword super](https://docs.oracle.com/javase/tutorial/java/IandI/super.html)
