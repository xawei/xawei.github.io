---
title: AWS NLB后端服务间歇性超时问题
date: 2025-02-09 10:26:02
tags: [AWS, NLB]
categories: [AWS]
---

在我们的 AWS 环境中，曾遇到一起网络超时疑案。两个 EKS 集群（ClusterA 与 ClusterB）跨 3 个可用区部署，均部署了Istio，但在通过Route53访问服务时，突然出现了间歇性连接超时和`connection reset`的问题。经过排查，发现问题出现在 NLB 与后端服务之间，跟网络配置有关系。

<!--more-->

# 问题描述

# 环境架构概览

# 调试过程与根本原因

# 解决方案与优化建议

# 总结