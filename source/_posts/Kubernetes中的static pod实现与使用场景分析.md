---
title: Kubernetes中的Static pod实现与使用场景分析
categories: kubernetes
date: 2021-06-22 12:00:00
---



介绍Kubernetes中的staic pod具体的实现逻辑，以及可能的使用场景。

<!--more-->

## 先决知识

- Kubernetes集群的[基本架构](https://kubernetes.io/docs/concepts/overview/)和[各组件的功能](https://kubernetes.io/docs/concepts/overview/components/)
- [Pod](https://kubernetes.io/docs/concepts/workloads/pods/)的基本概念及原理
- Kubernetes中的[Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)和[Daemonset](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)基本原理



## Static pod简介

### 普通的Pod

Pod是kubernets中最基本的工作单元，一个Pod中可以包含一组容器。通常情况，Pod的创建流程是如下所示（以Bare Pod为例）：

<img src="https://weiblog-1252613377.cos.ap-chengdu.myqcloud.com/20210707003849.png" style="zoom:50%;" />

用户首先是请求Kube-apiserver创建Pod，当Pod被系统接受后，Pod作为一个资源对象被持久化在Etcd中，状态为Pending。控制组件Kube-scheduler通过Kube-apiserver监听到这个未被指定调度节点的Pod后，将会根据一定策略，修改Pod的status字段，标记为这个Pod理应分配到某个节点。而所有节点上的Kubelet也会通过监听Kube-apiserver来发先被调度到本节点Pod，此时Kubelet才真正意义上地根据Pod定义的信息，来在自身节点上启动Pod。



### Static pod

跟Kubernetes中其他普通的Pod不一样，Static pod是直接由节点上的Kubelet管理的。只要把Pod的定义声明文件放在Kubelet所在节点的指定路径下，或者某个指定的URL地址，Kubelet就会读取Pod的定义文件，并且启动这个Pod，也会按照定义的配置管理Static pod的生命周期。Static pod的启动可以不需要集群，只节点上有Kubelet和相应容器运行时即可。

<img src="https://weiblog-1252613377.cos.ap-chengdu.myqcloud.com/20210707005243.png" style="zoom:50%;" />

#### 快速使用Static pod示例

Static pod的使用很简单，我们来快速试用一下吧。

- Step 1：准备一台服务器作为节点；
  
- Step 2：在节点上安装容器运行时：[点我参考](https://kubernetes.io/docs/setup/production-environment/container-runtimes/)；
  
- Step 3：在节点上安装Kubelet：[点我参考](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#installing-kubeadm-kubelet-and-kubectl)；
  
- Step 4：手动指定Kubelet启动参数：
  kubelet --cgroup-driver=systemd --pod-manifest-path=/etc/kubernetes/manifests/ --fail-swap-on=false --pod-infra-container-image=kubernetes/pause > /tmp/kubelet.log 2>&1

- Step 5：观察Pod定义的容器组已被Kubelet正确启动，纳入管理:

  ```shell
  cat > /etc/kubernetes/manifests/pod.yaml <<EOF
  {
      "kind":"Pod",
      "apiVersion":"v1",
      "metadata":{
          "name":"static-pod-demo",
          "namespace":"default",
          "uid":"114b565b-fbe0-4301-a7bd-89598ce86a7a"
      },
      "spec":{
          "containers":[
              {
                  "name":"nginx-container",
                  "image":"nginx:latest"
              }
          ],
          "restartPolicy":"Always"
      }
  }
  EOF
  ```

  ![](https://weiblog-1252613377.cos.ap-chengdu.myqcloud.com/20210707122532.png)
  
- Step 6：停止Static pod，只需要把Pod.yaml文件移出/etc/kubernetes/manifests/目录即可
  ![](https://weiblog-1252613377.cos.ap-chengdu.myqcloud.com/20210707122852.png)



## 为什么需要Static pod

Kubernetes官方文档，在介绍Static pod时，特别做了如下的标注说明：

> **Note:** If you are running clustered Kubernetes and are using static Pods to run a Pod on every node, you should probably be using a [DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset) instead.

也就是说，如果你在使用Static pod来实现kubernetes集群中每个Node的上启动Pod，那么你更应该使用DaemonSet，而不是Static pod。

既然官方文档都推荐使用DaemonSet了，为什么还存在static pod这种机制？

早期的Kubernetes，为了在集群各个节点上启动例如日志采集（fluentd）、网络组件(kube-proxy)等服务，使用了Static pod的机制。后来提出了DaemonSet的概念，于是这些需要在每个节点上都启动的服务，都逐渐被DaemonSet所替代，官方文档也建议优先选用DaemonSet。

Static pod机制一直保留下来，一方面是为了兼容广大开发者采用了Static pod的使用场景；另一方面则是Static pod具有DaemonSet无法替代的特性：不需要Kubernetes集群来直接启动、管理Pod。Static pod最大的特点是无需调用Kube-apiserver即可快速启动Pod，也就是说，不需要一个完整的kubernetes集群，只要安装了kubelet、容器运行时，即可快速地让kubelet来接管你的yaml文件定义的Pod。前面章节也简单介绍了如何快速使用这一特性。Static pod优点是不需要集群，缺点也是相对应的，没有集群层面的管理、调度功能。而Static pod最经典的使用场景，就是用来Bootstrap一个Kubernetes集群。

我们接着先简单分析Static pod机制在kubernetes中的源码实现，再来分析使用Static pod来Bootstrap Kubernetes集群的过程。



## Static pod的实现分析

下面基于Kubernetes v1.21.2的代码，主要分析Kubelet中处理Static pod的逻辑。**如果对源码实现不感兴趣的读者可以跳过这部分**。

> **注意**：这里不会详细介绍Kubelet的启动已经各种其他能力，可以参考：

Kubernetes/cmd/kubelet/app/server.go:

```go
func run(ctx context.Context, s *options.KubeletServer, kubeDeps *kubelet.Dependencies, featureGate featuregate.FeatureGate) (err error) {
	...
  // About to get clients and such, detect standaloneMode
    standaloneMode := true
    if len(s.KubeConfig) > 0 {
      standaloneMode = false
    }
	...
  // if in standalone mode, indicate as much by setting all clients to nil
    switch {
    case standaloneMode:
      kubeDeps.KubeClient = nil
      kubeDeps.EventClient = nil
      kubeDeps.HeartbeatClient = nil
      klog.InfoS("Standalone mode, no API client")
  ...
    }
  ...
  if err := RunKubelet(s, kubeDeps, s.RunOnce); err != nil {
		return err
	}
  ...
}  
```

首先找到Kubelet的启动入口，会判断是否传入kubeConfig，如果没有，则是Stand alone模式，即无集群模式，因为没有kubeConfig的Kubelet无法访问某个集群的Kube-apiserver。KubeClient, EeventClient, HeartClient都置为nil，不会上报事件、心跳。



Kubernetes/cmd/kubelet/app/server.go:

```go
// RunKubelet is responsible for setting up and running a kubelet.  It is used in three different applications:
//   1 Integration tests
//   2 Kubelet binary
//   3 Standalone 'kubernetes' binary
// Eventually, #2 will be replaced with instances of #3
func RunKubelet(kubeServer *options.KubeletServer, kubeDeps *kubelet.Dependencies, runOnce bool) error {
	...
  k, err := createAndInitKubelet(
    ...
  )
  ...
  	startKubelet(k, podCfg, &kubeServer.KubeletConfiguration, kubeDeps, kubeServer.EnableServer)
  ...
}

func createAndInitKubelet(
  ...
){
  ...
  k, err = kubelet.NewMainKubelet(
    ...
}

// NewMainKubelet instantiates a new Kubelet object along with all the required internal modules.
// No initialization of Kubelet and its modules should happen here.
func NewMainKubelet(
  ...
){
  ...
		kubeDeps.PodConfig, err = makePodSourceConfig(kubeCfg, kubeDeps, nodeName, nodeHasSynced)
   ...
}
```

RunKubelet -> createAndInitKubelet -> NewMainKubelet. 在NewMainKubelet中，调用makePodSourceConfig来根据kubeletConfiguration，生成PodConfig，一个struct，能够获取多种取到的Pod配置来源（StaticPodPath/StaticPodURL/Kube-apisever)，并能够分发给不通的Listener处理。PodConfig在源码中的注释说明原文如下：

```
// PodConfig is a configuration mux that merges many sources of pod configuration into a single
// consistent structure, and then delivers incremental change notifications to listeners
// in order.
```



Kubernetes/pkg/kubelet/kubelet.go

```go
// makePodSourceConfig creates a config.PodConfig from the given
// KubeletConfiguration or returns an error.
func makePodSourceConfig(kubeCfg *kubeletconfiginternal.KubeletConfiguration, kubeDeps *Dependencies, nodeName types.NodeName, nodeHasSynced func() bool) (*config.PodConfig, error) {
	...
  // define file config source
	if kubeCfg.StaticPodPath != "" {
		klog.InfoS("Adding static pod path", "path", kubeCfg.StaticPodPath)
		config.NewSourceFile(kubeCfg.StaticPodPath, nodeName, kubeCfg.FileCheckFrequency.Duration, cfg.Channel(kubetypes.FileSource))
	}

	// define url config source
	if kubeCfg.StaticPodURL != "" {
		klog.InfoS("Adding pod URL with HTTP header", "URL", kubeCfg.StaticPodURL, "header", manifestURLHeader)
		config.NewSourceURL(kubeCfg.StaticPodURL, manifestURLHeader, nodeName, kubeCfg.HTTPCheckFrequency.Duration, cfg.Channel(kubetypes.HTTPSource))
	}

	if kubeDeps.KubeClient != nil {
		klog.InfoS("Adding apiserver pod source")
		config.NewSourceApiserver(kubeDeps.KubeClient, nodeName, nodeHasSynced, cfg.Channel(kubetypes.ApiserverSource))
	}
  ...
}
```

再看看makePodSourceConfig函数里面，就是有三种来源的Pod定义信息，分别是StaticPodPath、StaticPodURL和kubeClient。

再直接查看kubernetes/pkg/kubelet/config/file.go：

```go
...
func (s *sourceFile) run() {
	listTicker := time.NewTicker(s.period)
	go func() {
		...
		for {
			select {
			case <-listTicker.C:
				if err := s.listConfig(); err != nil {
					klog.ErrorS(err, "Unable to read config path", "path", s.path)
				}
			...
			}
		}
	}()

	s.startWatch()
}
...
func (s *sourceFile) listConfig() error {
	...
	switch {
	case statInfo.Mode().IsDir():
		...
	case statInfo.Mode().IsRegular():
		...
	}
}
```

可以看到如果StaticPodPath配置了的话，kubelet会启动一个协程，定时watch这个路径下的所有文件，如果是符合Pod定义的文件，则把反序列化出来的Pod对象分发给PodConfig的Listener进行处理。

Stuct PodConfig的成员updates chan kubetypes.PodUpdate是一个分发需要处理的Pod事件的Channel。

Kubernetes/pkg/kubelet/kubelet.go

```go
func (kl *Kubelet) syncLoopIteration(configCh <-chan kubetypes.PodUpdate, handler SyncHandler,
	syncCh <-chan time.Time, housekeepingCh <-chan time.Time, plegCh <-chan *pleg.PodLifecycleEvent) bool {
  ...
}
```

在函数syncLoopIteration中，通过读取PodConfig的updates这个Channel，来分发出事件进行处理，主要是由Kubelet按照Pod的定义，调用底层的容器运行时来运行容器。当然，当Kubelet watch到指定路径的Pod定义文件被移除，那它也会停止原本运行的Static pod。后面的实现代码边幅较长不再详细列举。



## Static pod的典型应用场景

Static pod目前使用最广泛的场景，是在Kubeadm中使用使用这一机制来Bootstrap一个Kubernetes集群。

使用Kubernetes集群前，需要把管控面的组件先部署好。这些管控组件可以二进制部署，也可以容器化部署。二进制部署的方式稍显繁琐，且容易出错，升级也不方便，容器化部署这些管控组件的好处显而易见。

这是最典型的先有鸡还是先有蛋的问题。在没有Kubernetes集群的时候，我们如何把这些管控组件以容器化的形式启动起来？官方部署工具Kubeadm给出的解决方法就是使用Static pod。

在使用Kubeadm部署集群时，首先需要安装好kubelet、容器运行时等组件，Kubeadm会根据指定配置文件，生成Kube-apiserver, Kube-controller-manager, Kube-proxy等组件的Pod定义文件，放置在Master节点的指定Static Pod path下，让Kubelet接管这些Static pod的生命周期管理。



## 总结

本文首先介绍了Kubernetes中Static pod机制的原理，并与“常规的”集群中运行的Pod进行了对比。然后说明了如何快速使用Kubelet来部署启动、重启和停止Static pod来实现对一组业务容器的生命周期管理。如果我们需要在Kubernetes中指定每个节点启动特定的Pod，那么建议使用官方的DaemonSet来实现目的。Static pod的使用场景在于无集群时，如何能方便、稳定地管理运行在本节点上的容器。Static pod目前最广泛的应用场景是Kubeadm中利用这一机制来启动Kubernetes集群的Control Plane层面的各个组件。

Static pod仅仅依赖所在节点的Kubelet即可启动，不需要集群，但也缺少了集群层面的资源调度、自动伸缩等功能。



## 参考资料

1. [stack overflow: whats-the-difference-between-pods-and-static-pods](https://stackoverflow.com/questions/59612514/whats-the-difference-between-pods-and-static-pods-in-kubernetes-and-when-to)
2. https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/
3. https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/ha-topology/
4. https://octetz.com/docs/2019/2019-10-12-static-pods/

