---
title: Hypervisor介绍
categories: 虚拟化
date: 2022-3-10 11:48:03

---

hypervisor作用、类型和实现简介。

<!--more-->

## 简介

hypervisor又称VMM（virtual machine monitor），是一种用来创建、管理虚拟机的软件程序。运行hypervisor的硬件设施被称为宿主机（母机），在这之上可以使用hypervisor虚拟出来更多的子机，每个子机都有自己独立的操作系统（guest os）。

hypervisor把它管理的宿主机硬件设施资源如CPU、内存、磁盘存储等当做一个资源池子，按照一定策略分配给运行在其上的虚拟机。hypervisor要做到这一点，需要一些操作系统层面的管理组件，例如memory manager, process scheduler, input/output (I/O) stack, device drivers, security manager, a network stack等。



## Hypervisor的类型

总的来说，hypervisor可以分为两种类型，type 1 hypervisor和type 2 hypervisor，如下图所示。

<img src="https://weiblog-1252613377.cos.ap-chengdu.myqcloud.com/03101021997.png" style="zoom: 33%;" />

### Type 1 hypervisor - Bare-metal

第一种类型的hypervisor叫做Bare-metal hypervisor（裸金属），直接运行宿主机的硬件之上来管理guest os（虚拟子机的操作系统），代替了宿主机本身操作系统的功能，直接给虚拟机调度规划硬件资源。在企业的IDC中，使用这种类型的hypervisor技术最为常见。

下面列举一些主流常见的type 1 hypervisor实现：

* KVM（合入了Linux的2007发行版内核中，如果你正在使用最近的Linux，那么你已经拥有使用KVM的能力了:) ）
* Microsoft Hyper-V
* VMware vSphere



### Type 2 hypervisor - Hosted

第二种类型的hypervisor是Hosted类型的，就称之为托管型的hypervisor吧。这种hypervisor作为软件应用层运行在普通的操作系统之上，来虚拟化出多个guest os给子机使用，因此虚拟子机的资源规划是经过宿主机的操作系统再到底层硬件资源的，跟type 1 hypervisor相比，它需要多经过宿主机的操作系统。这种类型的hypervisor一般是个人用户使用较多，使用起来比较方便。

下面列举一些主流常见的type 2 hypervisor实现：

* VMware Workstation
* Oracle VirtualBox



## KVM介绍

KVM是目前最为流行的一种开源的type 1 hypervisor技术，在2006年第一次发布，并在一年后正式合入了Linux内核版本中。KVM已经成为了Linux中的一部分，KVM能让我们把Linux当做hypervisor运行在宿主机之上，虚拟化出多个独立运行的虚拟计算环境，也就是常说的虚拟机了。

正如前文所说，所有的hypervisor都需要一些操作系统层面的组件来运行虚拟机（memory manager, process scheduler, input/output (I/O) stack, device drivers, security manager, a network stack）。而KVM已经是Linux内核的一部分，那么它天然地就已经具有这种组件和能力了。这些KVM之上的虚拟机，都被实现为普通的Linux进程，被Linux调度器调度，使用专有的虚拟化硬件设备（CPU/显卡/内存/磁盘等）。

值得一提的是，AWS开源的专门用于容器场景的虚拟化技术Firecracker，正是使用KVM相关技术来创建microVM的。



## 参考资料

1. [Red Hat - What is a hypervisor?](https://www.redhat.com/en/topics/virtualization/what-is-a-hypervisor)
2. [VMware - What is a Hypervisor?](https://www.vmware.com/topics/glossary/content/hypervisor.html?resource=cat-1299087558#cat-1299087558)
3. [Red Hat - What is KVM?](https://www.redhat.com/en/topics/virtualization/what-is-KVM)
4. [Red Hat - Containers vs. Virtual Machines](https://www.redhat.com/en/topics/containers/containers-vs-vms)