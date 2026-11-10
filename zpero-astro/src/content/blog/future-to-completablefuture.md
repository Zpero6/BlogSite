---
title: "从 Future 到 CompletableFuture，异步任务是如何编排的？"
description: "从线程池执行任务出发，理解 Future 的结果获取与 CompletableFuture 的异步编排能力。"
pubDate: 2026-03-03
category: "后端笔记"
tags: ["Java", "并发编程", "CompletableFuture"]
cover: "future-to-completablefuture-girl.jpg"
coverAlt: "二次元少女插画构成的异步编程文章封面"
draft: false
---

# 从 Future 到 CompletableFuture，异步任务是如何编排的？

线程池通过复用工作线程、管理任务队列和限制线程数量，解决了线程资源管理的问题。 但是线程池的主要解决问题是任务如何执行，而不是多个任务之间如何协作。

有这样一个任务：

```text
              任务 A
                │
          得到计算结果
                │
         ┌──────┴──────┐
         │             │
         ▼             ▼
       任务 B         任务 C
         │             │
         └──────┬──────┘
                │
                ▼
             合并结果
```

这里存在两个要求：

第一，B 和 C 必须等待 A 完成后才能执行。

第二，B 和 C 之间没有依赖关系，因此可以并发执行。
## 一、从 Thread 到 Future：异步任务如何获取结果？

### 1.1 Thread 的局限

最初，我们可以直接使用 `Thread` 创建线程。d

```java
Thread thread = new Thread(() -> {
    System.out.println("执行任务");
});

thread.start();
```

但是如果任务要返回一个结果呢？ Thread 没有提供可以返回结果的办法，我们当然可以使用 共享变量保存结果然后通过 join（） 等待任务结束。

但是这样需要自己处理线程间的数据共享和同步。所以Java 提供了Callable 和 Future 


### 1.2 Future ： 代表未来的计算结果

和 Runnable 不同，Callable 可以返回计算结果，还可以抛出异常。 我们只需要定义一个 Callable 作为任务对象，然后Future 作为一个提交任务和异步等待结果的对象让线程等待结果的返回。

```java
Callable<Integer> task =() -> {
    return 	10 + 20 ;
};
ExecutorService executor = new  Executors.newFixedThreadPoll(2);
Future<Integer> future = executor.submit(task);
```


### 1.3 Future  的问题？

如果一个任务 后面的任务需要前面任务的结果，那么他们之间使用Future只能串行执行，通过get（） 方法来协调依赖关系 。 可是如果任务量有十几个以上的任务的时候，就需要人为代码去协调组织依赖关系，代码容易复杂。所以我们需要一种机制： **让任务之间有直接的依赖关系，调用线程不必阻塞等待后再手动提交下一个任务。**   这就是 CompletableFuture


## 二、 CompletableFuture是什么？

从Java 8 开始引入，定义如下：

```java
public class CompletableFuture<T> implements Future<T>,CompletionsStage<T>{
	//...
	}
```

`CompletionStage<T>` 则定义了一系列方法，用于描述当前计算完成后应该执行的操作。 因此，completableFuture 不仅具有了Future 的功能，还可以知道： 

* 一个任务完成以后接下来做什么；
* 多个任务间有哪些依赖关系、那些可以并发完成；
* 多个任务结束后结果如何合并；
* 任务发生异常如何处理；

## 三、如何创建 CompletableFuture？

创建方法有二：

```java
// 1. runAsync , 由于传参是 Runnable ， 没有返回值， T 的类型为 void
CompletableFuture<void> future = 
    CompletableFuture.runAsync(() ->{
        System.out.println("结果");
    });
//2. supplyAsync()   有结果有类型 ， 传参类型是Supplier<T> 
CompletableFuture<Integer> future = 
    CompletableFuture
    			.supplyAsync(() -> 10)
    			.thenApply(x -> x *2)
    			.thenApply(x -> x+5);

```

### 3.1 CompletableFuture 和线程池之间的关系？

如果不指定Executor 执行器，那么有可能会默认使用指定的执行器。在JDK17 中，默认异步执行器通常是： `ForkJoinPool.commonPoll()`。开发的时候我们一般显式指定线程池：

```java
ExecutorService executor = Executor.newFixedThreadPool(10);
CompletableFuture<Integer> future = 
    		CompletableFuture.supplyAsync(()->10 , executor);
```


### 3.2 后续任务的依赖

对于 supplyAsync 来说 有 两个API ： thenApply（） 和 thenApplyAsync();

