---
title: "Tomcat Worker 与自定义线程池是什么关系？一次 HTTP 请求的线程执行过程"
description: "沿着一次 HTTP 请求的执行链路，梳理 Tomcat Worker 线程与业务自定义线程池之间的关系。"
pubDate: 2026-03-04
category: "后端笔记"
tags: ["Java", "并发编程", "Tomcat"]
cover: "tomcat-worker-thread-pool-wall.jpg"
coverAlt: "墙头与动漫人物构成的 Tomcat 线程文章封面"
draft: false
---

# Tomcat Worker 与自定义线程池是什么关系？一次 HTTP 请求的线程执行过程

在 Java 后端开发中，我们经常会接触到各种线程池。例如，Spring Boot 内嵌的 Tomcat 本身就维护着用于处理 HTTP 请求的工作线程。而在业务开发中，我们也可能创建自己的线程池：

```
ExecutorService executor =
    Executors.newFixedThreadPool(10);
```

那么，这就产生了几个问题：

- 用户发起 HTTP 请求后，究竟由哪个线程执行 Controller？
- Controller 调用 Service、Mapper 时，会不会切换线程？
- Tomcat Worker 与自定义线程池中的线程是否存在一一对应关系？
- 如果 Tomcat Worker 提交了多个异步任务，它是否需要等待这些任务完成？
- 如果已经使用自定义线程池，为什么 Tomcat Worker 仍然可能阻塞？

要理解这些问题，我们需要从 Tomcat 的请求处理模型开始。

## 一、一次 HTTP 请求是如何进入 Spring Boot 的？

假设我们使用的是传统 Spring MVC 架构，Web 容器为内嵌 Tomcat，并采用 NIO Connector。当客户端发送 HTTP 请求时，请求并不是直接进入 Controller。  在简化的 Tomcat NIO 模型中，请求会经过以下几个阶段：

<img src="C:\Users\Zpero\Pictures\WallPaper\1134165c-af62-4472-aad1-7965095b4f80.png" alt="1134165c-af62-4472-aad1-7965095b4f80" style="zoom:33%;" />

这里涉及三类重要的线程角色。

### 1.1 Acceptor：接收客户端连接

Acceptor 负责接受新的 TCP 连接。例如，客户端向服务器的 8080 端口建立连接，Acceptor 接收连接后，将相应的 Socket 交给后续组件管理。

Acceptor 的主要职责是连接接入，而不是执行 Controller 中的业务代码。

### 1.2 Poller：监听网络 I/O 事件

Tomcat NIO 使用 Java NIO 的 Selector 等机制管理 Socket。 Poller 可以监听大量 Socket 的 I/O 就绪事件。 例如：

```
Socket A ──┐
Socket B ──┤
Socket C ──┼── Selector
Socket D ──┤       │
Socket E ──┘       ▼
                Poller
```

当某个 Socket 出现需要处理的事件时，Tomcat 会进一步安排请求处理工作。这意味着 Tomcat 不需要为每个空闲 TCP 连接都分配一个长期等待的 Worker。

### 1.3 Worker：执行 HTTP 请求处理任务

Worker 是 Tomcat 中真正参与业务请求处理的重要线程。它不仅负责请求处理过程中的协议解析、Servlet 调用等工作，还会执行 Spring MVC 的 Controller、Service 等同步业务逻辑。 因此：

**Tomcat NIO 负责高效管理网络连接，而 Tomcat Worker 负责实际执行请求处理任务。** 这里需要注意，**NIO 并不意味着整个业务调用链都是非阻塞的。**

## 二、Controller、Service 和 Mapper 是不是同一个线程执行？

考虑下面的代码：

```
@RestController
public class UserController {

    @GetMapping("/user")
    public User getUser() {
        return userService.getUser();
    }
}
```

Service：

```
@Service
public class UserService {

    public User getUser() {
        return userMapper.selectById(1L);
    }
}
```

假设 Tomcat 将这个请求交给：

```
http-nio-8080-exec-1
```

