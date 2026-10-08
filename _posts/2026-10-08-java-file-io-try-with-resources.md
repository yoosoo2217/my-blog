---
title: "파일 입출력과 try-with-resources: close()를 빼먹지 않는 방법"
date: 2026-10-08
tags:
  - Java
---

파일에 글자를 쓰고 읽는 코드는 몇 줄이면 끝나는데, 컴파일러가 `IOException` 처리를 먼저 요구한다.  
게다가 연 파일을 닫는 `close()`를 빼먹어도 컴파일은 통과해서, 실수가 조용히 남는다.  
`FileWriter`로 파일에 쓰고 `FileReader`로 읽는 코드를 확인하고, 자원을 자동으로 닫아 주는 `try-with-resources`로 고치는 방법까지 정리했다.  
예외 처리의 기본은 [이전 글]({{ site.baseurl }}/java-exception-handling-basics.html)에서 정리했다.

> **TL;DR**
> - 파일 입출력 클래스는 `IOException`(처리를 강제하는 예외) 처리를 요구한다.
> - `write` 뒤에 `flush()`를 하면 버퍼의 데이터가 디스크로 밀려 나가지만, 통로를 닫는 것은 아니다. 자원은 `close()`로 반납해야 한다.
> - `try-with-resources`는 `close()`를 자동으로 불러 줘서 `finally` 없이도 자원을 안전하게 닫는다.

환경: Java (실습에 쓴 버전은 `확인 필요`). 아래 실습 코드의 `main`은 `public` 없이 `static void main(String[] args)`로 적혀 있다.

## 1. 파일에 쓰고 읽기: FileWriter와 FileReader

```java
package com.wanted.b_fileio;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;

public class Application01 {
    static void main(String[] args) throws IOException {

        // 파일 쓰기
        try {
            // File IO 관련 클래스들은 객체 생성 시 예외를 반드시 처리하게 설정이 되어있다.
            FileWriter writer = new FileWriter("output.txt");
            writer.write("Hello, File IO!");
            writer.write("File Test");

            // 버퍼(연결통로)에 있는 데이터를 밀어서 디스크에 저장한다.
            writer.flush();

        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        // 파일 읽기 작업
        try {
            FileReader reader = new FileReader("output.txt");

            int data;
            // read() : 파일에서 한 문자씩 읽고, 파일 끝에 도달하면 -1 반환
            while ((data = reader.read()) != -1) {
                System.out.println((char) data);
            }

        } catch (FileNotFoundException e) {
            throw new RuntimeException(e);
        }
    }
}
```

### 쓰기: 어떤 일이 일어날까

| 코드 | 하는 일 |
|---|---|
| `new FileWriter("output.txt")` | `output.txt`에 쓸 통로를 연다. 파일이 없으면 만들어지고, 있으면 내용이 덮어씌워진다 |
| `writer.write("Hello, File IO!")` | 문자열을 쓴다 |
| `writer.write("File Test")` | 이어서 쓴다. 줄바꿈 문자를 넣지 않았으므로 앞 문자열 바로 뒤에 붙는다 |
| `writer.flush()` | 버퍼에 모인 데이터를 디스크로 밀어낸다 |

파일에는 `Hello, File IO!File Test`가 한 줄로 저장된다.  
`write`를 두 번 불렀지만 줄바꿈이 없기 때문이다.

`FileWriter`를 만들 때 `IOException`이 날 수 있어서 `try - catch`로 감쌌다.  
`catch` 안에서는 `throw new RuntimeException(e)`로 `IOException`을 `RuntimeException`으로 감싸서 다시 던졌다.  
처리를 강제하는 예외를 강제하지 않는 예외로 바꿔서, 호출한 쪽이 `throws`를 쓰지 않아도 되게 하는 방식이다.

### 읽기: 한 글자씩 읽다가 -1에서 끝낸다

`reader.read()`는 파일에서 문자를 하나씩 읽어서 `int`로 돌려주고, 파일 끝에 닿으면 `-1`을 돌려준다.  
그래서 `while ((data = reader.read()) != -1)`로 끝까지 반복한다.  
`(char) data`로 바꿔서 `println`으로 출력하기 때문에 문자가 **한 글자씩 한 줄에** 나온다.

저장된 `Hello, File IO!File Test`는 공백을 포함해 24글자라서 24줄이 출력된다.  
공백 문자가 나오는 줄은 비어 보인다.  
이 결과는 코드를 따라가 본 것이고, 직접 실행해 확인하지는 않았다.

### main의 throws IOException이 하는 일

읽기 쪽 `try`는 `FileNotFoundException`만 잡는다.  
하지만 `reader.read()`는 `IOException`을 던질 수 있다.  
`main` 선언부의 `throws IOException`이 이 예외를 `main` 밖으로 넘기기 때문에 컴파일이 통과한다.  
`FileNotFoundException`은 `IOException`의 자식이다.

## 2. 이 코드의 빈틈: 열기만 하고 닫지 않았다

`flush()`는 버퍼의 데이터를 내보낼 뿐이고, 파일 통로를 닫지는 않는다.  
`FileWriter`와 `FileReader` 모두 `close()`를 부르지 않았다.  
연습 코드에서는 동작하지만, 계속 열려 있는 자원은 운영체제의 자원을 붙잡고 있고, 다른 곳에서 같은 파일을 쓰기 어렵게 만들 수 있다.

