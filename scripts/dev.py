"""Serve the quiz locally without caching files between edits."""

import hashlib
import io
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def revision(directory):
    digest = hashlib.sha256()
    for path in sorted(Path(directory).rglob("*")):
        if path.is_file() and path.suffix in {".html", ".js", ".css"}:
            digest.update(str(path.relative_to(directory)).encode())
            digest.update(b"\0")
            digest.update(path.read_bytes())
            digest.update(b"\0")
    return digest.hexdigest()[:16]


def version_assets(text, suffix, version):
    # Rewrite both the entry point and its imports, including dynamic import().
    # Versioning just app.js would leave dilemmas.js at its old cache key.
    if suffix == ".html":
        return re.sub(r'((?:src|href)=")([^"/:]+\.(?:js|css))(")',
                      lambda m: f'{m[1]}{m[2]}?v={version}{m[3]}', text)
    if suffix == ".js":
        return re.sub(r'''(\bfrom\s*|\bimport\s*\(\s*)(['"])(\./[^'"?]+\.js)\2''',
                      lambda m: f'{m[1]}{m[2]}{m[3]}?v={version}{m[2]}', text)
    return text


class DevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).resolve().parent.parent / "dist"), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_head(self):
        # Do not validate an old browser copy against filesystem timestamps.
        if "If-Modified-Since" in self.headers:
            del self.headers["If-Modified-Since"]
        path = Path(self.translate_path(self.path))
        if path.is_dir():
            path /= "index.html"
        if path.is_file() and path.suffix in {".html", ".js", ".css"}:
            text = version_assets(path.read_text(encoding="utf-8"), path.suffix, revision(self.directory))
            body = text.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(str(path)) + "; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return io.BytesIO(body)
        return super().send_head()


if __name__ == "__main__":
    with ThreadingHTTPServer(("127.0.0.1", 5173), DevHandler) as server:
        print("Questionnaire: http://127.0.0.1:5173/ (cache disabled)", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