那么，默认情况下：

```
Tomcat Worker 1
       │
       ▼
执行 Controller
       │
       ▼
调用 Service
       │
       ▼
调用 Mapper
       │
       ▼
执行 JDBC 查询
       │
       ▼
获取数据库结果
       │
       ▼
返回 Controller
       │
       ▼
生成 HTTP 响应
```

**整个同步调用链通常由同一个 Tomcat Worker 线程执行。**

原因很简单：普通 Java 方法调用并不会自动创建线程。

例如：

```
public void methodA() {
    methodB();
}

public void methodB() {
    methodC();
}
```

调用 `methodB()`、`methodC()` 时，执行线程不会因为进入了不同方法就发生切换。 Spring MVC 的普通同步调用也是如此。 即使业务代码经过 Controller、Service、Mapper 多个层次，也不意味着每一层都有独立的线程。

### 2.1 数据库查询会创建一个新线程吗？

通常不会。例如：

```
User user = userMapper.selectById(1L);
```

对于普通的同步 JDBC 调用，执行查询的仍然是当前 Tomcat Worker。 它会通过数据库连接向 MySQL 发送 SQL 请求，并等待数据库返回结果。

等待期间，Tomcat Worker 可能进入阻塞状态。 这意味着： **Tomcat Worker 不仅执行 CPU 计算，也会执行同步 I/O，并可能因为等待 I/O 而阻塞。**

## 三、Tomcat Worker 为什么会阻塞？

假设有一个接口：

```
@GetMapping("/test")
public String test() throws InterruptedException {

    Thread.sleep(3000);

    return "success";
}
```

在传统平台线程执行模式下，请求进入 Controller 后，Tomcat Worker 会执行 `Thread.sleep(3000)`。

执行过程如下：

```
Tomcat Worker
      │
      ▼
执行 Controller
      │
      ▼
Thread.sleep(3000)
      │
      ▼
阻塞等待 3 秒
      │
      ▼
继续执行
      │
      ▼
返回 HTTP 响应
```

在这 3 秒内，Worker 无法继续处理其他普通请求的业务逻辑。

需要注意： **线程阻塞不意味着 CPU 一直在执行这个线程。**

例如，线程等待数据库响应时，CPU 可能处于空闲状态，也可能正在执行其他线程。但这个 Worker 仍然被当前请求占用。假设 Tomcat 最多允许 200 个 Worker 同时执行请求任务。如果 200 个 Worker 都在等待数据库或远程 HTTP 接口，那么新请求即使已经被 Tomcat 接收，也可能无法及时获得 Worker 执行业务逻辑。  于是就可能出现：

```
CPU 使用率不高
       │
       ▼
大量 Worker 阻塞
       │
       ▼
可用 Worker 不足
       │
       ▼
请求处理延迟增加
```

这也是传统同步 Web 服务容易受到工作线程数量限制的原因之一。

## 四、Tomcat Worker 与自定义线程池是什么关系？

现在我们引入一个自定义线程池：

```
@Bean
public ExecutorService businessExecutor() {
    return Executors.newFixedThreadPool(10);
}
```

假设 Tomcat 有 200 个 Worker，而自定义线程池有 10 个 Worker。

这两个线程池是独立的。

```
              Spring Boot
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
   Tomcat 线程池       自定义业务线程池
         │                 │
   Tomcat Worker 1     Business Worker 1
   Tomcat Worker 2     Business Worker 2
   Tomcat Worker 3     Business Worker 3
         ...               ...
   Tomcat Worker N     Business Worker 10
```

**Tomcat Worker 与自定义 Worker 之间不存在固定的一一对应关系。** 自定义线程池中的线程不会因为 Tomcat Worker 的存在而自动执行任务。只有当业务代码主动向自定义线程池提交任务时，才会发生线程之间的协作。  例如：

```
executor.submit(() -> {
    return calculate();
});
```

