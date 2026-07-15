import math


def sigmoid(logit):
    return 1.0 / (1.0 + math.exp(-logit))


def bce_with_logits(logit, target):
    return max(logit, 0.0) - logit * target + math.log1p(math.exp(-abs(logit)))


def softmax(logits):
    maximum = max(logits)
    exps = [math.exp(value - maximum) for value in logits]
    total = sum(exps)
    return [value / total for value in exps]


def cross_entropy(logits, target_index):
    maximum = max(logits)
    log_sum_exp = maximum + math.log(sum(math.exp(value - maximum) for value in logits))
    return log_sum_exp - logits[target_index]


rain_logit = 1.8
print("Binary rain task")
print("P(rain):", round(sigmoid(rain_logit), 4))
print("BCE:", round(bce_with_logits(rain_logit, target=1), 4))


weather_logits = [1.2, 0.4, 2.1]
weather_probabilities = softmax(weather_logits)
print("\nMutually exclusive weather task")
print("P(sunny, cloudy, rainy):", [round(value, 4) for value in weather_probabilities])
print("Cross entropy:", round(cross_entropy(weather_logits, target_index=2), 4))
