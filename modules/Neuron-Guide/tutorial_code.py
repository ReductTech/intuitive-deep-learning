import math


signals = {
    "interest": 0.8,
    "pressure": 0.6,
    "cost": 0.7,
    "future_growth": 0.9,
    "current_grade": 0.5,
}

weights = {
    "interest": 1.4,
    "pressure": -0.5,
    "cost": -1.0,
    "future_growth": 1.2,
    "current_grade": 0.7,
}

bias = -0.2


def sigmoid(x):
    return 1 / (1 + math.exp(-x))


score = bias
print("signal contributions")
for name, value in signals.items():
    contribution = value * weights[name]
    score += contribution
    print(f"{name:>14}: value={value:.2f}, weight={weights[name]:>5.2f}, contribution={contribution:>6.3f}")

probability = sigmoid(score)
print(f"\nraw score: {score:.3f}")
print(f"decision confidence after sigmoid: {probability:.3f}")
print("\nA neuron is a weighted vote over many input signals.")
