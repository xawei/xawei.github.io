---
title: PV和PVC的基本概念和使用
categories: kubernetes
date: 2021-01-10 11:10:00
---

PV和PVC是kubernetes存储管理中的重要概念，在日常生产场景中使用非常广泛。本文主要介绍PV和PVC在kubernetes中的基本概念、使用场景以及实现原理。更多PV和PVC的使用细节问题请参考kubernetes官方文档。

<!--more-->

## kubernetes存储中的卷

容器中的文件在磁盘上是临时存放的，也有很多场景下应用程序都需要对某些数据进行持久存储，避免在容器奔溃时造成数据丢失。

在kubernetes中，提供了挂载卷（Volume）的能力，卷的类型有很多种，例如还有跟云厂商关联的awsElasticBlockStore、azureDisk、azureFile等，具体可以参考[官方文档](https://kubernetes.io/docs/concepts/storage/volumes/)。

主要的常用卷类型包括：

emptyDir：卷最初是空的，在pod在节点运行时创建，pod删除时数据也会永久删除；

configMap：可以将configMap中的数据作为卷挂在到pod中；

secret：可以将secret中的数据作为卷挂载到pod中；

downwardAPI：将pod的元数据信息注入到pod中；

hostPath：能将主机节点文件系统上的文件或目录挂载到 Pod 中；

nfs：将 NFS (网络文件系统) 挂载到 Pod，可以多挂；

kubernetes的一个重要的基本理念是：**向应用开发者隐藏真实的基础设施，使他们不需要关心基础设施的具体状况信息，并使应用程序可以在不同的云服务商之前进行迁移、切换**。因此，kubernetes提出了PV和PVC的概念，使开发人员可以在创建pod需要使用持久化存储时，就像请求CPU\MEM等资源一样来向kubernetes集群请求持久存储。



## PV和PVC

### 基本概念

前面提到的emptyDir和hostPath都不是持久化存储，会随着Pod的销毁和重建而丢失。而PV和PVC都是kubernetes中定义的API资源，提供一种能持久化存储的能力。

PV是集群中的一块存储，一般可以由集群的管理员事先供应，或者使用storage class的方式来动态供应。pv属于集群资源，它们的生命周期跟使用它们的pod时相互独立。

PVC表达的是用户对存储的请求（persistant volume claim），也是kubernetes中独立存在的API资源。Pod 会耗用节点资源，而 PVC 申领会耗用 PV 资源。Pod 可以请求特定数量的资源（CPU 和内存）；同样PVC也可以请求特定的大小和访问模式。

当用户创建一个PVC，kubernetes中的volume controller会监测到PVC的对象，寻到集群中与之匹配的PV资源，将二者进行绑定。如果没有匹配的PV资源，PVC则会处理未绑定的状态一直持续等待，直到集群中出现满足条件的PV资源后进行绑定。PVC和PV之间的绑定是一种一对一的映射。

而另一个很重要的概念，也是kubernetes的API资源，就是storageClass。storageClass可以说是PV的创建模板。前面提到，PV可以是集群管理员事先供应的，就是所谓的静态供应（static provisioning）。这个方法很大的一个问题在于，当kubernetes集群规模很大时，需要管理员手工去创建成千上万的PV来对应存储资源，这是很繁琐的，因此，kubernetes中PV的创建一般会使用动态供应（dynamic provisioning）。

在storageClass中会定义：（1）PV的属性，如存储类型和大小；（2）创建PV需要的存储插件，如NFS。

这样，kubernetes就可以根据PVC指定的storageClass，调用指定的存储插件，创建所需的PV。

Pod、PVC、PV、StorageClass的关系图可以解释如下：

<img src="https://weiblog-1252613377.cos.ap-chengdu.myqcloud.com/20210511215559.png" style="zoom:67%;" />



### Pod中使用持久存储

例如，用户创建一个PVC，如下：

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nfs
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: manual
  resources:
    requests:
      storage: 1Gi
```

集群中的Volume Controller发现这个PVC后，就会主动在集群中寻找合适的PV，来和PVC绑定。只有和PV绑定了的PVC，才能被pod正常挂载使用。Volume Controller寻找PV的条件主要是：
（1）PVC和PV的spec字段中指定的规格，例如存储（storage）的大小；

（2）PVC和PV的storageClassName必须一样。（这里的storage）

 如果集群中存在类型下面这样能满足PVC条件的PV，则可能会被绑定：

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs
spec:
  storageclassName: manual
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteMany
  nfs:
    server: 10.0.0.1
    path: "/"
```

用户可以再在自己Pod中声明使用这个PVC了。为什么Pod使用这个PVC就可以实现容器的持久存储呢？其实容器的Volume就是将一个宿主机上的目录跟一个容器里的目录绑定挂载。只要宿主机上的这个路径的目录是”持久“的，那么在容器中的路径Volume也就是”持久”的了。所谓的持久，就是容器被删除，而Volume可以保留。

这个准备“持久化”宿主机目录的过程，我们可以形象地称为“两阶段处理”。

（1）Attach：为宿主机挂载远程存储；（如果是NFS的话，其实没有这个过程，因为不需要“挂载存储设备到宿主机”）

（2）Mount：将远程存储格式化挂载到宿主机的指定目录，对应容器中的Volume。

我们可以创建这样的一个Pod来使用PVC

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    role: web-frontend
spec:
  containers:
  - name: web
    image: nginx
    ports:
      - name: web
        containerPort: 80
    volumeMounts:
        - name: nfs
          mountPath: "/usr/share/nginx/html"
  volumes:
  - name: nfs
    persistentVolumeClaim:
      claimName: nfs
```



## 参考资料

1. https://kubernetes.io/docs/concepts/storage/volumes/
2. https://time.geekbang.org/column/intro/100015201