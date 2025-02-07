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
![](https://blog202411-1252613377.cos.ap-guangzhou.myqcloud.com/20250207195250.png)
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
Explanation:
•	Requests with /v1 go to v1 of my-app.
•	Requests with /v2 go to v2 of my-app.

## DestinationRule
Purpose:
Defines policies for service subsets, load balancing, and connection settings.

Example:
This rule defines subsets for v1 and v2 of my-app.
```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-app
spec:
  host: my-app
  trafficPolicy:
    loadBalancer:
      simple: ROUND_ROBIN
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```
Explanation:
•   Defines subsets v1 and v2, mapped to corresponding pod labels (version: v1 and version: v2).
•	Uses ROUND_ROBIN load balancing.

## ServiceEntry
Purpose:
Allows Istio to handle services that are external to the mesh.

Example:
This ServiceEntry registers api.external.com as an external service.
```yaml
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-api
spec:
  hosts:
    - "api.external.com"
  location: MESH_EXTERNAL
  ports:
    - number: 443
      name: https
      protocol: HTTPS
  resolution: DNS
```
Explanation:
•	Allows traffic to api.external.com (e.g., a SaaS API).
•	Uses DNS resolution to route traffic.

## Sidecar
Purpose:
Controls egress traffic for a specific namespace or workload.

Example:
This Sidecar restricts traffic for workloads in default namespace.
```yaml
apiVersion: networking.istio.io/v1beta1
kind: Sidecar
metadata:
  name: default-sidecar
  namespace: default
spec:
  egress:
    - hosts:
        - "./*"  # Only allows traffic to services in the same namespace
```
Explanation:
•	Limits outbound traffic to only services within the default namespace.

## PeerAuthentication
Purpose:
Defines mutual TLS (mTLS) and authentication policies.

Example:
This enforces STRICT mTLS for all services in a namespace.
```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: default
spec:
  mtls:
    mode: STRICT
```
Explanation:
•	All services in default namespace must communicate using mTLS.

## AuthorizationPolicy
Purpose:
Controls access permissions to services within the mesh.

Example:
This policy allows only users with a specific JWT claim to access my-app.
```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: my-app-policy
  namespace: default
spec:
  selector:
    matchLabels:
      app: my-app
  action: ALLOW
  rules:
    - from:
        - source:
            requestPrincipals: ["user@example.com"]
```
Explanation:
•	Only requests with user@example.com as JWT claim are allowed.

## Summary of Key Istio CRDs
| CRD                  | Purpose                                                   |
|----------------------|-----------------------------------------------------------|
| Gateway              | Defines external entry points (e.g., ingress)             |
| VirtualService       | Controls request routing                                  |
| DestinationRule      | Defines subsets, load balancing, and connection settings  |
| ServiceEntry         | Enables communication with external services              |
| Sidecar              | Configures egress traffic control for workloads           |
| PeerAuthentication   | Enforces mTLS for secure communication                    |
| AuthorizationPolicy  | Manages access control for services                       |