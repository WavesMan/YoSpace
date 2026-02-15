---
title: "Markdown Syntax Guide"
description: "A comprehensive guide to Markdown syntax and formatting features supported by this blog."
date: "2026-01-20T10:00:00Z"
tags: ["Markdown", "Test", "Guide"]
series:
  id: "usage-series"
  index: 1
  label: "Usage Guide"
isPinned: true
pinnedRank: 01
isRecommended: true
recommendRank: 00
---

# Heading Level 1

## Heading Level 2

### Heading Level 3

#### Heading Level 4

##### Heading Level 5

###### Heading Level 6

## Text Formatting

**Bold Text** using `**` or __Bold Text__ using `__`.

*Italic Text* using `*` or _Italic Text_ using `_`.

***Bold and Italic*** using `***` or ___Bold and Italic___ using `___`.

~~Strikethrough~~ using `~~`.

`Inline Code` using backticks.

[Link to Google](https://www.google.com)

## Lists

### Unordered List
- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2
    - Sub-sub-item 2.2.1
- Item 3

### Ordered List
1. First Item
2. Second Item
   1. Sub-item 2.1
   2. Sub-item 2.2
3. Third Item

### Task List
- [x] Completed task
- [ ] Incomplete task
- [ ] Another task

## Blockquotes

> This is a blockquote.
>
> It can span multiple lines.
>> And can be nested.

## Code Blocks

```javascript
// JavaScript Example
function hello() {
  console.log("Hello, World!");
}
hello();
```

```python
# Python Example
def hello():
    print("Hello, World!")

if __name__ == "__main__":
    hello()
```

```css
/* CSS Example */
body {
  background-color: #f0f0f0;
  color: #333;
}
```

## Tables

| Header 1 | Header 2 | Header 3 |
| :--- | :---: | ---: |
| Left Aligned | Center Aligned | Right Aligned |
| Row 1 Col 1 | Row 1 Col 2 | Row 1 Col 3 |
| Row 2 Col 1 | Row 2 Col 2 | Row 2 Col 3 |

## Horizontal Rule

---

## Images

![Placeholder Image](https://cloud.waveyo.cn//Services/websites/home/images/icon/favicon.ico "Placeholder Image Title")

## HTML Elements

<div style="background-color: #333; color: white; padding: 10px; border-radius: 5px;">
  This is a raw HTML div with inline styles.
</div>

<details>
  <summary>Click to expand</summary>
  Hidden content inside details tag.
</details>

## Auto Links

https://www.example.com

## Callouts (Tips)

> [!NOTE]
> This is a note callout, used to provide additional context.
>
> It supports multiple lines and can contain **bold text**, links, and more.

> [!TIP]
> This is a tip callout, used for best practices or useful tricks.

> [!WARNING]
> This is a warning callout, used to highlight potential risks.

> [!IMPORTANT]
> This is an important callout, used to emphasize key information.

> [!CAUTION]
> This is a caution callout, used to remind readers to be careful, for example when running scripts.

## Tabs Example

=== "macOS and Linux"

    Use `curl` to download the script and execute it with `sh`:

    ```console
    $ curl -LsSf https://astral.sh/uv/install.sh | sh
    ```

    If your system doesn't have `curl`, you can use `wget`:

    ```console
    $ wget -qO- https://astral.sh/uv/install.sh | sh
    ```

    Request a specific version by including it in the URL:

    ```console
    $ curl -LsSf https://astral.sh/uv/0.10.2/install.sh | sh
    ```

=== "Windows"

    Use `powershell` to download the script and execute it with `iex`:

    ```pwsh-session
    PS> powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    ```

    Adjusting PowerShell's execution policy can allow running scripts from the internet:

    ```pwsh-session
    PS> Get-ExecutionPolicy
    PS> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```

    You can also request a specific version by including it in the URL:

    ```pwsh-session
    PS> powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/0.10.2/install.ps1 | iex"
    ```
