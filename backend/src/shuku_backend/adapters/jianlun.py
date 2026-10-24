"""Reserved Jianlun phone identity contract; no SMS or remote login is simulated."""
from dataclasses import dataclass,field
import re
from uuid import UUID
from ..errors import BusinessError,require


@dataclass(frozen=True)
class JianlunIdentityResult:
    user_id: str
    user_name: str
    uuid: str
    token: str = field(repr=False)

    @classmethod
    def from_response(cls,value):
        require(isinstance(value,dict),502,'INVALID_JIANLUN_IDENTITY','减论身份响应格式不正确。')
        user_id=value.get('user_id');name=value.get('user_name');token=value.get('token')
        require(type(user_id) in (str,int) and 0<len(str(user_id))<=120 and isinstance(name,str) and 0<len(name.strip())<=200 and isinstance(token,str) and 0<len(token)<=16384,502,'INVALID_JIANLUN_IDENTITY','减论身份响应字段不完整。')
        try:uid=str(UUID(value.get('uuid')))
        except (ValueError,TypeError,AttributeError):raise BusinessError(502,'INVALID_JIANLUN_IDENTITY','减论身份 UUID 无效。')
        return cls(str(user_id),name.strip(),uid,token)


def phone_number(value):
    require(isinstance(value,str) and re.fullmatch(r'1[3-9][0-9]{9}',value),400,'INVALID_PHONE','请输入正确的手机号。')
    return value


class ReservedJianlunIdentity:
    """Replace with the real adapter and UUID→business-user/session mapping later."""
    def send_code(self,phone,peer,now):
        raise BusinessError(503,'JIANLUN_NOT_CONNECTED','验证码服务暂未接入，可先使用 Demo 体验登录。')

    def login_phone(self,method,phone,credential,peer,old_token_hash,now):
        raise BusinessError(503,'JIANLUN_NOT_CONNECTED','手机号登录暂未接入，可先使用 Demo 体验登录。')
