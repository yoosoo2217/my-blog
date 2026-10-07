---
title: "JDK·JRE·JVM 차이 정리"
date: 2026-09-28 09:00:00
tags:
  - Java
---

자바 코드를 한 줄 쓰기 전에, JDK·JRE·JVM은 각각 무엇을 가리키고 왜 수업에서는 특정 버전과 배포판을 골라 쓸까? 자바를 실행하고 개발하기 위한 환경부터 정리한다.

> **TL;DR**
> - JDK ⊃ JRE ⊃ JVM 포함 관계이고, 직접 만들려면 JDK가 필요하다.
> - 수업은 오래 지원되는 LTS 버전인 Java 21과 Eclipse Temurin 배포판을 쓴다.
> - `java`, `javac`가 터미널에서 동작하는 데는 PATH와 JAVA_HOME이 관여한다.

환경 : Windows, PowerShell, Eclipse Temurin JDK 21

## 1. JVM, JRE, JDK — 셋은 포함 관계다

```text
JDK (Java Development Kit)
 └── JRE (Java Runtime Environment)
      └── JVM (Java Virtual Machine)
```

- **JVM (Java Virtual Machine)**: `.class` 파일(바이트코드)을 읽고 실행하는 주체다. 클래스 로더, 바이트코드 검증기, 실행 엔진, 메모리 관리 기능을 갖고 있다. "자바 프로그램을 실제로 돌리는 엔진"이라고 보면 된다.
- **JRE (Java Runtime Environment)**: JVM + 자바 표준 라이브러리. 이미 만들어진 자바 프로그램을 **실행**하기 위한 환경이다.
- **JDK (Java Development Kit)**: JRE + 개발 도구. 자바 프로그램을 직접 **만들기** 위한 환경이다.

관계를 정리하면 이렇다.

```text
JVM = 실행하는 핵심
JRE = JVM + 실행에 필요한 라이브러리
JDK = JRE + 개발 도구
```

수업에서는 JDK를 "통역사 + 사전 + 번역 작업 도구 세트"에 비유했다. JVM(통역사)이 코드를 실제로 옮기고, 표준 라이브러리(사전)가 자주 쓰는 표현을 미리 담아두고, 개발 도구(번역 작업 도구)가 원고(소스 코드)를 만들고 다듬는 역할을 한다고 생각하면, 왜 셋이 이런 포함 관계인지 감이 잡힌다.

다만 이건 세 개념의 역할을 이해하기 위한 구조이고, 실제로 최신 JDK를 설치할 때 JVM·JRE·JDK가 각각 따로 설치되는 건 아니다. 요즘은 JDK 설치 파일 하나에 실행 환경(JVM + 표준 라이브러리)과 개발 도구가 전부 포함되어 있어서, 별도의 JRE만 골라 설치하는 경우는 드물다. "포함 관계"는 개념을 이해하기 위한 그림이라고 보면 된다.

이 중 지금 당장 손에 익혀야 할 도구는 소스 코드를 바이트코드로 컴파일하는 `javac`와, 그 결과를 실행하는 `java` 두 가지다. 그 외에 `jshell`(대화형 실행기), `javap`(역어셈블러), `jar`(압축·배포 도구), `javadoc`(문서 생성기), `jdb`(디버거)도 JDK 안에 들어 있지만, 지금 단계에서는 이런 도구들이 있다는 정도만 알아둔다.

## 2. 왜 Java 21(LTS)을 쓸까

자바는 버전이 계속 나오지만, 모든 버전이 똑같이 오래 지원되는 건 아니다. 그중 **Long-Term Support(LTS)** 로 지정된 버전만 오랜 기간 보안 패치와 업데이트를 받는다.

| 버전 | 구분 | 비고 |
|---|---|---|
| Java 8 | LTS | - |
| Java 11 | LTS | - |
| Java 17 | LTS | - |
| Java 21 | LTS | 이번 수업에서 사용하는 버전 |
| Java 25 | LTS | - |

그 사이(9, 10, 12~16, 18~20, 22~24)에도 버전은 계속 나왔지만, LTS로 지정되지 않아 지원 기간이 짧다.

이번 수업에서 Java 21을 사용하는 이유로 배운 내용은 이렇다 — 실무·강의 환경과의 호환성이 좋고, Spring Boot 같은 주요 프레임워크가 안정적으로 지원하는 버전이며, 그만큼 참고할 자료와 생태계가 쌓여 있다는 점이었다. (다른 LTS 버전을 쓰지 않는 이유까지 비교해서 배운 건 아니라서, 여기서는 "수업에서 Java 21을 고른 이유"로만 정리해둔다.)

## 3. JDK를 만드는 곳이 여럿이다: 배포판

JDK는 한 곳에서만 만드는 게 아니라 여러 배포판(distribution)이 있다.