这时，任务会被提交给自定义线程池。至于由哪个自定义 Worker 执行，取决于线程池的调度情况。同一个 Tomcat Worker 可以提交多个任务。同一个自定义 Worker 也可以先后执行来自不同 HTTP 请求的任务。因此，二者的关系是：  **任务提交与执行关系，而不是线程之间的固定映射关系。**

## 五、Tomcat Worker 提交多个任务后会发生什么？

假设一个 HTTP 请求需要完成三个相互独立的计算任务：

- 任务 A：查询用户信息。
- 任务 B：查询订单信息。
- 任务 C：查询账户信息。

三个任务之间不存在依赖关系，因此可以并发执行。

我们使用自定义线程池：

```
@GetMapping("/info")
public String getInfo() throws Exception {

    Future<String> futureA =
        executor.submit(() -> queryUser());

    Future<String> futureB =
        executor.submit(() -> queryOrder());

    Future<String> futureC =
        executor.submit(() -> queryAccount());

    String a = futureA.get();
    String b = futureB.get();
    String c = futureC.get();

    return a + b + c;
}
```

### 5.1 提交任务时发生了什么？

假设当前请求由 Tomcat Worker 1 执行。

它依次提交 A、B、C 三个任务。

```
Tomcat Worker 1
       │
       ├── submit(A) ──────▶ Business Worker 1
       │
       ├── submit(B) ──────▶ Business Worker 2
       │
       └── submit(C) ──────▶ Business Worker 3
```

如果自定义线程池有足够的空闲线程，三个任务可以并发执行。 需要注意，`submit()` 只是提交任务，并不保证任务立即开始执行。 如果线程池没有空闲工作线程，任务可能进入等待队列。

### 5.2 调用 Future.get() 后发生了什么？

提交完三个任务后，Tomcat Worker 执行：

```
String a = futureA.get();
```

如果任务 A 尚未完成，那么 Tomcat Worker 会阻塞等待。

与此同时，自定义线程池中的 Worker 仍然可以继续执行 A、B、C。

```
Tomcat Worker 1                自定义线程池
       │
       ├── submit(A) ─────────▶ Worker 1：执行 A
       ├── submit(B) ─────────▶ Worker 2：执行 B
       ├── submit(C) ─────────▶ Worker 3：执行 C
       │
       ▼
   futureA.get()
       │
       ▼
    阻塞等待
       │
       │                      A 执行完成
       ◀─────────────────────────┘
       │
       ▼
   futureB.get()
       │
       ▼
   futureC.get()
       │
       ▼
    合并结果
       │
       ▼
    返回响应
```

这里最重要的现象是：

**一次 HTTP 请求可能同时占用一个正在等待的 Tomcat Worker，以及多个正在执行任务的自定义 Worker。**

### 5.3 三个 get() 会让任务串行执行吗？

不会。 因为三个任务已经提前提交。 例如：

```
Future<String> a = executor.submit(this::taskA);
Future<String> b = executor.submit(this::taskB);
Future<String> c = executor.submit(this::taskC);

a.get();
b.get();
c.get();
```

虽然 `get()` 是依次调用的，但任务 A、B、C 可以并发执行。

假设：

| 任务 | 执行时间 |
| ---- | -------- |
| A    | 1 秒     |
| B    | 2 秒     |
| C    | 3 秒     |

如果三个任务几乎同时开始，且有足够的线程资源，那么等待全部完成的时间大约是 3 秒，而不是 6 秒。

因为：

```
时间（秒）    0       1       2       3
             │       │       │       │
任务 A       ████████
任务 B       ████████████████
任务 C       ████████████████████████
             │                       │
             └── 并发执行 ────────────┘
```

但是，Tomcat Worker 仍然需要等待最终结果。因此：**业务任务可以并发执行，不代表发起任务的 Tomcat Worker 不会阻塞。**

## 六、为什么提交到自定义线程池后，Tomcat Worker 仍然会阻塞？

这涉及两个不同的概念：**任务异步执行**和**调用线程非阻塞等待**。使用：

```
executor.submit(task);
```

