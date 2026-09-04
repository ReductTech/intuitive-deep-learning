x = 2.0
target = 6.0
w = 1.0
learning_rate = 0.1


def predict(weight, value):
    return weight * value


def mse_loss(y_pred, y_true):
    return (y_pred - y_true) ** 2


for step in range(6):
    y = predict(w, x)
    loss = mse_loss(y, target)

    # loss = (w*x - target)^2
    # dloss/dw = 2 * (w*x - target) * x
    grad_w = 2 * (y - target) * x

    print(
        f"step={step}  w={w:.4f}  pred={y:.4f}  "
        f"loss={loss:.4f}  grad={grad_w:.4f}"
    )

    w = w - learning_rate * grad_w

print("\nThe gradient is negative while the prediction is too small, so w increases.")
