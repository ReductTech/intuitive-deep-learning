"""Content-addressed bucket. HTTP authorization belongs to business services."""
from hashlib import sha256
from pathlib import Path
import os
import re
import tempfile


class Bucket:
    def __init__(self, root):
        self.root=Path(root).resolve()
        self.root.mkdir(parents=True,exist_ok=True)
        fd,name=tempfile.mkstemp(prefix=".ready-",dir=self.root)
        os.close(fd)
        os.unlink(name)

    def path(self, digest):
        if not isinstance(digest,str) or not re.fullmatch(r"[a-f0-9]{64}",digest):
            raise ValueError("Invalid content hash")
        path=self.root/"sha256"/digest[:2]/digest
        if not path.resolve().is_relative_to(self.root):
            raise ValueError("Object path leaves bucket")
        return path

    def put(self, content):
        digest=sha256(content).hexdigest()
        path=self.path(digest)
        path.parent.mkdir(parents=True,exist_ok=True)
        fd,name=tempfile.mkstemp(prefix=".write-",dir=path.parent)
        try:
            with os.fdopen(fd,"wb") as out:
                out.write(content);out.flush();os.fsync(out.fileno())
            os.replace(name,path)
        finally:
            if os.path.exists(name):os.unlink(name)
        return {"sha256":digest,"size":len(content)}

    def read(self, digest):
        content=self.path(digest).read_bytes()
        if sha256(content).hexdigest()!=digest:
            raise ValueError("Stored object checksum mismatch")
        return content
