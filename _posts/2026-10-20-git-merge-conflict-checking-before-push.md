---
title: "Git 병합 충돌 확인"
date: 2026-10-20
tags:
  - project
  - Git
---

PR을 올리기 직전에 "충돌 없음"을 확인했는데, 올리고 나니 충돌이 났다.  
3명이 한 프로젝트를 나눠 만들면서 `MainController.java` 한 파일에서 충돌을 두 번 겪었다. 두 번 모두 원인은 같았고, 두 번째에는 확인한 뒤에 다른 PR이 먼저 병합되는 일까지 겹쳤다. 충돌 화면에서 `Accept both changes`를 눌러도 되는 경우와 안 되는 경우를 가르는 기준, 그리고 병합 전에 충돌과 컴파일 여부를 미리 보는 방법을 정리했다.

> **TL;DR**
> - 한 파일의 **붙어 있는 줄**을 여러 명이 고치면 Git은 충돌로 본다. 서로 다른 기능이라도 마찬가지다.
> - `Accept both changes`는 두 쪽이 서로 다른 줄을 추가한 경우에만 맞다. 같은 위치의 줄을 서로 다르게 바꾼 경우에는 줄마다 골라야 한다.
> - 충돌 확인은 확인한 그 순간에만 유효하다. 푸시나 병합 직전에 `git merge-tree`로 다시 보고, "충돌 없음"과 "컴파일 됨"은 따로 확인해야 한다.

환경: Git 2.55.0 (Windows), GitHub의 PR 화면, Java 콘솔 프로젝트. `git merge-tree --write-tree`를 쓸 수 있는 최소 Git 버전은 `확인 필요`.

## 1. 왜 같은 파일에서 충돌이 날까?

프로젝트는 메뉴 분기를 `MainController` 한 파일에 모아 두고, 팀원이 자기 기능의 줄만 바꾸는 구조였다. 처음에는 이렇게 비어 있었다.

```java
case 1 -> System.out.println("[TODO:B] RestaurantView.list()");   // F-05
case 2 -> System.out.println("[TODO:C] ReviewView.detail()");     // F-08
case 3 -> System.out.println("[TODO:B] RestaurantView.add()");    // F-04
```

문제는 이 세 줄이 **담당자가 섞인 채 붙어 있다**는 점이다. 1번과 3번은 맛집 담당(B), 2번은 리뷰 담당(나)이다. 같은 `switch` 안에서 서로 다른 사람이 인접한 줄을 고치니, 한 명이 먼저 병합하면 다른 사람의 PR이 충돌한다.

| 충돌 | 겹친 줄 | 원인 |
|---|---|---|
| 1번째 (리뷰 작성 PR) | 필드 선언 두 줄 | 나는 `reviewController`, 회원 담당(A)은 `memberView`를 같은 위치에 추가했다 |
| 2번째 (상세 조회 PR) | `case 1`, `case 2`, `case 3` 세 줄 | B가 `case 1`과 `case 3`을 구현으로 바꿨고, 나는 `case 2`를 바꿨다 |

## 2. 충돌 1: Accept both가 맞는 경우

GitHub의 충돌 편집 화면에는 이런 내용이 나왔다.

```java
<<<<<<< feature/review-write (Current change)
    private final ReviewController reviewController = new ReviewController();
=======
    private final MemberView memberView = new MemberView();
>>>>>>> develop (Incoming change)
```

두 줄은 **서로 다른 필드**고, 둘 다 필요하다. 이럴 때는 `Accept both changes`로 두 줄을 모두 남기면 된다. 순서는 상관없다.

## 3. 충돌 2: Accept both가 틀린 경우

두 번째 충돌은 이랬다.

```java
<<<<<<< feature/review-detail
    case 1 -> System.out.println("[TODO:B] RestaurantView.list()");   // F-05
    case 2 -> reviewController.detail();                              // F-08
    case 3 -> System.out.println("[TODO:B] RestaurantView.add()");    // F-04
=======
    case 1 -> restaurantView.list();                                  // F-05
    case 2 -> System.out.println("[TODO:C] ReviewView.detail()");     // F-08
    case 3 -> restaurantView.add();                                   // F-04
>>>>>>> develop
```

`Accept both changes`를 누르면 `case 1`, `case 2`, `case 3`이 각각 두 번씩 생긴다. Java의 `switch`는 같은 `case` 값이 중복되면 컴파일 오류(duplicate case label)가 난다. 이번에는 **같은 `case`를 서로 다르게 바꾼 것**이라서, 줄마다 최신 쪽을 골라야 한다.

| 줄 | 남길 쪽 | 이유 |
|---|---|---|
| `case 1` | `develop`의 `restaurantView.list()` | B가 구현을 끝낸 버전이 최신이다 |
| `case 2` | 내 쪽의 `reviewController.detail()` | 내가 구현한 F-08이다 |
| `case 3` | `develop`의 `restaurantView.add()` | B가 구현을 끝낸 버전이다 |

기준은 "어느 쪽 전체를 고를까"가 아니라 **"각 줄에서 누구의 구현이 최신인가"**다. 한쪽을 통째로 고르면(`Accept current`/`Accept incoming`) 다른 사람의 기능이 `[TODO]`로 되돌아가거나 내 기능이 사라진다.

## 4. "충돌 없음"을 확인했는데 또 충돌이 났다

