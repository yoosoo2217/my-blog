---
title: "포카칩 계산기와 PR 충돌"
date: 2026-09-30
tags:
  - Java
  - Git
  - GitHub
---

세 명이 한 파일의 같은 자리에 각자 코드를 한 줄씩 추가하면 어떻게 될까? 카페 계산기 팀 프로젝트(포카칩)에서 `MultiplyCalculator`를 맡아 만들면서, 첫 번째 PR은 그냥 들어갔는데 두 번째부터는 `Application.java`에서 충돌이 난 이유를 확인했다. 브랜치와 PR의 기본 흐름은 [commit, push, PR 글]({{ site.baseurl }}/commit-push-pr.html)에서 정리했다.

> **TL;DR**
> - 팀이 메뉴 하나씩 맡아 클래스를 나눠 만들었다. 나는 "개수별 칼로리 계산"(`MultiplyCalculator`)을 맡았다.
> - 클래스 파일은 사람마다 따로라서 충돌이 없었지만, 메뉴 줄과 `case`를 모두 `Application.java`의 같은 자리에 넣어서 두 번째 PR부터 충돌이 났다.
> - 한 번 올린 PR에 새 커밋을 push하면 기존 PR에 자동으로 반영된다.

## 1. 프로젝트와 역할 나누기

팀 컨셉은 카페 음료와 간식을 즐기는 사람을 위한 계산기다. 하루 칼로리를 관리하고, 개수로 환산하고, 주문 금액을 나눈다. 메뉴 하나가 기능 하나이고, 기능마다 담당과 클래스가 정해져 있다.

| 메뉴 | 기능 | 담당 | 클래스 | 메소드 | Issue | PR |
|---|---|---|---|---|---|---|
| 1 | 오늘 먹은 칼로리 합계 | 팀장 | `PlusCalculator` | `sum` | #3 | #7 |
| 2 | 남은 칼로리 | 팀장 | `MinusCalculator` | `remain`, `judge` | #4 | #8 |
| 3 | 개수 별 칼로리 계산 | 나 | `MultiplyCalculator` | `multiply`, `CalorieTable` | #2 | #5 |
| 4 | 더치페이 | 팀원 | `DivideCalculator` | `individual_cost` | #4 | #6 |

README의 표에서 2번과 4번 기능의 Issue 번호가 모두 `#4`로 적혀 있다. 같은 이슈를 가리키는 것인지 오타인지는 이 기록만으로 알 수 없어서 `확인 필요`다.

## 2. 내가 맡은 기능 설계: 곱하기와 표 출력을 나눈다

`MultiplyCalculator`는 1회 분량의 칼로리와 최대 개수를 입력받아, 1개부터 n개까지의 칼로리 표를 출력한다. 처음 설계한 화면은 "1인분" 기준이었다.

```text
메뉴 선택 : 3
1인분 칼로리 : 550
몇 인분까지 : 4

1인분 : 550 kcal
2인분 : 1100 kcal
3인분 : 1650 kcal
4인분 : 2200 kcal
```

팀 역할 메모에 "1인분 -> 개수"라는 고려사항이 있어서, 최종 코드에서는 "인분"이 "개"로 바뀌었다. 기능은 메소드 두 개로 나눴다.

| 메소드 | 매개변수 | 하는 일 |
|---|---|---|
| 곱하기 `multiply` | `int` 1개 칼로리, `int` 개수 | `calories * Counts`를 반환한다 |
| 표 출력 `CalorieTable` | `int` 1개 칼로리, `int` 최대 개수 | 1개부터 최대 개수까지 반복하며 한 줄씩 출력한다. 반환값은 없다 |

`case`에서 할 일은 값 두 개를 입력받아 객체를 만들고 표 출력 메소드에 넘기는 것까지다. 출력은 메소드가 하므로 `case`에서는 따로 출력하지 않는다. 계산(곱하기)과 출력(표)을 나누면 곱하기 메소드를 다른 곳에서도 쓸 수 있다. 메소드를 나누고 값을 넘기는 방식은 [메소드 글]({{ site.baseurl }}/java-methods.html)에서 정리한 내용과 같다.

## 3. 완성된 코드

`Application.java`는 메뉴를 보여주고 입력에 따라 `case`를 실행하는 메인 클래스다. `do-while`로 `0`(종료)을 입력할 때까지 반복한다.

