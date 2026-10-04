"""Canonical identities for the fixed-kernel lesson's five seeded models."""
KERNEL_IDS = ("edge", "vertical", "horizontal", "corner")

def fixed_kernel_request(payload):
    if set(payload) != {"kernels", "seed"}:
        raise ValueError("Request must contain only kernels and seed.")
    seed = payload["seed"]
    if type(seed) is not int or not 0 <= seed <= 4:
        raise ValueError("seed must be an integer from 0 to 4.")
    kernels = payload["kernels"]
    if not isinstance(kernels, list) or not kernels or any(not isinstance(item, str) or item not in KERNEL_IDS for item in kernels):
        raise ValueError("Select at least one of the four supported kernels.")
    return {"kernels": [name for name in KERNEL_IDS if name in kernels], "seed": seed}
