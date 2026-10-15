---
title: Run neural graphics workloads with ML Extensions for Vulkan
weight: 2

### FIXED, DO NOT MODIFY
layout: learningpathall
---

## What is neural graphics, and why does it matter for real-time rendering?

Neural graphics combines real-time rendering with machine learning to improve visual quality and performance. Integrating ML techniques, such as neural upscaling, directly into the GPU pipeline can improve visual fidelity and efficiency. This approach is especially valuable on mobile and embedded devices, where power efficiency is critical.

## How do ML Extensions for Vulkan support neural graphics workloads?

The `VK_ARM_tensors` extension introduces support for multidimensional tensor data in Vulkan, while `VK_ARM_data_graph` enables the execution of ML computational graphs using Vulkan data graph pipelines. These pipelines use SPIR-V, Vulkan's intermediate representation for GPU programs, to define and execute ML computational graphs.

To help developers adopt these features, the Tensor and Data Graph Vulkan Samples offer hands-on demonstrations.

These samples address key challenges in ML integration, such as:

- **Understanding graph-based compute with Vulkan**: See how compute workloads can be structured using explicit graph topologies.
- **Demystifying ML inference in real-time rendering**: Learn how ML fits into the graphics pipeline.

The samples range from basic configurations to more advanced features, such as tensor aliasing and compute shader integration.

This Learning Path walks you through setting up and running the first sample, `simple_tensor_and_data_graph`.

## Why use ML Extensions for Vulkan in game and graphics development?

As a game developer, you've probably noticed the rising demand for smarter, more immersive graphics — but also the increasing strain on GPU resources, especially on mobile. Vulkan's traditional pipelines give you fine-grained control, but finding the right tooling to integrate machine learning has been a challenge. That’s where the new ML extensions for Vulkan come in.

Arm’s `VK_ARM_tensors` and `VK_ARM_data_graph` extensions give you native Vulkan support for executing neural networks on the GPU — using structured tensors and data graph pipelines. Instead of chaining compute shaders to simulate ML models, you can now express them as dataflow graphs in SPIR-V and run them more efficiently. This opens the door to using AI techniques right alongside the graphics pipeline.

Although ML is widely used for image classification and large language models (LLMs), these extensions are particularly useful for game and graphics workloads. They prioritize predictable execution, GPU compatibility, and memory efficiency. Built-in support for tensor formats and pipeline sessions helps you combine traditional Vulkan rendering with machine learning.

## What's next?

To help developers explore these capabilities, Arm provides development tools and hands-on examples. The ML Emulation Layers for Vulkan allow developers to experiment with the extensions on Vulkan-capable hardware without native support.

For an example of neural graphics in practice, see the Learning Path [**Neural Super Sampling with Unreal Engine**](/learning-paths/mobile-graphics-and-gaming/nss-unreal/).

In this Learning Path, you'll start with the Vulkan Samples to explore the ML Extensions directly. Continue to the next section to set up your development environment.