#!/usr/bin/env python3
"""
Generate images through an OpenAI-compatible API (for "new api" style providers).

Environment variables:
- NEWAPI_API_KEY or OPENAI_API_KEY
- NEWAPI_BASE_URL or OPENAI_BASE_URL (default: https://api.openai.com/v1)
- NEWAPI_IMAGE_MODEL (optional, default: gpt-image-1)
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from urllib import error, request


def normalize_base_url(base_url: str) -> str:
    url = base_url.strip().rstrip("/")
    if not url.startswith(("http://", "https://")):
        raise ValueError("Base URL must start with http:// or https://")
    if url.endswith("/v1"):
        return url
    return f"{url}/v1"


def post_json(url: str, payload: dict, headers: dict, timeout: int) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = request.Request(url, data=body, headers=headers, method="POST")
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            text = resp.read().decode("utf-8", errors="replace")
            return json.loads(text)
    except error.HTTPError as exc:
        err_text = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {err_text}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError("Failed to parse JSON response from API") from exc


def fetch_binary(url: str, timeout: int) -> bytes:
    req = request.Request(url, method="GET")
    with request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def extract_image_content(resp: dict) -> tuple[str, str]:
    # OpenAI-compatible images endpoint: {"data":[{"b64_json":"..."}]} or {"data":[{"url":"..."}]}
    data = resp.get("data")
    if isinstance(data, list) and data:
        first = data[0] if isinstance(data[0], dict) else {}
        for key in ("b64_json", "b64", "image_base64", "base64"):
            value = first.get(key)
            if isinstance(value, str) and value.strip():
                return ("b64", value.strip())
        for key in ("url", "image_url"):
            value = first.get(key)
            if isinstance(value, str) and value.strip():
                return ("url", value.strip())

    # Some providers may return output array in a responses-like schema.
    output = resp.get("output")
    if isinstance(output, list):
        for item in output:
            if not isinstance(item, dict):
                continue
            for key in ("b64_json", "image_base64", "base64", "result"):
                value = item.get(key)
                if isinstance(value, str) and value.strip():
                    return ("b64", value.strip())
            for key in ("url", "image_url"):
                value = item.get(key)
                if isinstance(value, str) and value.strip():
                    return ("url", value.strip())

    raise RuntimeError(f"No image payload found in API response: {json.dumps(resp, ensure_ascii=False)[:500]}")


def decode_b64(data: str) -> bytes:
    # Add missing padding for providers that omit '='
    missing = len(data) % 4
    if missing:
        data += "=" * (4 - missing)
    return base64.b64decode(data)


def save_image(image_bytes: bytes, output_dir: str, filename: str | None) -> Path:
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if filename:
        out_path = out_dir / filename
    else:
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        out_path = out_dir / f"newapi-image-{stamp}.png"

    if out_path.exists():
        stem = out_path.stem
        suffix = out_path.suffix or ".png"
        idx = 1
        while True:
            candidate = out_dir / f"{stem}-{idx}{suffix}"
            if not candidate.exists():
                out_path = candidate
                break
            idx += 1

    out_path.write_bytes(image_bytes)
    return out_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate image by OpenAI-compatible API")
    parser.add_argument("prompt", help="Prompt for image generation")
    parser.add_argument("--base-url", default=os.getenv("NEWAPI_BASE_URL") or os.getenv("OPENAI_BASE_URL") or "https://api.openai.com/v1")
    parser.add_argument("--api-key", default=os.getenv("NEWAPI_API_KEY") or os.getenv("OPENAI_API_KEY"))
    parser.add_argument("--model", default=os.getenv("NEWAPI_IMAGE_MODEL") or "gpt-image-1")
    parser.add_argument("--size", default="1536x1024", help="Image size, e.g. 1024x1024")
    parser.add_argument("--quality", default=None, help="Optional quality parameter if provider supports it")
    parser.add_argument("--output", "-o", default="./images", help="Output directory")
    parser.add_argument("--filename", default=None, help="Optional fixed output filename")
    parser.add_argument("--timeout", type=int, default=120, help="HTTP timeout seconds")
    parser.add_argument("--save-response", default=None, help="Optional path to save raw JSON response")
    args = parser.parse_args()

    if not args.api_key:
        print("Error: missing API key. Set NEWAPI_API_KEY (or OPENAI_API_KEY).", file=sys.stderr)
        return 1

    try:
        api_root = normalize_base_url(args.base_url)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    endpoint = f"{api_root}/images/generations"
    headers = {
        "Authorization": f"Bearer {args.api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": args.model,
        "prompt": args.prompt,
        "size": args.size,
        "n": 1,
    }
    if args.quality:
        payload["quality"] = args.quality

    try:
        resp_json = post_json(endpoint, payload, headers, args.timeout)
    except RuntimeError as exc:
        print(f"Error calling image API: {exc}", file=sys.stderr)
        return 1

    if args.save_response:
        Path(args.save_response).write_text(json.dumps(resp_json, ensure_ascii=False, indent=2), encoding="utf-8")

    try:
        kind, value = extract_image_content(resp_json)
        image_bytes = decode_b64(value) if kind == "b64" else fetch_binary(value, args.timeout)
    except Exception as exc:  # noqa: BLE001
        print(f"Error extracting image: {exc}", file=sys.stderr)
        return 1

    out_path = save_image(image_bytes, args.output, args.filename)
    print(out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
