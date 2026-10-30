---
title: "MySQL 八股笔记：事务、MVCC 与索引"
description: "MySQL 事务相关知识整理，涵盖事务特性、MVCC、Undo Log、索引、慢查询与主从复制。"
pubDate: 2026-10-30
category: "后端笔记"
tags: ["MySQL", "数据库"]
cover: "paper-clouds.webp"
coverAlt: "纸张与云朵构成的知识笔记封面"
draft: false
---

# 事务

## 事务的特性

![image-20260819085953042](/images/blog/mysql/image-20260819085953042.png)

![image-20260819090340258](/images/blog/mysql/image-20260819090340258.png)

![image-20260819090350405](/images/blog/mysql/image-20260819090350405.png)

![image-20260819090406795](/images/blog/mysql/image-20260819090406795.png)

![image-20260819090415934](/images/blog/mysql/image-20260819090415934.png)

![image-20260819090509217](/images/blog/mysql/image-20260819090509217.png)

## MVCC

![image-20260819090535863](/images/blog/mysql/image-20260819090535863.png)

![image-20260819090556152](/images/blog/mysql/image-20260819090556152.png)

## update是不是原子性的？

![image-20260819090616459](/images/blog/mysql/image-20260819090616459.png)

## undolog

![image-20260819090639186](/images/blog/mysql/image-20260819090639186.png)

## 查索引

![image-20260819090705481](/images/blog/mysql/image-20260819090705481.png)

![image-20260819090714365](/images/blog/mysql/image-20260819090714365.png)

## 查询慢办法

![image-20260819090734005](/images/blog/mysql/image-20260819090734005.png)

## 主从复制

![image-20260819090756935](/images/blog/mysql/image-20260819090756935.png)