전통적인 해결은 `finally`에서 `close()`를 부르는 것이다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
FileReader reader = null;
try {
    reader = new FileReader("output.txt");
    // ... 읽기 ...
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (reader != null) {
        try {
            reader.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

`close()` 자체도 `IOException`을 던질 수 있어서 `try - catch`가 또 필요하고, 코드가 길어진다.

## 3. try-with-resources: 닫는 일을 자바가 대신 한다

Java 7에서 추가된 `try-with-resources`는 `try (...)`의 괄호 안에서 만든 자원을 블록이 끝날 때 자동으로 닫는다.  
`finally`를 쓰지 않아도 된다.

```java
// 예시 코드 (직접 실행해 확인하지 않음)
try (BufferedReader in = new BufferedReader(new FileReader("test.dat"))) {

    String s;

    while ((s = in.readLine()) != null) {
        System.out.println(s);
    }

} catch (FileNotFoundException e) {
    e.printStackTrace();
} catch (IOException e) {
    e.printStackTrace();
}
```

| 방식 | 닫는 시점 | 코드의 양 |
|---|---|---|
| `finally`에서 `close()` | 직접 쓴 코드가 실행될 때 | 길다(`null` 검사와 중첩 `try - catch`) |
| `try-with-resources` | 블록이 끝날 때 자동으로 | 짧다 |

괄호 안에 쓸 수 있는 것은 `AutoCloseable` 인터페이스를 구현한 클래스다.  
`FileReader`, `FileWriter`, `BufferedReader` 같은 입출력 클래스가 여기에 해당한다.

이 글의 첫 번째 코드를 고치면 아래처럼 된다. (예시 코드이고 직접 실행해 확인하지는 않았다.)

```java
// 예시 코드 (직접 실행해 확인하지 않음)
try (FileWriter writer = new FileWriter("output.txt")) {
    writer.write("Hello, File IO!");
    writer.write("File Test");
}   // 블록이 끝나면 writer.close()가 자동으로 불린다
```

`close()`는 닫기 전에 버퍼에 남은 데이터를 내보내는 동작을 포함한다.  
그래서 이 코드에서는 `flush()`를 따로 부르지 않아도 데이터가 파일에 저장된다.

## 4. 헷갈리기 쉬운 점

### flush()와 close()는 다르다

`flush()`는 버퍼의 데이터를 내보내기만 한다.  
`close()`는 내보낸 뒤 통로를 닫는다.  
`flush()`를 했다고 자원이 반납되는 것은 아니다.

### 상대 경로의 파일은 실행 위치에 만들어진다

`new FileWriter("output.txt")`처럼 경로 없이 이름만 적으면, 프로그램을 실행한 위치(작업 디렉터리)에 파일이 만들어진다.  
파일이 보이지 않으면 실행 위치를 먼저 확인한다.

### 같은 파일을 쓰면 덮어쓴다

`new FileWriter("output.txt")`는 파일이 이미 있으면 내용을 지우고 새로 쓴다.  
기존 내용 뒤에 이어 쓰려면 이어쓰기 옵션이 있는 생성자를 써야 하는데, 정확한 사용법은 공식 문서로 확인한다.

## 5. 정리

- `FileWriter`와 `FileReader`는 `IOException` 처리를 강제한다.  
  `write` 뒤의 `flush()`는 디스크로 밀어내고, `read()`는 파일 끝에서 `-1`을 반환한다.
- `flush()`로는 자원이 반납되지 않는다.  
  열었으면 `close()`로 닫아야 한다.
- `try-with-resources`는 `AutoCloseable` 자원을 블록이 끝날 때 자동으로 닫아서 `finally` 코드를 줄이고 빠뜨리는 실수를 막는다.

다음에는 한 글자씩 읽는 방식보다 효율적인 `BufferedReader`와 `BufferedWriter`를 보면 좋다.

## 더 학습하면 좋은 개념

- **AutoCloseable과 Closeable** — `try-with-resources`에 쓸 수 있는 조건이다.  
  직접 만든 클래스도 이 인터페이스를 구현하면 자동으로 닫히게 할 수 있다.
- **BufferedReader와 BufferedWriter** — 버퍼를 활용해 한 글자씩 읽는 방식보다 효율적으로 읽고 쓰는 클래스다.  
  `readLine()`으로 한 줄씩 읽을 수 있다.
- **문자 인코딩(Charset)** — 한글이 깨지지 않게 읽고 쓰려면 어떤 인코딩으로 저장했는지가 중요하다.  
  기본 인코딩은 자바 버전과 환경에 따라 다를 수 있다.
- **java.nio.file의 Files와 Path** — 더 최근의 파일 처리 방식이다.  
  한 줄로 파일을 읽고 쓰는 메소드를 제공한다.
- **try-with-resources의 억제된 예외(suppressed)** — 본문과 `close()`에서 예외가 모두 날 때 어떤 예외가 던져지는지 이해하면 디버깅에 도움이 된다.

## 참고 자료
- [Oracle - The try-with-resources Statement](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html)
- [Java SE API - FileWriter](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/FileWriter.html)
- [Java SE API - FileReader](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/FileReader.html)
- [Java SE API - AutoCloseable](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/AutoCloseable.html)
