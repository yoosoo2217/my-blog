---
title: "객체지향 프로그래밍이란 — 절차지향과 무엇이 다를까"
date: 2026-10-01 10:00:00
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-user-defined-types-and-constructors.html)에서 클래스로 사용자 정의 자료형을 만드는 법을 정리했고, 이번엔 한 발 물러나서 "클래스로 코드를 짠다"는 게 왜 **객체지향**이라는 사고방식인지, 그리고 지금까지 써온 방식(절차지향)과 뭐가 다른지를 정리한다.

## 1. 객체지향 프로그래밍(OOP)이란?

객체지향은 **현실 세계의 모든 사건(event)은 객체와 객체의 상호작용에 의해 일어난다**는 세계관을 프로그램에 이용해서 새로운 세계를 창조하는 방법론이다. 다만 현실 세계와 다른 점이 있는데, 무생물이나 개념 같은 존재들도 하나의 주체로 **본인의 상태를 스스로 제어하고 행동**한다는 것이다. 이 의인화 기법이 바로 캡슐화의 기본 아이디어다.

또한 모든 객체는 너무 많은 일을 하는 게 아니라 **적절한 책임**만 가져야 한다. 책임이 너무 많아지면 그 책임을 다른 객체에게 나누는데, 이걸 **단일 책임의 원칙**이라고 한다.

### 1-1. 실세계의 모델링과 객체지향

*"친구네 강아지 '우미'가 낯선 사람을 향해 짖는다"*는 현실 속 사건을 코드로 표현할 수 있어야 객체지향적인 사고방식에 익숙해질 수 있다. `Dog` 객체는 "이름"이라는 **상태**와 "짖는다"는 **행동**을 가진다.

```java
class Dog {
    // 상태(state) 또는 정보(data)
    String name;
    String species;
    int age;
    char gender;

    // 행동(behavior)
    void bark() {
        System.out.println(name + "가 짖습니다!");
    }
}
```

### 1-2. 객체지향 사고방식

객체지향은 "어떻게(how) 기능을 구현할까?"보다 **"어떤 객체가 어떤 책임을 가져야 할까?"**를 먼저 고민하는 방식이다. 역할과 책임에 따라 코드 구조를 짜면 유지보수와 확장에 유리하게 설계된다.

### 1-3. 객체지향 프로그래밍의 장단점

| 장점 | 단점 |
|---|---|
| 재사용성 ↑ (클래스 재활용) | 설계 시간이 더 걸릴 수 있음 |
| 유지보수 용이 | 잘못된 설계 시 복잡도 증가 |
| 대규모 협업에 유리 | 규모가 작은 프로그램에는 과할 수 있음 |

객체지향이 무조건 정답은 아니지만, 여러 개발자와 대규모 프로젝트를 협업하고 유지보수해야 하는 입장에서는 필수에 가까운 요소다.

## 2. 절차 지향 vs 객체 지향

| 항목 | 절차 지향 (Procedural) | 객체 지향 (Object) |
|---|---|---|
| 중심(초점) | 함수, 로직 중심 (순서) | 객체 중심 |
| 재사용성 | 낮음 | 높음 |
| 예시 | C, 초기 Python | Java, C++, Kotlin |

"사각형의 밑변과 높이가 주어졌을 때, 넓이를 구하는 코드"로 차이를 비교해보자.

절차 지향 코드는 넓이를 구하는 수식(순서)에 초점이 맞춰져 있다.

```java
int width = 10;               // 밑변 정의 및 값 할당
int height = 20;              // 높이 정의 및 값 할당
int area = width * height;    // 넓이 정의 및 값 연산
```

객체 지향 코드는 같은 문제를 상태와 행위로 분리한 클래스로 정의한다.

```java
class Rectangle {
    int width;     // 밑변
    int height;    // 높이

    // 자신의 밑변과 높이를 이용해 계산된 넓이를 반환하는 메서드
    int getArea() {
        return this.width * this.height;
    }
}
```

### 2-1. 절차지향 → 객체지향 리팩토링 연습

시나리오: 사용자는 채팅 앱에서 메시지를 입력하고 전송할 수 있고, 전송된 메시지는 채팅방에 저장되며, 메시지 전송 시간과 발신자 정보가 함께 기록되어야 한다.

