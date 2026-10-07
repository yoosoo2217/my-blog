---
title: "Git add, commit, push"
date: 2026-08-30
tags:
  - Git
---

`add`와 `commit`은 왜 나뉘어 있을까? 한 번에 저장하면 될 것 같은데, 처음에는 이 구분이 가장 헷갈렸다.

> **TL;DR**
> - Git은 **저장 지점을 남기고 되돌릴 수 있게** 해 주는 도구다.
> - `add`로 담을 것을 고르고, `commit`으로 기록하고, `push`로 GitHub에 올린다.
> - `git log` 화면이 멈춘 것처럼 보이면 `q`를 누른다.

## add, commit, push는 각각 무엇을 할까

| 단계 | 명령 | 하는 일 |
|---|---|---|
| 1 | `git add` | 커밋에 담을 것을 고른다 |
| 2 | `git commit` | 고른 것을 한 덩어리로 기록한다 |
| 3 | `git push` | 기록을 GitHub로 올린다 |

## 왜 add와 commit이 나뉘어 있을까

파일을 두 개 고쳤는데 **하나만 커밋하고 싶을 때**가 있기 때문이다.
`add`로 커밋에 넣을 파일만 고르고 나서 `commit`을 하면, 고르지 않은 파일은 이번 기록에서 빠진다.

## 헷갈렸던 점: git log 화면이 멈춘 것처럼 보였다

`git log`를 입력했더니 화면이 멈춘 것처럼 보였다.
알고 보니 기록을 보여주는 화면이 열린 것이었고, `q`를 누르면 빠져나온다.

## 정리

- `add`는 고르기, `commit`은 기록하기, `push`는 GitHub에 올리기이다.
- `add`와 `commit`이 나뉜 이유는 고친 파일 중 일부만 커밋할 수 있게 하기 위해서이다.
- 다음에는 마크다운으로 글을 쓰고, 만든 것을 인터넷에 올리는 과정을 볼 예정이다.

## 참고 자료

- [Pro Git - Recording Changes to the Repository](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository)
