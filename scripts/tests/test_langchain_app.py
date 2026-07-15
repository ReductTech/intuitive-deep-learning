from __future__ import annotations

import json
import threading
import unittest
import urllib.error
import urllib.request
from functools import partial
from http.server import ThreadingHTTPServer
from unittest.mock import patch

from langchain_app import structured
from langchain_app import http_server
from langchain_app.client import LLMServiceUnavailable, ProxyClient
from langchain_app.errors import user_facing_service_error
from langchain_app.http_server import LangChainServiceHandler
from langchain_app.registry import ENDPOINTS, ROUTES
from langchain_app.structured import TaskResult
from langchain_app.tasks.loss import parse_probability_loss_design
from langchain_app.tasks.short_answer import (
    SHORT_ANSWER_SYSTEM_PROMPT,
    evaluate_short_answer,
    load_question_bank,
)
EXPECTED_PATHS = [
    "/classification/scenario",
    "/decision/intake",
    "/decision/extra-factors",
    "/short-answer/evaluate",
    "/digit/features-feedback",
    "/digit/vector-order-feedback",
    "/digit/sequence-strategy-feedback",
    "/digit/detection-strategy-feedback",
    "/face/verification-feedback",
    "/image/observation-feedback",
    "/kernel/gomoku-win-feedback",
    "/loss/compare-feedback",
    "/loss/category-encoding-feedback",
    "/loss/sigmoid-transform-feedback",
    "/loss/cross-entropy-sign-feedback",
    "/loss/probability-design",
    "/gradient/oscillation-feedback",
]

SHORT_ANSWER_ROUTES = {
    "/digit/features-feedback": "digit.feature_reflection",
    "/digit/vector-order-feedback": "digit.vector_order",
    "/digit/sequence-strategy-feedback": "digit.sequence_strategy",
    "/digit/detection-strategy-feedback": "digit.detection_strategy",
    "/face/verification-feedback": "face.verification",
    "/image/observation-feedback": "image.pixel_observation",
    "/kernel/gomoku-win-feedback": "kernel.gomoku_win",
    "/loss/compare-feedback": "loss.l1_l2_comparison",
    "/loss/category-encoding-feedback": "loss.category_encoding",
    "/loss/sigmoid-transform-feedback": "loss.sigmoid_transform",
    "/loss/cross-entropy-sign-feedback": "loss.cross_entropy_sign",
    "/gradient/oscillation-feedback": "gradient.oscillation",
}


class ScriptedClient:
    def __init__(self, responses: list[object]) -> None:
        self.responses = list(responses)
        self.prompts: list[str] = []
        self.system_prompts: list[str | None] = []
        self.calls: list[dict[str, object]] = []

    def call(self, prompt: str, **kwargs: object) -> str:
        self.prompts.append(prompt)
        self.calls.append(kwargs)
        system_prompt = kwargs.get("system_prompt")
        self.system_prompts.append(system_prompt if isinstance(system_prompt, str) else None)
        if not self.responses:
            raise AssertionError("Unexpected proxy call")
        response = self.responses.pop(0)
        if isinstance(response, BaseException):
            raise response
        return response if isinstance(response, str) else json.dumps(response, ensure_ascii=False)

    def health(self, timeout: float = 2.0) -> dict[str, object]:
        return {"ok": True, "url": "fake://proxy/health", "timeout": timeout}


class RegistryTests(unittest.TestCase):
    def test_registry_is_the_single_complete_endpoint_list(self) -> None:
        self.assertEqual([endpoint.path for endpoint in ENDPOINTS], EXPECTED_PATHS)
        self.assertEqual(set(ROUTES), set(EXPECTED_PATHS))

    def test_every_legacy_short_answer_route_binds_the_same_function(self) -> None:
        for path, task_id in SHORT_ANSWER_ROUTES.items():
            with self.subTest(path=path):
                handler = ROUTES[path]
                self.assertIsInstance(handler, partial)
                self.assertIs(handler.func, evaluate_short_answer)
                self.assertEqual(handler.keywords, {"task_id": task_id})

    def test_question_bank_has_only_maintainable_business_fields(self) -> None:
        bank = load_question_bank()
        self.assertEqual(set(bank), set(SHORT_ANSWER_ROUTES.values()))
        for task_id, task in bank.items():
            with self.subTest(task_id=task_id):
                self.assertEqual(set(task), {"id", "question", "answer", "notes"})
                self.assertEqual(task["id"], task_id)
                self.assertTrue(task["question"])
                self.assertTrue(task["answer"])

    def test_all_handlers_reject_a_non_object_answer_before_proxy_call(self) -> None:
        answer_paths = [
            path
            for path in EXPECTED_PATHS
            if path not in {"/classification/scenario", "/decision/intake", "/decision/extra-factors"}
        ]
        client = ScriptedClient([])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            for path in answer_paths:
                with self.subTest(path=path), self.assertRaises(ValueError):
                    ROUTES[path]({"answer": 123}, 1.0)
        self.assertEqual(client.prompts, [])


