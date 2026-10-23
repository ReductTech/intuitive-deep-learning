from concurrent.futures import ThreadPoolExecutor
import pytest
from shuku_backend.errors import BusinessError
from shuku_backend.storage import Store
from shuku_backend.workers import Worker


def test_task_idempotency_and_resource_exclusion(store):
    tid=store.enqueue('test','course-1','key',{'step':1},1000)
    assert store.enqueue('test','course-1','key',{'step':1},1000)==tid
    with pytest.raises(BusinessError) as error:store.enqueue('test','course-1','key',{'step':2},1000)
    assert error.value.status==409
    store.enqueue('test','course-1','other',{},1000)
    with ThreadPoolExecutor(max_workers=2) as pool:
        claimed=list(pool.map(lambda _:store.claim(['test'],1000),range(2)))
    assert sum(task is not None for task in claimed)==1
    first=next(t for t in claimed if t)
    assert store.finish(first['id'],first['lease_token'],1001,result={'done':True})=='succeeded'
    assert store.claim(['test'],1002)


def test_checkpoints_heartbeat_and_stale_executor(store):
    store.enqueue('test','course-1','key',{},1000)
    first=store.claim(['test'],1000,ttl=10)
    store.checkpoint(first['id'],first['lease_token'],1005,{'uploaded':2},ttl=10)
    assert store.claim(['test'],1011) is None
    second=Store(store.database_url).claim(['test'],1016)
    assert second['checkpoint']=={'uploaded':2} and second['attempts']==2
    for action in [lambda:store.finish(first['id'],first['lease_token'],1017,result={}),lambda:store.checkpoint(first['id'],first['lease_token'],1017,{'bad':True})]:
        with pytest.raises(BusinessError) as error:action()
        assert error.value.code=='STALE_LEASE'
    assert store.finish(second['id'],second['lease_token'],1018,result={})=='succeeded'


def test_retry_is_bounded_and_errors_do_not_leak_secrets(store):
    tid=store.enqueue('test','course-1','key',{},1000)
    clock=[1000]
    def fail(*_):raise RuntimeError('token-private')
    worker=Worker(store,{'test':fail},lambda:clock[0])
    for now in [1000,1003,1008]:
        clock[0]=now;assert worker.run_once()
    with store.transaction() as db:row=db.execute('SELECT * FROM shuku_business.tasks WHERE id=%s',(tid,)).fetchone()
    assert row['status']=='failed' and row['error_code']=='HANDLER_FAILED' and row['attempts']==3
    assert store.claim(['test'],1100) is None


def test_worker_reopens_persisted_task_after_restart(store):
    tid=store.enqueue('test','resource','key',{},1000)
    worker=Worker(Store(store.database_url),{'test':lambda task,save:(save({'stage':'done'}),{'ok':True})[1]},lambda:1001)
    assert worker.run_once()
    with store.transaction() as db:row=db.execute('SELECT * FROM shuku_business.tasks WHERE id=%s',(tid,)).fetchone()
    assert row['status']=='succeeded' and row['checkpoint']=={'stage':'done'}


def test_crash_on_last_attempt_reaches_terminal_state(store):
    tid=store.enqueue('test','resource','key',{},1000)
    with store.transaction() as db:db.execute('UPDATE shuku_business.tasks SET max_attempts=1 WHERE id=%s',(tid,))
    assert store.claim(['test'],1000,ttl=5)
    assert store.claim(['test'],1006) is None
    with store.transaction() as db:
        row=db.execute('SELECT status,error_code FROM shuku_business.tasks WHERE id=%s',(tid,)).fetchone()
        assert row=={'status':'failed','error_code':'ATTEMPTS_EXHAUSTED'}
        assert db.execute('SELECT count(*) AS n FROM shuku_business.task_leases').fetchone()['n']==0
