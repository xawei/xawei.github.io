---
title: Kubernetes架构及核心组件介绍
categories: kubernetes
date: 2019-10-17 19:03:15
---



Kubernets是一个容器编排平台，本文主要介绍其整体架构，以及各个核心组件之间是如何协作完成容器的各项编排工作。

<!--more-->

## Kubernetes的架构及组件基础概念

当你完成Kubernets部署的时候，你得到的是一个集群，集群包含控制面（control plane）组件（master部分），以及woker节点。用户的业务应用容器以Pod的形式，运行在这些worker节点之前。而master控制面组件，则负责管理集群中运行woker节点以及各个容器Pod。在生产环境中，控制面组件一般以多副本的形式部署在多台不同的机器上，以保证高可用。

下面是Kubernets集群的运行架构及核心组件示意图：

![](https://weiblog-1252613377.cos.ap-chengdu.myqcloud.com/201912152000007.png)

如图所示，左边的控制面的组件，包括etcd, controller-manager, kube-scheduler等。而worker节点上也运行着kubelet和kube-proxy组件。下面分别简单介绍各组件的主要功能。



## 控制面组件（Control Plane Components）

控制面组件执行集群层面的全局操作（如调度）、探测事件并做出相应动作（如当pod副本数不符合deployment中replicas字段设置的值时，启动或停止pod）等。控制面的组件可以在集群中的任意节点上运行，但是一般为了方便管理，一般这些控制面组件会在特定的节点上运行，称之为master节点，不会运行用户的业务容器，与worker节点区分开来。

### kube-apiserver

kube-apiserver是Kubernetes集群的一个控制面组件，对外暴露了Kubernetes API。kube-apiserver是一个无状态的件，我们可以水平扩展，部署多个副本，让流量均衡地分发到多个kube-apiserver服务上。

### etcd

etcd是Kubernetes的默认的持久化KV存储后端，存储整个Kuberntes集群的各种状态信息。需要注意备份这些信息。

### kube-scheduler

Kube-scheduler通过kube-apiserver持续监听集群中新创建还未分配节点的pod，根据一系列策略算法，选择节点来运行pod。策略算法考虑的因素包括：当前pod和其他pod的resource requirements、软硬件、policy限制、亲和性/反亲和性、资源分布性（例如多个pod应该落在多个可用区来增强可用性）等。

需要注意的是，kube-scheduler是为pod分配节点，在pod资源上进行标记，而未实际把pod启动起来，因为那是kubelet的工作，后面会介绍到。

### kube-controller-manager

kube-controller-manager是Kubernets中各种内置controller控制器的合集，在逻辑上，每个controller都是独立运行工作的，而实际上为了降低复杂性，这些controller都被编译到一个二进制中，启动一个进程来运行这些controller。一些典型的controller包括：

- Node controller：监测节点的宕机情况，并做出响应（如驱逐宕机节点上的pod）；
- Service controller：为每个新的namespace创建默认的ServiceAccounts

### cloud-controller-manager

我们可以在Kubernetes中添加特定云服务的控制逻辑。这些cloud controller与Kubernets中只与内部交互的controller不同，会与云厂商的API进行交互，管理云基础设置。



## Worker节点上的组件

kubelet和kube-proxy运行在每个节点上，负责维护运行的pod和Kubernetes的运行时环境。

### kubelet

kueblet是一个运行在节点上的agent，通过kube-apiserver监听分配到该节点上的pod，然后根据pod的定义，调用容器运行时，确保pod的容器业务运行起来。（当然还有特殊的static pod了，可以参考：[Kubernetes中的Static pod实现与使用场景分析](http://xawei.xyz/2021/06/22/Kubernetes%E4%B8%AD%E7%9A%84static%20pod%E5%AE%9E%E7%8E%B0%E4%B8%8E%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF%E5%88%86%E6%9E%90/)）

### kube-proxy

Kube-proxy是每个节点上都运行的network proxy，负责实现Kubernetes中的Service的概念。Kube-proxy维护节点上的网络路由规则，让集群上同节点或不同节点的pod可以通信。

如果操作系统支持包过滤层（packet filtering layer），那么kube-proxy会使用这一方式实现它的功能，否则kube-proxy会自己来进行流量转发。

### Container runtime

容器运行时是负责实际运行容器的组件，如containerd、CRI-O等，任意使用了[Kuberntes CRI协议](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-node/container-runtime-interface.md)的服务都可以作为Kuberntes的容器运行时。



## 参考资料

1. [Kubernetes Docs - Kubernetes Components](https://kubernetes.io/docs/concepts/overview/components/)
2. [Kubernetes Docs - Control Plane-Node Communication](https://kubernetes.io/docs/concepts/architecture/control-plane-node-communication/)

