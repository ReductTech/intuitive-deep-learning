"""Account-scoped, restart-safe GitHub binding. Secrets stay encrypted in MySQL."""
import json
import re
from pathlib import Path
from uuid import uuid4
from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.exc import IntegrityError
from .adapters.github_identity import GitHubDevice
from .errors import BusinessError, require


class GitHubIdentity:
    def __init__(self,store,clock,config=None,key_path=None,client=None):
        self.store=store;self.clock=clock;self.config=config or {};self.client=client
        self.cipher=None
        if config and key_path:
            require(bool(re.fullmatch(r'[A-Za-z0-9_.-]{1,100}',config.get('clientId',''))) and bool(config.get('clientSecretPath')),503,'GITHUB_NOT_CONFIGURED','请配置 GitHub 个人授权。')
            self.cipher=Fernet(Path(key_path).read_bytes().strip())
            self.client=client or GitHubDevice(config)

    def seal(self,uid,value):
        return self.cipher.encrypt(json.dumps({'uid':str(uid),'client':self.config['clientId'],'value':value}).encode()).decode()

    def open(self,uid,value):
        try:
            data=json.loads(self.cipher.decrypt(value.encode()))
            if data['uid']!=str(uid) or data['client']!=self.config['clientId']:raise ValueError()
            return data['value']
        except (InvalidToken,ValueError,KeyError,TypeError):
            raise BusinessError(503,'GITHUB_CREDENTIAL_UNAVAILABLE','GitHub 凭证无法恢复，请联系维护者检查加密密钥。') from None

    def enabled(self):return bool(self.client and self.cipher)

    def locked(self,db,uid):
        # Serializes same-account start/poll/cancel/disconnect across processes.
        db.execute('SELECT id FROM shuku_users WHERE id=%s FOR UPDATE',(uid,))
        return self.store.user_in(db,uid)

    def status(self,uid):
        with self.store.transaction() as db:
            self.store.user_in(db,uid)
            row=db.execute('SELECT client_id,github_id,login,expires_at,verified_at FROM shuku_github_identities WHERE user_id=%s',(uid,)).fetchone()
            authorized=bool(row and self.enabled() and row['client_id']==self.config['clientId'] and (row['expires_at'] is None or row['expires_at']>self.clock()))
            return {'available':self.enabled(),'connected':bool(row),'authorized':authorized,
                    'identity':{'id':row['github_id'],'login':row['login'],'url':'https://github.com/'+row['login'],'verified_at':row['verified_at']} if row else None}

    @staticmethod
    def flow_view(row,now):
        return {'flow_id':str(row['flow_id']),'user_code':row['user_code'],
                'verification_url':'https://github.com/login/device','interval':row['interval_seconds'],
                'expires_in':max(0,int(row['expires_at']-now))}

    def action(self,uid,action,data):
        require(self.enabled(),503,'GITHUB_NOT_CONFIGURED','此环境尚未配置 GitHub 个人授权，请联系维护者。')
        fields={'start':set(),'poll':{'flow_id'},'cancel':{'flow_id'},'disconnect':{'confirm','expected_id'}}
        require(action in fields and set(data)==fields[action],400,'INVALID_INPUT','GitHub 授权操作字段不正确。')
        if action=='start':return self.start(uid)
        if action=='disconnect':return self.disconnect(uid,data)
        if action=='cancel':
            with self.store.transaction() as db:
                self.locked(db,uid);row=self.flow(db,uid,data['flow_id'])
                require(not row['completed'],409,'GITHUB_FLOW_COMPLETED','授权已完成，请刷新账号状态。')
                self.revoke_pending(uid,row)
                db.execute("UPDATE shuku_github_identity_flows SET expires_at=0,device='',pending_credentials=NULL WHERE user_id=%s",(uid,))
            return {'message':'已取消授权'}
        return self.poll(uid,data['flow_id'])

    def start(self,uid):
        now=self.clock()
        with self.store.transaction() as db:
            self.locked(db,uid)
            row=db.execute('SELECT * FROM shuku_github_identity_flows WHERE user_id=%s',(uid,)).fetchone()
            if row and row['client_id']==self.config['clientId'] and row['expires_at']>now and not row['completed']:return self.flow_view(row,now)
            require(not row or row['created_at']<=now-60,429,'GITHUB_RATE_LIMIT','请稍后再获取新的授权码。')
            if row and row['client_id']==self.config['clientId']:self.revoke_pending(uid,row)
            result=self.client.start()
            require(isinstance(result.get('device_code'),str) and isinstance(result.get('user_code'),str) and 0<len(result['device_code'])<=1024 and bool(re.fullmatch(r'[A-Z0-9-]{4,32}',result['user_code'])),502,'GITHUB_INVALID_RESPONSE','GitHub 未返回有效授权码。')
            interval=max(5,min(60,int(result.get('interval',5))));expires=max(1,min(1800,int(result.get('expires_in',900))))
            old=db.execute('SELECT github_id FROM shuku_github_identities WHERE user_id=%s',(uid,)).fetchone()
            values=dict(user_id=uid,flow_id=str(uuid4()),client_id=self.config['clientId'],device=self.seal(uid,result['device_code']),user_code=result['user_code'],expires_at=now+expires,next_poll=now+interval,interval_seconds=interval,created_at=now,previous_id=old['github_id'] if old else None,pending_credentials=None,completed=False)
            db.upsert('github_identity_flows', values, [key for key in values if key!='user_id'])
            row=db.execute('SELECT * FROM shuku_github_identity_flows WHERE user_id=%s',(uid,)).fetchone()
            return self.flow_view(row,now)

    def revoke_pending(self,uid,row):
        if row['pending_credentials']:
            pending=self.open(uid,row['pending_credentials'])
            self.client.revoke(self.open(uid,pending['credentials'])['access_token'])

    def flow(self,db,uid,fid):
        require(isinstance(fid,str) and bool(re.fullmatch(r'[a-f0-9-]{36}',fid)),400,'INVALID_INPUT','授权流程不正确。')
        row=db.execute('SELECT * FROM shuku_github_identity_flows WHERE user_id=%s AND flow_id=%s',(uid,fid)).fetchone()
        require(row and row['client_id']==self.config['clientId'] and row['expires_at']>self.clock(),409,'GITHUB_FLOW_EXPIRED','授权已取消或过期，请重新获取授权码。')
        return row

    def credentials(self,uid,result):
        require(isinstance(result.get('access_token'),str) and 0<len(result['access_token'])<=2048,502,'GITHUB_INVALID_RESPONSE','GitHub 未返回有效授权。')
        expires=self.clock()+max(1,int(result['expires_in'])) if result.get('expires_in') else None
        return self.seal(uid,{'access_token':result['access_token'],'refresh_token':result.get('refresh_token')}),expires

    def poll(self,uid,fid):
        # Commit the exchanged token before /user: if identity lookup fails,
        # retry uses this encrypted checkpoint instead of reusing a consumed code.
        with self.store.transaction() as db:
            self.locked(db,uid);row=self.flow(db,uid,fid)
            if row['completed']:return {'complete':True,**self.status(uid)}
            if not row['pending_credentials']:
                if row['next_poll']>self.clock():return {'pending':True,'interval':row['interval_seconds']}
                result=self.client.poll(self.open(uid,row['device']))
                if result.get('error') in ('authorization_pending','slow_down'):
                    interval=min(300,row['interval_seconds']+(5 if result['error']=='slow_down' else 0))
                    db.execute('UPDATE shuku_github_identity_flows SET next_poll=%s,interval_seconds=%s WHERE user_id=%s',(self.clock()+interval,interval,uid))
                    return {'pending':True,'interval':interval}
                if result.get('error'):
                    db.execute("UPDATE shuku_github_identity_flows SET expires_at=0,device='' WHERE user_id=%s",(uid,))
                    failure=True
                else:
                    encrypted,expires=self.credentials(uid,result)
                    db.execute('UPDATE shuku_github_identity_flows SET pending_credentials=%s WHERE user_id=%s',(self.seal(uid,{'credentials':encrypted,'expires_at':expires}),uid))
                    failure=False
            else:failure=False
        require(not failure,409,'GITHUB_FLOW_EXPIRED','GitHub 授权未完成或已拒绝，请重新获取授权码。')
        try:
            with self.store.transaction() as db:
                user=self.locked(db,uid);row=self.flow(db,uid,fid)
                if row['completed']:return {'complete':True,**self.status(uid)}
                pending=self.open(uid,row['pending_credentials']);tokens=self.open(uid,pending['credentials'])
                remote=self.client.user(tokens['access_token'])
                require(type(remote.get('id')) is int and 0<remote['id']<2**63 and isinstance(remote.get('login'),str) and bool(re.fullmatch(r'[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*',remote['login'])) and len(remote['login'])<=100,502,'GITHUB_INVALID_RESPONSE','GitHub 返回的账号信息无效。')
                old=db.execute('SELECT * FROM shuku_github_identities WHERE user_id=%s',(uid,)).fetchone()
                require((old['github_id'] if old else None)==row['previous_id'],409,'GITHUB_IDENTITY_CHANGED','绑定已变化，请重新获取授权码。')
                # Require explicit disconnect before switching accounts, so old
                # credentials are revoked and no personal access is orphaned.
                require(not old or old['github_id']==remote['id'],409,'GITHUB_ACCOUNT_MISMATCH','请使用已绑定的 GitHub 账号授权；更换账号前请先解除绑定。')
                if old:
                    previous=self.open(uid,old['credentials'])['access_token']
                    if previous!=tokens['access_token']:self.client.revoke(previous)
                granted=old['granted_creator'] if old else user['role']=='learner'
                # A unique remote account must never update another local user's binding.
                if old:
                    db.execute('UPDATE shuku_github_identities SET client_id=%s,github_id=%s,login=%s,credentials=%s,expires_at=%s,verified_at=%s WHERE user_id=%s',(self.config['clientId'],remote['id'],remote['login'],pending['credentials'],pending['expires_at'],self.clock(),uid))
                else:
                    db.execute('INSERT INTO shuku_github_identities VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',(uid,self.config['clientId'],remote['id'],remote['login'],pending['credentials'],pending['expires_at'],self.clock(),granted))
                if user['role']=='learner':db.execute("UPDATE shuku_users SET role='creator' WHERE id=%s",(uid,))
                db.execute("UPDATE shuku_github_identity_flows SET completed=true,device='',pending_credentials=NULL WHERE user_id=%s",(uid,))
                db.execute("INSERT INTO shuku_audit(user_id,action,object_id,created_at) VALUES (%s,'github.identity.bind',%s,%s)",(uid,uid,self.clock()))
        except IntegrityError as exc:
            if getattr(exc.orig,"errno",None)!=1062:raise
            raise BusinessError(409,'GITHUB_ALREADY_BOUND','这个 GitHub 账号已绑定其他术库用户。') from None
        return {'complete':True,**self.status(uid)}

    def disconnect(self,uid,data):
        require(data['confirm'] is True and type(data['expected_id']) is int,400,'CONFIRM_REQUIRED','请确认要解除当前 GitHub 绑定。')
        with self.store.transaction() as db:
            user=self.locked(db,uid)
            row=db.execute('SELECT * FROM shuku_github_identities WHERE user_id=%s',(uid,)).fetchone()
            require(row and row['github_id']==data['expected_id'] and row['client_id']==self.config['clientId'],409,'GITHUB_IDENTITY_CHANGED','绑定已变化，请刷新后重试。')
            tokens=self.open(uid,row['credentials'])
            self.client.revoke(tokens['access_token'])
            db.execute('DELETE FROM shuku_github_identities WHERE user_id=%s',(uid,))
            db.execute('DELETE FROM shuku_github_identity_flows WHERE user_id=%s',(uid,))
            if row['granted_creator'] and user['role']=='creator':db.execute("UPDATE shuku_users SET role='learner' WHERE id=%s",(uid,))
            db.execute("INSERT INTO shuku_audit(user_id,action,object_id,created_at) VALUES (%s,'github.identity.disconnect',%s,%s)",(uid,uid,self.clock()))
        return {'message':'已解除 GitHub 绑定',**self.status(uid)}

    def verify(self,uid):
        """Refresh on use and verify remote numeric ID before personal operations."""
        require(self.enabled(),503,'GITHUB_NOT_CONFIGURED','请配置 GitHub 个人授权。')
        with self.store.transaction() as db:
            self.locked(db,uid)
            row=db.execute('SELECT * FROM shuku_github_identities WHERE user_id=%s',(uid,)).fetchone()
            require(row and row['client_id']==self.config['clientId'],409,'GITHUB_REAUTHORIZE','请先绑定 GitHub。')
            tokens=self.open(uid,row['credentials'])
            if row['expires_at'] is not None and row['expires_at']<=self.clock()+60:
                require(tokens.get('refresh_token'),409,'GITHUB_REAUTHORIZE','GitHub 授权已过期，请重新授权。')
                result=self.client.refresh(tokens['refresh_token']);encrypted,expires=self.credentials(uid,result)
                db.execute('UPDATE shuku_github_identities SET credentials=%s,expires_at=%s WHERE user_id=%s',(encrypted,expires,uid))
                tokens=self.open(uid,encrypted)
        remote=self.client.user(tokens['access_token'])
        require(remote.get('id')==row['github_id'],409,'GITHUB_IDENTITY_CHANGED','GitHub 身份不一致，请重新授权。')
        return remote
