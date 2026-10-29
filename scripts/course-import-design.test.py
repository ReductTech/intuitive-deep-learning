"""Check local references and JSON examples in the import discussion document."""
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
DOCUMENT = ROOT / 'docs' / '\u8bfe\u7a0bGitHub\u94fe\u63a5\u4e0eZIP\u5bfc\u5165\u521b\u5efa\u65b9\u6848\u8ba8\u8bba.md'


class ImportDesignTests(unittest.TestCase):
    def test_existing_code_links_resolve_inside_repository(self):
        document = DOCUMENT.read_text(encoding='utf8')
        links = re.findall(r'\[[^\]\n]+\]\(([^)]+)\)', document)
        local = [link for link in links if not re.match(r'[a-z]+://', link)]
        self.assertGreater(len(local), 10)
        for link in local:
            with self.subTest(link=link):
                target = (DOCUMENT.parent / link.split('#', 1)[0]).resolve()
                self.assertTrue(target.is_relative_to(ROOT.resolve()))
                self.assertTrue(target.is_file(), str(target))

    def test_json_examples_are_valid(self):
        blocks = re.findall(r'```json\s*\n(.*?)\n```', DOCUMENT.read_text(encoding='utf8'), re.S)
        self.assertTrue(blocks)
        for block in blocks:
            with self.subTest(example=block[:60]):
                self.assertIsInstance(json.loads(block), dict)


if __name__ == '__main__':
    unittest.main()
