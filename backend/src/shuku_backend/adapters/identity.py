"""Demo credentials first; replace this provider when Jianlun API is available."""
from hashlib import scrypt, sha256
from hmac import compare_digest
import secrets
from typing import Protocol
from ..errors import BusinessError, require


class IdentityProvider(Protocol):
    def login(self, username, password, peer, old_token_hash, now): ...


class DemoIdentity:
    def __init__(self, store, password):
        self.store=store
        self.salt=secrets.token_bytes(16)
        self.password_hash=self._hash(password)

    def _hash(self, value):
        return scrypt(value.encode(),salt=self.salt,n=16384,r=8,p=1,dklen=32)

    def login(self, username, password, peer, old_token_hash, now):
        require(isinstance(username,str) and len(username)<=100 and isinstance(password,str) and len(password)<=256,400,"INVALID_INPUT","请输入账号和密码。")
        username=username.strip().lower()
        peer_key=sha256(peer.encode()).hexdigest()
        failure=None
        result=None
        with self.store.transaction() as db:
            db.insert_once('INSERT INTO shuku_login_attempts(peer_key,until_at) VALUES (%s,%s)',(peer_key,now+60))
            attempt=db.execute("SELECT * FROM shuku_login_attempts WHERE peer_key=%s FOR UPDATE",(peer_key,)).fetchone()
            if attempt["until_at"]<=now:
                attempt={"failures":0,"until_at":now+60}
                db.execute("UPDATE shuku_login_attempts SET failures=0,until_at=%s WHERE peer_key=%s",(now+60,peer_key))
            if attempt["failures"]>=10:
                failure=BusinessError(429,"LOGIN_RATE_LIMIT","登录尝试过于频繁，请稍后重试。")
            else:
                valid=compare_digest(self._hash(password),self.password_hash)
                user=db.execute("SELECT id FROM shuku_users WHERE username=%s AND active",(username,)).fetchone()
                if not valid or not user:
                    db.execute("UPDATE shuku_login_attempts SET failures=failures+1 WHERE peer_key=%s",(peer_key,))
                    failure=BusinessError(401,"INVALID_CREDENTIALS","账号或密码不正确。")
                else:
                    db.execute("UPDATE shuku_login_attempts SET failures=0,until_at=%s WHERE peer_key=%s",(now+60,peer_key))
                    db.execute("DELETE FROM shuku_sessions WHERE token_hash=%s OR expires_at<=%s",(old_token_hash,now))
                    token=secrets.token_hex(32)
                    db.execute("INSERT INTO shuku_sessions VALUES (%s,%s,%s)",(sha256(token.encode()).hexdigest(),user["id"],now+43200))
                    result=(self.store.user_in(db,user["id"]),token)
        # Raise after commit so failed-attempt increments survive.
        if failure:raise failure
        return result
