---
title: "String과 배열(Array) 기초"
date: 2026-10-01 09:00:00
tags:
  - Java
---

[이전 글]({{ site.baseurl }}/java-method-parameters-and-instances.html)에서 메서드 호출을 정리했고, 이번엔 지금까지 써온 `int`, `double` 같은 기본 자료형 말고 **String**과 **배열**을 정리한다.

## 1. String — 문자열도 객체다

자료형은 크게 세 가지로 나뉜다.

1. 기본 자료형 (`int`, `char`, `double` 등)
2. 참조 자료형
3. 사용자 정의 자료형

`String`은 참조 자료형이고, 클래스이기 때문에 내부에 호출할 수 있는 메서드를 가지고 있다.

```java
String str1 = "apple";
System.out.println("str1 의 길이 : " + str1.length());
```

자주 쓰는 메서드는 두 가지다.

- `length()` — 문자열의 길이를 `int`로 반환한다.
- `charAt(index)` — 특정 위치(index)의 문자 하나를 반환한다.

index는 0부터 시작하는 숫자 체계를 쓴다. `"abc"`라면 `a`는 0, `b`는 1, `c`는 2다. 그래서 문자열을 한 글자씩 출력하려면 `length()`로 범위를 구하고 `charAt(i)`로 한 글자씩 꺼내면 된다.

```java
for (int i = 0; i < str1.length(); i++) {
    System.out.println(str1.charAt(i));
}
```

```text
a
p
p
l
e
```

공백을 다루는 `trim()`도 써봤다.

```java
String trimStr = "   java   ";
System.out.println("공백 제거 전 : #" + trimStr + "#");
System.out.println("공백 제거 후 : #" + trimStr.trim() + "#");
```

```text
공백 제거 전 : #   java   #
공백 제거 후 : #java#
```

`trim()`은 문자열 양 끝의 공백만 제거하고, 문자열 중간에 있는 공백은 그대로 남긴다. 수업에서는 "메서드를 다 외운 다음 쓰는 게 아니라, 써보고 출력해보고 나서야 이해가 된다"는 점을 강조했는데, 이번 장을 직접 써보면서 그 말이 와닿았다.

## 2. 문자열을 만드는 두 가지 방법과 `==` vs `equals()`

문자열은 두 가지 방식으로 만들 수 있다.

```java
// 1. 리터럴 방식
String str1 = "java";
// 2. 객체 생성 방식 (new : 새로운 공간을 만든다)
String str2 = new String("java");
String str3 = "java";

System.out.println("동등 비교: " + (str1 == str2)); // false
System.out.println("동등 비교: " + (str1 == str3)); // true
System.out.println("equals() 활용 비교 : " + str1.equals(str2)); // true
```

실습 중에 `str1 == str2`가 왜 `false`인지 바로 이해가 안 갔는데, 이걸 정리해보면 다음과 같다.

- `String str1 = "java";`처럼 **리터럴로 문자열을 선언**하면, JVM은 똑같은 내용의 문자열을 담아두는 별도의 저장 공간(문자열 상수 풀)을 두고, 이미 `"java"`라는 리터럴이 그 풀에 있다면 **새로 만들지 않고 같은 주소를 가리키게** 한다. 그래서 `str1`과 `str3`은 리터럴로 선언한 같은 문자열이라 **같은 주소**를 가리키고, `str1 == str3`은 `true`가 된다.
- 반면 `String str2 = new String("java");`처럼 `new`를 쓰면, 내용이 같더라도 **항상 Heap 영역에 새로운 공간을 만든다.** 그래서 `str2`는 `str1`과 내용은 같아도 **주소가 다른** 별개의 공간이 되고, `str1 == str2`는 `false`가 된다.
- `==`는 두 변수가 **같은 주소를 가리키는지**를 비교하는 연산자이지, 문자열의 **내용**을 비교하는 연산자가 아니다. 문자열 생성 방식과 상관없이 **내용 자체**를 비교하고 싶다면 `equals()` 메서드를 써야 한다. 그래서 `str1.equals(str2)`는 내용이 같으므로 `true`가 된다.

## 3. 배열 — 동일한 자료형의 묶음

변수는 1개의 값만 담을 수 있는 공간이다. 그래서 여러 개의 값을 저장해야 한다면 변수를 여러 개 만들어야 하는데, 이 한계를 해결해주는 게 배열이다.

```text
자료형[] 변수명;        // 선언
new 자료형[크기];       // 할당
```

```java
int[] iarr = new int[5];

System.out.println("iarr.length = " + iarr.length); // 여기서 length는 변수! 메서드가 아니다.
System.out.println(iarr[0]);
```

```text
iarr.length = 5
0
```

`length`는 `String`의 `length()`와 헷갈리기 쉬운데, 배열의 `length`는 **괄호 없는 변수**다. 또 하나, 아직 값을 넣은 적이 없는데도 `iarr[0]`을 출력하면 `0`이 나온다. 이건 Heap 메모리 영역의 특징 때문인데, Heap 공간은 값이 비어있는 상태로 존재할 수 없어서, 값을 넣지 않아도 JVM이 자료형별 기본값으로 세팅해둔다.

