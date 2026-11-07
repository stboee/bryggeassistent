"""Publication-specific checks supplement, rather than replace, inherited tests."""
from pathlib import Path
import datetime, hashlib, json, re, unittest

ROOT = Path(__file__).resolve().parents[1]
PKG = ROOT / 'package'
META = json.loads((ROOT / 'release.json').read_text())
V = META['version']
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

class PublicationTests(unittest.TestCase):
    def test_01_calendar_version(self):
        self.assertRegex(V, r'^\d{4}\.\d{2}\.\d{2}-[1-9]\d*$')
        datetime.datetime.strptime(V.split('-')[0], '%Y.%m.%d')
        self.assertEqual(META['tag'], V)
        self.assertTrue(META['prerelease'])

    def test_02_onboarding_and_status(self):
        for file in ['README.md','AGENTS.md','START-HERE.md','STATUS.md','RELEASE-NOTES.md']:
            self.assertTrue((ROOT/file).is_file(), file)
        self.assertEqual((ROOT/'START-HERE.md').read_bytes(), (PKG/'dokumentasjon/NY-CHAT-ONBOARDING.md').read_bytes())
        for marker in ['OPEN-001','OPEN-002','OPEN-003','OPEN-004']:
            self.assertIn(marker, (ROOT/'STATUS.md').read_text())

    def test_03_license_preserved(self):
        self.assertEqual((ROOT/'LICENSE').read_bytes(), (PKG/'LICENSE').read_bytes())
        self.assertIn('MIT License', (ROOT/'LICENSE').read_text())

    def test_04_baseline_and_engine_identity(self):
        m = json.loads((PKG/'ha-entity-config-id-manifest-rc3.3.2.json').read_text())
        self.assertEqual(m['source_zip_sha256'], META['import_archive_sha256'])
        self.assertEqual(m['source_version'], META['import_baseline'])
        self.assertEqual(len(m['entity_config_ids']), 230)
        for name,key in [(f'brygging-assistent-{V}-flow.json','normalized_flow_sha256'),(f'brygging-dashboard-{V}.yaml','normalized_dashboard_sha256')]:
            text=(PKG/name).read_text()
            for token in ['v1.0.0-rc3.3.2','v1.0.0-RC3.3.2','RC3.3.2','rc3.3.2',V]: text=text.replace(token,'__RELEASE__')
            self.assertEqual(hashlib.sha256(text.encode()).hexdigest(),m[key])

    def test_05_no_embedded_credentials(self):
        patterns=[r'gh[pousr]_[A-Za-z0-9_]{20,}',r'github_pat_[A-Za-z0-9_]{20,}',r'eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}',r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----']
        for p in PKG.rglob('*'):
            if p.is_file() and p.suffix not in ['.xlsx']:
                text=p.read_text()
                for pattern in patterns: self.assertIsNone(re.search(pattern,text),str(p))
        flow=json.loads((PKG/f'brygging-assistent-{V}-flow.json').read_text())
        for node in flow:
            self.assertNotIn('credentials',node)
            if node.get('type')=='server':
                self.assertNotIn('access_token',node)
                self.assertNotIn('token',node)

    def test_06_no_runtime_data(self):
        forbidden={'sessions','state','reports','template-backups','.env','flows_cred.json','credentials.json'}
        for p in PKG.rglob('*'):
            self.assertFalse(set(p.relative_to(PKG).parts)&forbidden,str(p))

    def test_07_findings_are_current_not_open_historical_errors(self):
        inv=json.loads((PKG/f'dokumentasjon/node-red-variabel-og-dataflytinventar-{V}.json').read_text())
        self.assertEqual(inv['metadata']['source_sha256'],sha(PKG/f'brygging-assistent-{V}-flow.json'))
        self.assertEqual(len(inv['findings']),11)
        for f in inv['findings']:
            self.assertIn('status',f)
            self.assertEqual(f['reviewed_in_release'],V)
        self.assertEqual(inv['summary']['broken_edges'],0)

    def test_08_reference_and_workbook_unchanged(self):
        evidence=json.loads((ROOT/'import-provenance.json').read_text())
        for item in evidence['byte_identical_files']:
            self.assertEqual(sha(PKG/item['release_path']),item['source_sha256'])

    def test_09_installer_only_version_changed(self):
        evidence=json.loads((ROOT/'import-provenance.json').read_text())
        text=(PKG/f'install-brygging-{V}.sh').read_text()
        for token in ['v1.0.0-rc3.3.2','RC3.3.2','rc3.3.2',V]: text=text.replace(token,'__RELEASE__')
        self.assertEqual(hashlib.sha256(text.encode()).hexdigest(),evidence['normalized_installer_sha256'])
        self.assertIn('AUTO_ROLLBACK="false"', (PKG/f'install-brygging-{V}.sh').read_text())

    def test_10_workflow_release_is_trusted_and_pinned(self):
        text=(ROOT/'.github/workflows/release.yml').read_text()
        self.assertNotIn('pull_request_target',text)
        self.assertIn('github.ref == \'refs/heads/main\'',text)
        self.assertIn('contents: write',text)
        self.assertIn('--target "$GITHUB_SHA"',text)
        for match in re.finditer(r'uses: ([^\s]+)',text): self.assertRegex(match[1],r'@[a-f0-9]{40}$')

    def test_11_release_scope_is_explicit(self):
        text=(ROOT/'STATUS.md').read_text()
        self.assertIn('ikke automatisk rollback',text)
        self.assertIn('ikke full funksjonell kravdekning',text)
        self.assertEqual(META['state_schema_version'],'1.0')
        self.assertEqual(META['event_schema_version'],'1.0')
        self.assertEqual(META['template_schema_version'],'1.0')

if __name__=='__main__': unittest.main(verbosity=2)
