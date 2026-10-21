import io
import re
import tempfile
import unittest
from email.message import Message
from pathlib import Path

from scripts.dev import DevHandler


class DevServerTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "index.html").write_text('<script type="module" src="bootstrap.js"></script><link href="styles.css">')
        (self.root / "bootstrap.js").write_text("import('./app.js');")
        (self.root / "app.js").write_text("import { question } from './dilemmas.js';")
        (self.root / "dilemmas.js").write_text("export const question = 'ישן';")
        (self.root / "styles.css").write_text("body { color: green; }")

    def request(self, path):
        # Exercise the HTTP response handler without binding a listening socket.
        handler = DevHandler.__new__(DevHandler)
        handler.directory = str(self.root)
        handler.path = path
        handler.headers = Message()
        handler.headers["If-Modified-Since"] = "Wed, 21 Oct 2099 07:00:00 GMT"
        handler.request_version = "HTTP/1.1"
        handler.command = "GET"
        handler.wfile = io.BytesIO()
        handler.log_request = lambda *args: None
        body = handler.send_head()
        self.addCleanup(body.close)
        headers = handler.wfile.getvalue().decode("latin1")
        payload = body.read()
        self.assertIn("200 OK", headers)
        self.assertIn("Cache-Control: no-store", headers)
        self.assertIn(f"Content-Length: {len(payload)}\r\n", headers)
        return headers, payload.decode()

    def test_versions_every_module_and_stylesheet_in_the_dependency_chain(self):
        _, html = self.request("/")
        version = re.search(r"bootstrap.js\?v=([a-f0-9]+)", html)[1]
        self.assertIn(f"styles.css?v={version}", html)
        _, bootstrap = self.request(f"/bootstrap.js?v={version}")
        self.assertIn(f"import('./app.js?v={version}')", bootstrap)
        _, app = self.request(f"/app.js?v={version}")
        self.assertIn(f"from './dilemmas.js?v={version}'", app)

    def test_editing_only_question_text_changes_all_asset_urls(self):
        _, before = self.request("/")
        # Keep the file timestamp unchanged to catch timestamp-based cache bugs.
        path = self.root / "dilemmas.js"
        timestamp = path.stat().st_mtime_ns
        path.write_text("export const question = 'חדש';")
        import os
        os.utime(path, ns=(timestamp, timestamp))
        _, after = self.request("/")
        self.assertNotEqual(before, after)
        headers, content = self.request("/dilemmas.js?v=old")
        self.assertIn("javascript", headers)
        self.assertIn("חדש", content)
        _, unchanged = self.request("/")
        self.assertEqual(after, unchanged)


if __name__ == "__main__":
    unittest.main()