`thenApply()` 不会强制将后续操作重新提交给线程池。它可能由完成前一个阶段的线程执行，也可能由注册回调的线程执行，具体取决于完成时机。

```java
thenApplyAsync(..., executor)
```

会通过指定的执行器安排后续操作。需要注意： **Async 不意味着一定创建一个新线程，而是意味着后续操作通过异步执行机制调度。**

因此，`thenApply()` 与 `thenApplyAsync()` 的区别，并不是简单的“同步与异步”。更准确地说，它们主要区别在于后续操作如何被调度执行。

### 3.3 如何组织多个并发任务？

以开头的例子为例

```text
      			 A
                 │
              得到 10
                 │
          ┌──────┴──────┐
          │             │
          ▼             ▼
          B             C
        10²           10³
          │             │
          ▼             ▼
         100           1000
          │             │
          └──────┬──────┘
                 │
                 ▼
              100 + 1000
                 │
                 ▼
                1100
```

```java
ExecutorService executor =
    Executors.newFixedThreadPool(3);

try {
    CompletableFuture<Integer> futureA =
        CompletableFuture.supplyAsync(
            () -> 10,
            executor
        );

    CompletableFuture<Integer> futureB =
        futureA.thenApplyAsync(
            x -> x * x,
            executor
        );

    CompletableFuture<Integer> futureC =
        futureA.thenApplyAsync(
            x -> x * x * x,
            executor
        );

    CompletableFuture<Integer> result =
        futureB.thenCombine(
            futureC,
            Integer::sum
        );

    System.out.println(result.join());
} finally {
    executor.shutdown();
}
```

B、C 之间互相不依赖，可以并行，而且都有一个共同的前置依赖 A。 那么他们都可以 使用 `FutureA.thenApplyAsync()`  来继续后续的计算。

## 四、thenApply、thenCompose 和 thenCombine 的区别

这是 `CompletableFuture` 中最容易混淆的三个方法。

它们分别对应三种不同的任务关系。

### 4.1 thenApply：转换结果

```java
CompletableFuture<Integer> future =
    CompletableFuture.completedFuture(10);

CompletableFuture<Integer> result =
    future.thenApply(x -> x * 2);
```

这里的关系是：

```text
一个结果 → 转换 → 另一个结果
```

### 4.2 thenCompose：串联异步任务

假设我们有一个方法：

```java
static CompletableFuture<Integer> calculateAsync(
        int x,
        Executor executor) {

    return CompletableFuture.supplyAsync(
        () -> x * 2,
        executor
    );
}
```

现在希望先得到 10，再将它传给 `calculateAsync()`。

如果使用 `thenApply()`：

```java
CompletableFuture<CompletableFuture<Integer>> result =
    CompletableFuture
        .completedFuture(10)
        .thenApply(x ->
            calculateAsync(x, executor)
        );
```

会得到一个嵌套结构：

```java
CompletableFuture<CompletableFuture<Integer>>
```

因为 `calculateAsync()` 本身返回的就是一个 `CompletableFuture`。

如果使用 `thenCompose()`：

```java
CompletableFuture<Integer> result =
    CompletableFuture
        .completedFuture(10)
        .thenCompose(x ->
            calculateAsync(x, executor)
        );
```

得到的就是：

```java
CompletableFuture<Integer>
```

`thenCompose()` 会将嵌套的异步结果展开。

因此，它适合将两个存在先后依赖关系的异步操作串联起来。

### 4.3 thenCombine：合并两个结果

```java
CompletableFuture<Integer> a =
    CompletableFuture.completedFuture(10);

CompletableFuture<Integer> b =
    CompletableFuture.completedFuture(20);

CompletableFuture<Integer> result =
    a.thenCombine(b, Integer::sum);
```

这里不需要将 A 的结果传给 B。

只需要等待两者都完成，再合并结果。

三者可以概括为：

| 方法          | 作用         | 关系           |
| ------------- | ------------ | -------------- |
| `thenApply`   | 转换结果     | A → B          |
| `thenCompose` | 串联异步任务 | A 完成后启动 B |
| `thenCombine` | 合并两个结果 | A + B → C      |

理解这些方法时，最重要的不是记住方法名，而是先判断任务之间存在什么关系。

## 五、CompletableFuture 如何处理异常？

异步任务同样可能执行失败。例如：

```java
CompletableFuture<Integer> future =
    CompletableFuture.supplyAsync(() -> {
        throw new RuntimeException("计算失败");
    });
```

