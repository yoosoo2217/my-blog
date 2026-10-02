---
title: "추상화 설계를 실제 코드로 — 카레이서와 자동차 구현하기"
date: 2026-10-02 09:30:00
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-encapsulation-monster-example.html)에서 캡슐화 문제를 Monster로 직접 겪어봤고, 오늘은 조금 더 과거로 돌아가서 — [추상화 글]({{ site.baseurl }}/java-abstraction-interfaces.html)에서 요구사항만 적어두고 설계까지만 했던 "카레이서와 자동차" 예제를 실제로 구현해봤다.

## 0. 다시 보는 요구사항과 설계

[추상화 글]({{ site.baseurl }}/java-abstraction-interfaces.html)에서 이미 정리했던 내용이라 간단히만 복습하면, 요구사항은 이렇다.

```text
1. 자동차는 처음에 멈춘 상태로 대기한다.
2. 카레이서는 먼저 자동차에 시동을 건다. 이미 걸려있다면, 다시 시동을 걸 수 없다.
3. 카레이서가 엑셀을 밟으면 시동이 걸려있다면 시속이 10km/h 증가하며 앞으로 나간다.
4. 자동차가 달리고 있는 중이면 브레이크를 밟을 시 시속이 0으로 떨어지며 멈춘다.
5. 브레이크를 밟을 때 자동차가 달리는 중이 아니라면 이미 멈춰있는 상태라고 안내한다.
6. 카레이서가 시동을 끄면, 더 이상 자동차는 움직이지 않는다.
7. 자동차가 달리는 중이라면 시동을 끌 수 없다.
```

여기서 "은/는, 이/가" 앞에 오는 단어가 대부분 클래스 후보라는 팁도 다시 나왔다 — `자동차`, `카레이서`. 오늘은 이 설계를 `Car`, `CarRacer`, `Application` 세 클래스로 실제 구현했다.

## 1. Car — 상태와 행위를 가진 자동차

```java
public class Car {
    // 데이터 후보군(= 변하는 상태 후보군): 속력, 시동 여부
    private int speed;
    private boolean isOn; // T/F가 젤 좋음

    public void startUp() {
        if (isOn) {
            System.out.println("🤖 시동이 이미 걸려있습니다. 그것도 모르냐, 카레이서 접어라");
        } else {
            this.isOn = true;
            System.out.println("시동 걸기 완료! 출발 준비 오키도키");
        }
    }

    public void go() {
        if (isOn) {
            System.out.println("🚔차가 출발합니다 뿌뿌~");
            this.speed += 10; // this.speed = speed + 10; 과 동일
            System.out.println("현재 차의 속력은" + this.speed + "(km/h) 입니다. 적당히 하세요. 목 날라갈수ㅡ동 잇어요");
        } else {
            System.out.println("차의 시동이 걸려있지 않습니다. 시동 확인 바람. 그것도 모르냐");
        }
    }

    public void stop() {
        if (isOn) {
            if (speed > 0) {
                this.speed = 0;
                System.out.println("끼익...... 브레이크 밟기 완료. 그렇게 빨리 달리다가 사망한다.");
            } else {
                System.out.println("차 이미 멈춰있지롱. 밟아라. 인간아.");
            }
        } else {
            System.out.println("시동이 걸려있지 않습니다. 시동부터 확인하고 하자 응? 가라는 거야 말라는 거야");
        }
    }

    public void turnOff() {
        if (isOn) {
            if (speed > 0) {
                System.out.println("미쳣냐? 달리고 있는데 시동을 끄게? 먼저 멈추면 꺼줄게 바보야");
            } else {
                this.isOn = false;
                System.out.println("시동 끔");
            }
        } else {
            System.out.println("이미 시동이 꺼져있음");
        }
    }
}
```

필드는 `speed`(속력)와 `isOn`(시동 여부) 두 개뿐이고, 메서드 네 개가 요구사항 7개를 전부 나눠서 처리한다.

- `startUp()`: 이미 켜져 있으면(요구사항 2) 경고, 아니면 켜고 안내 — 요구사항 1·2.
- `go()`: 시동이 켜져 있어야만 속력을 10 올린다 — 요구사항 3.
- `stop()`: 켜져 있고 달리는 중이면 속력을 0으로(요구사항 4), 켜져 있지만 멈춰 있으면 안내만(요구사항 5), 꺼져 있으면 또 다른 안내.
- `turnOff()`: 달리는 중이면 끌 수 없다고 거부(요구사항 7), 멈춰 있으면 꺼준다(요구사항 6).

### 주의할 점 — `isOn`이 처음부터 `false`인 이유

파일 맨 위 주석에 "객체 생성 → 기본 생성자 호출(Heap 영역에 메모리 올림) → 그래서 false 타입으로 꺼짐(초깃값)"이라고 적혀 있었는데, 이건 [JVM 메모리 구조 글]({{ site.baseurl }}/java-jvm-memory-stack-heap.html)에서 정리했던 내용과 그대로 이어진다. `new Car()`로 인스턴스를 만들면 Heap에 올라간 `isOn` 필드는 값을 넣어주기 전까지 `boolean`의 기본값인 `false`로 채워진다. 그래서 요구사항 1("자동차는 처음에 멈춘 상태로 대기한다")을 코드로 따로 작성하지 않아도, Heap의 기본값 자체가 "꺼져 있고 멈춰 있는 상태"를 만들어준다.

## 2. CarRacer — Car를 감싸서 캡슐화하기

```java
public class CarRacer {
    // 캡슐화 — Car는 CarRacer만 접근 가능하고, Application은 Car에 직접 접근하면 안 된다.
    private Car car = new Car();

    public void stratUp() {
        car.startUp();
    }

    public void stepAccel() {
        car.go();
    }

    public void stepBreak() {
        car.stop();
    }

    public void turnOff() {
        car.turnOff();
    }
}
```

