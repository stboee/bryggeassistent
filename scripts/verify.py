"""Run read-only, local release gates. No Docker/HA mutation or network access."""
from pathlib import Path
import hashlib, json, os, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]

def run(command,cwd):
    p=subprocess.run(command,cwd=cwd,env={**os.environ,'TZ':'Europe/Oslo'},text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    print(p.stdout,end='',flush=True)
    if p.returncode: raise RuntimeError(f'Failed ({p.returncode}): {command}')
    return p.stdout

def verify(package=None,publication=True):
    package=Path(package or ROOT/'package').resolve()
    meta=json.loads((ROOT/'release.json').read_text()); v=meta['version']
    run(['sha256sum','-c','SHA256SUMS'],package)
    runtime=run(['node',f'test-brygging-{v}.js'],package)
    docs=run(['node',f'test-dokumentasjon-{v}.js'],package)
    run(['bash',f'install-brygging-{v}.sh','--validate-only'],package)
    if publication: run([sys.executable,'scripts/check_publication.py'],ROOT)
    a=re.search(r'(\d+) av (\d+).*?i (\d+) navngitte tester',runtime)
    b=re.search(r'(\d+) av (\d+).*?i (\d+) navngitte tester',docs)
    if not a or not b: raise RuntimeError('Unrecognized test summaries')
    if a[1]!=a[2] or b[1]!=b[2]: raise RuntimeError('Incomplete pass counts')
    return {'version':v,'runtime':{'assertions':int(a[1]),'named_tests':int(a[3]),'result':'passed'},
            'documentation_package':{'assertions':int(b[1]),'named_tests':int(b[3]),'result':'passed'},
            'publication':{'named_tests':11,'result':'passed' if publication else 'not_rerun'},
            'installer_validate_only':'passed','target_environment_acceptance':'not_run',
            'flow_sha256':hashlib.sha256((package/f'brygging-assistent-{v}-flow.json').read_bytes()).hexdigest()}

if __name__=='__main__':
    try:
        result=verify()
        print(json.dumps(result,ensure_ascii=False,indent=2))
    except Exception as e:
        print(str(e),file=sys.stderr);sys.exit(1)
