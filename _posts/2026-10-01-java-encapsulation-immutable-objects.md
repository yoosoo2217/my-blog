---
title: "캡슐화와 불변 객체, Java Bean"
date: 2026-10-01 12:30:00
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-polymorphism.html)에서 다형성을 정리했고, 이번엔 객체지향 3대 특징의 나머지 하나인 **캡슐화**, 그리고 캡슐화를 실제로 적용한 **불변 객체**와 **Java Bean** 규약을 정리한다.

## 1. 캡슐화(Encapsulation)란

캡슐화는 유지보수성 증가(낮은 결합도)를 위해 **필드의 직접 접근을 제한**하고, `public` 메서드를 이용해서 **간접적으로 접근**해 사용할 수 있도록 클래스를 작성하는 기법이다. 클래스를 작성할 때 특별한 목적이 아닌 이상 캡슐화가 기본 원칙으로 쓰인다.

### 1-1. 필드에 직접 접근 가능할 때 발생할 수 있는 문제점

**1. 필드에 올바르지 않은 값이 들어가도 통제가 불가능하다.**

```java
public class Monster {
    String name;  // 몬스터 이름
    int hp;       // 몬스터 체력
}
```

```java
Monster monster2 = new Monster();
monster2.name = "뿌꾸";
monster2.hp = -200; // 몬스터2의 체력을 음수로 지정하였다.

System.out.println("monster2 name : " + monster2.name);
System.out.println("monster2 hp : " + monster2.hp);
```

```text
monster2 name : 뿌꾸
monster2 hp : -200
```

체력이 음수가 되는 게 말이 안 되는데도, 필드가 외부에 그대로 열려 있으면 이런 값이 들어가는 걸 막을 방법이 없다.

**2. 필드의 이름이나 자료형을 변경할 때 사용하는 쪽에도 영향을 미친다.** `Monster` 클래스의 `name` 필드명을 바꾸면, `monster1.name`처럼 그 필드를 직접 쓰던 모든 코드가 전부 컴파일 에러가 난다.

### 1-2. 캡슐화의 필요성

1. **내부 구현을 숨기고, 인터페이스만 노출** — 속성과 행동을 하나로 묶고 외부에는 필요한 메서드만 노출해서, 내부 구현이 바뀌어도 사용자는 영향을 받지 않는다. 버튼을 누르면 동작은 일어나지만 내부 회로는 몰라도 되는 것과 같다.
2. **잘못된 데이터 변경 방지(데이터 보호 및 무결성 유지)** — 필드에 직접 접근하지 못하게 하고, getter/setter 또는 검증 로직을 통해서만 값을 수정하게 한다.
3. **유지보수성과 확장성 향상** — 내부 구조를 바꾸더라도 외부와 약속된 메서드만 유지하면 된다. 모듈화된 설계로 유지보수가 쉬워지고 변경 시 오류 발생 가능성이 줄어든다.
4. **객체 간의 결합도 감소(느슨한 결합)** — 객체가 다른 객체의 내부 구조를 몰라도 협력할 수 있게 해준다. 상호작용은 오직 공개된 메서드를 통해서만 이루어지므로, 재사용성과 테스트 용이성이 높아진다.

## 2. 접근 제어자(Access Modifier)의 종류와 활용

Java 공식 튜토리얼이나 Oracle 문서에서는 '접근 제어자' 또는 '접근 제한자'라는 용어를 쓴다.

| 구분 | 같은 클래스 | 같은 패키지 | 자식 클래스 | 전체 |
|---|---|---|---|---|
| `public` | O | O | O | O |
| `protected` | O | O | O |  |
| (default) | O | O |  |  |
| `private` | O |  |  |  |

[추상화 글]({{ site.baseurl }}/java-abstraction-interfaces.html)에서 본 `MemberDTO`가 바로 이 표를 실제로 적용한 예시다. 모든 필드를 `private`으로 캡슐화해서 직접 접근을 막고, 필드마다 `public` getter/setter 메서드를 제공해서 외부에서는 그 메서드로만 값을 읽고 쓸 수 있게 했다.

## 3. 불변 객체 설계하기

### 3-1. 불변 객체(Immutable Object)란

**생성 이후 상태가 절대 변하지 않는 객체**다. 필드 값이 초기화 이후 절대 변경되지 않는다. 대표 예로 `String`, `Integer`, `LocalDate` 등이 있다.

### 3-2. 왜 불변 객체가 중요할까

- **스레드 안전성(Thread-safe)** 확보 → 동기화가 필요 없다.
- 객체 상태가 예측 가능 → 버그 발생 가능성 감소.
- 설계 단순화 → 상태 관리 부담 감소.
- 값 객체(Value Object)에 적합 (좌표, 통화, 이름 등).

### 3-3. 불변 객체 설계 원칙

| 규칙 | 설명 |
|---|---|
| `final` 클래스 선언 | 상속을 막아 설계를 고정 |
| 모든 필드를 `private final`로 선언 | 값 변경 방지 |
| 생성자를 통해서만 초기화 | 외부에서 직접 설정 불가 |
| setter 메서드 제거 | 값을 바꿀 수 있는 메서드 제공 금지 |
| 가변 객체를 포함할 경우 복사 사용 | 불변성 보존 |

```java
public final class Person {
    private final String name;
    private final int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
}
```

상태를 바꿀 수 있는 `setName()` 같은 setter 메서드는 존재하지 않는다. 객체 생성 후에는 절대 변경할 수 없다.