`CarRacer`는 `Car`를 `private` 필드로 가지고 있다. `Application`은 `Car`를 직접 다루지 않고, 항상 `CarRacer`가 가진 네 개의 메서드(시동·전진·정지·시동끄기)를 통해서만 자동차를 조작한다. 어제 Monster 예제에서 본 "필드를 `private`으로 막으면, 메서드를 거치지 않고는 값을 바꿀 방법이 없어진다"는 원칙이 여기서는 클래스 단위로 한 번 더 적용된 셈이다 — `Application`은 `car.speed`나 `car.isOn`에는 아예 접근할 수 없고, `CarRacer`가 공개한 메서드만 쓸 수 있다.

### 주의할 점 — 메서드 이름 오타(`stratUp`)

`Car`의 메서드는 `startUp()`인데, `CarRacer`가 그걸 감싸는 메서드 이름은 `stratUp()`으로 `t`와 `r` 순서가 바뀌어 있다. 둘이 같은 이름일 필요는 없어서 컴파일되고 정상 동작은 하지만, 같은 기능을 감싼 메서드끼리 이름이 다르면 나중에 코드를 읽을 때 헷갈리기 쉽다. 실제로 이 오타 때문에 처음엔 `startUp()`과 `stratUp()`이 서로 다른 메서드인 줄 알고 잠깐 헷갈렸다.

## 3. Application — Scanner와 반복문으로 메뉴 만들기

```java
Scanner sc = new Scanner(System.in);
CarRacer racer = new CarRacer();

while (true) {
    System.out.println("========= 카레이싱 프로그램 ==========");
    System.out.println("1. 시동 걸기");
    System.out.println("2. 전진");
    System.out.println("3. 정지");
    System.out.println("4. 시동 끄기");
    System.out.println("9. 프로그램 종료");
    System.out.println("====================================");
    System.out.print("메뉴를 선택해주세요 :");

    int no = sc.nextInt();

    switch (no) {
        case 1:
            racer.stratUp();
            break;
        case 2:
            racer.stepAccel();
            break;
        case 3:
            racer.stepBreak();
            break;
        case 4:
            racer.turnOff();
            break;
        case 9:
            break;
        default:
            System.out.println("잘못된 번호 입력!");
            break;
    }

    if (no == 9) {
        System.out.println("프로그램을 종료합니다 ㅃㅇ");
        break; // while 밖에 있는 break : while(무한루프) 탈출
    }
}
```

`while (true)`로 무한 반복하면서, 사용자가 숫자를 입력할 때마다 `switch`로 분기해서 `racer`의 메서드를 호출한다.

### 주의할 점 — `switch` 안의 `break`와 `while`을 빠져나가는 `break`는 다른 `break`다

`case 9: break;`는 `switch` 블록만 빠져나갈 뿐, 그 안에서는 아무 메서드도 호출하지 않고 그냥 `switch`를 끝낸다. 실제로 프로그램을 종료시키는 건 `switch` 바깥에 따로 있는 `if (no == 9) { ... break; }`다. 이 `break`는 `switch`가 아니라 `while`을 감싸고 있어서, 이 줄이 실행되면 무한 반복문 자체를 탈출한다. 똑같이 생긴 `break` 키워드라도 **자신을 감싸고 있는 가장 가까운 반복문이나 switch** 하나만 빠져나간다는 걸 이 코드로 확인했다 — 그래서 `case 9`의 `break`만으로는 `while`까지 끝낼 수 없어서, `switch` 밖에 조건문을 하나 더 둬야 했던 것이다.

## 오늘 정리

- 추상화 과정에서 "요구사항 → 객체 후보 추출 → 메시지(행동) 추출 → 클래스 설계"까지 글로 정리했던 것을, 오늘은 `Car`/`CarRacer`/`Application` 세 클래스로 실제 구현해봤다.
- `Car`의 필드(`speed`, `isOn`)가 Heap의 기본값(`0`, `false`)만으로 "처음엔 멈춰있고 꺼져있는 상태"라는 요구사항 1을 저절로 만족한다는 걸 확인했다.
- `CarRacer`가 `Car`를 `private` 필드로 감싸서, `Application`이 `Car`에 직접 접근하지 못하게 캡슐화하는 걸 클래스 단위로 다시 확인했다.
- `switch`의 `break`와 `while`의 `break`는 서로 다른 블록을 빠져나간다는 걸, 두 `break`가 나란히 쓰인 종료 로직으로 직접 확인했다.

## 더 학습하면 좋은 개념

- **`do-while`로 메뉴 루프 바꿔보기** — 지금은 `while (true)` + 안쪽 `if`로 종료 조건을 처리하는데, [반복문 글]({{ site.baseurl }}/java-loops.html)에서 배운 `do-while`로 구조를 바꾸면 더 깔끔해질지 직접 비교해보고 싶다.
- **`Scanner`의 입력 오류 처리** — 지금은 숫자가 아닌 값을 입력하면 `sc.nextInt()`에서 바로 예외가 날 텐데, 이런 잘못된 입력을 안전하게 처리하는 방법을 알아보고 싶다.
- **행위 중심 추상화의 인터페이스화** — 지금은 `Car`를 구체 클래스로 바로 썼는데, "운전 가능한 것"을 인터페이스로 뽑아내면 [다형성 글]({{ site.baseurl }}/java-polymorphism.html)에서 본 것처럼 다른 종류의 차량도 같은 방식으로 다룰 수 있을 것 같다.

## 참고 자료
- [Oracle - The switch Statement](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/switch.html)
- [Oracle - Branching Statements (break)](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/branch.html)
