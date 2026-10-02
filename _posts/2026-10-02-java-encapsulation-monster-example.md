---
title: "캡슐화가 필요한 이유 — Monster 클래스로 보는 3가지 문제와 해결"
date: 2026-10-02 09:00:00
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-encapsulation-immutable-objects.html)에서 캡슐화의 개념과 접근 제어자를 정리했고, 오늘은 같은 `Monster` 클래스를 가지고 "캡슐화를 적용하지 않으면 정확히 어떤 문제가 생기는지"를 문제 1→2→3 순서로 직접 겪어보고, 마지막에 해결하는 실습을 했다.

## 1. 문제 1 — 검증되지 않은 값이 그대로 들어간다

```java
public class Monster {
    String name;  // 이름
    int hp;       // 체력 - 몬스터가 가지고 있는 고유한 값

    // HP를 전달받아 양수인 경우 전달받은 값으로 hp 세팅, 음수인 경우 0으로 강제 변경
    public void setHP(int hp) {
        if (hp > 0) {
            System.out.println("정상 값입니다. 몬스터의 체력을 " + hp + "로 설정합니다.");
            this.hp = hp;
        } else {
            System.out.println("삐빅.. 오류 발생.. 잘못된 값이 탐지되어 hp를 0으로 강제합니다. ㅅㄱ");
        }
    }
}
```

```java
Monster monster1 = new Monster();
monster1.name = "메로나";
monster1.hp = 50;
System.out.println("monster1.name = " + monster1.name);
System.out.println("monster1.hp = " + monster1.hp);

Monster monster2 = new Monster();
monster2.name = "헐크";
// 문제 상황 발생 — 검증되지 않은 값을 넣었을 때 문제가 발생할 수 있다.
monster2.hp = -200;
System.out.println("monster2.name = " + monster2.name);
System.out.println("monster2.hp = " + monster2.hp);

Monster monster3 = new Monster();
monster3.name = "타노스";
monster3.setHP(-300);
System.out.println("monster3.name = " + monster3.name);
System.out.println("monster3.hp = " + monster3.hp);
```

```text
monster1.name = 메로나
monster1.hp = 50
monster2.name = 헐크
monster2.hp = -200
삐빅.. 오류 발생.. 잘못된 값이 탐지되어 hp를 0으로 강제합니다. ㅅㄱ
monster3.name = 타노스
monster3.hp = 0
```

`monster2`는 필드에 직접 `-200`을 넣었기 때문에 아무 검증 없이 음수 체력이 그대로 저장된다. `monster3`는 검증 메서드인 `setHP()`를 거쳤기 때문에 음수가 걸러진다.

### 주의할 점 — "0으로 강제합니다"라고 말만 하고 실제로는 안 바꾼다

`setHP()`의 `else` 분기를 다시 보면, 출력 문구는 "hp를 0으로 강제합니다"라고 말하지만 실제 코드에는 `this.hp = 0;`이 없다. 그냥 메시지만 출력하고 끝난다. `monster3.hp`가 `0`으로 나온 건 이 코드가 0으로 "강제"해서가 아니라,애초에 인스턴스를 만들 때 Heap이 채워주는 `int`의 기본값이 `0`이었고 `setHP(-300)`이 그 값을 바꾸지 못했기 때문이다. 말(주석·출력문)과 실제 동작이 다를 수 있다는 걸 보여주는 좋은 사례였다.

## 2. 문제 2 — 필드를 직접 쓰면, 필드 이름을 바꾸는 순간 사용하는 쪽이 전부 깨진다

요구사항이 바뀌어서 `Monster`의 `name` 필드를 `kinds`로 바꿔야 하는 상황을 가정했다.

```java
public class Monster {
    // String name;  // 이름 (삭제됨)

    // 요구사항 변경으로 인해 기존 name -> kinds 변수명으로 변경됨.
    String kinds;
    int hp;

    public void setHP(int hp) { /* 문제 1과 동일 */ }
}
```

