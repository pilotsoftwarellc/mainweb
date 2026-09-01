#!/usr/bin/env python3
"""Verify static demo pages and local image assets.

Usage:
  python3 scripts/verify-demos.py
  python3 scripts/verify-demos.py --base-url https://pilotsoftware.llc
"""
from __future__ import annotations

import argparse
import hashlib
import html
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTES = [
    "/",
    "/demos/",
    "/demos/restaurant/",
    "/demos/salon/",
    "/demos/contractor/",
    "/demos/fitness/",
    "/demos/photographer/",
    "/demos/cleaning/",
]

class ImageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[str] = []
        self.css: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        if tag in {"img", "source"}:
            for name in ("src", "srcset"):
                value = attrs_dict.get(name)
                if value:
                    self.refs.extend(
                        part.split()[0] for part in value.split(",") if part.strip()
                    )

    def handle_data(self, data: str) -> None:
        self.css.append(data)


def local_file_for(ref: str) -> Path | None:
    clean = urllib.parse.urlsplit(html.unescape(ref)).path
    if not clean.startswith("/demos/assets/"):
        return None
    return ROOT / clean.lstrip("/")


def request(url: str) -> tuple[int, str, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": "PilotDemoAssetAudit/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            body = response.read()
            return response.status, response.headers.get_content_type(), body
    except urllib.error.HTTPError as exc:
        return exc.code, exc.headers.get_content_type(), b""
    except (urllib.error.URLError, TimeoutError) as exc:
        return 0, str(exc), b""


def route_file(route: str) -> Path:
    if route == "/":
        return ROOT / "index.html"
    return ROOT / route.lstrip("/") / "index.html"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8765")
    args = parser.parse_args()
    base = args.base_url.rstrip("/")
    failures: list[str] = []
    total_refs = 0
    unique_assets: dict[str, Path] = {}
    report: list[tuple[str, int, int, int, int]] = []

    for route in ROUTES:
        path = route_file(route)
        if not path.is_file():
            failures.append(f"{route}: missing page file {path}")
            continue
        text = path.read_text(encoding="utf-8")
        if re.search(r"images\.unsplash\.com|images\.pexels\.com|images\.openverse\.org", text, re.I):
            failures.append(f"{route}: remote stock image URL remains in source")
        parser_instance = ImageParser()
        parser_instance.feed(text)
        refs = [ref for ref in parser_instance.refs if ref]
        css_refs = re.findall(r"url\(([^)]+)\)", text, re.I)
        refs.extend(ref.strip(" '\"") for ref in css_refs if ref.strip(" '\"").lower().endswith((".webp", ".avif", ".jpg", ".jpeg", ".png")))
        local_refs = [ref for ref in refs if local_file_for(ref)]
        remote_image_refs = [ref for ref in refs if ref.startswith(("http://", "https://")) and re.search(r"\.(?:webp|avif|jpe?g|png)(?:\?|$)", ref, re.I)]
        if remote_image_refs:
            failures.append(f"{route}: remote image refs: {remote_image_refs}")
        total_refs += len(local_refs)
        hashes: list[str] = []
        broken_before = 0
        for ref in local_refs:
            path_for_ref = local_file_for(ref)
            assert path_for_ref is not None
            asset_key = urllib.parse.urlsplit(ref).path
            unique_assets[asset_key] = path_for_ref
            if not path_for_ref.is_file():
                failures.append(f"{route}: missing local asset {path_for_ref}")
                continue
            digest = hashlib.sha256(path_for_ref.read_bytes()).hexdigest()
            hashes.append(digest)
        duplicate_count = len(hashes) - len(set(hashes))
        if duplicate_count:
            failures.append(f"{route}: duplicate image bytes detected ({duplicate_count})")
        page_url = f"{base}{route}"
        page_status, _, _ = request(page_url)
        if page_status != 200:
            failures.append(f"{route}: page HTTP {page_status}")
        report.append((route, len(local_refs), 0, duplicate_count, page_status))

    image_failures = 0
    for asset_url, path in sorted(unique_assets.items()):
        url = f"{base}{asset_url}"
        status, content_type, body = request(url)
        if status != 200 or not content_type.startswith("image/"):
            failures.append(f"{asset_url}: HTTP {status}, Content-Type {content_type}")
            image_failures += 1
        if not body and status == 200:
            failures.append(f"{asset_url}: empty response body")

    print(f"Routes checked: {len(ROUTES)}")
    print(f"Local image references: {total_refs}")
    print(f"Unique local assets: {len(unique_assets)}")
    print(f"Image response failures: {image_failures}")
    for route, refs, _, duplicates, status in report:
        print(f"{route:28} images={refs:2} duplicates={duplicates} page_http={status}")
    if failures:
        print("\nFAILURES:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print("\nPASS: all pages and local image assets are valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
