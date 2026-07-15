from __future__ import annotations

from dataclasses import dataclass
from functools import partial
from typing import Any, Callable

from .tasks.classification import generate_classification_scenario
from .tasks.decision import analyze_decision_intake, generate_extra_decision_factors
from .tasks.loss import parse_probability_loss_design
from .tasks.short_answer import evaluate_short_answer


TaskHandler = Callable[[dict[str, Any], float], dict[str, Any]]


@dataclass(frozen=True)
class Endpoint:
    path: str
    handler: TaskHandler
    request_example: str


ENDPOINTS = (
    Endpoint("/classification/scenario", generate_classification_scenario, "{subject, context?}"),
    Endpoint("/decision/intake", analyze_decision_intake, "{decision}"),
    Endpoint(
        "/decision/extra-factors",
        generate_extra_decision_factors,
        "{decision, positive_label, negative_label, primary_factor_name, context?}",
    ),
    Endpoint("/short-answer/evaluate", evaluate_short_answer, "{task_id, answer, ...context}"),
    Endpoint("/digit/features-feedback", partial(evaluate_short_answer, task_id="digit.feature_reflection"), "{answer}"),
    Endpoint("/digit/vector-order-feedback", partial(evaluate_short_answer, task_id="digit.vector_order"), "{answer, selected_order?}"),
    Endpoint("/digit/sequence-strategy-feedback", partial(evaluate_short_answer, task_id="digit.sequence_strategy"), "{answer, digits?}"),
    Endpoint("/digit/detection-strategy-feedback", partial(evaluate_short_answer, task_id="digit.detection_strategy"), "{answer}"),
    Endpoint("/face/verification-feedback", partial(evaluate_short_answer, task_id="face.verification"), "{answer}"),
    Endpoint("/image/observation-feedback", partial(evaluate_short_answer, task_id="image.pixel_observation"), "{answer}"),
    Endpoint("/kernel/gomoku-win-feedback", partial(evaluate_short_answer, task_id="kernel.gomoku_win"), "{answer, board_size?}"),
    Endpoint("/loss/compare-feedback", partial(evaluate_short_answer, task_id="loss.l1_l2_comparison"), "{answer}"),
    Endpoint("/loss/category-encoding-feedback", partial(evaluate_short_answer, task_id="loss.category_encoding"), "{answer}"),
    Endpoint("/loss/sigmoid-transform-feedback", partial(evaluate_short_answer, task_id="loss.sigmoid_transform"), "{answer}"),
    Endpoint("/loss/cross-entropy-sign-feedback", partial(evaluate_short_answer, task_id="loss.cross_entropy_sign"), "{answer}"),
    Endpoint("/loss/probability-design", parse_probability_loss_design, "{answer}"),
    Endpoint("/gradient/oscillation-feedback", partial(evaluate_short_answer, task_id="gradient.oscillation"), "{answer}"),
)

ROUTES = {endpoint.path: endpoint.handler for endpoint in ENDPOINTS}