这里的异常发生在执行任务的线程中。`CompletableFuture` 会将异常作为该阶段的异常完成结果进行传播。如果后续阶段依赖前一个阶段的正常结果，那么当前一个阶段异常完成时，这些后续操作通常不会执行正常的转换逻辑。例如：

```java
CompletableFuture<Integer> result =
    future.thenApply(x -> x * 2);
```

如果 `future` 异常完成，那么 `thenApply()` 中的乘法不会正常执行。

### 5.1 exceptionally：提供异常恢复结果

```java
CompletableFuture<Integer> result =
    CompletableFuture
        .supplyAsync(() -> {
            if (true) {
                throw new RuntimeException("计算失败");
            }
            return 10;
        })
        .exceptionally(ex -> {
            System.out.println(ex.getMessage());
            return 0;
        });
```

`exceptionally()` 会在前一个阶段异常完成时执行。

它可以提供一个替代结果，使后续阶段继续按照正常结果处理。

### 5.2 handle：同时处理成功和失败

```java
CompletableFuture<Integer> result =
    future.handle((value, ex) -> {
        if (ex != null) {
            return 0;
        }

        return value;
    });
```

`handle()` 无论前一个阶段正常完成还是异常完成，都会执行。

它可以根据执行结果决定返回什么值。

### 5.3 whenComplete：观察执行结果

```java
future.whenComplete((value, ex) -> {
    if (ex != null) {
        System.out.println("任务执行失败");
    } else {
        System.out.println("任务执行成功");
    }
});
```

`whenComplete()` 主要用于观察任务的完成情况，例如记录日志或监控指标。

它通常不会把原来的异常转换成正常结果。

因此：

- `exceptionally`：异常时恢复。
- `handle`：统一处理成功和失败。
- `whenComplete`：观察完成结果。

## 六、CompletableFuture 如何等待任务完成？

虽然 `CompletableFuture` 可以通过回调组织任务，但有时调用者仍然需要获取最终结果。

最常见的两个方法是：

```java
get()
join()
```

### 6.1 get

```java
Integer result = future.get();
```

**适用于极少数需要对“线程中断”做特殊相应的底层并发场景。** 如果任务尚未完成，调用线程会阻塞等待。`get()` 可能抛出：

```java
InterruptedException
ExecutionException
```

### 6.2 join

```java
Integer result = future.join();
```

`join()` 同样会在结果尚未完成时阻塞调用线程。与 `get()` 不同，它不会要求调用者显式处理受检异常。任务异常完成时，`join()` 通常通过 `CompletionException` 等非受检异常传播失败。 **大多数情况的选择**

### 6.3 CompletableFuture 不等于非阻塞 I/O

这里需要明确一个容易混淆的概念。

```java
CompletableFuture<Integer> future =
    CompletableFuture.supplyAsync(() -> {
        Thread.sleep(1000);
        return 10;
    }, executor);
```

这段代码需要处理 `InterruptedException`，因此实际编写时还需要异常处理。 **即使任务被放进 CompletableFuture，执行 Thread.sleep() 的工作线程仍然会阻塞。**`CompletableFuture` 不会自动将阻塞操作变成非阻塞操作。 ==它只是允许我们将计算放到其他线程执行，并以非阻塞等待的方式描述后续依赖==

如果调用者立即执行：

```java
future.join();
```

调用线程同样可能阻塞。

因此，要区分：

- 异步执行：任务不一定由调用线程执行。
- 非阻塞等待：调用线程不必停下来等待结果。
- 非阻塞 I/O：底层 I/O 操作不需要长期占用线程等待结果。

这三个概念并不相同。

## 七、CompletableFuture 为什么能够自动触发后续任务？

前面我们已经知道：

```java
CompletableFuture<Integer> result =
    CompletableFuture
        .supplyAsync(() -> 10)
        .thenApply(x -> x * 2);
```

当第一个任务完成后，第二个阶段会自动执行。但为什么它能够做到这一点？

传统 `Future` 主要提供了等待和读取结果的能力。 而 `CompletableFuture` 除了保存结果，还会保存依赖当前阶段的后续操作。

### 7.1 CompletableFuture 保存了什么？

以 JDK 17 的实现为例，`CompletableFuture` 内部有两个值得关注的字段：

```java
volatile Object result;

volatile Completion stack;
```

这里的 `result` 用于表示当前阶段的完成结果。

