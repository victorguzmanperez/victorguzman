import importlib.util, unittest, json
from pathlib import Path
spec=importlib.util.spec_from_file_location('sync',Path(__file__).parents[1]/'sync_substack.py')
sync=importlib.util.module_from_spec(spec); spec.loader.exec_module(sync)
def item(url='https://dataversodata.substack.com/p/example',title='Power Query'):
    return f'<item><title>{title}</title><link>{url}</link><pubDate>Thu, 20 Aug 2026 18:00:03 GMT</pubDate><description>Datos</description></item>'
def feed(body): return ('<rss><channel>'+body+'</channel></rss>').encode()
class SyncTests(unittest.TestCase):
    def test_dedup(self): self.assertEqual(len(sync.parse_feed(feed(item()+item()))),1)
    def test_normalization(self): self.assertEqual(sync.parse_feed(feed(item('https://dataversodata.substack.com/p/example?utm_source=x')))[0]['url'],'https://dataversodata.substack.com/p/example')
    def test_classification(self): self.assertIn('power-query',sync.parse_feed(feed(item()))[0]['topics'])
    def test_bad_host(self):
        with self.assertRaises(ValueError): sync.parse_feed(feed(item('https://evil.test/p/example')))
    def test_empty(self):
        with self.assertRaises(ValueError): sync.parse_feed(feed(''))
    def test_entity(self):
        with self.assertRaises(ValueError): sync.parse_feed(b'<!DOCTYPE x><rss/>')
    def test_invalid_xml(self):
        with self.assertRaises(Exception): sync.parse_feed(b'<rss>')
    def test_no_title(self):
        with self.assertRaises(ValueError): sync.parse_feed(feed(item(title='')))
    def test_conflict(self):
        with self.assertRaises(ValueError): sync.parse_feed(feed(item()+item(title='Changed')))
    def test_oversized(self):
        with self.assertRaises(ValueError): sync.parse_feed(b' ' * 5_000_001)
    def test_production_path_rejected(self):
        with self.assertRaises(ValueError): sync.sync(feed(item()),sync.ROOT/'assets/chatbot/data/content/approved.json')
    def test_no_runtime_staged_import(self):
        for path in (sync.ROOT/'assets/chatbot').rglob('*.js'):
            self.assertNotIn('content/staged',path.read_text(encoding='utf-8'))
if __name__=='__main__': unittest.main()
