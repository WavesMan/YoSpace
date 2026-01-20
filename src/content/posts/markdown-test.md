---
title: "Markdown Syntax Guide"
description: "A comprehensive guide to Markdown syntax and formatting features supported by this blog."
date: "2024-01-21T10:00:00Z"
tags: ["Markdown", "Test", "Guide"]
isPinned: true
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

![Placeholder Image](https://via.placeholder.com/600x400 "Placeholder Image Title")

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
