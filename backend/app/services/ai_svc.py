"""OpenAI Vision (photo check) + Whisper (transcription) + GPT-4o (evaluation)."""
from __future__ import annotations
import json
import tempfile
import os
import httpx
from openai import AsyncOpenAI
from ..config import settings

_client: AsyncOpenAI | None = None


def _ai() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


# ── Visual Integrity ──────────────────────────────────────

PHOTO_PROMPTS = {
    1: (
        "This image is Step 1 of a retail store audit. "
        "It should clearly show the EXTERIOR of a store — its entrance, storefront, signage, or facade. "
        "Does this image show a store exterior or entrance? "
        'Answer with only valid JSON: {"passed": true/false, "reason": "one sentence"}'
    ),
    2: (
        "This image is Step 2 of a retail store audit. "
        "It should clearly show a STORE AISLE, product shelf, or retail shelf display with products. "
        "Does this image show a store aisle or shelf? "
        'Answer with only valid JSON: {"passed": true/false, "reason": "one sentence"}'
    ),
}


async def check_photo(photo_url: str, step: int) -> dict:
    """Run OpenAI Vision on a photo and return {passed, reason}."""
    if not settings.openai_api_key:
        return {"passed": True, "reason": "AI check skipped (no API key configured)"}

    prompt = PHOTO_PROMPTS.get(step, PHOTO_PROMPTS[1])
    try:
        response = await _ai().chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": photo_url, "detail": "low"}},
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
            max_tokens=200,
        )
        text = response.choices[0].message.content or "{}"
        # Strip markdown fences if present
        text = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(text)
    except Exception as exc:
        return {"passed": False, "reason": f"Vision check error: {exc}"}


# ── Whisper Transcription ─────────────────────────────────

async def transcribe_video(video_url: str) -> str:
    """Download video from a URL and transcribe with Whisper."""
    if not settings.openai_api_key:
        return "[Transcription skipped — no API key configured]"

    try:
        async with httpx.AsyncClient(timeout=120) as http:
            resp = await http.get(video_url)
            resp.raise_for_status()
            video_bytes = resp.content

        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as f:
                result = await _ai().audio.transcriptions.create(
                    model="whisper-1",
                    file=f,
                    response_format="text",
                )
            return result
        finally:
            os.unlink(tmp_path)

    except Exception as exc:
        return f"[Transcription error: {exc}]"


# ── GPT-4o Context Evaluation ─────────────────────────────

EVAL_SYSTEM = (
    "You are a quality analyst evaluating participant answers from a retail campaign video audit. "
    "Your job is to assess whether the participant gave substantive, relevant answers to the questions asked."
)

EVAL_USER_TMPL = """\
Campaign: {name}
Category: Multivitamins retail audit (9 questions covering: category reason, retailer choice, trip type, brand consideration, findability, assortment, organisation, improvement, purchase decision).

Video Transcript:
---
{transcript}
---

Evaluate this transcript:
1. Did the participant answer multiple questions (not just one)?
2. Were answers substantive (>1 sentence each) rather than one-word replies?
3. Did the content relate to the expected shopping/retail context?

Respond with ONLY valid JSON:
{{"passed": true/false, "score": 0-100, "summary": "2-3 sentence summary", "reason": "brief pass/fail reason"}}
"""


async def evaluate_transcript(transcript: str, project_name: str) -> dict:
    if not settings.openai_api_key:
        return {
            "passed": True,
            "score": 90,
            "summary": "Evaluation skipped — no API key configured.",
            "reason": "Mock pass",
        }

    try:
        response = await _ai().chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": EVAL_SYSTEM},
                {"role": "user", "content": EVAL_USER_TMPL.format(
                    name=project_name, transcript=transcript
                )},
            ],
            max_tokens=300,
        )
        text = response.choices[0].message.content or "{}"
        text = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(text)
    except Exception as exc:
        return {"passed": False, "score": 0, "summary": "", "reason": f"Evaluation error: {exc}"}
