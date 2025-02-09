---
title: AWS NLB后端服务间歇性超时问题
date: 2025-02-09 10:26:02
tags: [AWS, NLB]
categories: [AWS]
---

最近在AWS上遇到一个问题：两个EKS集群（ClusterA与ClusterB）跨3个可用区部署，均部署了Istio，但在通过Route53访问服务时，突然出现了间歇性连接超时和`connection reset`。经排查，发现问题出现在NLB与后端服务之间，也和网络配置有关。

<!--more-->

## 问题描述
我们在AWS同一Region内部署了两个EKS集群：
- ClusterA：主要发起请求。
- ClusterB：提供服务，并在该集群上部署了Istio Ingress Gateway。
ClusterA上的服务是通过Route53配置的域名访问ClusterB的服务时，部分请求出现了超时与connection reset的错误。

![](https://blog202411-1252613377.cos.ap-guangzhou.myqcloud.com/202502091140278.png)

## 环境架构概览
- EKS集群：两个集群均分布在3个可用区，每个集群均部署了Istio服务网格。
- Istio Ingress Gateway：在ClusterB上，仅在2个可用区部署了对应的Pod。
- AWS NLB配置：
  - 用于对外暴露Istio Ingress Gateway。
  - 未启用cross-zone load balancing（跨AZ负载均衡）。
  - 开启了multiple-zone feature，使得在所有3个可用区均有节点。
  - 配置了多个target group，不同listener对应不同target group。

![](https://blog202411-1252613377.cos.ap-guangzhou.myqcloud.com/202502091319230.png)

## 调试过程与根本原因
1. 初步排查
   - 检查发现ClusterB的Istio Ingress Gateway只在2个可用区部署，第三个可用区无对应Pod。
   - 分析NLB配置后发现，由于multiple-zone特性，但是没配置cross-zone，DNS解析NLB的domain返回了所有可用区的节点IP，这样就导致了部分流量被错误路由到没有部署Istio Ingress Gateway Pod的区域。正常情况下，DNS解析应该只有2个可用区的节点IP，会自动根据健康检测的结果，只返回健康的target groups所在的可用区的NLB节点IP。
    > After you enable an Availability Zone, the Network Load Balancer starts routing requests to the registered targets in that Availability Zone. Your Network Load Balancer is most effective if you ensure that each enabled Availability Zone has at least one registered target.
2. 深入调查Target Group健康状态
   - 发现这个NLB，某个listener对应的target group在第三个AZ全部显示unhealthy。
   - 根据AWS文档，当target group的所有节点都unhealthy时，NLB的domain name system (DNS)解析会返回所有节点的IP地址。https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-troubleshooting.html#no-healthy-targets
    > When there are only unhealthy registered targets, the Network Load Balancer routes requests to all the registered targets, known as fail-open mode.
    - 因此，DNS解析意外返回了第三个AZ的节点IP，导致部分流量被错误路由到没有部署Istio Ingress Gateway Pod的区域，从而引发超时和连接重置问题。

![](https://blog202411-1252613377.cos.ap-guangzhou.myqcloud.com/202502091921606.png)

## 解决方案与优化建议
1. 确保所有Target Group均为健康状态
   - 检查并修复健康检查失败的问题，确保所有listener对应的target group与实际部署状态匹配。
2. 启用Cross-Zone Load Balancing
   - 开启NLB的跨AZ负载均衡功能，使流量在各AZ之间均衡分布，即使DNS解析返回了第三个AZ的节点IP，也能正确转发至健康Pod。
3. 在所有可用区部署Istio Ingress Gateway
   - 考虑在ClusterB的所有3个可用区部署Ingress Gateway Pod，从根本上避免因单个AZ缺少入口而导致的问题。
4. 实时监控与告警
   - 对NLB各个target group的健康状态进行实时监控，及时设置告警，以便发现异常后迅速响应。

## 总结
在云上复杂环境中，细微的配置差异都可能引发问题。此次问题由AWS NLB的multiple-zone配置与部分target group健康状态不一致引起。通过仔细的排查和调整配置，最终找到了问题根源并提出了相应的解决方案。