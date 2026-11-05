---
title: "有了 synchronized，为什么还需要 ReentrantLock？"
description: "对比 synchronized 与 ReentrantLock 的同步机制、锁控制能力和适用场景，理解显式锁存在的意义。"
pubDate: 2026-02-28
category: "后端笔记"
tags: ["Java", "并发编程", "ReentrantLock"]
cover: "synchronized-vs-reentrant-lock.png"
coverAlt: "紫色线稿风格的二次元人物构成的并发编程文章封面"
draft: false
---

# 有了 synchronized，为什么还需要 ReentrantLock？

在多线程环境中，当多个线程同时修改共享变量时，如果缺少必要的同步机制，就可能发生竞态条件，导致最终结果不符合预期。

对于这类问题，Java 提供了 `synchronized` 关键字，通过互斥访问保证临界区内操作的线程安全。

例如：

```
private int count = 0;

public synchronized void increment() {
    count++;
}
```

当一个线程进入 `increment()` 方法后，其他线程无法同时进入由同一个对象监视器保护的同步区域。

只有当前线程退出同步方法并释放锁后，其他线程才有机会获取锁。

既然 `synchronized` 已经能够实现互斥访问，而且使用简单、无需手动释放锁，那么 Java 为什么还要在 JUC 并发包中提供 `ReentrantLock`？

要回答这个问题，我们需要先理解 `synchronized` 的工作方式，以及它在锁控制方面存在哪些限制。

## 1. synchronized 是如何实现线程同步的？

`synchronized` 是 Java 提供的内置同步机制，可以用于修饰实例方法、静态方法以及代码块。

例如：

```
public class Counter {

    private int count = 0;

    public synchronized void increment() {
        count++;
    }

    public synchronized int getCount() {
        return count;
    }
}
```

这里的 `synchronized` 实例方法使用当前对象 `this` 对应的监视器锁。

当线程 A 成功获取该对象的锁并进入同步方法后，线程 B 如果尝试进入同一个对象上受相同监视器保护的同步区域，就需要等待。

需要注意，`synchronized` 并不是锁住某个方法，而是锁住指定对象对应的监视器。

例如：

```
synchronized (lock) {
    count++;
}
```

这里使用的是 `lock` 对象对应的监视器，而不是 `count` 变量本身。

### 1.1 synchronized 的底层实现

对于同步代码块，Java 编译器会生成 `monitorenter` 和 `monitorexit` 字节码指令。

可以将其理解为：

```
进入 synchronized 代码块
          ↓
执行 monitorenter
          ↓
尝试获取对象监视器锁
          ↓
获取成功，执行临界区
          ↓
执行 monitorexit
          ↓
释放监视器锁
```

对于同步方法，通常通过方法访问标志 `ACC_SYNCHRONIZED` 表示其同步语义，而不是在方法体中显式插入 `monitorenter` 和 `monitorexit`。

这些机制最终由 JVM 负责执行。

因此，`synchronized` 的锁管理主要由 JVM 提供，而不是由 Java 应用代码自行实现。

### 1.2 synchronized 为什么是可重入锁？

假设一个线程已经获取了某个对象的监视器锁，随后又调用了同一个对象上受该监视器保护的另一个同步方法。

```
public synchronized void methodA() {
    methodB();
}

public synchronized void methodB() {
    // 执行业务逻辑
}
```

当线程进入 `methodA()` 后，它已经持有当前对象的监视器锁。

随后调用 `methodB()` 时，虽然该方法也需要获取同一把锁，但 JVM 允许当前线程再次进入。

这就是锁的可重入性。

**可重入意味着：同一个线程在已经持有某把锁的情况下，可以再次获取这把锁，而不会因为重复获取而把自己阻塞。**

`synchronized` 和 `ReentrantLock` 都支持可重入。

## 2. synchronized 有什么限制？

`synchronized` 能够满足大多数基本的互斥需求，但它提供的锁控制能力相对固定。

