---
title: 用 NumPy 从零实现反向传播
date: 2026-10-06
tags: [机器学习, NumPy, 实验记录]
summary: 不调用任何深度学习框架，手推链式法则、用矩阵运算写出前向与反向传播，再用数值梯度校验每一层的解析梯度。
---

课程要求「不许 import 框架」，一开始觉得是折腾，写完才发现：**只有自己把梯度算一遍，才知道 `loss.backward()` 那一行到底做了什么。**

这篇记录保留当时的推导、代码和踩过的坑，方便以后回看。

## 先把要解决的问题写清楚

目标是一个两层全连接网络，输入 784 维（28×28 的手写数字），中间 128 个隐藏单元，输出 10 类：

- 前向：`Z1 = XW1 + b1`，`A1 = ReLU(Z1)`，`Z2 = A1W2 + b2`，`A2 = softmax(Z2)`
- 损失：交叉熵 `L = -Σ y·log(A2)`
- 要做的事：求出 `∂L/∂W1`、`∂L/∂b1`、`∂L/∂W2`、`∂L/∂b2`

## 前向传播：把公式写成矩阵

关键是所有样本一起算，不要写 `for` 循环。一个 batch 的 `X` 是 `(N, 784)`，那么 `Z1` 就是 `(N, 128)`：

```python
import numpy as np

def forward(X, params):
    W1, b1, W2, b2 = params["W1"], params["b1"], params["W2"], params["b2"]
    Z1 = X @ W1 + b1                 # (N, 128)
    A1 = np.maximum(Z1, 0)           # ReLU
    Z2 = A1 @ W2 + b2                # (N, 10)
    A2 = softmax(Z2)                 # 按行归一化
    cache = (X, Z1, A1, Z2, A2)
    return A2, cache
```

`softmax` 必须减掉每行最大值再取指数，否则 `exp(800)` 直接溢出成 `inf`：

```python
def softmax(Z):
    Z = Z - Z.max(axis=1, keepdims=True)
    e = np.exp(Z)
    return e / e.sum(axis=1, keepdims=True)
```

## 反向传播：链式法则落成四个式子

从输出往回推，每一步只关心「上一层传进来的梯度 × 本层的局部导数」：

1. `dZ2 = A2 - Y`（softmax + 交叉熵合并后的结果，这一条值得单独推一遍）
2. `dW2 = A1.T @ dZ2`，`db2 = dZ2.sum(axis=0)`
3. `dA1 = dZ2 @ W2.T`，再过 ReLU：`dZ1 = dA1 * (Z1 > 0)`
4. `dW1 = X.T @ dZ1`，`db1 = dZ1.sum(axis=0)`

写成代码只有十行：

```python
def backward(Y, params, cache):
    X, Z1, A1, Z2, A2 = cache
    W2 = params["W2"]
    N = X.shape[0]

    dZ2 = A2 - Y                              # (N, 10)
    dW2 = A1.T @ dZ2 / N
    db2 = dZ2.sum(axis=0) / N

    dA1 = dZ2 @ W2.T                          # (N, 128)
    dZ1 = dA1 * (Z1 > 0)
    dW1 = X.T @ dZ1 / N
    db1 = dZ1.sum(axis=0) / N

    return {"W1": dW1, "b1": db1, "W2": dW2, "b2": db2}
```

### 一个维度写错的教训

第一次跑 `dW1 = X.T @ dZ1` 报 `shapes (128,10) and (784,128) not aligned`：我把 `dZ1` 写成了 `dA1`。**转置的位置没有玄学，只要盯住「结果矩阵的形状必须是参数本身的形状」**，`W1` 是 `(784, 128)`，那 `X.T (784,N) @ dZ1 (N,128)` 才对得上。

## 用数值梯度校验

解析梯度写完不能直接信，用小扰动逼近一遍对比：

```python
def numeric_grad(f, params, key, eps=1e-5):
    grad = np.zeros_like(params[key])
    it = np.nditer(params[key], flags=["multi_index"])
    for _ in it:
        i = it.multi_index
        old = params[key][i]
        params[key][i] = old + eps
        plus = f(params)
        params[key][i] = old - eps
        minus = f(params)
        params[key][i] = old
        grad[i] = (plus - minus) / (2 * eps)
    return grad
```

相对误差用 `|a - b| / max(1e-8, |a| + |b|)`，实测结果：

| 参数 | 相对误差 |
| --- | --- |
| W1 | 3.2e-10 |
| b1 | 1.1e-09 |
| W2 | 2.7e-10 |
| b2 | 8.4e-10 |

全部小于 `1e-7`，说明解析梯度是对的。这一步花的时间最多，但后面调参时心里有底——**梯度校验通过之后，训练不收敛就只可能是学习率或数据的问题。**

## 跑出来的结果

在 MNIST 上跑 20 个 epoch，学习率 `0.1`，batch 64：

> 训练损失从 2.31 降到 0.08，测试集准确率 **97.4%**；第 6 个 epoch 之后准确率基本不动，猜测是没做正则、也没做学习率衰减。

- 最慢的地方不是反向传播，是 `numeric_grad`：784×128 个参数逐个扰动，一次校验要 40 秒，所以只在**缩小到 10 维输入**的玩具网络上做
- 学习率 0.5 时损失直接冲到 `nan`，因为 softmax 前的 logits 太大
- 加了 `X / 255` 归一化之后，收敛快了大约 3 个 epoch

## 结论

框架里那一行 `backward()`，本质上就是上面那十行代码加上自动微分。手写一遍最大的收获是**对维度不再心虚**——看到形状对不上，能立刻知道是哪个转置漏了。

下一步想做：加一层 batch norm，看看能不能把收敛速度再压一压。
