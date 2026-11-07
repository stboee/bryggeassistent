"""Explicit developer operation; never called implicitly by verification."""
from pathlib import Path
import hashlib

ROOT = Path(__file__).resolve().parents[1]

def write_manifest():
    package = ROOT / 'package'
    files = sorted(p for p in package.rglob('*') if p.is_file() and p.name != 'SHA256SUMS')
    lines = [hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.relative_to(package).as_posix() for p in files]
    (package / 'SHA256SUMS').write_text('\n'.join(lines) + '\n')
    print(f'Manifest: {len(files)} releasefiler')

if __name__ == '__main__':
    write_manifest()
