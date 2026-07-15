from __future__ import annotations

import io
import json
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

from llm_settings import LLM_MAX_TOKENS, LlmSettings

from langchain_app.client import LLMServiceUnavailable, ProxyClient
from langchain_app.proxy import http_server as proxy_http
from langchain_app.proxy.http_server import LlmProxyHandler
from langchain_app.proxy.upstream import (
    Completion,
    UpstreamServiceError,
    build_upstream_request,
    extract_text,
    normalize_messages,
    post_json,
    request_completion,
    upstream_url,
)


SETTINGS = LlmSettings(
    source_path=Path("settings.json"),
    base_url="https://provider.example/v1",
    auth_token="secret-token",
    model="course-model",
)


class UpstreamAdapterTests(unittest.TestCase):
    def test_upstream_url_accepts_supported_base_shapes(self) -> None:
        self.assertEqual(upstream_url(SETTINGS), "https://provider.example/v1/messages")
        self.assertEqual(
            upstream_url(LlmSettings(Path("s"), "https://provider.example", "token", "model")),
            "https://provider.example/v1/messages",
        )
        self.assertEqual(
            upstream_url(LlmSettings(Path("s"), "https://provider.example/v1/messages", "token", "model")),
            "https://provider.example/v1/messages",
        )

    def test_messages_are_normalized_and_system_content_is_separated(self) -> None:
        payload = {
            "messages": [
                {"role": "system", "content": [{"text": "第一条"}, "第二条"]},
                {"role": "user", "content": "问题"},
                {"role": "invalid", "content": "忽略"},
            ],
            "temperature": 0.2,
            "maxTokens": 321,
            "model": "must-be-ignored",
        }
        normalized = normalize_messages(payload)
        self.assertEqual(normalized[0], {"role": "system", "content": "第一条\n第二条"})
        url, headers, body, model = build_upstream_request(payload, settings=SETTINGS)
        self.assertEqual(url, "https://provider.example/v1/messages")
        self.assertEqual(model, "course-model")
        self.assertEqual(body["model"], "course-model")
        self.assertEqual(body["system"], "第一条\n第二条")
        self.assertEqual(body["messages"], [{"role": "user", "content": "问题"}])
        self.assertEqual(body["max_tokens"], LLM_MAX_TOKENS)
        self.assertEqual(headers["x-api-key"], "secret-token")

    def test_prompt_fallback_and_response_text_shapes(self) -> None:
        self.assertEqual(normalize_messages({"prompt": "  hello  "}), [{"role": "user", "content": "hello"}])
        self.assertEqual(
            extract_text({"content": [{"type": "text", "text": "A"}, {"type": "text", "text": "B"}]}),
            "AB",
        )
        self.assertEqual(
            extract_text({"choices": [{"message": {"content": "OpenAI text"}}]}),
            "OpenAI text",
        )
        self.assertEqual(
            extract_text({"content": [{"type": "thinking", "thinking": "Anthropic reasoning"}]}),
            "Anthropic reasoning",
        )
        self.assertEqual(
            extract_text(
                {
                    "content": [
                        {"type": "thinking", "thinking": "Internal reasoning"},
                        {"type": "text", "text": '{"ok":true}'},
                    ]
                }
            ),
            '{"ok":true}',
        )
        self.assertEqual(
            extract_text({"choices": [{"message": {"content": "", "reasoning_content": "Model reasoning"}}]}),
            "Model reasoning",
        )

    def test_upstream_http_status_is_classified_without_returning_detail(self) -> None:
        response_body = io.BytesIO(json.dumps({"error": "account balance exhausted"}).encode("utf-8"))
        error = urllib.error.HTTPError("https://provider.example", 402, "Payment Required", {}, response_body)
        with patch("langchain_app.proxy.upstream.urllib.request.urlopen", side_effect=error):
            with self.assertRaises(UpstreamServiceError) as caught:
                post_json("https://provider.example", {}, {"messages": []}, 1)
        self.assertEqual(caught.exception.reason, "quota_exhausted")
        self.assertFalse(caught.exception.retryable)
        self.assertIn("balance exhausted", str(caught.exception.detail))

    def test_empty_provider_text_is_a_typed_failure(self) -> None:
        request_parts = ("https://provider.example", {}, {"messages": [{"role": "user", "content": "q"}]}, "model")
        with patch("langchain_app.proxy.upstream.build_upstream_request", return_value=request_parts), patch(
            "langchain_app.proxy.upstream.post_json",
            return_value={"content": []},
        ):
            with self.assertRaises(UpstreamServiceError) as caught:
                request_completion({"prompt": "q"}, 1)
        self.assertEqual(caught.exception.reason, "empty_response")


class ProxyHttpTests(unittest.TestCase):
    def test_proxy_http_contract_and_langchain_reason_passthrough(self) -> None:
        server = ThreadingHTTPServer(("127.0.0.1", 0), LlmProxyHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base_url = f"http://127.0.0.1:{server.server_address[1]}"

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
            with patch.object(proxy_http, "get_llm_settings", return_value=SETTINGS), patch.object(
                proxy_http,
                "request_completion",
                return_value=Completion(model="course-model", text="模型回答", raw={"provider": "raw"}),
            ) as completion_mock:
                status, health = request("/health")
                self.assertEqual(status, 200)
                self.assertEqual(health["service"], "llm-proxy")

                status, success = request("/chat", {"prompt": "问题"})
                self.assertEqual(status, 200)
                self.assertTrue(success["ok"])
                self.assertEqual(success["text"], "模型回答")
                self.assertIsNone(success["raw"])
                completion_mock.assert_called_once()

                completion_mock.side_effect = ValueError("Request must include either messages[] or prompt.")
                status, invalid = request("/chat", {})
                self.assertEqual(status, 422)
                self.assertEqual(invalid["errorCode"], "INVALID_REQUEST")

                completion_mock.side_effect = UpstreamServiceError(
                    "provider technical text with acct-secret-456",
                    reason="quota_exhausted",
                    retryable=False,
                    detail={"full": "secret provider response"},
                )
                status, unavailable = request("/chat", {"prompt": "问题"})
                self.assertEqual(status, 503)
                self.assertEqual(unavailable["reason"], "quota_exhausted")
                self.assertEqual(unavailable["errorCode"], "AI_QUOTA_EXHAUSTED")
                unavailable_json = json.dumps(unavailable, ensure_ascii=False)
                self.assertNotIn("acct-secret-456", unavailable_json)
                self.assertNotIn("secret provider response", unavailable_json)

                client = ProxyClient(base_url + "/chat")
                with self.assertRaises(LLMServiceUnavailable) as caught:
                    client.call("prompt", model="model", temperature=0, max_tokens=20, timeout=2)
                self.assertEqual(caught.exception.reason, "quota_exhausted")
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
