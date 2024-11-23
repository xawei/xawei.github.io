---
title: PV和PVC
categories: kubernetes
date: 2021-01-10 11:10:00
---

在 Kubernetes 中，有状态应用(stateful application)非常普遍和重要，而PV和PVC是实现有状态应用的核心基础。

<!--more-->

## volume和volumeMount

容器中的文件在磁盘上是临时存放的，也有很多场景下应用程序都需要对某些数据进行持久存储，避免在容器奔溃时造成数据丢失。

Volume 是 Kubernetes 中定义的存储资源，作用是将外部存储或节点上的存储空间与 Pod 关联，用于在容器之间共享数据或提供持久化存储。

Volume的类型有很多种，例如还有跟云厂商关联的awsElasticBlockStore、azureDisk、azureFile等，具体可以参考[官方文档](https://kubernetes.io/docs/concepts/storage/volumes/)。

主要的常用volume类型包括：
![](https://blog202411-1252613377.cos.ap-guangzhou.myqcloud.com/202411231001973.png)

kubernetes的一个重要的基本理念是：**向app developers隐藏真实的基础设施，使他们不需要关心基础设施的具体状况信息，并使应用程序可以在不同的云服务商之前进行迁移、切换**。因此，kubernetes提出了PV和PVC的概念，使开发人员可以在创建pod需要使用持久化存储时，就像请求 CPU \ Mem 等资源一样来向kubernetes集群请求持久存储。

## PV和PVC

### 基本概念

前面提到的emptyDir和hostPath都不是持久化存储，会随着Pod/Node的销毁和重建而丢失。而PV和PVC都是kubernetes中定义的API资源，提供一种能持久化存储的能力。

PV是集群中的一块存储，可以由集群的administrators事先手动创建外部存储后关联PV，就是所谓的静态供应（static provisioning）。

这个方法很大的一个问题在于，当kubernetes集群规模很大时，需要管理员手工去创建成千上万的PV来对应存储资源，这是很繁琐的。

因此，kubernetes中PV的创建一般会使用动态供应（dynamic provisioning）。

![](https://blog202411-1252613377.cos.ap-guangzhou.myqcloud.com/202411231025304.png)

PV属于集群资源，它们的生命周期跟使用它们的pod时相互独立。

PVC表达的是用户对存储的请求，也是kubernetes中独立存在的API资源。Pod 会耗用节点资源，而 PVC 申领会耗用 PV 资源。Pod 可以请求特定数量的资源（CPU 和内存）；同样PVC也可以请求特定的大小和访问模式。

当用户创建一个PVC，kubernetes中的volume controller会监测到PVC的对象，寻到集群中与之匹配的PV资源，将二者进行绑定。如果没有匹配的PV资源，PVC则会处理未绑定的状态一直持续等待，直到集群中出现满足条件的PV资源后进行绑定。PVC和PV之间的绑定是一种一对一的映射。

而另一个很重要的概念，也是kubernetes的API资源，就是storageClass。storageClass可以说是PV的创建模板。

这样，kubernetes就可以根据PVC指定的storageClass，调用指定的存储插件，创建所需的PV。

Pod、PVC、PV、StorageClass的关系图可以解释如下：

![](https://blog202411-1252613377.cos.ap-guangzhou.myqcloud.com/202411231051425.png)


### Pod中使用持久存储

例如，在AWS上的kubernetes集群，使用PVC声明需要EBS并挂载到Pod中：
1. 需要在集群中预先部署[aws-ebs-csi-driver](https://github.com/kubernetes-sigs/aws-ebs-csi-driver) （EKS的话，有提供AWS managed Add-on直接支持）
2. 创建对应的storageClass, 确保Provisioner backend pods也正常运行
3. 创建PVC, 在workload中使用PVC作为volume, 并使用volumeMount在pod中声明
4. aws-ebs-csi-driver创建对应的外部存储EBS和PV，挂载到workload的pod中

![](https://blog202411-1252613377.cos.ap-guangzhou.myqcloud.com/202411231141710.png)

#### PVC / PV / SC 等资源

1. 在集群中需要有对应的storageClass
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-sc
provisioner: ebs.csi.aws.com  # Specify related provisioner
parameters:
  type: gp3                # The type of EBS volume (gp3 for general-purpose SSD)
  fsType: ext4             # File system type
reclaimPolicy: Delete       # Automatically delete EBS volume when PVC is deleted
volumeBindingMode: WaitForFirstConsumer # Volume is provisioned only when a pod uses the PVC
```

2. 创建PVC
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-ebs-pvc
spec:
  accessModes:
    - ReadWriteOnce          # EBS volumes can only be attached to one node at a time
  resources:
    requests:
      storage: 5Gi           # Request 5Gi of storage
  storageClassName: ebs-sc    # Use the ebs-sc StorageClass
```

集群中的**Volume Controller**发现这个PVC后，就会主动在集群中寻找合适的PV，来和PVC绑定。只有和PV绑定了的PVC，才能被pod正常挂载使用。

Volume Controller寻找PV的条件主要是：
- PVC和PV的spec字段中指定的规格，例如存储（storage）的大小；
- PVC和PV的storageClassName必须一样。

如果集群中不存在合适的PV，Provisioner就会尝试根据配置动态创建外部存储，和在集群上创建对应的PV。

3. 创建使用PVC的workload
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ebs-pvc-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ebs-pvc-app
  template:
    metadata:
      labels:
        app: ebs-pvc-app
    spec:
      containers:
      - name: app
        image: nginx
        volumeMounts:
        - mountPath: /usr/share/nginx/html   # Mount PVC at this path
          name: storage
      volumes:
      - name: storage
        persistentVolumeClaim:
          claimName: my-ebs-pvc             # Use the PVC created earlier
```

对于EBS这样的块存储，分为“两阶段处理”。

（1）Attach：为宿主机挂载远程存储；（如果是NFS的话，其实没有这个过程，因为不需要“挂载存储设备到宿主机”）

（2）Mount：将远程存储格式化挂载到宿主机的指定目录，对应容器中的Volume。


## 参考资料

1. https://kubernetes.io/docs/concepts/storage/volumes/
2. https://time.geekbang.org/column/intro/100015201