意味着任务交给其他线程执行。但如果随后调用：

```
future.get();
```

调用线程仍然需要等待任务完成。 所以：

```
异步执行任务
     ≠
调用线程一定不阻塞
```

对于普通的 Spring MVC 同步 Controller：

```
@GetMapping("/test")
public String test() throws Exception {

    Future<String> future =
        executor.submit(this::queryDatabase);

    return future.get();
}
```

Tomcat Worker 的执行过程是：

1. 接收请求处理任务。
2. 进入 Controller。
3. 向自定义线程池提交数据库查询任务。
4. 调用 `future.get()`。
5. 阻塞等待自定义 Worker 返回结果。
6. 获取结果并返回 HTTP 响应。

所以，自定义线程池并没有自动释放 Tomcat Worker。 反而可能增加线程资源的占用。

简单来说： Future 等待的结果是 线程池里面执行结果，**阻塞的是谁？是调用者线程，也就是worker线程**

## 七、如果不调用 get()，Tomcat Worker 还会阻塞吗？

考虑下面的代码：

```
@GetMapping("/task")
public String submitTask() {

    executor.submit(() -> {
        executeTask();
    });

    return "任务已提交";
}
```

执行过程：

```
Tomcat Worker
      │
      ▼
提交任务
      │
      ├──────────────────▶ 自定义 Worker
      │                         │
      ▼                         ▼
返回 HTTP 响应              执行业务任务
      │                         │
      ▼                         ▼
处理其他请求                 任务完成
```

此时，Tomcat Worker 不需要等待任务执行完成。 它可以在返回 HTTP 响应后继续处理其他请求。 而自定义 Worker 会独立执行任务。

但这里有一个问题： **客户端收到的是“任务已提交”，而不是任务真正执行完成后的结果。**  如果业务要求必须等待 A、B、C 都执行完成，再将结果返回客户端，那么就不能简单地提交任务后立即返回。

我们需要进一步考虑如何协调异步任务与 HTTP 响应。

## 八、CompletableFuture 能解决 Tomcat Worker 阻塞的问题吗？

在前面的文章中，我们介绍过 `CompletableFuture`。

它能够描述多个异步任务之间的依赖关系。

例如：

```
CompletableFuture<String> a =
    CompletableFuture.supplyAsync(this::taskA, executor);

CompletableFuture<String> b =
    CompletableFuture.supplyAsync(this::taskB, executor);

CompletableFuture<String> c =
    CompletableFuture.supplyAsync(this::taskC, executor);
```

等待三个任务完成：

```
CompletableFuture.allOf(a, b, c).join();
```

这里虽然使用了 `CompletableFuture`，但如果任务尚未完成，调用 `join()` 的 Tomcat Worker 仍然会阻塞。

因此：**CompletableFuture 负责异步任务编排，但不会自动改变 Spring MVC 的同步请求处理模型。**

不过，`CompletableFuture` 可以配合 Servlet 异步处理机制，让 Tomcat Worker 不必持续等待任务完成。

## 九、如何让 Tomcat Worker 不阻塞，同时等待异步任务返回结果？

Spring MVC 提供了异步请求处理机制。

例如：

- `Callable`
- `DeferredResult`
- `WebAsyncTask`

这些机制建立在 Servlet 异步处理能力之上。这里以 `DeferredResult` 为例。

### 9.1 使用 DeferredResult

```
@GetMapping("/info")
public DeferredResult<String> getInfo() {

    DeferredResult<String> result =
        new DeferredResult<>(5000L);

    CompletableFuture<String> a =
        CompletableFuture.supplyAsync(
            this::taskA, executor
        );

    CompletableFuture<String> b =
        CompletableFuture.supplyAsync(
            this::taskB, executor
        );

    CompletableFuture<String> c =
        CompletableFuture.supplyAsync(
            this::taskC, executor
        );

    CompletableFuture.allOf(a, b, c)
        .whenComplete((unused, ex) -> {

            if (ex != null) {
                result.setErrorResult(ex);
                return;
            }

            result.setResult(
                a.join() + b.join() + c.join()
            );
        });

    return result;
}
```