문제는 `Application` 쪽이다. 문제 1의 코드처럼 `monster1.name = "메로나";`같이 필드에 **직접** 접근하던 코드가 있었다면, `name`이 `kinds`로 바뀌는 순간 그 필드를 직접 쓰던 모든 곳에서 동시에 컴파일 에러가 난다. 실제로 이번 문제 2의 실습 파일에서는 그 구버전 `Application` 코드 전체가 주석 처리되어 있었는데, 이게 바로 "필드명이 바뀌어서 더 이상 컴파일되지 않는 코드"를 보여주는 예시였다. 필드에 직접 접근하는 코드가 많을수록, 필드 하나 이름을 바꾸는 단순한 작업이 여러 곳의 동시다발적인 에러로 번진다.

## 3. 문제 3 — 메서드로 감싸도, 필드가 여전히 public이면 소용없다

문제 1·2를 의식해서 `setName()`, `setHP()`, `getInfo()` 메서드를 추가했다. 하지만 필드 자체는 아직 `private`로 막지 않았다.

```java
public class Monster {
    String name;
    int hp;

    public void setHP(int hp) {
        if (hp > 0) {
            System.out.println("정상 값입니다. 몬스터의 체력을 " + hp + "로 설정합니다.");
            this.hp = hp;
        } else {
            System.out.println("삐빅.. 오류 발생.. 잘못된 값이 탐지되어 hp를 0으로 강제합니다. ㅅㄱ");
        }
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getInfo() {
        return "몬스터의 이름은 " + this.name + "이고" + "체력은 " + this.hp + "입니다.";
    }
}
```

```java
Monster monster3 = new Monster();
monster3.setName("헐크");
monster3.setHP(-300);
monster3.getInfo();

// 문제 1, 문제 2에서 발생하는 "변수 직접 접근" 문제는 해결했다.
// Application은 더 이상 Monster의 필드를 직접 건드리지 않기 때문에
// 필드명을 바꿔도 컴파일 에러 범위에서 벗어난다.
// 다만 메서드로 접근하는 길을 만들어 놨을 뿐, 필드 자체는 여전히 열려 있다.
monster3.hp = -5500;
System.out.println(monster3.getInfo());
```

```text
삐빅.. 오류 발생.. 잘못된 값이 탐지되어 hp를 0으로 강제합니다. ㅅㄱ
몬스터의 이름은 헐크이고체력은 -5500입니다.
```

`monster1.getInfo()`, `monster2.getInfo()`처럼 반환값을 그냥 호출만 하고 `System.out.println()`으로 감싸지 않으면 그 반환값은 콘솔에 출력되지 않고 버려진다. 그래서 실제로 눈에 보이는 출력은 `monster3.setHP(-300)`의 오류 메시지와, 맨 마지막에 `println`으로 감싼 `monster3.getInfo()` 결과뿐이다.

더 중요한 건 마지막 줄이다. `setHP()`로 음수를 막아뒀는데도 `monster3.hp = -5500;`처럼 필드에 **직접** 접근해서 값을 넣어버리면 검증을 그대로 건너뛴다. `getInfo()`가 찍은 체력은 `0`이 아니라 `-5500`이다. 메서드를 아무리 잘 만들어도 필드가 `public`으로 열려 있는 한 그 메서드를 거치지 않고 돌아가는 길이 항상 남아있다는 걸 코드로 확인했다.

### 주의할 점 — `getInfo()`의 띄어쓰기

```java
return "몬스터의 이름은 " + this.name + "이고" + "체력은 " + this.hp + "입니다.";
```

`"이고"`와 `"체력은 "` 사이에 공백이 없어서, 실제 출력은 "헐크이고체력은 -5500입니다."처럼 "이고"와 "체력은"이 붙어서 나온다. 문자열을 여러 조각으로 나눠 이어붙일 때는 조각과 조각 사이의 띄어쓰기를 조각 쪽에 넣어둬야 한다는 걸 다시 확인했다.

## 4. 해결 — `private`로 필드를 완전히 막기

