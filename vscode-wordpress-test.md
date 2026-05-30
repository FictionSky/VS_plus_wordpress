---
title: VS Code 发布测试
status: draft
---

这是从 VS Code 通过 WordPress Post 发布到 WordPress 的测试草稿。

如果你能在 WordPress 后台的草稿箱看到这篇文章，说明 VS Code 到 WordPress 的发布链路已经基本打通。

## 标题测试

这是一段普通正文，用来确认中文内容可以正常发布。

This sentence checks whether English text is published correctly.

## 列表测试

- 第一项：中文列表
- 第二项：英文和数字 WordPress 2026
- 第三项：行内代码 `console.log("hello")`

## 代码块测试

```python
def greet(name):
    return f"Hello, {name}!"

print(greet("WordPress"))
```

## 数学公式测试

行内公式：[katex]E = mc^2[/katex]

独立公式：

[katex display=true]\int_0^1 x^2 dx = \frac{1}{3}[/katex]

## 结尾

发布成功后，可以把这篇草稿删除，或者留着以后测试 VS Code 发布配置。