它不仅可能保存正常计算结果，也可能通过内部包装结构表示异常完成。

而 `stack` 则用于管理依赖当前阶段的后续操作。

可以将它简化理解为：

```text
CompletableFuture
       │
       ├── result
       │     │
       │     └── 计算结果或异常
       │
       └── stack
             │
             └── 等待触发的后续操作
```

需要注意，`result == null` 在这一实现中表示阶段尚未完成；正常计算得到的 `null` 会使用内部特殊表示。

### 7.2 thenApply 做了什么？

假设：

```java
CompletableFuture<Integer> a =
    new CompletableFuture<>();

CompletableFuture<Integer> b =
    a.thenApply(x -> x * 2);
```

此时 A 尚未完成。

调用 `thenApply()` 时，`CompletableFuture` 会建立 B 对 A 的依赖关系。

可以简化理解为：

```text
Future A
   │
   ├── 当前尚未完成
   │
   └── 后续操作
          │
          ▼
       x -> x * 2
          │
          ▼
       Future B
```

在 JDK 17 中，类似 `thenApply` 的依赖会使用内部 `UniApply` 等完成节点来表示。

这些节点记录了需要执行的函数、依赖的源阶段以及目标阶段等信息。

因此，后续操作并不是凭空自动执行的。

它们实际上已经被注册到了前一个阶段的完成机制中。

### 7.3 前一个任务完成后发生什么？

假设我们调用：

```java
a.complete(10);
```

此时 A 被正常完成，结果为 10。

`CompletableFuture` 会尝试触发依赖 A 的后续操作。

对于前面的例子：

```java
x -> x * 2
```

会使用 A 的结果 10 进行计算。

得到：

```java
20
```

随后 B 也完成。

整个过程可以理解为：

```text
Future A
   │
   ▼
complete(10)
   │
   ▼
保存完成结果
   │
   ▼
触发依赖 A 的 Completion
   │
   ▼
执行 x -> x * 2
   │
   ▼
Future B 完成，结果为 20
```

这就是 `CompletableFuture` 能够实现任务链式执行的基础。

### 7.4 如果注册回调时，任务已经完成呢？

考虑下面的代码：

```java
CompletableFuture<Integer> a =
    CompletableFuture.completedFuture(10);

CompletableFuture<Integer> b =
    a.thenApply(x -> x * 2);
```

这里 A 在调用 `thenApply()` 之前就已经完成。

这种情况下，不需要再等待 A 完成。

`CompletableFuture` 可以在注册后续操作时直接尝试执行对应逻辑。

因此：

**CompletableFuture 不仅需要处理“先注册依赖，后完成任务”，还需要处理“任务已经完成，再注册依赖”的情况。**

这也是为什么普通的 `thenApply()` 回调不保证由某个固定线程执行。

## 八、CompletableFuture 如何保证线程安全？

既然多个线程可能同时操作一个 `CompletableFuture`，就会出现并发问题。

例如：

线程 A：

```java
future.complete(10);
```

线程 B：

```java
future.complete(20);
```

如果两个线程同时尝试完成同一个 Future，最终应该保存哪个结果？

`CompletableFuture` 的完成状态必须保证一致性。

在 JDK 17 的实现中，完成结果的关键操作会使用 CAS。

例如，其内部存在类似下面的逻辑：

```java
boolean casResult(Object expected, Object value)
```

通过 CAS，多个线程可以竞争将结果从未完成状态更新为完成状态。

对于普通的完成操作：

**只有一个线程能够成功将尚未完成的 CompletableFuture 转换为已完成状态。**

其他线程不能再覆盖已经确定的完成结果。

此外，依赖节点的注册与移除也涉及 CAS 等并发控制机制。

这里就与前面学习的 `volatile` 和 CAS 联系起来了。

`volatile` 提供必要的可见性与内存顺序保证。

CAS 则用于实现关键状态的原子更新。

因此，`CompletableFuture` 的实现并不是简单地使用一个变量保存结果，而是需要协调多个线程之间的状态更新与依赖触发。

需要注意，JDK 还提供了 `obtrudeValue()`、`obtrudeException()` 等特殊方法，可以强制覆盖已记录的结果或异常；它们不属于普通完成操作的语义。

## 九、CompletableFuture 与 AQS 有什么关系？

在前面的文章中，我们介绍过 AQS。

AQS 主要用于构建锁、信号量等同步组件。

