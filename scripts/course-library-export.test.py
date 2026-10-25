import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('exporter',Path(__file__).with_name('course-library-export.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)


class ExportTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.source=Path(self.temp.name)/'source';self.target=Path(self.temp.name)/'target'
        for root in (self.source,self.target):root.mkdir();self.git(root,'init')
        self.write('modules/A/outlines.json',json.dumps({'id':'course-a','moduleIdentity':{'id':'uuid-a'},'title':'课程 A','entry':'Course.tsx'}))
        self.write('modules/A/Course.tsx','export const Course=()=>null;')
        self.write('modules/shared/runtime.ts','shared')
        self.write('assets/uuid-a/image.png','binary fixture')
        self.write('creator-skill/SKILL.md','创作规范')
        self.write('package.json',json.dumps({'dependencies':{'react':'19.2.7'}}))
        self.write(module.WORKFLOW,'workflow fixture')
        self.write('scripts/course-library-export.py','export fixture')
        self.write('backend/private.py','must not export')
        self.commit(self.source)
    def git(self,root,*args):
        return subprocess.check_output(['git','-C',str(root),*args],stderr=subprocess.DEVNULL)
    def write(self,name,content):
        p=self.source/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content,encoding='utf-8')
    def commit(self,root):
        self.git(root,'add','-A');self.git(root,'-c','user.name=Test','-c','user.email=test@example.com','commit','-m','snapshot')
    def test_committed_content_assets_dependencies_and_idempotence(self):
        self.write('modules/A/uncommitted.ts','must not export')
        result=module.export(self.source,self.target)
        self.assertEqual(result['courses'],1);self.assertFalse((self.target/'backend').exists());self.assertFalse((self.target/'modules/A/uncommitted.ts').exists())
        self.assertTrue((self.target/'assets/uuid-a/image.png').is_file());self.assertTrue((self.target/'modules/shared/runtime.ts').is_file())
        self.assertEqual(json.loads((self.target/'package.json').read_text())['peerDependencies']['react'],'19.2.7')
        self.commit(self.target);module.export(self.source,self.target)
        self.assertEqual(self.git(self.target,'status','--porcelain'),b'')
    def test_add_modify_and_no_automatic_deletions(self):
        module.export(self.source,self.target);self.commit(self.target)
        self.write('modules/A/Course.tsx','updated');self.write('modules/A/new.ts','new');(self.source/'assets/uuid-a/image.png').unlink();self.commit(self.source)
        module.export(self.source,self.target)
        self.assertEqual((self.target/'modules/A/Course.tsx').read_text(),'updated');self.assertTrue((self.target/'modules/A/new.ts').exists());self.assertTrue((self.target/'assets/uuid-a/image.png').exists())
    def test_independent_changes_stop_sync(self):
        module.export(self.source,self.target);self.commit(self.target)
        (self.target/'modules/A/Course.tsx').write_text('independent');self.commit(self.target)
        with self.assertRaisesRegex(ValueError,'Independent target change'):module.export(self.source,self.target)
        self.assertEqual((self.target/'modules/A/Course.tsx').read_text(),'independent')
    def test_unsafe_paths_and_dirty_destination(self):
        for name in ('../escape','modules/A/.env','modules/A/api_token','modules/A/key.pem'):
            with self.assertRaises(ValueError):module.safe_name(name)
        (self.target/'untracked').write_text('local')
        with self.assertRaisesRegex(ValueError,'independent local changes'):module.export(self.source,self.target)


if __name__=='__main__':unittest.main()