처음에는 푸시 전에 최신 `develop`과 충돌이 없는 것을 확인했다. 그런데 그 직후에 B의 PR 두 개가 `develop`에 병합됐고, 내 PR 화면에서 충돌이 다시 나타났다. 확인한 시점과 병합하는 시점 사이에 `develop`이 움직인 것이다.

병합하지 않고 충돌 여부만 보는 방법은 `git merge-tree`다.

```bash
git fetch origin
git merge-tree --write-tree --name-only --no-messages HEAD origin/develop
```

첫 줄은 병합 결과 트리의 해시다. 충돌이 있으면 그 아래에 충돌한 파일 이름이 나오고, 없으면 해시 한 줄만 나온다. 이 명령은 작업 폴더나 브랜치를 바꾸지 않는다.

**"충돌 없음"이 "컴파일 됨"은 아니다.** 서로 다른 줄을 고쳤어도 합친 결과가 깨질 수 있다. 그래서 병합 결과 트리를 임시 폴더에 꺼내서 컴파일했다.

```bash
TREE=$(git merge-tree --write-tree --no-messages HEAD origin/develop)
mkdir -p /tmp/mergecheck && git archive "$TREE" | tar -x -C /tmp/mergecheck
javac -encoding UTF-8 -d /tmp/out $(find /tmp/mergecheck/src/main/java -name '*.java')
```

충돌이 난 쪽은 내 PC에서 `git merge origin/develop`으로 먼저 합치고, 위 `case` 세 줄을 정리해 병합 커밋을 만든 뒤 푸시했다. 내 PC에서 해결만 하고 푸시하지 않으면 GitHub의 PR에는 충돌이 그대로 남아 있다. 해결한 병합 커밋을 **푸시해야** PR에 반영된다.

## 5. 겪은 혼란

**GitHub 화면에서 고칠까, 내 PC에서 고칠까.** 화면에서 직접 고치면 병합 커밋이 원격에만 생겨서 내 PC의 브랜치가 뒤처진다. 이미 PC에서 해결해 두었다면 푸시만 하면 되고, 화면의 충돌 편집기는 저장하지 않고 닫는다.

**PR 대상 브랜치.** 저장소의 기본 브랜치가 `main`이라 PR 만들기 화면의 `base`가 `main`으로 채워진다. 팀 규칙은 `feature → develop`이므로 올리기 전에 `base`를 확인해야 한다.

**다른 PR 위에 쌓은 브랜치.** 리뷰 수정·삭제 브랜치를 상세 조회 브랜치(아직 병합 전) 위에서 만들었다. 이때 상세 조회 PR을 **Squash and merge**로 병합하면 수정·삭제 PR에 같은 변경이 중복으로 잡혀서 충돌할 수 있다. 이 팀은 기본 병합 방식("Merge pull request")을 썼기 때문에 문제가 없었다. squash 병합 시 실제로 어떻게 보이는지는 직접 겪지 않았다(`확인 필요`).

## 6. 결과

- 충돌 두 건 모두 해결해서 PR이 병합됐다.
- 병합 결과로 만든 트리가 컴파일되는 것을 확인했다.
- 병합된 `MainController`에서 `case`가 기능마다 한 번씩만 연결된 것을 `grep -n "case [0-9] ->"`로 확인했다. (회원 F-01~F-03, 맛집 F-04~F-06, 리뷰 F-07~F-09)

돌이켜보면 충돌을 줄이는 방법은 두 가지였다.

| 방법 | 효과 |
|---|---|
| PR을 작게, 자주 병합한다 | 같은 파일을 오래 따로 고치는 기간이 줄어든다 |
| 메뉴를 담당자별 Controller로 나눈다 | `MainController`에는 담당자당 한 줄(`memberController.run()` 등)만 남아 겹칠 곳이 줄어든다 |

이번 프로젝트는 하위 메뉴(`restaurantMenu`)가 `MainController`에 있어서 맛집 메뉴 안에 리뷰 담당의 기능(상세 조회)이 끼어 있었다. 이 구조가 충돌이 난 자리였다.

## 더 학습하면 좋은 개념

- **3-way merge** — Git이 공통 조상, 내 쪽, 상대 쪽을 비교해 충돌을 판단하는 방식이다. 왜 "붙어 있는 줄"에서 충돌이 나는지 설명해 준다.
- **`merge`와 `rebase`의 차이** — 충돌을 푸는 방식과 기록이 남는 모양이 다르다. 협업 규칙을 정할 때 알아야 한다.
- **Squash / Rebase / Merge commit 병합 방식** — 이 글에서 겪지 못한 squash 병합이 쌓아 올린 브랜치에 주는 영향을 확인해 두면 좋다.
- **브랜치 보호 규칙(Branch protection)** — 리뷰 승인이나 상태 검사를 병합 조건으로 걸 수 있다. 실수로 `main`에 병합하는 일을 줄인다.
- **의존 관계가 있는 PR 관리(stacked PR)** — 한 기능이 다른 PR 위에 쌓일 때 브랜치와 병합 순서를 어떻게 관리할지 다룬다.

## 참고 자료

- [Git 공식 문서 - git-merge-tree](https://git-scm.com/docs/git-merge-tree)
- [Git 공식 문서 - git-archive](https://git-scm.com/docs/git-archive)
- [GitHub Docs - 병합 충돌 해결하기](https://docs.github.com/ko/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-on-github)
- [GitHub Docs - Pull request 병합 방식](https://docs.github.com/ko/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github)