这段代码与直接调用 `future.get()` 有什么区别？

### 9.2 执行流程

```
Tomcat Worker
      │
      ▼
进入 Controller
      │
      ▼
提交 A、B、C
      │
      ▼
注册完成回调
      │
      ▼
返回 DeferredResult
      │
      ▼
Servlet 请求进入异步模式
      │
      ▼
Tomcat Worker 释放
      │
      │
      │       自定义线程池
      │             │
      │       ┌─────┼─────┐
      │       ▼     ▼     ▼
      │       A     B     C
      │       │     │     │
      │       └─────┼─────┘
      │             │
      │             ▼
      │       全部任务完成
      │             │
      │             ▼
      │       设置异步结果
      │             │
      ▼             ▼
Tomcat 后续异步分派
      │
      ▼
完成 HTTP 响应
```

这时，Tomcat Worker 不需要一直阻塞等待 A、B、C。 它可以先结束当前请求分派，让自定义线程池执行任务。当三个任务完成后，回调设置 `DeferredResult` 的结果，Spring MVC 再通过 Servlet 异步分派机制完成响应处理。

需要注意，最终的响应处理仍然需要相应的执行资源，并不是完全没有线程参与。另外，上面的代码主要用于说明机制。生产环境还需要处理任务取消、超时后的资源清理、线程池拒绝任务等问题。

### 9.3 为什么这里的 join() 不会继续等待？

因为：

```
CompletableFuture.allOf(a, b, c)
```

只有在所有任务都完成后，才会触发对应的完成回调。 如果三个任务全部正常完成，那么：

```
a.join();
b.join();
c.join();
```

可以直接读取结果。

因此，这里的 `join()` 不会再等待尚未完成的任务。这与在 Controller 中直接调用 `join()` 的情况不同。

## 十、数据库连接池与 Tomcat Worker 又是什么关系？

前面讨论的是自定义线程池。

但在 Spring Boot 中，还有另一种容易混淆的组件：**数据库连接池。** 例如 HikariCP：

```
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
```

这里的 `maximum-pool-size` 限制的是数据库连接数量，而不是 Java 业务工作线程数量。

假设：

```
server:
  tomcat:
    threads:
      max: 200
```

那么系统可能有：

```
Tomcat Worker 线程池
      │
      └── 最多 200 个工作线程

HikariCP 数据库连接池
      │
      └── 最多 20 个数据库连接
```

当 Tomcat Worker 执行：

```
userMapper.selectById(1L);
```

它会通过数据库访问组件获取连接，并使用该连接执行查询。如果连接池中没有可用连接，当前线程可能阻塞等待连接。如果成功获取连接，但 MySQL 尚未返回结果，当前线程也可能阻塞等待数据库响应。

例如，假设 100 个请求同时查询数据库，而连接池最多只有 20 个连接。 那么可能出现：

```
100 个 Tomcat Worker
          │
          ▼
      请求数据库连接
          │
          ▼
    HikariCP（20 个连接）
          │
     ┌────┴────┐
     │         │
     ▼         ▼
20 个请求     80 个请求
获得连接      等待连接
     │         │
     ▼         ▼
执行 SQL      Worker 阻塞
```

这里需要明确：**数据库连接池不会自动为每个 SQL 查询分配一个独立的 Java 业务线程。** 它主要负责连接的创建、借用、归还和复用。因此，Tomcat Worker、自定义业务线程池和数据库连接池管理的是不同资源。

| 组件                 | 管理的资源   | 主要职责               |
| -------------------- | ------------ | ---------------------- |
| Tomcat Worker 线程池 | 请求处理线程 | 执行 HTTP 请求处理逻辑 |
| 自定义线程池         | 业务工作线程 | 执行主动提交的任务     |
| HikariCP             | 数据库连接   | 管理和复用 JDBC 连接   |

## 十一、JDK 21 虚拟线程会改变这种关系吗？

