"""UserPromptSubmit hook: append every user prompt, verbatim and timestamped, to docs/ai/prompts-log.md.

AI_PROCESS.md must list all prompts textually and in chronological order. This keeps that record
without manual copy-paste. It never blocks the prompt: any error is swallowed and the prompt goes through.

The hook also fires for messages the user did not write: Claude Code delivers background-task
notifications through the same event. Those are skipped, and the <pasted_content> wrapper the client
adds around pasted text is removed so only the user's own text is recorded.
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

TASK_NOTIFICATION = re.compile(r"<task-notification>.*?</task-notification>", re.DOTALL)
# Only the client's wrapper lines (always with an id, on their own line); a mention of the tag inside
# the user's text must survive verbatim.
PASTED_CONTENT_TAG = re.compile(r'^</?pasted_content id="[^"]*">$\n?', re.MULTILINE)
PROMPT_HEADING = re.compile(r"^## Prompt \d+ · ", re.MULTILINE)


def clean_prompt(prompt: str) -> str:
    """Return the user's own text, or an empty string when the message is a tool notification."""
    if not TASK_NOTIFICATION.sub("", prompt).strip():
        return ""
    return PASTED_CONTENT_TAG.sub("", prompt).strip()


def format_entry(number: int, stamp: str, prompt: str) -> str:
    fence = "~~~~"
    return f"\n## Prompt {number} · {stamp}\n\n{fence}text\n{prompt}\n{fence}\n"


def main() -> None:
    try:
        event = json.loads(sys.stdin.read() or "{}")
        prompt = clean_prompt(event.get("prompt", ""))
        if not prompt:
            return
        root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or event.get("cwd") or Path.cwd())
        log = root / "docs" / "ai" / "prompts-log.md"
        log.parent.mkdir(parents=True, exist_ok=True)
        count = len(PROMPT_HEADING.findall(log.read_text(encoding="utf-8"))) if log.exists() else 0
        stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        with log.open("a", encoding="utf-8") as fh:
            fh.write(format_entry(count + 1, stamp, prompt))
    except Exception:
        pass


if __name__ == "__main__":
    main()
