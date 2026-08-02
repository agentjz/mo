from __future__ import annotations

import argparse
import http.server
import os
import shutil
import socketserver
import subprocess
import sys
import webbrowser
from functools import partial
from pathlib import Path
from urllib.parse import unquote, urlsplit


PORT = 4567
PAGES_PREFIX = "/mo"


def build_dist(project_root: Path) -> None:
    npm_command = "npm.cmd" if os.name == "nt" else "npm"
    print("[mo] Building the GitHub Pages site...")
    subprocess.run([npm_command, "run", "build"], cwd=project_root, check=True)


def windows_browser_candidates() -> list[tuple[Path, str]]:
    roots = [
        os.environ.get("PROGRAMFILES"),
        os.environ.get("PROGRAMFILES(X86)"),
        os.environ.get("LOCALAPPDATA"),
    ]
    candidates: list[tuple[Path, str]] = []
    for root in filter(None, roots):
        base = Path(root)
        candidates.extend([
            (base / "Microsoft/Edge/Application/msedge.exe", "--inprivate"),
            (base / "Google/Chrome/Application/chrome.exe", "--incognito"),
        ])
    return candidates


def open_private_browser(url: str) -> None:
    print("[mo] Opening a private browser window...")
    if os.name == "nt":
        for executable, flag in windows_browser_candidates():
            if executable.is_file():
                subprocess.Popen([str(executable), flag, url])
                return
    else:
        for name, flag in (("microsoft-edge", "--inprivate"), ("google-chrome", "--incognito"), ("chromium", "--incognito")):
            executable = shutil.which(name)
            if executable:
                subprocess.Popen([executable, flag, url])
                return

    print("[mo] Private Edge/Chrome was not found; opening the default browser.", file=sys.stderr)
    webbrowser.open(url)


class MoPagesHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        route = unquote(urlsplit(path).path)
        if route == PAGES_PREFIX:
            route = "/"
        elif route.startswith(f"{PAGES_PREFIX}/"):
            route = route[len(PAGES_PREFIX):]
        else:
            route = "/__mo_not_found__"
        return super().translate_path(route)


class LocalServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


def serve(directory: Path, port: int, should_open: bool) -> None:
    handler = partial(MoPagesHandler, directory=str(directory))
    with LocalServer(("127.0.0.1", port), handler) as server:
        url = f"http://127.0.0.1:{port}{PAGES_PREFIX}/#/"
        print(f"[mo] Serving {directory} at {url}")
        if should_open:
            open_private_browser(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n[mo] Server stopped.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build and serve Mo locally in a private browser.")
    parser.add_argument("--port", type=int, default=PORT, help="Local HTTP port.")
    parser.add_argument("--no-build", action="store_true", help="Skip npm build.")
    parser.add_argument("--no-open", action="store_true", help="Do not open a browser.")
    parser.add_argument("--check", action="store_true", help="Validate the launcher and exit.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    project_root = Path(__file__).resolve().parent
    dist_dir = project_root / "dist"

    if args.check:
        required = [project_root / "package.json", project_root / "vite.config.ts"]
        missing = [path.name for path in required if not path.is_file()]
        if missing:
            print(f"[mo] Missing required files: {', '.join(missing)}", file=sys.stderr)
            return 1
        print("[mo] start_index.py check passed.")
        return 0

    try:
        if not args.no_build:
            build_dist(project_root)
        if not (dist_dir / "index.html").is_file():
            print("[mo] dist/index.html not found. Run without --no-build first.", file=sys.stderr)
            return 1
        serve(dist_dir, args.port, not args.no_open)
        return 0
    except subprocess.CalledProcessError as error:
        print(f"[mo] Build failed: {error}", file=sys.stderr)
        return error.returncode or 1
    except OSError as error:
        print(f"[mo] Failed to start server: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
