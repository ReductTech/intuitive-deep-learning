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
            try:
                os.replace(name,path)
            except PermissionError:
                # Windows may reject replacement while a concurrent writer reads
                # the same immutable object. An identical published object suffices.
                if not path.is_file() or sha256(path.read_bytes()).hexdigest()!=digest:
                    raise
        finally:
            if os.path.exists(name):os.unlink(name)
        return {"sha256":digest,"size":len(content)}

    def read(self, digest):
        content=self.path(digest).read_bytes()
        if sha256(content).hexdigest()!=digest:
            raise ValueError("Stored object checksum mismatch")
        return content

    def put_file(self, source):
        """Store large seekable uploads without materializing the whole file in RAM."""
        source.seek(0);digest=sha256();size=0
        fd,name=tempfile.mkstemp(prefix='.write-',dir=self.root)
        try:
            with os.fdopen(fd,'wb') as out:
                while True:
                    chunk=source.read(65536)
                    if not chunk:break
                    digest.update(chunk);size+=len(chunk);out.write(chunk)
                out.flush();os.fsync(out.fileno())
            path=self.path(digest.hexdigest());path.parent.mkdir(parents=True,exist_ok=True)
            try:os.replace(name,path)
            except PermissionError:
                if not path.is_file() or path.stat().st_size!=size:raise
                existing=sha256()
                with path.open('rb') as stored:
                    for chunk in iter(lambda:stored.read(65536),b''):existing.update(chunk)
                if existing.digest()!=digest.digest():raise
        finally:
            if os.path.exists(name):os.unlink(name)
        return {'sha256':digest.hexdigest(),'size':size}

    def remove(self,digest):
        """Caller must hold the exclusive reference lock and verify no live references."""
        path=self.path(digest)
        path.unlink(missing_ok=True)
        try:path.parent.rmdir()
        except OSError:pass  # Other objects may still share the hash prefix directory.
