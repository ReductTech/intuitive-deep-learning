"""Reuse the existing IDL HTTP client; never duplicate computation or its queue."""
from dataclasses import dataclass, field
from urllib.parse import urlsplit
from uuid import UUID
from idl_backend.contracts.client import request_json, ServiceError
from ..errors import BusinessError, require


@dataclass(frozen=True)
class IdlClient:
    base_url: str
    token: str = field(default="",repr=False)

    def __post_init__(self):
        url=urlsplit(self.base_url)
        if url.scheme not in ("http","https") or not url.hostname or url.username or url.password or url.query or url.fragment:
            raise ValueError("Configure an HTTP(S) IDL service URL on the server")

    def submit(self, course_uuid, endpoint, payload, idempotency_key):
        course_uuid=str(UUID(course_uuid))
        require(isinstance(endpoint,str) and endpoint.startswith('/') and not endpoint.startswith('//') and isinstance(payload,dict),400,"INVALID_COMPUTATION","计算任务格式不正确。")
        require(isinstance(idempotency_key,str) and 0<len(idempotency_key)<=200,400,"INVALID_COMPUTATION","请提供有效任务标识。")
        try:
            return request_json(self.base_url,self.token,"POST","/v1/jobs",{
                "course_uuid":course_uuid,"endpoint":endpoint,"payload":payload,
                "idempotency_key":idempotency_key},timeout=15)
        except ServiceError as error:
            raise BusinessError(503,"COMPUTATION_UNAVAILABLE","课程计算服务暂时不可用。") from error
