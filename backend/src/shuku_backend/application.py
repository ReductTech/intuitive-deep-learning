from dataclasses import dataclass
import time
from .adapters.identity import DemoIdentity
from .api import Server, handler_for
from .files import Bucket
from .services import Courses
from .storage import Store
from .workers import Worker


@dataclass
class Application:
    settings: object
    store: object
    bucket: object
    identity: object
    courses: object
    worker: object
    clock: object

    def server(self):
        return Server((self.settings.host,self.settings.port),handler_for(self))

    def close(self):
        self.worker.close()


def create_application(settings, clock=time.time):
    store=Store(settings.database_url)
    store.ready()  # Explicit migration only; never seed or migrate during serving.
    bucket=Bucket(settings.bucket_dir)
    identity=DemoIdentity(store,settings.demo_password)
    def verify_file(task,checkpoint):
        data=bucket.read(task["payload"]["sha256"])
        checkpoint({"verified":True})
        return {"size":len(data)}
    worker=Worker(store,{"file.verify":verify_file},clock)
    return Application(settings,store,bucket,identity,Courses(store,clock),worker,clock)
