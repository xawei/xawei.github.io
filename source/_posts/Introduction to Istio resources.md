---
title: "Introduction to Istio Resources"
date: 2025-1-21 12:55:00 
tags: ["Istio", "Kubernetes", "Service Mesh"]
categories: ["Istio"]
author: "xawei"
---

Istio is an open platform that provides a uniform way to connect, manage, and secure microservices. It supports managing traffic, enforcing access policies, and aggregating telemetry data, all without requiring changes to the actual services. This article will introduce the basic resources of Istio, including `Gateway`, `VirtualService`, `DestinationRule`, `ServiceEntry`, `Sidecar`, and `AuthorizationPolicy`.

<!--more-->

## Gateway
Purpose:
Defines an entry point into the service mesh (usually at the edge of the cluster) for external traffic.

Example:
This Gateway allows HTTPS traffic on port 443 to a my-app service.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: my-gateway
  namespace: istio-system
spec:
  selector:
    istio: ingressgateway  # Applies to the Istio ingress gateway
  servers:
    - port:
        number: 443
        name: https
        protocol: HTTPS
      hosts:
        - "my-app.example.com"
      tls:
        mode: SIMPLE
        credentialName: my-app-cert  # Secret containing TLS certificate
```

## VirtualService
Purpose:
Defines rules for routing traffic to services inside the mesh.

Example:
This VirtualService directs requests to my-app based on different paths.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app
spec:
  hosts:
    - "my-app.example.com"
  gateways:
    - my-gateway
  http:
    - match:
        - uri:
            prefix: "/v1"
      route:
        - destination:
            host: my-app
            subset: v1
    - match:
        - uri:
            prefix: "/v2"
      route:
        - destination:
            host: my-app
            subset: v2
```