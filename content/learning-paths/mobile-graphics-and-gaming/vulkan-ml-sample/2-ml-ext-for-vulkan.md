---
title: Set up the ML Emulation Layers for Vulkan
weight: 3

### FIXED, DO NOT MODIFY
layout: learningpathall
---

## Overview

To run the Vulkan Samples, you first need to set up your development environment.

This setup involves two main steps:

- Create a Python virtual environment and install the ML Emulation Layers for Vulkan.
- Install the Vulkan SDK and configure the emulation layers for Vulkan, which simulate the `VK_ARM_data_graph` and `VK_ARM_tensors` extensions.

## Set up the development environment

Open **Windows PowerShell** from the Windows 11 Start menu. Verify that Python 3.10 or later is installed, then navigate to your user home directory:

```powershell
python --version
cd $HOME
```

The following steps create a Python virtual environment and install two packages:

- **ML Emulation Layers for Vulkan:** Part of Arm's open-source **ML SDK for Vulkan**, a toolkit that helps developers build and test neural graphics and AI/ML workloads using the ML Extensions for Vulkan. The emulation layers provide support for these extensions on Vulkan-capable hardware.
- **CMake:** Provides the build tools needed to compile the Vulkan Samples.

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install ai-ml-emulation-layer-for-vulkan cmake
```

To verify your installation, run the following commands:

```powershell
cmake --version
python --version
git --version
python -m pip show ai-ml-emulation-layer-for-vulkan
```

Each command prints the installed version of the tool or shows where the appropriate files are located.

### Install the Vulkan Software Development Kit

Download and install the Vulkan SDK from [Getting Started with the Windows Vulkan SDK](https://vulkan.lunarg.com/sdk/home).

1. Under **Windows**, select **x64 / x86**.
2. Download the **SDK Installer** for version 1.4.321 or later. Do not select the Runtime Installer.
3. Run the installer and accept the default installation directory.
4. Keep the default component selections and accept the license agreement.
5. Complete the installation.
6. On the final screen, select **Run the Vulkan Configurator and Hardware Capabilities Viewer**, then click **Finish**.

Verify that Vulkan Configurator opens successfully. You will use it in the next section to enable the ML Emulation Layers for Vulkan.


## Enable the emulation layers in Vulkan Configurator

If Vulkan Configurator is not already open, launch it from the Windows Start menu.

In **Vulkan Configurator**, configure the emulation layers for the `VK_ARM_data_graph` and `VK_ARM_tensors` extensions.

1. In the **Vulkan Layers Available** tab, add the directory containing the emulation layer manifests from your Python virtual environment:

   ```text
   .venv\Lib\site-packages\emulation_layer\deploy\bin
   ```

   For example, if you created the virtual environment in your Windows user home directory, the path is:

   ```text
   C:\Users\<username>\.venv\Lib\site-packages\emulation_layer\deploy\bin
   ```

2. Verify that the following layers appear in the available layers list:
   - `VK_LAYER_ML_Graph_Emulation`
   - `VK_LAYER_ML_Tensor_Emulation`

![Vulkan Layers Available](images/vl-available.png)

3. In the **Vulkan Layers Configuration** tab, enable system Vulkan layer configuration and ensure both emulation layers are set to **Enable**.

4. Verify that the **Graph Emulation** layer is listed above the **Tensor Emulation** layer.

![Vulkan Layers Configuration](images/vl-layers.png)

{{% notice Important %}}
Keep Vulkan Configurator running while you run the Vulkan samples.
{{% /notice %}}

With the emulation layers configured, you're ready to build the Vulkan Samples. Continue to the next section to get started.
