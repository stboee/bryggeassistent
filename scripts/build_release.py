"""Deterministic package from tracked package bytes, with separately attested provenance."""
from pathlib import Path
import argparse, datetime, hashlib, json, os, re, shutil, subprocess, tempfile, zipfile
from verify import verify

ROOT=Path(__file__).resolve().parents[1]

def write_zip(path, entries, timestamp):
    with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name,data,mode in sorted(entries):
            info=zipfile.ZipInfo(name,timestamp)
            info.create_system=3;info.external_attr=(0o100000|mode)<<16
            info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)

def build(source_commit):
    meta=json.loads((ROOT/'release.json').read_text()); v=meta['version']
    if source_commit!='WORKTREE':
        if not re.fullmatch('[a-f0-9]{40}',source_commit): raise ValueError('Invalid source commit')
        current=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
        if current!=source_commit: raise ValueError('HEAD differs from stated source commit')
        dirty=subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=ROOT,text=True)
        if dirty: raise ValueError('Tracked source is dirty')
    result=verify()
    result.update(source_commit=source_commit,import_baseline=meta['import_baseline'],
                  import_archive_sha256=meta['import_archive_sha256'],
                  artifact=meta['artifact'],release_type='controlled_production_trial',
                  workbook_provenance='Byte-identical RC3.3.2 workbook; embedded source_release denotes origin')
    provenance={'version':v,'source_commit':source_commit,'import_baseline':meta['import_baseline'],
                'import_archive_sha256':meta['import_archive_sha256'],
                'target_environment_acceptance':'not_run'}
    provenance_bytes=(json.dumps(provenance,ensure_ascii=False,sort_keys=True,indent=2)+'\n').encode()
    entries=[]
    for p in sorted((ROOT/'package').rglob('*')):
        if p.is_file(): entries.append(('Bryggedagsassistent/'+p.relative_to(ROOT/'package').as_posix(),p.read_bytes(),0o755 if p.suffix in ('.sh','.js') else 0o644))
    entries.append(('RELEASE-PROVENANCE.json',provenance_bytes,0o644))
    date=datetime.datetime.strptime(v.split('-')[0],'%Y.%m.%d')
    timestamp=(date.year,date.month,date.day,0,0,0)
    out=ROOT/'dist';out.mkdir(exist_ok=True)
    archive=out/meta['artifact']
    write_zip(archive,entries,timestamp)
    with tempfile.TemporaryDirectory(prefix='bryggeassistent-clean-') as tmp:
        with zipfile.ZipFile(archive) as z:
            if z.testzip(): raise RuntimeError('Corrupt archive')
            z.extractall(tmp)
        # zipfile extraction does not preserve executable modes, unlike unzip.
        package=Path(tmp)/'Bryggedagsassistent'
        for p in package.rglob('*'):
            if p.suffix in ('.js','.sh'): p.chmod(0o755)
        clean=verify(package,publication=False)
        for field in ['runtime','documentation_package','flow_sha256','installer_validate_only']:
            if clean[field]!=result[field]: raise RuntimeError('Clean extraction test mismatch: '+field)
        second=Path(tmp)/'second.zip';write_zip(second,entries,timestamp)
        if archive.read_bytes()!=second.read_bytes(): raise RuntimeError('Non-deterministic archive')
    result['clean_extraction']='passed';result['deterministic_rebuild']='passed'
    result['artifact_sha256']=hashlib.sha256(archive.read_bytes()).hexdigest()
    result['package_files']={name:hashlib.sha256(data).hexdigest() for name,data,_ in sorted(entries)}
    (out/(meta['artifact']+'.sha256')).write_text(result['artifact_sha256']+'  '+meta['artifact']+'\n')
    (out/'verification.json').write_text(json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2)+'\n')
    shutil.copyfile(ROOT/'RELEASE-NOTES.md',out/'RELEASE-NOTES.md')
    print('RELEASE_BUILD',json.dumps({k:result[k] for k in ['version','source_commit','artifact','artifact_sha256','runtime','documentation_package','clean_extraction','deterministic_rebuild']},ensure_ascii=False))
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source-commit',required=True)
    build(p.parse_args().source_commit)
