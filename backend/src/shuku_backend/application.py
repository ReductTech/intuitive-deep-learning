from dataclasses import dataclass
import time
from .adapters.identity import DemoIdentity
from .api import Server, handler_for
from .files import Bucket
from .services import Courses
from .storage import Store
from .workers import Worker
from .workflow import Workflow
from .collaboration import Collaboration
from .governance import Governance


@dataclass
class Application:
    settings: object
    store: object
    bucket: object
    identity: object
    courses: object
    worker: object
    clock: object
    workflow: object

    def server(self):
        return Server((self.settings.host,self.settings.port),handler_for(self))

    def close(self):
        self.worker.close()


def create_application(settings, clock=time.time):
    store=Store(settings.database_url)
    store.ready()  # Explicit migration only; never seed or migrate during serving.
    bucket=Bucket(settings.bucket_dir)
    if settings.source_root is not None:
        from pathlib import Path
        from shutil import which
        root=Path(settings.source_root)
        required=[root/'scripts/build-shuku-preview.mjs',root/'node_modules/esbuild/package.json',root/'node_modules/@tailwindcss/node/package.json',root/'node_modules/@tailwindcss/oxide/package.json']
        if not which('node') or not all(path.is_file() for path in required):
            raise RuntimeError("Configure SHUKU_SOURCE_ROOT and install Node runtime dependencies before serving")
    identity=DemoIdentity(store,settings.demo_password)
    def verify_file(task,checkpoint):
        data=bucket.read(task["payload"]["sha256"])
        checkpoint({"verified":True})
        return {"size":len(data)}
    workflow=Workflow(store,bucket,settings.source_root,clock)
    workflow.collaboration=Collaboration(workflow)
    workflow.governance=Governance(workflow)
    worker=Worker(store,{"governance.remove":workflow.governance.run,"file.verify":verify_file,"revision.build":workflow.build},clock)
    return Application(settings,store,bucket,identity,Courses(store,clock),worker,clock,workflow)
