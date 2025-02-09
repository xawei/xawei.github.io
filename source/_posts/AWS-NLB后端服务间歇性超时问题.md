---
title: AWS NLB后端服务间歇性超时问题
date: 2025-02-09 10:26:02
tags: [AWS, NLB]
categories: [AWS]
---

最近在AWS上遇到一个问题：两个EKS集群（ClusterA与ClusterB）跨3个可用区部署，均部署了Istio，但在通过Route53访问服务时，突然出现了间歇性连接超时和`connection reset`。经排查，发现问题出现在NLB与后端服务之间，也和网络配置有关。

<!--more-->

# 问题描述
我们在AWS同一Region内部署了两个EKS集群：
- ClusterA：主要发起请求。
- ClusterB：提供服务，并在该集群上部署了Istio Ingress Gateway，但replica数是2，所以仅在 2 个可用区内有对应的Pod，第三个可用区未部署。
ClusterA上的是通过Route53配置的域名访问ClusterB的服务时，部分请求出现了超时与connection reset的错误。



# 环境架构概览

# 调试过程与根本原因

# 解决方案与优化建议

# 总结