| 배포판 | 비고 |
|---|---|
| OpenJDK | 자바 표준을 오픈소스로 구현한 프로젝트. 아래 배포판들 대부분이 이 소스를 기반으로 빌드된다 |
| Eclipse Temurin | Eclipse 재단이 OpenJDK 소스로 빌드해 배포. **이번 수업에서 설치한 배포판** |
| Oracle JDK | Oracle이 빌드해 배포, 버전마다 라이선스 조건이 달라 실제 사용 전 확인이 필요함 |
| Amazon Corretto | Amazon이 빌드해 배포, AWS 환경에 최적화 |
| Microsoft Build of OpenJDK | Microsoft가 빌드해 배포 |

배포판이 달라도 자바 표준 자체(문법, 바이트코드 규격)는 동일하고, 누가 빌드해서 어떤 지원 정책·최적화로 배포하는지가 다르다는 정도로 이해했다.

## 4. java 명령이 실행되는 이유: JAVA_HOME과 PATH

설치가 끝나면 터미널에서 `java`, `javac`가 바로 동작해야 하는데, 여기에는 환경 변수 두 개가 관여한다.

- **JAVA_HOME**: 지금 사용할 JDK가 설치된 위치를 가리키는 환경 변수. Maven, Gradle, IDE 같은 다른 도구들이 "자바가 어디 있는지" 확인할 때 이 값을 참조한다.
- **PATH**: 실행 파일을 찾을 폴더 목록. 터미널에 `java`나 `javac`처럼 명령어 이름만 입력해도 실행되는 이유는, 운영체제가 PATH에 등록된 폴더들을 순서대로 뒤져서 그 이름의 실행 파일을 찾아주기 때문이다. ([리눅스 셸 기초 정리]({{ site.baseurl }}/git-linux-shell-basics.html)에서 정리했던 셸이 바로 이 과정을 담당하는 프로그램이다.)

즉 JAVA_HOME은 "자바가 설치된 한 지점"을 가리키는 좌표이고, PATH는 "실행 파일을 찾아볼 폴더들의 목록"이라는 차이가 있다. 보통 설치 과정에서 PATH에 `%JAVA_HOME%\bin`(JDK 설치 폴더 아래 실행 파일들이 모여 있는 폴더)을 추가해서, 두 환경 변수가 함께 동작하도록 만든다.

설치가 잘 됐는지는 아래 명령어로 확인했다.

```powershell
java -version
javac -version
echo $env:JAVA_HOME
```

- `java -version`: 현재 PATH에 연결된 자바 실행 버전을 확인한다.
- `javac -version`: 현재 PATH에 연결된 **컴파일러**(JDK)의 버전을 확인한다. 개발 도구 없이 실행 환경만 설치돼 있으면 이 명령어는 동작하지 않는다.
- `echo $env:JAVA_HOME` (PowerShell 기준): 현재 설정된 JAVA_HOME 경로를 출력한다.

## 정리

- JDK ⊃ JRE ⊃ JVM 관계이고, "실행만 할지" 아니면 "직접 만들지"에 따라 필요한 설치가 달라진다는 걸 알았다.
- LTS는 모든 자바 버전이 아니라 그중 오래 지원되는 버전에만 붙는 이름이고, 수업은 LTS인 Java 21을 쓴다.
- JAVA_HOME과 PATH는 역할이 다르다 — 하나는 "위치를 가리키는 값", 하나는 "찾아볼 폴더 목록"이라는 걸 구분해서 이해했다.
- 다음에 볼 것 : 실행 과정을 다루는 [다음 글]({{ site.baseurl }}/java-program-execution.html)이다.

## 더 학습하면 좋은 개념

- **클래스 로더(Class Loader)** — 오늘은 JVM 구성 요소 중 하나로만 언급했는데, `.class` 파일을 어떤 순서로 메모리에 올리는지 구체적인 동작 방식을 알면 다음 글에서 다룰 실행 과정이 더 명확해진다.
- **가비지 컬렉션(Garbage Collection)** — JVM의 메모리 관리 기능과 이어지는 개념으로, 자바가 왜 개발자가 직접 메모리를 해제하지 않아도 되는지를 설명해준다.
- **셸과 환경 변수** — PATH가 실행 파일을 찾는 방식은 셸의 기본 동작이다. [셸 기초 정리]({{ site.baseurl }}/git-linux-shell-basics.html)에서 정리한 내용과 이어서 보면 좋다.
- **빌드 도구(Maven/Gradle)** — JAVA_HOME을 참조하는 대표적인 도구들이다. 지금은 `javac`로 직접 컴파일했지만, 프로젝트가 커지면 빌드 도구가 이 과정을 대신 관리해준다.

## 참고 자료
- [Oracle - JDK 21 문서](https://docs.oracle.com/en/java/javase/21/)
- [Eclipse Temurin 공식 사이트](https://adoptium.net/temurin/)
- [OpenJDK 공식 사이트](https://openjdk.org/)
