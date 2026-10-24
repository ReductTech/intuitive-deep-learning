# 减论登录接入位置

当前仍运行 Demo 认证。手机号页面已预留，尚未调用减论。

| 本站接口 | 请求 |
| --- | --- |
| POST /api/shuku/auth/sms-code | `{ "phone": "手机号" }` |
| POST /api/shuku/auth/phone-login | `{ "method": "sms", "phone": "手机号", "code": "验证码" }` |
| POST /api/shuku/auth/phone-login | `{ "method": "password", "phone": "手机号", "password": "密码" }` |

当前有效格式请求返回 503 JIANLUN_NOT_CONNECTED，不模拟发送成功或生成登录态。Demo 登录接口保持可用。

减论已确认：输入手机号／验证码，输出 user_id、user_name、uuid、token。密码登录和短信发送的上游协议、接口地址及授权方式待确认。

接入位置：`backend/src/shuku_backend/adapters/jianlun.py`。响应校验模型为 JianlunIdentityResult，默认适配器为 ReservedJianlunIdentity。完成真实服务连接后，以全局唯一 uuid 对应本地账号，user_id 保存外部引用，user_name 用于展示；权限仍由本站维护。上游 token 只留服务端，浏览器使用本站 HttpOnly 会话。

待完成：真实 API 调用、账号映射、上游 token 生命周期、短信限制与真实联调。不得仅凭客户端提供的 uuid 或 token 创建会话。
