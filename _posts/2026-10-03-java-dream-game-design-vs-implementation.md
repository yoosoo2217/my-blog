---
title: "설계와 구현은 다를 수 있다 — '꿈꾸는 나' 콘솔 게임 직접 만들어보기"
date: 2026-10-03
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-abstraction-carracer-example.html)에서 카레이서·자동차 예제를 구현해봤는데, 그 패턴(요구사항 → 객체/메시지 설계 → 클래스 구현)을 그대로 따라서 "꿈꾸는 나 — 알람이 울리기 전에"라는 콘솔 게임을 직접 만들어봤다. 다 만들고 나서 처음에 적어둔 요구사항과 실제로 완성된 코드를 나란히 비교해보니, 둘이 똑같지 않다는 걸 발견했다 — 그 차이를 짚어보는 게 이번 글의 핵심이다.

## 1. 요구사항과 설계

```text
1. 프로그램에는 Me, Dream, Alarm 3개의 객체만 존재한다.
2. Me는 잠들었는지 여부를 가지며, 잠들기와 깨어나기를 할 수 있다.
3. Dream은 꿈을 꾸는지 여부를 가지며, 꿈 시작하기·하늘 날기·놀이공원 가기·꿈 끝내기를 할 수 있다.
4. Alarm은 알람 시간(int)과 울렸는지 여부를 가지며, 알람 설정하기·시간 1 감소시키기·알람 울리기를 할 수 있다.
5. 메인 메뉴는 "잠들기 / 알람 설정하기 / 종료"이다.
6. 꿈속 메뉴는 "하늘 날기 / 놀이공원 가기 / 꿈에서 깨어나기"이다.
7. 알람 시간은 사용자가 직접 입력한다.
8. 알람이 설정되지 않았으면 꿈을 시작할 수 없다.
9. 이미 잠든 상태에서는 다시 잠들 수 없다.
10. 잠들기 전에는 꿈속 행동(하늘 날기, 놀이공원 가기)을 할 수 없다.
11. 꿈을 꾸고 있지 않으면 꿈속 행동을 할 수 없다.
12. 꿈속 행동을 1번 할 때마다 알람 시간이 1 감소한다.
13. 알람 시간이 0이 되면 알람이 울리고 꿈이 끝난다.
14. 꿈에서 깨어나면(알람이 울리거나 직접 깨어나면) 모든 상태가 처음 상태로 돌아간다.
15. Application은 로직을 처리하지 않고, 객체끼리 메시지를 주고받으며 협력한다.
```

협력 시나리오도 먼저 적어뒀다. 핵심은 `Application`이 `Me`에게만 말을 걸고, `Me`가 `Dream`·`Alarm`에게 다시 메시지를 전달하는 구조였다.

```text
사용자 -> Me : "잠들어라"
Me -> Alarm : "설정되었는지 알려줘라"  (알람 미설정이면 꿈을 시작하지 않는다)
Me -> Dream : "꿈을 시작해라"
```

## 2. 실제 클래스 구현

### Alarm — 시간과 설정 여부

```java
public class Alarm {
    private int time;
    private boolean set;

    public void setTime(int time) {
        this.time = time;
        set = true;
        System.out.println("알람을 " + time + "시간 후로 설정했습니다.");
    }

    public int getTime() {
        return time;
    }

    public void ring() {
        System.out.println("'띠리리링~! 띠리리리잉~⏱️⏱️' 알람이 울립니다.");
    }

    public boolean isSet() {
        return set;
    }
}
```

### Dream — 꿈을 꾸는 중인지

```java
public class Dream {
    private boolean dreaming;

    public void start() {
        dreaming = true;
        System.out.println("당신은 잠이 들었습니다. 쿨쿨쿨..");
    }

    public void end() {
        dreaming = false;
        System.out.println("현실을 살아갈 시간이야.. 아우 피곤해.. 출근하자!");
    }

    public boolean isDreaming() {
        return dreaming;
    }

    public void richman() {
        System.out.println("당신은 부자가 되었습니다!");
    }

    public void superstar() {
        System.out.println("당신이 좋아하는 연예인이 나타났습니다!");
    }
}
```

### Me — Dream과 Alarm을 가지고 있는 중개자