class StructuredTaskTests(unittest.TestCase):
    def test_feedback_success_uses_structured_schema(self) -> None:
        client = ScriptedClient(
            [{"verdict": "正确", "level": "correct", "is_correct": True, "explanation": "两者的惩罚增长方式不同。"}]
        )
        with patch.object(structured, "DEFAULT_CLIENT", client):
            result = evaluate_short_answer(
                {"answer": "L1 是绝对值，L2 是平方。"},
                1.0,
                task_id="loss.l1_l2_comparison",
            )
        self.assertTrue(result["is_correct"])
        self.assertEqual(result["level"], "correct")
        self.assertEqual(result["task_id"], "loss.l1_l2_comparison")
        self.assertIn("L1 Loss 和 L2 Loss", client.prompts[0])
        self.assertEqual(client.system_prompts, [SHORT_ANSWER_SYSTEM_PROMPT])

    def test_invalid_first_output_triggers_one_repair_call(self) -> None:
        fixed = {
            "verdict": "接近正确",
            "level": "close",
            "is_correct": False,
            "explanation": "还需要说明平方惩罚增长更快。",
        }
        client = ScriptedClient(["not-json", fixed])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            result = evaluate_short_answer(
                {"answer": "一个是绝对值。"},
                1.0,
                task_id="loss.l1_l2_comparison",
            )
        self.assertEqual(result["verdict"], fixed["verdict"])
        self.assertEqual(result["level"], fixed["level"])
        self.assertEqual(result["explanation"], fixed["explanation"])
        self.assertEqual(result["task_id"], "loss.l1_l2_comparison")
        self.assertEqual(len(client.prompts), 2)
        self.assertIn("原始输出", client.prompts[1])
        self.assertEqual(client.system_prompts, [SHORT_ANSWER_SYSTEM_PROMPT, SHORT_ANSWER_SYSTEM_PROMPT])

    def test_unparseable_model_text_is_a_successful_unstructured_result(self) -> None:
        client = ScriptedClient(["我认为 L1 对异常值更稳定。", "仍然不是 JSON"])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            result = evaluate_short_answer(
                {"answer": "L1 更稳定。"},
                1.0,
                task_id="loss.l1_l2_comparison",
            )
        self.assertIsInstance(result, TaskResult)
        self.assertFalse(result.structured)
        self.assertEqual(result.raw_text, "我认为 L1 对异常值更稳定。")
        self.assertTrue(result.repair_attempted)
        self.assertEqual(len(client.prompts), 2)

    def test_repair_service_failure_keeps_the_initial_model_response_successful(self) -> None:
        unavailable = LLMServiceUnavailable("quota exhausted", reason="quota_exhausted")
        client = ScriptedClient(["普通文本回答", unavailable])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            result = evaluate_short_answer(
                {"answer": "我的解释。"},
                1.0,
                task_id="loss.l1_l2_comparison",
            )
        self.assertFalse(result.structured)
        self.assertEqual(result.raw_text, "普通文本回答")
        self.assertIn("quota exhausted", result.repair_error)

    def test_initial_service_failure_is_not_converted_to_a_model_success(self) -> None:
        unavailable = LLMServiceUnavailable("network offline", reason="network_error", retryable=True)
        client = ScriptedClient([unavailable])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            with self.assertRaises(LLMServiceUnavailable):
                evaluate_short_answer(
                    {"answer": "我的解释。"},
                    1.0,
                    task_id="loss.l1_l2_comparison",
                )

    def test_three_levels_are_normalized_to_one_machine_contract(self) -> None:
        cases = [
            ("正确", "incorrect", False, "correct", True),
            ("接近正确", "correct", True, "close", False),
            ("错误", "correct", True, "incorrect", False),
        ]
        for verdict, model_level, model_correct, expected_level, expected_correct in cases:
            response = {
                "verdict": verdict,
                "level": model_level,
                "is_correct": model_correct,
                "explanation": "统一反馈。",
            }
            client = ScriptedClient([response])
            with self.subTest(verdict=verdict), patch.object(structured, "DEFAULT_CLIENT", client):
                result = evaluate_short_answer(
                    {"task_id": "gradient.oscillation", "answer": "回答内容"},
                    1.0,
                )
                self.assertEqual(result["level"], expected_level)
                self.assertEqual(result["is_correct"], expected_correct)
                self.assertEqual(result["task_id"], "gradient.oscillation")

    def test_route_context_is_added_without_a_specialized_function(self) -> None:
        response = {"verdict": "正确", "level": "correct", "is_correct": True, "explanation": "反馈。"}
        client = ScriptedClient([response])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            ROUTES["/kernel/gomoku-win-feedback"](
                {"answer": "扫描四个方向，连续五个同色棋子获胜。", "board_size": 15, "winner": "黑棋"},
                1.0,
            )
        self.assertIn('"board_size": 15', client.prompts[0])
        self.assertIn('"winner": "黑棋"', client.prompts[0])

    def test_probability_design_fallback_does_not_call_proxy(self) -> None:
        client = ScriptedClient([])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            result = parse_probability_loss_design({"answer": "不知道"}, 1.0)
        self.assertFalse(result["is_meaningful"])
        self.assertEqual(result["family"], "negative_log")
        self.assertEqual(client.prompts, [])

    def test_every_single_call_task_accepts_its_public_result_contract(self) -> None:
        feedback_cases = [
            ("/digit/features-feedback", {"answer": "它是可比较的数字。"}),
            ("/digit/vector-order-feedback", {"answer": "所有样本保持一致即可。"}),
            ("/digit/sequence-strategy-feedback", {"answer": "滑窗识别并跳过空白。"}),
            ("/digit/detection-strategy-feedback", {"answer": "扫描并找 P(6) 最大的位置。"}),
            ("/face/verification-feedback", {"answer": "比较两张脸的特征向量距离。"}),
            ("/image/observation-feedback", {"answer": "看到了像素小点。"}),
            ("/kernel/gomoku-win-feedback", {"answer": "扫描四个方向的连续同色棋子。"}),
            ("/loss/compare-feedback", {"answer": "L1 绝对值，L2 平方。"}),
            ("/loss/category-encoding-feedback", {"answer": "编号制造了不存在的顺序。"}),
            ("/loss/sigmoid-transform-feedback", {"answer": "用 Sigmoid 压到 0 到 1。"}),
            ("/loss/cross-entropy-sign-feedback", {"answer": "负号让损失非负且概率越大损失越小。"}),
            ("/gradient/oscillation-feedback", {"answer": "缩小每次更新的步长。"}),
        ]
        for path, payload in feedback_cases:
            response = {"verdict": "正确", "level": "correct", "is_correct": True, "explanation": "反馈。"}
            client = ScriptedClient([response])
            with self.subTest(path=path), patch.object(structured, "DEFAULT_CLIENT", client):
                result = ROUTES[path](payload, 1.0)
                self.assertEqual(result["verdict"], "正确")
                self.assertEqual(result["task_id"], SHORT_ANSWER_ROUTES[path])
                self.assertEqual(client.system_prompts, [SHORT_ANSWER_SYSTEM_PROMPT])

        generic_client = ScriptedClient(
            [{"verdict": "接近正确", "level": "close", "is_correct": False, "explanation": "还不完整。"}]
        )
        with patch.object(structured, "DEFAULT_CLIENT", generic_client):
            generic_result = ROUTES["/short-answer/evaluate"](
                {"task_id": "loss.l1_l2_comparison", "answer": "L1 是绝对值。"},
                1.0,
            )
        self.assertEqual(generic_result["level"], "close")

        design = {
            "family": "quadratic",
            "scale": 1.0,
            "power": 2.0,
            "formula": "L(p) = (1-p)^2",
            "derivative": "L'(p) = -2(1-p)",
            "is_negative_log": False,
            "is_meaningful": True,
            "explanation": "使用平方惩罚。",
        }
        client = ScriptedClient([design])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            result = ROUTES["/loss/probability-design"]({"answer": "用 (1-p) 的平方"}, 1.0)
        self.assertEqual(result["family"], "quadratic")


