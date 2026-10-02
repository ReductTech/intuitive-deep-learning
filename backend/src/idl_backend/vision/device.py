"""Explicit device policy shared by local training and CUDA workers."""
import os


def select_device(torch):
    requested = os.environ.get("IDL_DEVICE", os.environ.get("CNN_TORCH_DEVICE", "auto")).lower()
    if requested not in {"auto", "cpu", "cuda", "mps"}:
        raise ValueError("IDL_DEVICE must be auto, cpu, cuda or mps.")
    cuda = torch.cuda.is_available()
    mps = getattr(torch.backends, "mps", None)
    mps_available = bool(mps and mps.is_available())
    if requested == "auto":
        requested = "cuda" if cuda else "cpu"
    if requested == "cuda" and not cuda or requested == "mps" and not mps_available:
        raise RuntimeError(f"Requested device {requested} is unavailable.")
    if requested == "cuda":
        fraction = os.environ.get("IDL_CUDA_MEMORY_FRACTION", os.environ.get("CNN_CUDA_MEMORY_FRACTION", ""))
        if fraction:
            fraction = float(fraction)
            if not 0 < fraction <= 1:
                raise ValueError("CUDA memory fraction must be in (0, 1].")
            torch.cuda.set_per_process_memory_fraction(fraction, 0)
    return torch.device(requested)
