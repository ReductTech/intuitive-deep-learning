import numpy as np


def tanh(x):
    return np.tanh(x)


X = np.array([
    [-1.0, -1.0],
    [-1.0, 1.0],
    [1.0, -1.0],
    [1.0, 1.0],
])

W1 = np.array([
    [1.2, -0.7, 0.5],
    [0.8, 1.0, -1.1],
])
b1 = np.array([0.0, 0.2, -0.1])

W2 = np.array([
    [1.0],
    [-1.2],
    [0.8],
])
b2 = np.array([0.05])

hidden = tanh(X @ W1 + b1)
logits = hidden @ W2 + b2
probs = 1 / (1 + np.exp(-logits))

print("input -> hidden activations -> probability")
for x, h, p in zip(X, hidden, probs):
    print(f"{x.tolist()} -> {np.round(h, 3).tolist()} -> {p.item():.3f}")

print("\nThe hidden layer bends the input space before the final linear readout.")
