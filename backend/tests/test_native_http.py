import threading
import time
import pytest

from idl_backend.contracts.client import request_json, ServiceError
from idl_backend.contracts.courses import load_courses
from idl_backend.local.http import create_server

UUID = "80396753-7fc8-4f55-9188-bddbdb828169"


@pytest.fixture
def server():
    http = create_server(port=0, courses=load_courses(), token="test-token")
    thread = threading.Thread(target=http.serve_forever, daemon=True)
    thread.start()
    yield "http://127.0.0.1:" + str(http.server_port)
    http.shutdown()
    http.server_close()
    http.jobs.close()
    thread.join()


def test_manual_native_service_implements_cloud_job_protocol(server):
    payload = {"course_uuid": UUID, "endpoint": "/lenet5/fixed-kernel-preview", "payload": {"image": [[0] * 28 for _ in range(28)]}}
    payload["cache_context"] = {"course_scope": "official/visual-feature-learning", "endpoint": payload["endpoint"], "request_data": payload["payload"]}
    created = request_json(server, "test-token", "POST", "/v1/jobs", payload)
    deadline = time.time() + 25
    while time.time() < deadline:
        record = request_json(server, "test-token", "GET", "/v1/jobs/" + created["id"])
        if record["status"] in {"complete", "error"}:
            break
        time.sleep(0.1)
    assert record["status"] == "complete", record
    assert record["result"]["result"]["dataset"]["images"] == "custom-canvas"
    outbox = request_json(server, "test-token", "GET", "/v1/completions")
    assert outbox["records"][0]["cache_context"] == payload["cache_context"]
    request_json(server, "test-token", "POST", "/v1/completions/" + created["id"] + "/ack", {})
    assert request_json(server, "test-token", "GET", "/v1/completions") == {"records": []}


def test_auth_and_unknown_course_rejected(server):
    with pytest.raises(ServiceError) as error:
        request_json(server, "wrong", "GET", "/v1/endpoints")
    assert error.value.status == 401
    with pytest.raises(ServiceError) as error:
        request_json(server, "test-token", "POST", "/v1/jobs", {"course_uuid": "not-registered", "endpoint": "/lenet5/fixed-kernel-preview"})
    assert error.value.status == 422


def test_dev_mode_is_explicit_and_loopback_only():
    with pytest.raises(ValueError):
        create_server("0.0.0.0", 0, token="", dev=True)
    with pytest.raises(ValueError):
        create_server(port=0, token="")


def test_opening_page_legacy_recognition_reuses_resident_model(monkeypatch):
    from idl_backend.config import model_directory
    from test_resident_inference import canvas
    if not (model_directory() / "emnist_mobilenet_v3_small_best.pt").is_file():
        pytest.skip("Recognition checkpoint is not installed")
    pytest.importorskip("torch")
    pytest.importorskip("torchvision")
    monkeypatch.setenv("IDL_DEVICE", "cpu")
    http = create_server(port=0, token="test-token")
    thread = threading.Thread(target=http.serve_forever, daemon=True)
    try:
        http.jobs.warmup_inference()
        initial_pid = http.jobs.inference_process.pid
        thread.start()
        address = "http://127.0.0.1:" + str(http.server_port)
        for offset in (2, 12):
            started = time.perf_counter()
            response = request_json(address, "test-token", "POST", "/emnist/predict-digits", {"images": [canvas(offset)]})
            assert response["ok"]
            assert len(response["result"]["predictions"]) == 1
            print(f"Opening-page HTTP recognition: {(time.perf_counter() - started) * 1000:.1f} ms")
        assert http.jobs.warmup_inference()["modelLoads"] == 1
        assert http.jobs.inference_process.pid == initial_pid
    finally:
        if thread.is_alive():
            http.shutdown()
            thread.join()
        http.server_close()
        http.jobs.close()
