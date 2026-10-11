import base64
from io import BytesIO
import time
from types import SimpleNamespace

from PIL import Image, ImageDraw
import pytest

from idl_backend.jobs.local import LocalJobs
from idl_backend.vision.device import select_device


@pytest.mark.parametrize("cuda,mps,expected", [(True, False, "cuda"), (False, True, "cpu"), (False, False, "cpu")])
def test_default_device_prefers_cuda_and_falls_back_to_cpu(monkeypatch, cuda, mps, expected):
    monkeypatch.delenv("IDL_DEVICE", raising=False)
    monkeypatch.delenv("CNN_TORCH_DEVICE", raising=False)
    monkeypatch.delenv("IDL_CUDA_MEMORY_FRACTION", raising=False)
    monkeypatch.delenv("CNN_CUDA_MEMORY_FRACTION", raising=False)
    torch = SimpleNamespace(cuda=SimpleNamespace(is_available=lambda: cuda), backends=SimpleNamespace(mps=SimpleNamespace(is_available=lambda: mps)), device=lambda name: name)
    assert select_device(torch) == expected


def canvas(offset):
    image = Image.new("RGBA", (96, 96))
    ImageDraw.Draw(image).line([(30 + offset, 15), (50, 80)], fill="black", width=9)
    output = BytesIO()
    image.save(output, format="PNG")
    return "data:image/png;base64," + base64.b64encode(output.getvalue()).decode()


def test_handwriting_reuses_weights_recovers_from_errors_and_does_not_wait_for_training(monkeypatch):
    from idl_backend.config import model_directory
    if not (model_directory() / "emnist_mobilenet_v3_small_best.pt").is_file():
        pytest.skip("Recognition checkpoint is not installed")
    pytest.importorskip("torch")
    pytest.importorskip("torchvision")
    monkeypatch.setenv("IDL_DEVICE", "cpu")
    jobs = LocalJobs(timeout=60)
    worker = None
    try:
        assert jobs.warmup_inference()["modelLoads"] == 1
        worker = jobs.inference_process
        # Simulate an occupied training slot without launching a real training run.
        import threading
        release = threading.Event()
        blocked = jobs.pool.submit(release.wait, 30)
        try:
            for offset in (0, 8):
                started = time.perf_counter()
                record = jobs.submit("vision", "/emnist/predict-digits", {"images": [canvas(offset)]})
                result = jobs.wait(record["id"], 10)
                assert result["status"] == "complete", result
                assert len(result["result"]["result"]["predictions"]) == 1
                assert jobs.inference_process.pid == worker.pid
                print(f"Resident CPU recognition: {(time.perf_counter() - started) * 1000:.1f} ms")
        finally:
            release.set()
            blocked.result(timeout=5)
        bad = jobs.submit("vision", "/emnist/predict-digits", {"images": ["invalid"]})
        assert jobs.wait(bad["id"], 10)["status"] == "error"
        assert jobs.warmup_inference()["modelLoads"] == 1
        assert jobs.inference_process.pid == worker.pid
        # A dead worker is replaced; queued events from the old process cannot leak.
        worker.terminate()
        worker.join(timeout=5)
        assert jobs.warmup_inference()["modelLoads"] == 1
        assert jobs.inference_process.pid != worker.pid
        worker = jobs.inference_process
    finally:
        jobs.close()
    assert not worker.is_alive()
