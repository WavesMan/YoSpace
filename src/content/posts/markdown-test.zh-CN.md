---
title: "Markdown 语法指南"
description: "本博客支持的 Markdown 语法和格式特性的全面指南。"
date: "2026-01-20T10:00:00Z"
tags: ["Markdown", "测试", "指南"]
series:
  id: "usage-series"
  index: 2
  label: "使用说明"
isPinned: true
pinnedRank: 01
isRecommended: true
recommendRank: 00
---

# 一级标题

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

## 文本格式

**加粗文本** 使用 `**` 或 __加粗文本__ 使用 `__`。

*斜体文本* 使用 `*` 或 _斜体文本_ 使用 `_`。

***加粗斜体*** 使用 `***` 或 ___加粗斜体___ 使用 `___`。

~~删除线~~ 使用 `~~`。

`行内代码` 使用反引号。

[链接到 Google](https://www.google.com)

## 列表

### 无序列表
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
    - 子子项目 2.2.1
- 项目 3

### 有序列表
1. 第一项
2. 第二项
   1. 子项目 2.1
   2. 子项目 2.2
3. 第三项

### 任务列表
- [x] 已完成任务
- [ ] 未完成任务
- [ ] 另一项任务

## 引用

> 这是一个引用块。
>
> 它可以跨越多行。
>> 并且可以嵌套。

## 代码块

```javascript
// JavaScript 示例
function hello() {
  console.log("你好，世界！");
}
hello();
```

```python
# Python 示例
def hello():
    print("你好，世界！")

if __name__ == "__main__":
    hello()
```

```css
/* CSS 示例 */
body {
  background-color: #f0f0f0;
  color: #333;
}
```

## 表格

| 标题 1 | 标题 2 | 标题 3 |
| :--- | :---: | ---: |
| 左对齐 | 居中对齐 | 右对齐 |
| 行 1 列 1 | 行 1 列 2 | 行 1 列 3 |
| 行 2 列 1 | 行 2 列 2 | 行 2 列 3 |

## 水平分割线

---

## 图片

![占位图](https://cloud.waveyo.cn//Services/websites/home/images/icon/favicon.ico "占位图标题")

## HTML 元素

<div style="background-color: #333; color: white; padding: 10px; border-radius: 5px;">
  这是一个带有内联样式的原生 HTML div。
</div>

<details>
  <summary>点击展开</summary>
  details 标签内的隐藏内容。
</details>

## 自动链接

https://www.example.com

## 提示块（Callouts）

> [!NOTE]
> 这是一个说明提示块，用于补充一些额外的上下文信息。
>
> 支持多行内容，也可以在其中使用 **加粗**、链接等格式。

> [!TIP]
> 这是一个提示提示块，用于给出最佳实践或小技巧。

> [!WARNING]
> 这是一个警告提示块，用于强调潜在风险或需要注意的地方。

> [!IMPORTANT]
> 这是一个重要提示块，用于突出关键信息。

> [!CAUTION]
> 这是一个注意提示块，用于提醒读者谨慎操作，例如执行脚本前先检查环境。

## Tabs 示例

=== "macOS 和 Linux"

    使用 `curl` 下载脚本并用 `sh` 执行：

    ```console
    $ curl -LsSf https://astral.sh/uv/install.sh | sh
    ```

    如果系统没有 `curl`，可以使用 `wget`：

    ```console
    $ wget -qO- https://astral.sh/uv/install.sh | sh
    ```

    通过在 URL 中包含版本号请求指定版本：

    ```console
    $ curl -LsSf https://astral.sh/uv/0.10.2/install.sh | sh
    ```

=== "Windows"

    使用 `powershell` 下载脚本并通过 `iex` 执行：

    ```pwsh-session
    PS> powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    ```

    适当调整 PowerShell 的执行策略可以允许执行来自互联网的脚本：

    ```pwsh-session
    PS> Get-ExecutionPolicy
    PS> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```

    同样可以通过在 URL 中包含版本号请求指定版本：

    ```pwsh-session
    PS> powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/0.10.2/install.ps1 | iex"
    ```
