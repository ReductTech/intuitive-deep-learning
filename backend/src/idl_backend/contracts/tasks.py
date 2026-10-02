"""Single lazy task catalog. Legacy endpoints remain stable aliases."""
from __future__ import annotations

from dataclasses import dataclass
import importlib
from typing import Any, Callable


@dataclass(frozen=True)
class TaskDefinition:
    task_id: str
    endpoint: str
    handler: str
    kind: str = "vision"
    progress: bool = False


VISION_TASKS = (
    TaskDefinition("vision.digits.fixed.preview", "/lenet5/fixed-kernel-preview", "vision.features.digits:preview_fixed_kernel"),
    TaskDefinition("vision.digits.fixed.train", "/lenet5/fixed-kernel-train", "vision.features.digits:train_fixed_kernel"),
    TaskDefinition("vision.digits.sequence", "/lenet5/sequence-sample", "vision.features.digits:build_sequence_sample"),
    TaskDefinition("vision.digits.recognize", "/emnist/predict-digits", "vision.inference.digits:predict_digits"),
    TaskDefinition("vision.digits.classifier.train", "/visual-feature-learning/digit-train", "vision.training.digits:train_digit_network", progress=True),
    TaskDefinition("vision.faces.fixed.preview", "/face-recog/fixed-kernel-preview", "vision.features.faces:preview_face_fixed_kernel"),
    TaskDefinition("vision.faces.fixed.train", "/face-recog/fixed-kernel-train", "vision.features.faces:train_face_fixed_kernel"),
    TaskDefinition("vision.faces.classifier.train", "/face-recog/lenet-train", "vision.training.faces:train_face_classifier", progress=True),
    TaskDefinition("vision.faces.embedding.compare", "/face-recog/embedding-similarity", "vision.inference.faces:face_embedding_similarity"),
)

ASSESSMENT_ENDPOINTS = (
    "/classification/scenario", "/decision/intake", "/decision/extra-factors",
    "/short-answer/evaluate", "/digit/features-feedback", "/digit/vector-order-feedback",
    "/digit/sequence-strategy-feedback", "/digit/detection-strategy-feedback",
    "/face/verification-feedback", "/image/observation-feedback", "/kernel/gomoku-win-feedback",
    "/loss/compare-feedback", "/loss/category-encoding-feedback", "/loss/sigmoid-transform-feedback",
    "/loss/cross-entropy-sign-feedback", "/loss/probability-design", "/gradient/oscillation-feedback",
)


def endpoints(kind: str) -> tuple[str, ...]:
    return tuple(task.endpoint for task in VISION_TASKS) if kind == "vision" else ASSESSMENT_ENDPOINTS


def resolve_vision(endpoint: str) -> tuple[TaskDefinition, Callable]:
    for task in VISION_TASKS:
        if endpoint in {task.endpoint, task.task_id}:
            module, name = task.handler.split(":")
            return task, getattr(importlib.import_module("idl_backend." + module), name)
    raise ValueError(f"Unsupported vision task: {endpoint}")


def execute_vision(endpoint: str, payload: dict[str, Any], progress=None, *, execution_id=None) -> dict[str, Any]:
    task, handler = resolve_vision(endpoint)
    body = dict(payload)
    body.pop("async", None)
    body.pop("_digit_training", None)
    if task.task_id == "vision.digits.classifier.train":
        return handler(body, progress_callback=progress, artifact_id=execution_id)
    return handler(body, progress_callback=progress) if task.progress else handler(body)


def execute_assessment(endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Cloud and native gateways return the same assessment result envelope."""
    from idl_backend.assessment.client import LLMServiceUnavailable
    from idl_backend.assessment.config import CONFIG
    from idl_backend.assessment.errors import INTERNAL_ERROR, user_facing_input_error, user_facing_service_error
    from idl_backend.assessment.registry import ROUTES
    from idl_backend.assessment.structured import TaskResult
    handler = ROUTES.get(endpoint)
    if handler is None:
        return {"httpStatus": 404, "body": {"ok": False, "status": "not_found", "error": "Unknown assessment task."}}
    try:
        result = handler(dict(payload), CONFIG.timeout)
        fields = result.http_fields() if isinstance(result, TaskResult) else {"structured": True, "result": result}
        return {"httpStatus": 200, "body": {"ok": True, "status": "success", **fields}}
    except ValueError as exc:
        friendly = user_facing_input_error(exc)
        return {"httpStatus": 422, "body": {"ok": False, "status": "invalid_request", "errorCode": friendly.code, "error": friendly.message}}
    except LLMServiceUnavailable as exc:
        friendly = user_facing_service_error(exc)
        return {"httpStatus": 503, "body": {"ok": False, "status": "service_unavailable", "errorCode": friendly.code, "error": friendly.message, "retryable": exc.retryable}}
    except Exception:
        return {"httpStatus": 500, "body": {"ok": False, "status": "internal_error", "errorCode": INTERNAL_ERROR.code, "error": INTERNAL_ERROR.message}}