```java
package com.pokachip.cafe;   // 팀 번호에 맞게 변경

import java.util.Scanner;

public class Application {

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);
        int menu;

        do {
            System.out.println("===== [포카칩] 식단 계산기 =====");
            // (1) 각자 자기 메뉴 한 줄 추가
            System.out.println("0. 종료");
            System.out.println("3. 개수 별 칼로리 계산");
            System.out.print("메뉴 선택 : ");
            menu = sc.nextInt();

            switch (menu) {
                // (2) 각자 자기 case 블록 추가
                case 3: {
                    System.out.print("1개 칼로리 : ");
                    int calories = sc.nextInt();

                    System.out.print("몇 개까지 : ");
                    int maxCounts = sc.nextInt();

                    MultiplyCalculator calculator = new MultiplyCalculator();
                    calculator.CalorieTable(calories, maxCounts);
                    break;
                }

                case 0:
                    System.out.println("계산기를 종료합니다.");
                    break;

                default:
                    System.out.println("없는 메뉴입니다. 다시 선택하세요.");
            }
            System.out.println();

        } while (menu != 0);

    }
}
```

`MultiplyCalculator`는 곱하기와 표 출력을 담은 클래스다.

```java
package com.pokachip.cafe;

public class MultiplyCalculator {

    public int multiply(int calories, int Counts) {
        return calories * Counts;
    }

    public void CalorieTable(int calories, int maxCounts) {
        for (int i = 1; i <= maxCounts; i++) {
            System.out.println(i + "개 : " + multiply(calories, i) + " kcal");
        }
    }
}
```

메뉴에서 `3`을 고르고 `550`, `4`를 입력하면 다음과 같이 출력된다. 코드를 따라가서 적은 출력이고, 실행해서 확인하지는 않았다.

```text
1개 : 550 kcal
2개 : 1100 kcal
3개 : 1650 kcal
4개 : 2200 kcal
```

반복문 `for (int i = 1; i <= maxCounts; i++)`가 `i`를 1부터 `maxCounts`까지 늘리고, 매번 `multiply(calories, i)`를 호출해 `calories * i`를 출력한다. 반복문의 동작은 [반복문 글]({{ site.baseurl }}/java-loops.html)에서 다뤘다.

## 4. 왜 두 번째 PR부터 충돌이 났을까

팀 README에 정리한 경험은 세 가지다.

| 상황 | 결과 | 이유 |
|---|---|---|
| 첫 번째 PR | 그냥 병합된다 | 기준이 되는 `Application.java`가 아직 바뀌지 않았다 |
| 두 번째 PR부터 | `Application.java`에서 충돌이 난다 | 모두 같은 자리에 메뉴 줄과 `case`를 넣었다 |
| 각자 만든 클래스 파일 | 충돌이 없다 | 파일이 사람마다 하나씩이라 겹치지 않는다 |

위 코드의 주석 `(1) 각자 자기 메뉴 한 줄 추가`와 `(2) 각자 자기 case 블록 추가`가 모두에게 같은 두 위치를 가리킨다. 한 사람이 그 자리에 코드를 넣어 병합하면, 같은 자리를 고친 다음 사람의 변경이 겹친다. 같은 부분을 서로 다르게 고쳤을 때 Git은 어느 쪽이 맞는지 판단하지 못하고 사람에게 맡긴다. 아래는 충돌이 나면 파일에 표시되는 모양을 보이기 위한 예시이고, 실제 우리 팀의 충돌 내용은 아니다.

```java
<<<<<<< HEAD
            System.out.println("1. 오늘 먹은 칼로리 합계");
=======
            System.out.println("3. 개수 별 칼로리 계산");
>>>>>>> feature/multiply
```

이 예시는 두 사람이 같은 자리에 서로 다른 메뉴 줄을 넣은 경우다. 이럴 때는 `<<<<<<<`, `=======`, `>>>>>>>` 줄을 지우고 두 줄을 모두 남기도록 직접 고친 뒤 커밋한다. 팀 README의 "충돌 해결 기록" 항목은 아직 비어 있어서, 우리가 실제로 어떻게 해결했는지는 이 글에 적지 못했다.

PR에 대해서는 한 가지를 더 확인했다. PR을 올린 뒤에도 같은 브랜치에 새 커밋을 push하면 기존 PR에 자동으로 반영된다. 수정 사항이 생기면 PR을 닫고 새로 만들 필요가 없다.

