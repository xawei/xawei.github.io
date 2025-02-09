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
- ClusterB：提供服务，并在该集群上部署了Istio Ingress Gateway。
ClusterA上的是通过Route53配置的域名访问ClusterB的服务时，部分请求出现了超时与connection reset的错误。

![](https://blog202411-1252613377.cos.ap-guangzhou.myqcloud.com/202502091140278.png)

# 环境架构概览
- EKS集群：两个集群均分布在3个可用区，每个集群均部署了Istio服务网格。
- Istio Ingress Gateway：在ClusterB上，仅在2个可用区部署了对应的Pod。
- AWS NLB配置：
  - 用于对外暴露Istio Ingress Gateway。
  - 未启用cross-zone load balancing（跨AZ负载均衡）。
  - 开启了multiple-zone feature，使得在所有3个可用区均有节点。
  - 配置了多个target group，不同listener对应不同target group，其中一个listener的target group在第三个AZ显示unhealthy。

# 调试过程与根本原因
1. 初步排查
   - 检查发现ClusterB的Istio Ingress Gateway只在2个可用区部署，第三个可用区无对应Pod。
   - 分析NLB配置后发现，由于multiple-zone特性，DNS解析返回了所有可用区的节点IP。
2. 深入调查Target Group健康状态
   - 某个listener对应的target group在第三个AZ全部显示unhealthy。
   - 根据AWS文档，当target group的所有节点都unhealthy时，NLB的domain name system (DNS)解析会返回所有节点的IP地址。https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-troubleshooting.html#no-healthy-targets
    > When there are only unhealthy registered targets, the Network Load Balancer routes requests to all the registered targets, known as fail-open mode.
    - 因此，DNS解析意外返回了第三个AZ的节点IP，导致部分流量被错误路由到没有部署Istio Ingress Gateway Pod的区域，从而引发超时和连接重置问题。
# 解决方案与优化建议

# 总结