```java
public class Monster {
    private String name;
    private int hp;

    public void setHP(int hp) {
        if (hp >= 0) {
            System.out.println("정상 값입니다. 몬스터의 체력을 " + hp + "로 설정합니다.");
            this.hp = hp;
        } else {
            System.out.println("삐빅.. 오류 발생.. 잘못된 값이 탐지되어 hp를 0으로 강제합니다. ㅅㄱ");
        }
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getInfo() {
        return "몬스터의 이름은 " + this.name + "이고" + "체력은 " + this.hp + "입니다.";
    }
}
```

```java
Monster monster3 = new Monster();
monster3.setName("헐크");
monster3.setHP(-300);
monster3.getInfo();
// monster3.hp = -5500;   <- 이제 이 줄은 컴파일조차 안 된다 (hp가 private)
System.out.println(monster3.getInfo());
```

```text
삐빅.. 오류 발생.. 잘못된 값이 탐지되어 hp를 0으로 강제합니다. ㅅㄱ
몬스터의 이름은 헐크이고체력은 0입니다.
```

문제 3과 비교해보면 차이가 분명하다. 문제 3에서는 `monster3.hp = -5500;`이 아무 제지 없이 실행돼서 최종 출력에 `-5500`이 찍혔는데, 여기서는 그 줄 자체가 `private` 필드에 대한 접근이라 **컴파일 에러**가 나기 때문에 아예 주석으로 막아둘 수밖에 없다. 그래서 `hp`는 끝까지 기본값 `0`에서 바뀌지 않고, `getInfo()`도 `0`을 출력한다. 필드를 `private`으로 막은 다음에야 "메서드를 거치지 않고 값을 바꾸는 길" 자체가 사라졌다.

참고로 이 버전에서는 조건도 `hp > 0`에서 `hp >= 0`으로 바뀌어서, 체력이 정확히 `0`인 것도 이제는 정상 값으로 받아들인다.

### 주의할 점 — `private`을 적용해도 1번 문제의 버그는 그대로 남아있다

`private`은 "필드에 직접 접근하는 길"을 막아줬을 뿐이다. `setHP()`의 `else` 분기가 실제로 `this.hp = 0;`을 하지 않는 문제 1의 버그는 이 버전에도 그대로 남아있다. **접근을 막는 것(캡슐화)**과 **메서드 내부 로직이 정확한 것**은 서로 다른 문제라서, 하나를 고쳤다고 다른 하나가 저절로 고쳐지지는 않는다는 걸 확인했다.

## 오늘 정리

- 필드를 외부에 그대로 열어두면(문제 1) 검증되지 않은 값이 들어가는 걸 막을 수 없다.
- 필드에 직접 접근하는 코드가 많으면(문제 2) 필드명 하나만 바꿔도 여러 곳이 동시에 깨진다.
- setter/getter 메서드를 추가해도(문제 3) 필드 자체가 `public`이면 그 메서드를 우회해서 값을 바꾸는 길이 남아있다.
- `private`으로 필드를 완전히 막아야(해결) 메서드를 거치지 않고는 값을 바꿀 방법이 없어진다 — 단, 메서드 내부 로직 자체의 버그는 별개로 여전히 고쳐야 한다.

## 더 학습하면 좋은 개념

- **단위 테스트(Unit Test)** — 오늘 `setHP()`의 "말과 다른 동작" 버그는 직접 코드를 읽어야만 찾을 수 있었는데, 이런 걸 자동으로 검증해주는 테스트 코드 작성법을 다음에 배워보고 싶다.
- **불변 객체 설계** — [캡슐화 글]({{ site.baseurl }}/java-encapsulation-immutable-objects.html)에서 본 것처럼, 아예 생성자에서만 값을 받고 setter 자체를 없애면 오늘 본 "검증 우회" 문제를 구조적으로 더 줄일 수 있을 것 같다.
- **예외(Exception) 처리** — 오늘은 잘못된 값이 들어왔을 때 메시지만 출력하고 넘어갔는데, `IllegalArgumentException` 같은 예외를 던져서 호출한 쪽이 문제를 확실히 알아차리게 하는 방법도 다음에 알아보고 싶다.

## 참고 자료
- [Oracle - Controlling Access to Members of a Class](https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html)
