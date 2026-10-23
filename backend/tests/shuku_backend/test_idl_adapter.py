from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
import json
import threading
from uuid import uuid4
import pytest
from shuku_backend.adapters.idl import IdlClient
from shuku_backend.errors import BusinessError


def test_reuses_idl_http_contract_and_hides_external_errors():
    received=[]
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def do_POST(self):
            body=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            received.append((self.path,self.headers.get('X-API-Key'),body))
            self.send_response(202 if len(received)==1 else 500)
            self.send_header('Content-Type','application/json');self.end_headers()
            self.wfile.write(json.dumps({'id':'job-1'} if len(received)==1 else {'detail':'private-upstream-token'}).encode())
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    thread=threading.Thread(target=server.serve_forever);thread.start()
    try:
        client=IdlClient('http://127.0.0.1:'+str(server.server_port),'test-api-key')
        cid=str(uuid4());result=client.submit(cid,'/test',{'seed':1},'key-1')
        assert result=={'id':'job-1'}
        assert received[0]==('/v1/jobs','test-api-key',{'course_uuid':cid,'endpoint':'/test','payload':{'seed':1},'idempotency_key':'key-1'})
        with pytest.raises(BusinessError) as error:client.submit(cid,'/test',{},'key-2')
        assert 'private-upstream-token' not in str(error.value)
        assert 'test-api-key' not in repr(client)
    finally:server.shutdown();server.server_close();thread.join()
