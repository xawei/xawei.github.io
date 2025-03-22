---
title: 使用CRD和Aggregated Server扩展Kubernetes
categories: kubernetes
date: 2021-3-5 10:01:00

---



Kubernetes官方提供了两种常用的方式让开发者可以方便地进行自定义的扩展。一种是使用CRD（Custom Resource Definition），另一种则是配置Aggregation layer，将请求代理到Aggreated Server中。本文主要介绍两者的使用原理和相关的适用场景。

<!--more-->

## CRD扩展原理简介

在Kube-apisever中，有许多内置的API对象，例如我们非常熟悉的Pod、ConfigMap、Namespace等。Kube-apiserver能够识别这些API对象，并把相关的资源实例持久化存储在集群的etcd中。所以当我们使用```kubectl get node```等命令时，Kube-apiserver能够正确处理，返回相应的信息。

如果我们需要让Kube-apiserver认识一些自定义的对象，例如nodePool，并且通过```kubectl get nodepool```能够输出相关的信息，该怎么办呢？Kubernetes官方提供的CRD特性，让我们能够自定义API对象来扩展Kube-apiserver。

首先，需要在Kubernetes中创建CRD模板对象。即告诉Kubernetes，我现在需要一种自定义的对象，它带有哪些字段、哪些字段是必填或可选、字段的值应该是什么类型、通过kubectl查看时应该如何输出等。这时，Kube-apiserver就已经理解了你需要自定义的资源模板了。CRD相当于一个类的模板。

然后，当需真正创建了自定义资源实例CR后，对应的信息就会持久化存储在后端的etcd中，我们可以通过kubectl命令查看到实例的信息。而CRD一般会配套对应的Controller，监听自定义资源的创建、更新、删除等，由Controller再进行实际业务逻辑的处理。



## Aggreated Server扩展原理简介

使用Aggregation Layer，可以在Kubernetes的核心API之外，进行额外的扩展。例如 [metrics server](https://github.com/kubernetes-sigs/metrics-server)，就是在一种现成的扩展方案。当然我们也可以自行开发需要扩展的API。CRD的方案，是让kube-apiserver识别更多类型的对象，而Aggregation layer则不一样，它是在Kube-apiserver进程中一起运行的，需要注册扩展的资源才能发挥功效。

通过APIService对象可以注册API：使用APIService声明一个在Kubernetes API中的URL路径。这样，当访问这个URL路径时，Kube-apiserver中的Aggregation layer就会把请求代理转发到对应的APIService对象。

最常见的使用APService的方式，是在Kubernetes集群中启动Pod(s)来作为扩展的API Server。而一般情况下，使用Aggreated  Server来管理资源，都会配套相应的一个或多个Controller在集群中。使用apiserver-builder库可以生成扩展的Aggreated Server和对应Controller的基本工程框架。

![](https://weiblog-1252613377.cos.ap-chengdu.myqcloud.com/03101324436.png)



## 使用场景分析

### CRD

在kubernetes中管理有状态应用，是比较复杂的，而一个相对灵活、编程友好的管理"有状态应用"的解决方案就是Operator，依赖CRD和Controller进行实现。

Operator的工作原理，实际上是利用Kubernetes的CRD来描述我们想要部署的"有状态应用"或想要得到的资源，然后再自定义Controller中根据自定义API对象的变化，完成具体的部署和维护工作。

例如Kubernetes的子项目Cluster API，也是使用Operator模式，在Management Cluster中通过应用CRD来定义集群、机器等资源模板，额外部署的各种Controller，则是负责读取相关的CRD实例信息，对集群、机器等资源进行生命周期的管理，包括创建、更新、删除等。

![](https://weiblog-1252613377.cos.ap-chengdu.myqcloud.com/03101325491.png)



### Aggregated Server

一个典型的通过APIService方式配置Aggregated Server来扩展Kube-apisever的项目，则是Metric server了。

Metric server采集进行autoscaling所需的指标数据：CPU & Memory。Metric server本身并不会计算指标数值，而是Kubelet计算的。Metric server采集Kubelet所暴露的指标数据，进行聚集后，通过API的形式暴露出来，进行autoscaling。

![](https://weiblog-1252613377.cos.ap-chengdu.myqcloud.com/03101327905.png)



## 参考资料

1. [Kubernetes Docs - Configuring the Aggregation Layer](https://kubernetes.io/docs/tasks/extend-kubernetes/configure-aggregation-layer/)
2. [Kubernetes Docs - Setup an Extension API Server](https://kubernetes.io/docs/tasks/extend-kubernetes/setup-extension-api-server/)
3. [Kubernetes Docs - APIServer Aggregation](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/)
4. [Kubernetes Docs - Resource Metrics Pipeline](https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/)
5. [Red Hat - Kubernetes Operators Best Practices](https://cloud.redhat.com/blog/kubernetes-operators-best-practices)