class ComplexTaskTests(unittest.TestCase):
    def test_classification_scenario_contract(self) -> None:
        response = {
            "subject": "网球",
            "normalized_subject": "网球",
            "task_question": "是否喜欢网球？",
            "positive_label": "喜欢网球",
            "negative_label": "不喜欢网球",
            "summary": "根据两项可测特征分类。",
            "feature_x": {"name": "运动兴趣", "axis_label": "运动兴趣", "question": "兴趣多高？", "measurement": "0-1"},
            "feature_y": {"name": "观看频率", "axis_label": "观看频率", "question": "多久观看？", "measurement": "0-1"},
            "intro_lines": ["从网球开始。", "把它变成二分类。", "使用两个特征。", "边界就是模型规则。"],
            "boundary_note": "横轴运动兴趣，纵轴观看频率。",
            "first_level_name": "画出边界",
            "first_level_description": "分开两类样本。",
            "second_level_description": "加入噪声样本。",
            "third_level_description": "非线性结构需要复杂边界。",
        }
        client = ScriptedClient([response])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            result = ROUTES["/classification/scenario"]({"subject": "网球"}, 1.0)
        self.assertEqual(result["normalized_subject"], "网球")
        self.assertEqual(len(result["intro_lines"]), 4)

    def test_decision_intake_returns_first_factor_without_waiting_for_extras(self) -> None:
        intake = {
            "status": "ok",
            "normalized_decision": "要不要读研？",
            "positive_label": "读研",
            "negative_label": "不读研",
            "first_factor_name": "学术兴趣",
            "first_factor_direction": "positive",
            "first_factor_value_label": "学术兴趣强度",
            "first_factor_value_question": "你对学术研究有多感兴趣？",
            "first_factor_explanation": "兴趣会影响长期投入。",
            "suggested_importance": 0.8,
            "reason": "输入明确。",
        }
        client = ScriptedClient([intake])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            result = ROUTES["/decision/intake"]({"decision": "读研"}, 1.0)
        self.assertEqual(len(client.prompts), 1)
        self.assertEqual(result["decision"], "要不要读研？")
        self.assertEqual(result["primary_factor"]["name"], "学术兴趣")
        self.assertEqual(result["primary_factor"]["value_transform"], "direct")
        self.assertEqual(result["primary_factor"]["suggested_importance"], 0.8)

    def test_extra_decision_factors_are_a_separate_small_request(self) -> None:
        extras = {
            "factors": [
                {
                    "name": "职业目标",
                    "direction": "positive",
                    "value_label": "职业目标清晰度",
                    "value_question": "你的职业目标有多清晰？",
                    "suggested_importance": 0.9,
                    "explanation": "清晰的目标有助于判断深造价值。",
                },
                {
                    "name": "时间压力",
                    "direction": "negative",
                    "value_label": "可投入时间压力",
                    "value_question": "你目前面临的时间压力有多大？",
                    "suggested_importance": 0.7,
                    "explanation": "压力越大，可用于深造的精力越少。",
                },
            ]
        }
        client = ScriptedClient([extras])
        payload = {
            "decision": "要不要读研？",
            "positive_label": "读研",
            "negative_label": "不读研",
            "primary_factor_name": "学术兴趣",
        }
        with patch.object(structured, "DEFAULT_CLIENT", client):
            result = ROUTES["/decision/extra-factors"](payload, 1.0)
        self.assertEqual(len(client.prompts), 1)
        self.assertEqual(len(result["factors"]), 2)
        self.assertEqual(result["factors"][0]["value_transform"], "direct")
        self.assertEqual(result["factors"][1]["value_transform"], "inverse")
        self.assertEqual(result["factors"][0]["suggested_importance"], 0.9)
        self.assertNotIn("importance_question", result["factors"][0])
        self.assertNotIn("value", result["factors"][0])

    def test_unparseable_decision_intake_short_circuits_as_model_success(self) -> None:
        client = ScriptedClient(["我需要更多信息。", "还是无法形成 JSON。"])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            result = ROUTES["/decision/intake"]({"decision": "不知道"}, 1.0)
        self.assertIsInstance(result, TaskResult)
        self.assertFalse(result.structured)
        self.assertEqual(result.raw_text, "我需要更多信息。")
        self.assertEqual(len(client.prompts), 2)

    def test_model_content_refusal_is_a_structured_success(self) -> None:
        refusal = {
            "status": "refuse",
            "normalized_decision": "",
            "positive_label": "",
            "negative_label": "",
            "first_factor_name": "",
            "first_factor_direction": "positive",
            "first_factor_value_label": "",
            "first_factor_value_question": "",
            "first_factor_explanation": "",
            "suggested_importance": 0.5,
            "reason": "该输入不适合继续分析。",
        }
        client = ScriptedClient([refusal])
        with patch.object(structured, "DEFAULT_CLIENT", client):
            result = ROUTES["/decision/intake"]({"decision": "测试输入"}, 1.0)
        self.assertIsInstance(result, TaskResult)
        self.assertTrue(result.structured)
        self.assertEqual(result["status"], "refuse")
        self.assertEqual(len(client.prompts), 1)


