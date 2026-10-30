from pathlib import Path
import re,shutil,os
repo=Path.cwd();source=repo/'modules/Convolution-Kernel-Intro';target=repo/'modules/Creator-Guide/components/workflow/copied-course'
assert not target.exists(), 'Copy destination already exists; inspect before replacing'
target.mkdir()
for name in ['pages','course.tsx','LessonContext.tsx','gomokuEngine.ts','GuidePage.tsx','tailwind.css']:
    src=source/name;dst=target/name
    if src.is_dir():shutil.copytree(src,dst)
    else:shutil.copyfile(src,dst)
for dst in target.rglob('*'):
    if not dst.is_file():continue
    src=source/dst.relative_to(target)
    s=dst.read_text(encoding='utf-8-sig')
    def imported(m):
        before,path,quote=m.group(1),m.group(2),m.group(3)
        resolved=(src.parent/path).resolve()
        if resolved.is_relative_to(repo/'modules/shared'):
            path=os.path.relpath(resolved,dst.parent).replace('\\','/')
            if not path.startswith('.'):path='./'+path
        return before+path+quote
    s=re.sub(r'''((?:from\s+|import\s*)['"])(\.[^'"]+)(['"])''', imported, s)
    s=s.replace('38cd1c79-d8b7-462a-b208-a567c5cd89c4','444f8951-dd2e-42dc-94e5-c5a878618631')
    s=re.sub(r'''(moduleAssetUrl\([^,\n]+,\s*['"])([^'"]+)(['"]\))''',r'\1workflow/convolution-course/\2\3',s)
    s=s.replace('course-shell','cg-copy-course-shell').replace('cktw-','cg-copy-tw-').replace('ck-','cg-copy-ck-')
    s=s.replace('convolution-kernel-intro','creator-guide-copied-convolution')
    dst.write_text(s,encoding='utf-8')
# The copied course shares state only inside its provider, never through original or persistent storage.
p=target/'LessonContext.tsx';s=p.read_text(encoding='utf-8')
s=re.sub(r"const (?:STORAGE_KEY|KERNEL_STORAGE_KEY) = [^;]+;\n",'',s)
a=s.index('function readStored():');b=s.index('function normalizeKernel',a);s=s[:a]+s[b:]
a=s.index('function readStoredKernel():');b=s.index('export function GomokuLessonProvider',a);s=s[:a]+s[b:]
s=s.replace('useState<GomokuOutcome | null>(readStored)','useState<GomokuOutcome | null>(null)').replace('useState<LessonKernel | null>(readStoredKernel)','useState<LessonKernel | null>(null)')
s=re.sub(r'^\s*(?:writeStored|writeStoredKernel)\([^\n]*\);\n','\n',s,flags=re.M)
s=s.replace("'gomoku-outcome'","'creator-guide:copied-course:gomoku-outcome'").replace("'gomoku_outcome_recorded'","'creator_guide_gomoku_outcome_recorded'")
p.write_text(s,encoding='utf-8')
assets=repo/'assets/444f8951-dd2e-42dc-94e5-c5a878618631/workflow/convolution-course'
assert not assets.exists(), 'Asset destination already exists'
shutil.copytree(repo/'assets/38cd1c79-d8b7-462a-b208-a567c5cd89c4',assets)
files=[p for p in assets.rglob('*') if p.is_file()]
print({'sourceFiles':len([p for p in target.rglob('*') if p.is_file()]),'assets':len(files),'assetBytes':sum(p.stat().st_size for p in files)})
