import math


def relu(x):
    return max(0.0, x)


hidden_units = [
    {"w": 1.0, "b": 0.0, "v": 1.2},
    {"w": -1.0, "b": 1.0, "v": -0.8},
    {"w": 1.0, "b": -1.5, "v": 0.7},
]


def network(x):
    total = 0.2
    activations = []
    for unit in hidden_units:
        z = unit["w"] * x + unit["b"]
        h = relu(z)
        total += unit["v"] * h
        activations.append(round(h, 3))
    return total, activations


xs = [-2, -1, 0, 0.5, 1, 1.5, 2, 3]
print("x\toutput\tReLU activations")
for x in xs:
    y, hs = network(x)
    print(f"{x:>4}\t{y:>6.3f}\t{hs}")

print("\nEach ReLU turns on after w*x+b crosses 0.")
print("Adding several ReLUs creates a piecewise linear function.")