**절차지향 방식** (데이터 + 로직 분리, 기능 중심)

```java
// 1. 데이터 준비
String sender = "alice";
String message = "안녕하세요!";
String roomId = "room1";
long timestamp = System.currentTimeMillis();

// 2. 메시지 전송 처리
System.out.println("[" + roomId + "] " + sender + " (" + timestamp + "): " + message);

// 3. 메시지 저장 → 실제 프로젝트라면 리스트나 DB에 저장했을 코드
```

모든 데이터가 흩어져 있고 전송/출력 로직이 하드코딩되어 있다. "메시지"라는 객체 개념이 없다 보니 테스트, 확장, 재사용이 어렵다. 메시지를 한 번 더 보내고 싶으면 이 코드를 통째로 반복해야 한다.

**객체지향 방식으로 리팩토링** (역할 분리, 책임 분산)

| 절차지향 | 객체지향 |
|---|---|
| 메시지 = 단순 문자열 | 메시지를 `ChatMessage` 객체로 모델링 |
| 전송 = `println()` 문 직접 호출 | `ChatRoom` 객체가 메시지를 수신하고 출력 |
| 로직 중심 | 객체 책임 중심 (객체 간 협력) |

```java
// ChatMessage.java — 메시지를 표현하는 객체
class ChatMessage {
    private String sender;
    private String message;
    private long timestamp;

    public ChatMessage(String sender, String message) {
        this.sender = sender;
        this.message = message;
        this.timestamp = System.currentTimeMillis();
    }

    public String format() {
        return sender + " (" + timestamp + "): " + message;
    }
}
```

```java
// ChatRoom.java — 채팅방 객체
class ChatRoom {
    private String roomId;
    private List<ChatMessage> messages = new ArrayList<>();

    public ChatRoom(String roomId) {
        this.roomId = roomId;
    }

    public void receiveMessage(ChatMessage message) {
        messages.add(message); // 저장
        System.out.println("[" + roomId + "] " + message.format()); // 출력
    }
}
```

```java
// Application.java
ChatRoom room1 = new ChatRoom("room1");
ChatMessage msg = new ChatMessage("alice", "안녕하세요!");

room1.receiveMessage(msg);
```

### 2-2. 그렇다면 언제 객체지향이 더 유리한가?

- 프로젝트 규모가 점점 커질 때
- 유지보수, 기능 확장, 코드 재사용이 필요할 때
- 팀 단위 개발에서 모듈화된 책임 분담이 필요할 때

## 오늘 정리

- 객체지향은 "객체와 객체의 상호작용으로 사건이 일어난다"는 세계관을 코드로 옮기는 방법론이고, 각 객체는 적절한 책임(단일 책임의 원칙)만 가져야 한다는 걸 정리했다.
- 절차지향은 "함수와 로직의 순서"에, 객체지향은 "어떤 객체가 어떤 책임을 지는지"에 초점을 둔다는 차이를 사각형 넓이 예시로 확인했다.
- 채팅 앱 시나리오를 절차지향에서 객체지향으로 직접 리팩토링해보면서, 데이터와 로직을 분리하는 것과 객체에 책임을 부여하는 것의 차이를 체감했다.

## 더 학습하면 좋은 개념

- **단일 책임의 원칙(SRP)** — 오늘 OOP 정의에서 짧게 언급됐는데, SOLID 원칙 중 하나로 더 깊이 있게 다뤄지는 개념이라 따로 알아보고 싶다.
- **캡슐화** — "의인화 기법 = 캡슐화"라는 언급이 있었는데, 아직 캡슐화 자체를 제대로 배우지 않아서 다음 단계로 자연스럽게 이어진다.
- **`private` 접근제어자** — 오늘 리팩토링한 `ChatMessage`/`ChatRoom`의 필드가 전부 `private`으로 선언되어 있었는데, 왜 필드를 직접 공개하지 않는지는 캡슐화를 배우면서 같이 이해하고 싶다.

## 참고 자료
- [Oracle - Object-Oriented Programming Concepts](https://docs.oracle.com/javase/tutorial/java/concepts/)