- 정수: `0`
- 실수: `0.0`
- 논리: `false`
- 참조: `null`

배열은 리터럴로 바로 값을 채워 만들 수도 있다.

```java
int[] iarr2 = new int[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
```

배열의 장점은 두 가지다.

1. index 번호 체계를 가지며, 1씩 증가한다.
2. 반복문을 사용할 때 유용하다.

### 주의할 점 — 실습 코드의 세미콜론 버그

반복문으로 배열의 각 칸을 출력해보려던 코드에 실제로 버그가 있었다.

```java
int i;
for (i = 0; i < iarr.length; i++) ; // 세미콜론으로 반복문이 여기서 끝나버림
    System.out.println("iarr[" + i + "]공간에 있는 값 ");
```

`for(...)` 뒤에 세미콜론(`;`)을 붙이면, 반복문의 실행 코드가 "아무것도 하지 않는 빈 문장"이 되어버리고 반복문은 그 자리에서 끝난다. 바로 아래 줄의 `System.out.println(...)`은 반복문에 포함된 게 아니라 **반복이 끝난 뒤 딱 한 번만** 실행되는 별개의 문장이 되고, 그 시점엔 `i`가 이미 `iarr.length`(5)까지 증가해 있는 상태다. 그래서 의도("각 공간의 값을 하나씩 출력")와 다르게 `"iarr[5]공간에 있는 값"` 한 줄만 출력된다. `for`문 뒤에 실수로 세미콜론을 붙이는 건 흔한 실수라, 반복문을 작성한 뒤에는 세미콜론이 붙어있지 않은지 확인하는 습관이 필요하다는 걸 배웠다.

## 4. Scanner로 배열에 값 입력받아 합계·평균 구하기

5명의 Java 점수를 입력받아 합계와 평균을 구하는 프로그램도 만들었다.

```java
Scanner sc = new Scanner(System.in);
int[] scores = new int[5];

for (int i = 0; i < scores.length; i++) {
    System.out.print((i + 1) + "번 째 학생의 java 점수를 입력해주세요 : ");
    scores[i] = sc.nextInt();
}

double sum = 0;
double avg = 0.0;
for (int i = 0; i < scores.length; i++) {
    sum += scores[1];
}
avg = sum / scores.length;

System.out.println("avg = " + avg);
System.out.println("sum = " + sum);
```

### 주의할 점 — `scores[1]`은 `scores[i]`의 오타다

합계를 구하는 반복문 안에서 `sum += scores[1];`로 쓰여 있는데, 반복 변수 `i`를 쓰지 않고 **항상 인덱스 1번 값만** 더하고 있다. 이 상태로는 5명의 점수 합계가 아니라 2번째 학생 점수를 5번 더한 값이 `sum`에 담기게 된다. 배열 전체를 순회하며 더하려면 `scores[i]`로 고쳐야 한다. 반복문 안에서 인덱스 대신 고정된 숫자를 실수로 넣는 것도 배열을 다룰 때 흔히 하는 실수라는 걸 이 코드로 확인했다.

## 오늘 정리

- `String`은 참조 자료형(클래스)이고, `length()`·`charAt(index)`·`trim()` 같은 메서드를 가지고 있다.
- 문자열을 리터럴로 선언하면 같은 내용의 문자열은 같은 주소(문자열 상수 풀)를 공유하지만, `new String(...)`은 항상 Heap에 새 공간을 만든다. 그래서 `==`는 다르게 나올 수 있고, 내용을 비교하려면 `equals()`를 써야 한다.
- 배열은 동일한 자료형의 값을 묶어서 저장하는 자료구조이고, `length`는 메서드가 아니라 변수다.
- `for`문 뒤 세미콜론, 반복문 안에서 고정된 인덱스를 쓰는 실수처럼, 반복문과 배열을 함께 쓸 때 생기기 쉬운 버그 두 가지를 직접 코드로 확인했다.

## 더 학습하면 좋은 개념

- **StringBuilder** — `String`은 한 번 만들어지면 내용을 바꿀 수 없는(불변) 객체라서, 문자열을 반복적으로 이어 붙이는 작업에는 `StringBuilder`가 더 효율적이라고 들었다. `String`의 불변성과 함께 다음에 짚어보고 싶다.
- **문자열 상수 풀(String Constant Pool)** — 오늘 `str1 == str3`이 `true`인 이유를 설명하면서 이 개념을 언급했는데, 정확히 Heap의 어느 영역에 어떻게 저장되는지는 더 깊이 알아볼 만하다.
- **ArrayList와 다차원 배열** — 오늘 배운 배열은 크기가 고정되어 있는데, 크기가 가변적인 `ArrayList`나 배열 안에 배열이 들어가는 다차원 배열은 자연스러운 다음 단계다.

## 참고 자료
- [Oracle - Class String](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html)
- [Oracle - Arrays](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/arrays.html)