## 5. 헷갈리기 쉬운 점과 고칠 곳

코드를 다시 읽으면서 찾은 부분이다.

| 항목 | 현재 | 고칠 점 |
|---|---|---|
| 메소드 이름 | `CalorieTable` | 자바 관례는 소문자로 시작하는 `calorieTable`이다 |
| 매개변수 이름 | `Counts` | 같은 이유로 `counts`가 관례다 |
| 파일 이름 | 노트에는 `MultiplyCalculation.java`로 적힘 | 공개(`public`) 클래스 이름과 파일 이름이 같아야 하므로 `MultiplyCalculator.java`여야 한다. 노트의 오타로 보이지만 `확인 필요`다 |
| 잘못된 입력 | `sc.nextInt()`에 문자를 입력하면 예외가 난다 | 입력 검증이 아직 없다 |
| 최대 개수 | `0` 이하를 넣으면 아무것도 출력되지 않는다 | 안내 메시지가 없다 |

이름 규칙은 공식 튜토리얼이 메소드 이름의 첫 글자를 소문자로 쓰는 것으로 설명한다. 잘못된 입력 처리는 아직 구현하지 않았고, 다음에 예외 처리를 배운 뒤 고칠 곳이다.

## 6. 협업에서 배운 점

- 혼자 작업할 때와 달리, 팀 프로젝트에서는 다른 사람의 작업과 내 작업이 같은 곳에서 겹칠 수 있다. 변경 사항을 자주 확인하고, 작업 내용을 팀원과 맞추는 것이 중요하다.
- 클래스를 사람별로 나누면 충돌이 없지만, 모든 기능이 모이는 `Application.java`는 충돌의 지점이 된다. 모두가 같은 위치에 코드를 넣도록 안내한 구조가 충돌을 거의 확정하는 구조였다.

## 7. 정리

- 기능을 사람별 클래스로 나누고(`MultiplyCalculator` 등), 메뉴와 `case`는 `Application.java`에 모았다. 곱하기와 표 출력은 메소드 두 개로 나눴다.
- 두 번째 PR부터 `Application.java`에서 충돌이 난 이유는 모두가 같은 자리에 코드를 넣었기 때문이다. 클래스 파일은 사람마다 따로라서 충돌이 없었다.
- PR을 올린 뒤 새 커밋을 push하면 기존 PR에 자동으로 반영된다.

다음에 볼 것은 아래 "더 학습하면 좋은 개념"에 적었다.

## 더 학습하면 좋은 개념

- **Git 병합 충돌 해결** — 충돌 표시(`<<<<<<<`, `=======`, `>>>>>>>`)를 읽고 직접 고치는 과정을 정리하면, "충돌 해결 기록"을 빈칸으로 두지 않고 채울 수 있다.
- **브랜치 전략** — 여러 사람이 같은 파일을 고칠 때 충돌을 줄이는 방법이다. [브랜치 전략 글]({{ site.baseurl }}/git-branch-strategy.html)에서 정리한 내용을 이번 경험에 대입해 볼 수 있다.
- **코드 충돌을 줄이는 구조** — 메뉴 줄과 `case`를 한 파일에 모으는 대신, 기능마다 메뉴를 스스로 등록하게 만드는 방식을 찾아보고 싶다. 인터페이스를 쓰면 가능할 것으로 생각하지만, 아직 확인하지 않았다.
- **자바 네이밍 관례** — 클래스, 메소드, 변수의 이름 규칙이다. 팀 프로젝트에서 이름이 섞이면 읽기 어려워지기 때문에 팀 단위로 맞춰 두는 것이 좋다.
- **예외 처리(`try-catch`)** — `Scanner.nextInt()`에 숫자가 아닌 입력이 들어오는 경우를 처리하려면 필요하다.

## 참고 자료
- [Git 공식 문서 - 브랜치와 병합의 기초](https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-%EB%B8%8C%EB%9E%9C%EC%B9%98%EC%99%80-Merge-%EC%9D%98-%EA%B8%B0%EC%B4%88)
- [GitHub Docs - 병합 충돌 해결](https://docs.github.com/ko/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line)
- [Oracle - Defining Methods (메소드 이름 규칙)](https://docs.oracle.com/javase/tutorial/java/javaOO/methods.html)
- [Java SE API - Scanner](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Scanner.html)