它通过同步状态、等待队列以及线程阻塞与唤醒机制，协调多个线程对共享资源的访问。

而 `CompletableFuture` 的主要目标并不是互斥访问共享资源。

它需要解决的是：

**一个计算阶段完成后，如何将结果传递给依赖它的其他阶段。**

因此，两者虽然都涉及并发状态管理，但设计目标不同。

| 对比     | AQS                      | CompletableFuture        |
| -------- | ------------------------ | ------------------------ |
| 主要目标 | 线程同步与资源协调       | 异步计算与任务依赖编排   |
| 核心状态 | 同步状态 `state`         | 计算完成结果 `result`    |
| 主要结构 | 同步等待队列             | 依赖完成节点             |
| 典型操作 | 获取锁、释放锁           | 完成阶段、触发后续阶段   |
| 典型应用 | ReentrantLock、Semaphore | 异步任务链、并发结果合并 |

不过，`CompletableFuture` 在实现阻塞等待结果的 `get()`、`join()` 等方法时，也会涉及等待线程的挂起与唤醒。

在 JDK 17 中，相关等待机制使用了 `LockSupport`。

但不能因此认为 `CompletableFuture` 是基于 AQS 实现的。

**CompletableFuture 有自己的完成状态和依赖节点管理机制，并不依赖 AQS 来完成任务编排。**

## 十、使用 CompletableFuture 需要注意什么？

### 10.1 不要认为 Async 就一定更快

假设任务只是：

```java
int result = 10 + 20;
```

如果把它提交给线程池：

```java
CompletableFuture.supplyAsync(() -> 10 + 20);
```

反而可能增加任务调度开销。

异步执行的价值在于合理利用并发能力，而不是让所有计算都变成异步。

### 10.2 不要在任务链中随意阻塞等待

例如：

```java
CompletableFuture<Integer> result =
    CompletableFuture.supplyAsync(() -> {
        return anotherFuture.join();
    }, executor);
```

这里执行任务的工作线程可能阻塞等待另一个 Future。

如果线程池容量较小，而且任务之间存在复杂的相互等待关系，就可能发生线程饥饿甚至死锁。

因此，对于任务依赖关系，应优先使用：

```java
thenCompose()
thenCombine()
```

而不是在工作线程内部频繁调用 `join()`。

### 10.3 注意线程池容量

`CompletableFuture` 只是负责组织任务。

真正执行任务的仍然是线程池中的工作线程。

如果同时创建大量异步任务，仍然可能出现：

- 工作线程耗尽。
- 等待队列积压。
- 线程池拒绝任务。
- 下游资源竞争加剧。

因此，使用 `CompletableFuture` 并不能绕过线程池的容量限制。

### 10.4 超时不意味着任务一定停止

例如：

```java
future.orTimeout(2, TimeUnit.SECONDS);
```

如果两秒内没有完成，对应的 `CompletableFuture` 会异常完成。

但底层正在执行的任务不一定会立即停止。

例如，正在执行阻塞式 I/O 的工作线程可能仍然等待底层操作结束。

因此，实际开发中还需要结合底层操作的超时机制。

## 十一、总结

回到文章最初的问题：

**既然已经有了线程池和 Future，为什么还需要 CompletableFuture？**

线程池解决了线程资源管理和任务执行的问题。

`Future` 让我们能够获取异步任务的计算结果。

但当多个任务之间存在复杂依赖关系时，传统 `Future` 往往需要调用线程主动等待结果，再手动组织后续任务。

而 `CompletableFuture` 提供了另一种思路：

**不再要求调用线程逐步协调每个任务，而是直接描述任务之间的依赖关系，让后续操作在前置阶段完成后自动触发。**

从实现角度看，`CompletableFuture` 主要依靠以下机制：

1. 使用完成状态保存计算结果或异常。
2. 使用依赖节点记录后续需要执行的操作。
3. 在阶段完成时触发相应的依赖操作。
4. 通过 CAS 等并发机制协调完成状态与依赖节点。
5. 在需要阻塞获取结果时，使用等待与唤醒机制协调调用线程。

因此，`CompletableFuture` 的核心价值并不是简单地“开启异步线程”。

而是将原本需要手动协调的异步任务，组织成具有明确依赖关系的计算流程。

可以用一句话总结：

> **线程池负责执行任务，Future 负责表示结果，而 CompletableFuture 负责将异步任务及其结果组织起来。**

理解这一点，就能从单纯使用异步 API，进一步理解 Java 异步编程的设计思想。