### 2.1 获取锁时无法主动放弃等待

考虑下面的代码：

```
synchronized (lock) {
    // 执行耗时操作
}
```

假设线程 A 已经持有锁，线程 B 尝试进入同步代码块。

如果线程 A 长时间不释放锁，线程 B 就需要继续等待。

在 Java 语言层面，`synchronized` 没有提供一个类似下面的接口：

```
boolean tryLock();
```

让线程尝试获取锁，如果获取失败，就立即返回。

因此，对于需要快速失败、避免长时间等待的业务场景，`synchronized` 的灵活性就有所不足。

### 2.2 等待获取锁时不能通过中断取消

假设线程 B 正在等待进入某个 `synchronized` 代码块。

此时其他线程调用：

```
threadB.interrupt();
```

线程 B 不会仅仅因为被中断，就停止等待监视器锁并抛出 `InterruptedException`。

它仍然需要按照监视器锁的获取机制继续等待。

需要区分的是，线程进入 `Object.wait()` 后的等待是可中断的，这与等待获取 `synchronized` 监视器锁不是同一回事。

### 2.3 不支持显式配置公平策略

当多个线程竞争同一把监视器锁时，`synchronized` 并不承诺按照线程到达的先后顺序分配锁。

它也没有提供公平锁配置参数。

这意味着，我们无法像配置 `ReentrantLock` 那样，直接要求它尽量按照等待顺序分配锁。

以上限制并不意味着 `synchronized` 存在设计缺陷，而是因为它更侧重于提供简单、可靠的内置互斥机制。

如果需要更灵活的锁控制，就需要另一种解决方案。

## 3. ReentrantLock 是什么？

`ReentrantLock` 是 Java `java.util.concurrent.locks` 包中提供的可重入互斥锁。

它与 `synchronized` 一样，能够保证同一时刻只有一个线程持有某把互斥锁。

不同之处在于，`ReentrantLock` 通过显式的方法调用完成锁的获取和释放。

例如：

```
private final ReentrantLock lock = new ReentrantLock();

private int count = 0;

public void increment() {
    lock.lock();

    try {
        count++;
    } finally {
        lock.unlock();
    }
}
```

这里有两个重要操作：

- `lock()`：获取锁。
- `unlock()`：释放锁。

与 `synchronized` 不同，`ReentrantLock` 不会在方法结束时自动释放锁。

因此，通常需要使用 `try-finally`，确保线程在正常执行或抛出异常时都能释放锁。

那么，`ReentrantLock` 除了使用方式不同，还提供了哪些能力？

## 4. ReentrantLock 提供了哪些额外能力？

### 4.1 tryLock：尝试获取锁

假设某个业务操作需要访问共享资源，但我们不希望线程长时间等待。

使用 `ReentrantLock`，可以调用：

```
if (lock.tryLock()) {
    try {
        // 获取锁成功，执行业务逻辑
    } finally {
        lock.unlock();
    }
} else {
    // 获取失败，执行降级或其他逻辑
}
```

`tryLock()` 会立即尝试获取锁。

如果锁当前可获取，就成功获取并返回 `true`。

如果无法立即获取，就返回 `false`，而不是一直等待。

例如，在某些允许放弃本次操作的场景中，我们可以在获取失败后直接返回，避免线程堆积。

需要注意，无参 `tryLock()` 在公平锁中也允许直接尝试抢锁，不严格遵循公平排队策略。

### 4.2 lockInterruptibly：可中断地等待锁

在一些业务场景中，线程可能等待锁很长时间。

如果用户已经取消请求，或者系统准备关闭，我们希望线程能够及时停止等待。

`ReentrantLock` 提供了：

```
lock.lockInterruptibly();

try {
    // 执行业务逻辑
} finally {
    lock.unlock();
}
```

当线程在等待获取锁期间收到中断请求时，`lockInterruptibly()` 可以抛出 `InterruptedException`，使调用方有