class ProxyClientTests(unittest.TestCase):
    def test_network_error_is_typed_as_service_unavailable(self) -> None:
        client = ProxyClient("http://127.0.0.1:59413/chat")
        with patch(
            "langchain_app.client.urllib.request.urlopen",
            side_effect=urllib.error.URLError("offline"),
        ):
            with self.assertRaises(LLMServiceUnavailable) as caught:
                client.call("prompt", model="model", temperature=0, max_tokens=20, timeout=1)
        self.assertEqual(caught.exception.reason, "network_error")
        self.assertTrue(caught.exception.retryable)

    def test_quota_error_from_proxy_is_classified(self) -> None:
        client = ProxyClient("http://127.0.0.1:59413/chat")
        with patch.object(
            ProxyClient,
            "post_json",
            return_value={"ok": False, "error": "insufficient credit; please check billing"},
        ):
            with self.assertRaises(LLMServiceUnavailable) as caught:
                client.call("prompt", model="model", temperature=0, max_tokens=20, timeout=1)
        self.assertEqual(caught.exception.reason, "quota_exhausted")
        self.assertFalse(caught.exception.retryable)

    def test_every_service_reason_has_a_stable_user_facing_code(self) -> None:
        expected = {
            "configuration_error": "AI_CONFIGURATION_ERROR",
            "quota_exhausted": "AI_QUOTA_EXHAUSTED",
            "rate_limited": "AI_RATE_LIMITED",
            "authentication_failed": "AI_AUTHENTICATION_FAILED",
            "timeout": "AI_REQUEST_TIMEOUT",
            "network_error": "AI_NETWORK_ERROR",
            "invalid_proxy_response": "AI_INVALID_RESPONSE",
            "empty_response": "AI_EMPTY_RESPONSE",
            "upstream_error": "AI_SERVICE_UNAVAILABLE",
            "unknown_reason": "AI_SERVICE_UNAVAILABLE",
        }
        for reason, code in expected.items():
            with self.subTest(reason=reason):
                friendly = user_facing_service_error(LLMServiceUnavailable("full technical error", reason=reason))
                self.assertEqual(friendly.code, code)
                self.assertNotIn("full technical error", friendly.message)