```java
public class Me {
    private Dream dream;
    private Alarm alarm;

    public Me(Dream dream, Alarm alarm) {
        this.dream = dream;
        this.alarm = alarm;
    }

    public void sleep() {
        dream.start();
    }

    public void wakeUp() {
        System.out.println("'벌써 아침이야?!' 당신은 잠에서 깬다.");
        dream.end();
    }
}
```

`Me`가 생성자에서 `dream`과 `alarm`을 전달받는 방식(`new Me(dream, alarm)`)은 어제 `CarRacer`가 `private Car car = new Car();`로 직접 만들던 것과는 다르다. 이번엔 `Application`이 먼저 `Dream`, `Alarm`을 만들고 그걸 `Me`에게 넘겨준다 — 같은 "캡슐화해서 감싸기"라도 인스턴스를 누가 만드느냐(내부에서 직접 생성 vs 밖에서 전달받기)에 따라 코드가 달라진다는 걸 비교해볼 수 있었다.

### Application — 메뉴와 중첩된 꿈속 선택지

```java
Dream dream = new Dream();
Alarm alarm = new Alarm();
Me me = new Me(dream, alarm);

while (true) {
    // 1. 잠들기 / 2. 알람 설정하기 / 0. 게임 종료
    int no = sc.nextInt();

    switch (no) {
        case 1:
            me.sleep();
            while (dream.isDreaming()) {
                // 1. 부자 되기 / 2. 연예인 만나기 / 3. 꿈에서 깨기
                int action = sc.nextInt();
                switch (action) {
                    case 1:
                        dream.richman();
                        // 1. 여행하기 / 2. 건물주 되기 / 3. 사람 부리기
                        int choiceR = sc.nextInt();
                        switch (choiceR) {
                            case 1:
                                alarm.ring();
                                me.wakeUp();
                                break;
                            // case 2, 3도 결과만 다르고 동일하게 alarm.ring() + me.wakeUp()
                        }
                        break;
                    case 2:
                        dream.superstar();
                        // ... superstar도 동일한 구조
                        break;
                    case 3:
                        alarm.ring();
                        me.wakeUp();
                        break;
                }
            }
            break;
        case 2:
            int time = sc.nextInt();
            alarm.setTime(time);
            break;
    }
}
```

메뉴(1/2/0) → 꿈속 메뉴(1/2/3) → 꿈의 결말 선택(1/2/3)까지 `switch` 안에 `switch`가 또 들어있는 3단 중첩 구조다. 어떤 결말을 고르든 마지막에는 `alarm.ring()`과 `me.wakeUp()`을 호출해서 꿈을 끝낸다.

## 3. 설계와 실제 구현이 달라진 부분

다 만들고 나서 요구사항 15개를 하나씩 다시 짚어보니, 몇 가지는 실제 코드에 반영되지 않았다는 걸 발견했다.

### 요구사항 8 — "알람이 설정되지 않았으면 꿈을 시작할 수 없다"가 지켜지지 않는다

설계 단계의 메시지 목록에는 분명 "잠들어라 (잠든 상태인지, 알람이 설정되었는지 확인 후 Dream에게 꿈을 시작시킨다)"라고 적어뒀는데, 실제 `Me.sleep()`은 이렇다.

```java
public void sleep() {
    dream.start();
}
```

`alarm.isSet()`을 확인하는 코드가 없다. 그래서 알람을 한 번도 설정하지 않고 바로 "1. 잠들기"를 선택해도 꿈이 그대로 시작된다. 설계 문서의 "확인 후"라는 말이 실제 코드에는 옮겨지지 않은 셈이다.

### 요구사항 12·13 — 알람 시간 감소와 자동 알람은 아예 구현되지 않았다

`Alarm`에는 시간을 감소시키는 메서드 자체가 없다. `setTime()`으로 설정한 시간이 꿈속 행동을 할 때마다 줄어드는 로직도, 시간이 0이 되었을 때 자동으로 `ring()`이 호출되는 로직도 찾을 수 없었다. 대신 실제 게임은 꿈속에서 **어떤 결말을 선택하든** 그 자리에서 바로 `alarm.ring()` → `me.wakeUp()`을 호출해서 꿈을 끝내는 방식으로 단순화되어 있었다. 메뉴에 표시되는 "⏰ 현재 알람: N시간 후"는 사용자가 입력한 값을 그대로 보여줄 뿐, 게임 진행에 실제로 쓰이지는 않는다.