前面我们已经知道：

传统 Tomcat Worker 在同步等待数据库结果时，通常会占用一个平台线程。

如果大量请求都在等待 I/O，那么就可能需要大量平台线程承载这些等待。

JDK 21 引入虚拟线程后，可以采用不同的执行方式。

Tomcat 可以配置虚拟线程执行器，让请求处理任务由虚拟线程执行。

例如：

```
<Executor
    name="virtualThreadExecutor"
    className="org.apache.catalina.core.StandardVirtualThreadExecutor" />

<Connector
    port="8080"
    protocol="org.apache.coyote.http11.Http11NioProtocol"
    executor="virtualThreadExecutor" />
```

此时，请求处理逻辑可以运行在虚拟线程上。

```
Tomcat NIO Poller
        │
        ▼
Virtual Thread A
        │
        ▼
执行 Controller
        │
        ▼
查询 MySQL
        │
        ▼
遇到支持卸载的阻塞等待
        │
        ▼
Virtual Thread A 暂停
        │
        ▼
释放 Carrier Thread
        │
        ▼
Carrier 执行其他虚拟线程
        │
        ▼
数据库响应返回
        │
        ▼
Virtual Thread A 恢复执行
```

这样，即使请求仍然使用同步 JDBC 调用，虚拟线程在支持卸载的等待期间，也可以避免长期占用载体线程。

不过，虚拟线程并不会自动解决所有问题。

例如：

- 数据库连接池仍然可能只有 20 个连接。
- 外部接口仍然可能存在吞吐量限制。
- CPU 密集型计算仍然需要竞争 CPU。
- JDK 21 中部分阻塞场景可能发生 Pinning。

因此，虚拟线程降低的是线程资源成本，而不是消除其他资源的容量限制。

还有一点值得注意：

如果 Tomcat 请求处理已经运行在虚拟线程上，那么对于某些同步阻塞式 I/O 业务，未必还需要将任务额外提交给自定义平台线程池。

因为直接在虚拟线程中执行支持卸载的阻塞操作，就可能获得较好的线程资源利用率。

但如果需要并行执行多个相互独立的任务，仍然需要考虑任务并发执行与结果协调。

## 十二、总结

回到文章最初的问题：

**Tomcat Worker 与自定义线程池中的线程究竟是什么关系？**

首先，Tomcat Worker 是 Spring MVC 同步请求处理过程中的主要执行线程。

默认情况下，Controller、Service、Mapper 等普通同步方法调用通常都由同一个 Tomcat Worker 执行。

如果调用同步 JDBC、Redis 或 HTTP 接口，Tomcat Worker 可能阻塞等待结果。

其次，自定义线程池是独立的任务执行组件。

Tomcat Worker 可以主动向自定义线程池提交任务，但两者不存在固定的一一对应关系。

同一个 Tomcat Worker 可以提交多个任务，同一个自定义 Worker 也可以执行来自不同请求的任务。

最后，**任务异步执行不意味着 Tomcat Worker 一定不会阻塞。**

如果 Tomcat Worker 提交任务后立即调用：

```
future.get();
```

或者：

```
future.join();
```

那么在任务尚未完成时，它仍然需要阻塞等待。

如果希望在等待异步任务完成期间释放 Tomcat Worker，可以使用 Spring MVC 的 Servlet 异步处理机制，例如 `DeferredResult`。

而 JDK 21 虚拟线程提供了另一种优化思路：通过降低阻塞等待期间的底层线程资源成本，让大量同步请求能够以较低的平台线程占用运行。

最终可以将这几个概念概括为：

> **Tomcat Worker 负责执行请求，自定义线程池负责执行提交的任务，数据库连接池负责管理连接，而 Future 和 CompletableFuture 负责表示结果或协调任务。它们彼此协作，但管理的是不同的资源与执行过程。**

理解它们的关系之后，再分析 Spring MVC 的线程阻塞、异步请求处理和 JDK 21 虚拟线程，就会清晰得多。