class HttpContractTests(unittest.TestCase):
    def test_http_envelope_and_status_mapping(self) -> None:
        server = ThreadingHTTPServer(("127.0.0.1", 0), LangChainServiceHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base_url = f"http://127.0.0.1:{server.server_address[1]}"
        fake_client = ScriptedClient([])

        def request(path: str, payload: object | None = None) -> tuple[int, dict[str, object]]:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
            req = urllib.request.Request(
                base_url + path,
                data=body,
                headers={"Content-Type": "application/json"},
                method="POST" if payload is not None else "GET",
            )
            try:
                with urllib.request.urlopen(req, timeout=2) as response:
                    return response.status, json.loads(response.read())
            except urllib.error.HTTPError as exc:
                status = exc.code
                data = json.loads(exc.read())
                exc.close()
                return status, data

        try:
            with patch.object(http_server, "DEFAULT_CLIENT", fake_client), patch.dict(
                ROUTES,
                {"/loss/compare-feedback": lambda payload, timeout: {"echo": payload["answer"], "timeout": timeout}},
            ):
                status, health = request("/health")
                self.assertEqual(status, 200)
                self.assertEqual(health["service"], "langchain-service")
                self.assertEqual(health["endpoints"], EXPECTED_PATHS)

                status, success = request("/loss/compare-feedback", {"answer": "hello"})
                self.assertEqual(status, 200)
                self.assertTrue(success["ok"])
                self.assertEqual(success["status"], "success")
                self.assertTrue(success["structured"])
                self.assertEqual(success["result"]["echo"], "hello")

                ROUTES["/loss/compare-feedback"] = lambda payload, timeout: {
                    "verdict": "不太对哦",
                    "is_correct": False,
                    "explanation": "回答错误，但请求成功。",
                }
                status, wrong_answer = request("/loss/compare-feedback", {"answer": "错误答案"})
                self.assertEqual(status, 200)
                self.assertTrue(wrong_answer["ok"])
                self.assertFalse(wrong_answer["result"]["is_correct"])

                ROUTES["/loss/compare-feedback"] = lambda payload, timeout: TaskResult.unstructured(
                    "模型返回的普通文本",
                    parse_error="invalid JSON",
                    repair_attempted=True,
                    repair_error="repair was also invalid",
                )
                status, unstructured = request("/loss/compare-feedback", {"answer": "回答"})
                self.assertEqual(status, 200)
                self.assertTrue(unstructured["ok"])
                self.assertFalse(unstructured["structured"])
                self.assertIsNone(unstructured["result"])
                self.assertEqual(unstructured["rawText"], "模型返回的普通文本")
                self.assertEqual(unstructured["warning"]["code"], "MODEL_RESPONSE_FORMAT_ERROR")
                self.assertIn("格式无法解析", unstructured["warning"]["message"])
                self.assertNotIn("parseError", unstructured)
                self.assertNotIn("repairError", unstructured)
                self.assertNotIn("invalid JSON", json.dumps(unstructured, ensure_ascii=False))
                self.assertNotIn("repair was also invalid", json.dumps(unstructured, ensure_ascii=False))

                def unavailable_handler(payload: object, timeout: float) -> dict[str, object]:
                    raise LLMServiceUnavailable(
                        "insufficient credit: provider account acct-secret-123 has no balance",
                        reason="quota_exhausted",
                        detail={"providerError": "full upstream error with secret diagnostics"},
                        retryable=False,
                    )

                ROUTES["/loss/compare-feedback"] = unavailable_handler
                status, unavailable = request("/loss/compare-feedback", {"answer": "回答"})
                self.assertEqual(status, 503)
                self.assertFalse(unavailable["ok"])
                self.assertEqual(unavailable["status"], "service_unavailable")
                self.assertEqual(unavailable["errorCode"], "AI_QUOTA_EXHAUSTED")
                self.assertIn("额度已用完", unavailable["error"])
                unavailable_json = json.dumps(unavailable, ensure_ascii=False)
                self.assertNotIn("acct-secret-123", unavailable_json)
                self.assertNotIn("full upstream error", unavailable_json)
                self.assertNotIn("detail", unavailable)
                self.assertNotIn("reason", unavailable)

                def internal_error_handler(payload: object, timeout: float) -> dict[str, object]:
                    raise RuntimeError("database password=secret-value leaked in traceback")

                ROUTES["/loss/compare-feedback"] = internal_error_handler
                status, internal = request("/loss/compare-feedback", {"answer": "回答"})
                self.assertEqual(status, 500)
                self.assertEqual(internal["errorCode"], "INTERNAL_ERROR")
                self.assertNotIn("secret-value", json.dumps(internal, ensure_ascii=False))

                status, missing = request("/missing", {})
                self.assertEqual(status, 404)
                self.assertFalse(missing["ok"])
                self.assertEqual(missing["errorCode"], "NOT_FOUND")

                status, invalid = request("/loss/compare-feedback", ["not", "an", "object"])
                self.assertEqual(status, 422)
                self.assertFalse(invalid["ok"])
                self.assertEqual(invalid["status"], "invalid_request")
                self.assertEqual(invalid["errorCode"], "INVALID_REQUEST_BODY")
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
