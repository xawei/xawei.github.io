---
title: Hypervisor介绍
categories: 虚拟化
date: 2022-3-10 11:48:03

---

hypervisor作用、类型和实现简介。

<!--more-->

## 简介

你是否想过如何在一台计算机上同时运行多个操作系统？或者如何让服务器更高效地利用硬件资源？答案就在于 hypervisor 技术。Hypervisor，又称虚拟机监视器（Virtual Machine Monitor，简称 VMM），是一种强大的软件程序，它允许你在单一硬件平台上创建和管理多个虚拟机（VM）。每个虚拟机都可以运行独立的操作系统（称为 Guest OS），就像它们运行在独立的物理机器上一样。

Hypervisor 的核心功能是将宿主机的硬件资源（如 CPU、内存、磁盘存储等）虚拟化为一个资源池，然后根据需求分配给各个虚拟机。为了实现这一点，hypervisor 需要依赖操作系统层面的组件，包括内存管理器（memory manager）、进程调度器（process scheduler）、输入/输出栈（I/O stack）、设备驱动（device drivers）、安全管理器（security manager）和网络栈（network stack）等。


## Hypervisor的类型

Hypervisor 主要分为两种类型：Type 1（裸金属） 和 Type 2（托管型）。这两种类型的架构和应用场景各有不同，下文将详细说明。
<img src="https://weiblog-1252613377.cos.ap-chengdu.myqcloud.com/03101021997.png" style="zoom: 33%;" />

### Type 1 hypervisor - Bare-metal

Type 1 hypervisor（裸金属 hypervisor）直接运行在宿主机的硬件上，负责管理虚拟机并分配硬件资源。它不需要依赖宿主机的操作系统，而是自己充当一个轻量级的操作系统。这种类型的 hypervisor 以高性能和安全性著称，因此广泛应用于企业的数据中心（IDC）。

常见的 Type 1 hypervisor 包括： 
- KVM：一个开源 hypervisor，已集成到 Linux 内核（2007 年版本起）。如果你使用的是较新版本的 Linux，KVM 已内置其中。
- Microsoft Hyper-V：微软推出的虚拟化平台，常见于 Windows 服务器环境。
- VMware vSphere：VMware 的旗舰产品，用于构建和管理大规模虚拟化基础设施。


### Type 2 hypervisor - Hosted

Type 2 hypervisor（托管型 hypervisor）作为应用程序运行在宿主机的操作系统之上。它通过宿主机的操作系统访问硬件资源，再将这些资源分配给虚拟机。相比 Type 1，它多了一层操作系统中介，因此性能稍逊，但安装和使用更简单，常用于个人用户或开发测试场景。

常见的 Type 2 hypervisor 包括： 
- VMware Workstation：VMware 的桌面虚拟化产品，支持 Windows 和 Linux。
- Oracle VirtualBox：免费开源的虚拟化工具，支持多种操作系统。


## KVM介绍

KVM（Kernel-based Virtual Machine，基于内核的虚拟机）是一种广受欢迎的开源 Type 1 hypervisor。它于 2006 年首次发布，并在 2007 年正式合并到 Linux 内核中，成为 Linux 的一部分。这意味着，使用较新版本的 Linux 系统时，你无需额外安装即可使用 KVM。

KVM 的独特之处在于它将 Linux 内核转变为一个 hypervisor，允许用户在 Linux 上创建和管理虚拟机。每个虚拟机都被视为一个普通的 Linux 进程，由 Linux 的调度器管理，并使用虚拟化的硬件设备（如 CPU、内存、磁盘等）。KVM 充分利用了 Linux 内核现有的组件（如内存管理、进程调度、I/O 栈等），因此运行高效且稳定。

此外，KVM 支持硬件辅助虚拟化技术，如 Intel 的 VT-x 和 AMD 的 AMD-V，进一步提升了虚拟化性能。一个有趣的例子是，AWS 开源的 Firecracker 项目基于 KVM 技术开发，专门用于容器场景，创建轻量级的 microVM。


## 参考资料

1. [Red Hat - What is a hypervisor?](https://www.redhat.com/en/topics/virtualization/what-is-a-hypervisor)
2. [VMware - What is a Hypervisor?](https://www.vmware.com/topics/glossary/content/hypervisor.html?resource=cat-1299087558#cat-1299087558)
3. [Red Hat - What is KVM?](https://www.redhat.com/en/topics/virtualization/what-is-KVM)
4. [Red Hat - Containers vs. Virtual Machines](https://www.redhat.com/en/topics/containers/containers-vs-vms)