### 요구사항 14 — 깨어나도 알람 상태는 초기화되지 않는다

```java
public void wakeUp() {
    System.out.println("'벌써 아침이야?!' 당신은 잠에서 깬다.");
    dream.end();
}
```

`wakeUp()`은 `dream.end()`만 호출해서 `dreaming`은 `false`로 되돌리지만, `alarm`의 `time`과 `set`은 그대로 남는다. 그래서 한 번 꿈을 꾸고 깨어난 뒤에도 메인 메뉴에는 "⏰ 현재 알람: N시간 후"가 계속 떠 있다 — "모든 상태가 처음 상태로 돌아간다"는 요구사항과는 다르게 동작한다.

### Application이 Me만 거치지 않고 Dream·Alarm에 직접 말을 건다

협력 시나리오에는 "Me → Dream", "Me → Alarm"만 있고 `Application`이 `Dream`·`Alarm`에 직접 메시지를 보내는 경로는 없었다. 그런데 실제 `Application`은 `dream`과 `alarm`을 `Me`와 별개로 직접 들고 있고, `dream.isDreaming()`, `dream.richman()`, `alarm.ring()`, `alarm.isSet()`, `alarm.getTime()`, `alarm.setTime()`을 전부 직접 호출한다. `Me`를 거치는 건 `me.sleep()`과 `me.wakeUp()` 두 번뿐이다. 어제 `CarRacer`가 `Car`를 완전히 감싸서 `Application`이 `Car`에 접근할 방법 자체가 없었던 것과 비교하면, 이번엔 캡슐화가 그만큼 철저하게 지켜지지는 않았다.

이 차이들이 "버그"라기보다는, **글로 적어둔 설계와 실제로 짠 코드 사이에는 항상 틈이 생길 수 있다**는 걸 보여주는 사례에 가깝다고 생각한다. 설계 문서를 쓰는 것과, 그걸 빠짐없이 코드로 옮기는 것은 별개의 작업이라는 걸 직접 겪어봤다.

## 오늘 정리

- 요구사항과 협력 시나리오를 먼저 글로 쓰고, `Alarm`/`Dream`/`Me`/`Application` 순서로 구현해봤다.
- `Me`가 `Dream`·`Alarm`을 생성자로 전달받는 방식(`new Me(dream, alarm)`)을, 어제 `CarRacer`가 `Car`를 내부에서 직접 생성하던 방식과 비교해봤다.
- 다 만든 뒤 요구사항을 하나씩 다시 대조해보니, 알람 설정 여부 확인(요구사항 8), 알람 시간 감소·자동 알람(요구사항 12·13), 상태 초기화(요구사항 14)가 실제 코드에는 빠져 있었고, `Application`이 `Me`만 거치지 않고 `Dream`·`Alarm`에도 직접 접근하고 있었다는 걸 발견했다.
- 설계 문서와 실제 코드를 나란히 비교해보는 습관이, 빠뜨린 부분을 찾는 데 실제로 도움이 된다는 걸 체감했다.

## 더 학습하면 좋은 개념

- **생성자 주입(Constructor Injection)** — 오늘 `Me(Dream dream, Alarm alarm)`처럼 필요한 객체를 생성자로 전달받는 방식을 썼는데, 이 패턴이 왜 테스트하기 쉽고 결합도를 낮추는 데 도움이 되는지 더 깊이 알아보고 싶다.
- **상태 패턴(State Pattern)** — `dreaming`, `set`처럼 boolean 하나로 상태를 표현하는 방식은 상태 종류가 늘어나면 금방 복잡해질 것 같다. 상태를 객체로 다루는 디자인 패턴을 다음에 찾아보고 싶다.
- **요구사항 추적(Requirement Traceability)** — 오늘처럼 요구사항 15개와 실제 코드를 하나씩 대조하는 작업을 더 체계적으로 하는 방법(체크리스트, 테스트 코드 등)이 실무에 있는지 알아보고 싶다.

## 참고 자료
- [Oracle - Passing Information to a Method or a Constructor](https://docs.oracle.com/javase/tutorial/java/javaOO/arguments.html)