마지막 규칙("가변 객체를 포함할 경우 복사 사용")을 예시로 보면, 아래 `Team` 클래스는 필드로 `List<String>` 타입의 `members`를 가지고 있다. `members`가 다른 컬렉션 객체를 참조하지 못하게 막을 수는 있지만, 컬렉션 자체의 내부 요소는 `add()`, `set()`, `remove()` 등으로 얼마든지 조작할 수 있는 가변 객체다. 그래서 가변 필드를 포함할 때는 깊은 복사를 통해 복사본을 제공하고 원본은 건드리지 않도록 해야 한다.

```java
public final class Team {
    private final List<String> members;

    public Team(List<String> members) {
        this.members = new ArrayList<>(members); // 방어적 복사
    }

    public List<String> getMembers() {
        return new ArrayList<>(members); // 복사본 반환
    }
}
```

## 4. Java Bean 규약

### 4-1. Java Bean이란

특정 규칙을 따르는 Java 클래스로, 주로 **데이터를 담고 주고받는 용도(VO, DTO)**로 쓰인다. 다음 규칙을 따른다.

1. **기본 생성자**가 있어야 한다 (`public ClassName()`).
2. **모든 필드는 `private`**으로 캡슐화한다.
3. **getter/setter 메서드**를 통해 접근한다 (`getX()`, `setX()` 형식).
4. (선택) **직렬화 가능**하게 `implements java.util.Serializable`을 구현한다.

### 4-2. Java Bean 예시

```java
public class UserDTO implements Serializable {

    /* 자바빈 작성 규칙
     * 1. 자바빈은 특정 패키지에 속해있어야 함 (default 패키지 사용 금지)
     * 2. 멤버변수의 접근제어자는 private로 선언해야 함.
     * 3. 기본생성자가 명시적으로 존재해야 한다. (매개변수 있는 생성자는 선택사항)
     * 4. 모든 멤버변수에 접근 가능한 설정자(setter)와 접근자(getter)가 public으로 작성되어 있어야 함.
     * 5. 직렬화(Serializable 구현)가 되어야 한다. (선택사항) */

    private String id;
    private String pwd;
    private String name;
    private java.util.Date enrollDate;

    // 기본 생성자는 명시적으로 작성한다.
    // (명시하지 않고 추후 매개변수 있는 생성자를 추가할 시 에러 발생 가능성이 있기 때문이다.)
    public UserDTO() {}

    // 매개변수 있는 생성자는 선택 사항이지만, 일반적으로 모든 필드를 초기화하는 생성자를 가장 많이 쓴다.
    public UserDTO(String id, String pwd, String name, java.util.Date enrollDate) {
        this.id = id;
        this.pwd = pwd;
        this.name = name;
        this.enrollDate = enrollDate;
    }

    public void setId(String id) { this.id = id; }
    public void setPwd(String pwd) { this.pwd = pwd; }
    public void setName(String name) { this.name = name; }
    public void setEnrollDate(java.util.Date enrollDate) { this.enrollDate = enrollDate; }

    public String getId() { return id; }
    public String getPwd() { return pwd; }
    public String getName() { return name; }
    public java.util.Date getEnrollDate() { return enrollDate; }

    // 접근자로 하나씩 필드값을 확인하기 번거로우니,
    // 모든 필드의 값을 하나의 문자열로 반환하는 메서드를 필드값 확인용으로 많이 쓴다.
    public String getInformation() {
        return "UserDTO [id=" + this.id + ", pwd=" + this.pwd + ", name=" + this.name + ", enrollDate=" + this.enrollDate + "]";
    }
}
```

### 4-3. 불변 객체와 Java Bean 비교

| 항목 | 불변 객체 | Java Bean |
|---|---|---|
| 필드 변경 가능성 | 없음 | 있음 |
| setter | 없음 | 필수 |
| 생성자 | 모든 값 초기화 | 기본 생성자 필요 |
| 용도 | 안정성, 스레드 안전성 | 도구/프레임워크와의 연동 |

## 오늘 정리

- 캡슐화는 필드를 직접 열어두지 않고 `public` 메서드로만 접근하게 해서, 잘못된 값 통제와 필드 변경의 파급 효과 두 가지 문제를 해결한다는 걸 `Monster` 예시로 확인했다.
- 접근 제어자(`public`/`protected`/default/`private`)는 "같은 클래스 / 같은 패키지 / 자식 클래스 / 전체" 범위를 단계적으로 좁혀간다.
- 불변 객체는 `final` 클래스 + `private final` 필드 + 생성자 초기화 + setter 제거로 설계하고, 가변 필드(컬렉션 등)를 포함할 때는 방어적 복사가 필요하다는 걸 `Team` 예시로 봤다.
- Java Bean은 불변 객체와 반대로 setter를 필수로 요구하는 규약이고, 기본 생성자·private 필드·getter/setter라는 형식이 정해져 있다는 걸 정리했다.

## 더 학습하면 좋은 개념

- **getter/setter 작성 규칙** — 어제 `MemberDTO`에서 간단히 다뤘지만, `boolean`은 `get`이 아니라 `is`로 시작한다는 관례처럼 세부 규칙을 더 찾아보고 싶다.
- **값 검증 로직을 넣은 setter** — 오늘 `Monster`의 `hp`가 음수가 되는 문제를 봤는데, 실제로 `setHp()` 안에 "0 미만이면 막는" 검증 코드를 넣어보면 캡슐화의 효과를 더 체감할 수 있을 것 같다.
- **`Serializable` 인터페이스** — Java Bean 규약에 "선택사항"으로 등장했는데, 정확히 무엇을 직렬화하고 왜 필요한지는 아직 몰라서 따로 알아보고 싶다.

## 참고 자료
- [Oracle - Controlling Access to Members of a Class](https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html)
- [Oracle - Immutable Objects](https://docs.oracle.com/javase/tutorial/essential/concurrency/immutable.html)
