"""UserPromptSubmit hook: append every prompt, verbatim and timestamped, to docs/ai/prompts-log.md.

AI_PROCESS.md must list all prompts textually and in chronological order. This keeps that record
without manual copy-paste. It never blocks the prompt: any error is swallowed and the prompt goes through.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path


def main() -> None:
    try:
        event = json.loads(sys.stdin.read() or "{}")
        prompt = event.get("prompt", "")
        if not prompt.strip():
            return
        root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or event.get("cwd") or Path.cwd())
        log = root / "docs" / "ai" / "prompts-log.md"
        log.parent.mkdir(parents=True, exist_ok=True)
        count = log.read_text(encoding="utf-8").count("\n## Prompt ") if log.exists() else 0
        stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        fence = "~~~~"
        entry = f"\n## Prompt {count + 1} · {stamp}\n\n{fence}text\n{prompt}\n{fence}\n"
        with log.open("a", encoding="utf-8") as fh:
            fh.write(entry)
    except Exception:
        pass


if __name__ == "__main__":
    main()
