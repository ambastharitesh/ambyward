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
        "It MUST clearly show the entrance, storefront, signage, facade, or interior branding of a WALMART store. "
        "Look for the Walmart logo, the yellow spark icon, the blue-and-yellow color scheme, "
        "Walmart-branded signage, or any other visual indicator that unambiguously identifies the store as Walmart. "
        "REJECT (passed=false) the image if it shows any other retailer such as Kroger, Target, Costco, Sam's Club, "
        "Trader Joe's, Whole Foods, CVS, Walgreens, etc., or if the store cannot be confidently identified as Walmart. "
        "Is this image clearly identifiable as a Walmart store? "
        'Answer with only valid JSON: {"passed": true/false, "reason": "one sentence explaining what was seen"}'
    ),
    2: (
        "This image is Step 2 of a retail store audit. "
        "It MUST show a store aisle, product shelf, or retail shelf display that contains MULTIVITAMIN products "
        "or closely related items (vitamin bottles, multivitamin packaging, gummy vitamins, supplement jars, "
        "tablets/capsules clearly labeled as multivitamins, or a shelf section dedicated to vitamins/supplements). "
        "REJECT (passed=false) the image if it shows an aisle of unrelated products (groceries, beverages, snacks, "
        "household goods, apparel, etc.) with no visible multivitamin or vitamin/supplement products. "
        "Does this image show a shelf or aisle containing multivitamin or vitamin/supplement products? "
        'Answer with only valid JSON: {"passed": true/false, "reason": "one sentence explaining what was seen"}'
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

def _detect_video_extension(data: bytes) -> str:
    """
    Detect video container format from the first bytes (magic numbers).
    Whisper picks parser from the filename extension, so we must save the
    temp file with the right suffix.

    WebM / Matroska: starts with EBML header 1A 45 DF A3
    MP4 / QuickTime: bytes 4..8 == "ftyp"
    """
    if len(data) >= 4 and data[:4] == b"\x1a\x45\xdf\xa3":
        return ".webm"
    if len(data) >= 12 and data[4:8] == b"ftyp":
        return ".mp4"
    return ".webm"


async def transcribe_video(video_url: str) -> str:
    """Download video from a URL and transcribe with Whisper."""
    if not settings.openai_api_key:
        return "[Transcription skipped — no API key configured]"

    try:
        async with httpx.AsyncClient(timeout=120) as http:
            resp = await http.get(video_url)
            resp.raise_for_status()
            video_bytes = resp.content

        # Pick suffix from actual container, not the URL or key naming
        suffix = _detect_video_extension(video_bytes)

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
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

# The 9 questions the participant was asked while walking through Walmart's
# multivitamin section. Keep in sync with src/data/videoQuestions.ts.
EVAL_QUESTIONS = [
    {
        "id": 1,
        "category": "CATEGORY",
        "question": "Why are you shopping for Multivitamins today?",
        "hints": "Reason for the purchase — health goal, deficiency, doctor advice, family member, replenishment, etc.",
    },
    {
        "id": 2,
        "category": "RETAILER",
        "question": "Why did you choose this retailer (Walmart) for this purchase?",
        "hints": "Choice driver — price, convenience, location, selection, habit, proximity.",
    },
    {
        "id": 3,
        "category": "TRIP TYPE",
        "question": "Is this a regular shopping trip or a one-off trip just for this category?",
        "hints": "Routine grocery run vs. dedicated trip; trigger (running out, recommendation, illness, sale).",
    },
    {
        "id": 4,
        "category": "BRAND",
        "question": "Did you have a particular product, brand, or type in mind? Which brands are you considering and why?",
        "hints": "Brand names (Centrum, One A Day, Nature Made, etc.) or 'no specific brand'; reasoning.",
    },
    {
        "id": 5,
        "category": "FINDABILITY",
        "question": "How was your experience finding the products — positive, neutral, or negative, and why?",
        "hints": "Ease of locating the multivitamins; signage, layout, staff help. Sentiment + reason.",
    },
    {
        "id": 6,
        "category": "ASSORTMENT",
        "question": "How do you feel about the assortment of products offered here — positive, neutral, or negative, why?",
        "hints": "Range of brands/types/strengths; whether the participant's preferred option is stocked.",
    },
    {
        "id": 7,
        "category": "ORGANIZATION",
        "question": "What do you think about how products are organised — the layout?",
        "hints": "Shelf grouping; categorisation (men/women, age, condition); sub-sections; signage clarity.",
    },
    {
        "id": 8,
        "category": "IMPROVEMENT",
        "question": "Is there anything that would improve your shopping experience in this section?",
        "hints": "Concrete suggestions — better signage, more brands, info cards, price comparison, samples.",
    },
    {
        "id": 9,
        "category": "DECISION",
        "question": "What did you decide to buy, and why? Or, if you decided not to buy, explain why.",
        "hints": "Final purchase decision — specific brand/SKU and reason, OR a no-purchase decision and rationale.",
    },
]


# Minimum acceptable per-question score for a question to count as "answered well".
_Q_PASS_SCORE = 50
# Minimum number of well-answered questions out of 9 for the overall context check to pass.
_OVERALL_PASS_COUNT = 6


EVAL_SYSTEM = (
    "You are a quality analyst evaluating a participant's spoken responses from a retail "
    "audit at Walmart, focused on the Multivitamins category. You receive a single "
    "transcript covering all 9 questions. For each question independently, judge whether "
    "the transcript contains a substantive, on-topic answer. Be lenient — informal, "
    "conversational, in-store speech is expected. One short on-topic sentence is fine; "
    "score it higher if it has reasoning or detail."
)


def _build_eval_user_message(transcript: str) -> str:
    lines = [
        "You are scoring a single multivitamin retail-audit video transcript against 9 specific questions.",
        "",
        "Questions to evaluate (each must be scored independently):",
    ]
    for q in EVAL_QUESTIONS:
        lines.append(
            f"  Q{q['id']} [{q['category']}] {q['question']}\n"
            f"     What to listen for: {q['hints']}"
        )
    lines += [
        "",
        "Transcript:",
        "---",
        transcript.strip() or "(empty)",
        "---",
        "",
        "For EACH of the 9 questions, return:",
        '  - "id": question id (1..9)',
        '  - "category": the category label',
        '  - "answered": true if the transcript clearly addresses this question, else false',
        '  - "score": 0-100 reflecting depth + relevance (0 = not addressed, 50 = brief but on-topic, 90+ = clear with reasoning)',
        '  - "snippet": a short verbatim quote from the transcript supporting your judgment, or "" if not present',
        '  - "reason": one sentence explanation',
        "",
        "Respond with ONLY valid JSON in this exact shape:",
        "{",
        '  "per_question": [ {"id":1, "category":"CATEGORY", "answered":true|false, "score":0-100, "snippet":"...", "reason":"..."}, ... 9 items ... ],',
        '  "summary": "2-3 sentence overall assessment of the participant\'s coverage and quality"',
        "}",
    ]
    return "\n".join(lines)


def _normalise_per_question(raw: list[dict]) -> list[dict]:
    """Ensure we always return 9 entries with the expected fields."""
    by_id = {int(item.get("id", -1)): item for item in raw if isinstance(item, dict)}
    cleaned: list[dict] = []
    for q in EVAL_QUESTIONS:
        item = by_id.get(q["id"], {})
        cleaned.append({
            "id": q["id"],
            "category": q["category"],
            "question": q["question"],
            "answered": bool(item.get("answered", False)),
            "score": int(item.get("score", 0) or 0),
            "snippet": str(item.get("snippet", "") or "")[:280],
            "reason": str(item.get("reason", "") or "")[:280],
        })
    return cleaned


async def evaluate_transcript(transcript: str, project_name: str) -> dict:
    """
    Score the transcript against all 9 questions individually.

    Returns:
        {
          "passed": bool,
          "score": int,                    # average per-question score
          "summary": str,                  # 2-3 sentence overall summary from GPT
          "reason": str,                   # short pass/fail reason (e.g. "Answered 7 of 9")
          "per_question": [ {id, category, question, answered, score, snippet, reason}, ... ],
        }
    """
    if not settings.openai_api_key:
        per_q = _normalise_per_question([
            {"id": q["id"], "answered": True, "score": 90, "snippet": "", "reason": "Mock pass (no API key)"}
            for q in EVAL_QUESTIONS
        ])
        return {
            "passed": True,
            "score": 90,
            "summary": "Evaluation skipped — no API key configured.",
            "reason": "Mock pass",
            "per_question": per_q,
        }

    try:
        response = await _ai().chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": EVAL_SYSTEM},
                {"role": "user", "content": _build_eval_user_message(transcript)},
            ],
            response_format={"type": "json_object"},
            max_tokens=1500,
        )
        text = response.choices[0].message.content or "{}"
        text = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(text)

        per_q = _normalise_per_question(data.get("per_question", []))
        well_answered = sum(1 for q in per_q if q["answered"] and q["score"] >= _Q_PASS_SCORE)
        avg_score = int(round(sum(q["score"] for q in per_q) / len(per_q))) if per_q else 0
        passed = well_answered >= _OVERALL_PASS_COUNT

        missing = [f"Q{q['id']} ({q['category']})" for q in per_q if not (q["answered"] and q["score"] >= _Q_PASS_SCORE)]
        reason = (
            f"Answered {well_answered} of {len(per_q)} questions (need ≥ {_OVERALL_PASS_COUNT})."
            + (f" Weak/missing: {', '.join(missing[:4])}{'…' if len(missing) > 4 else ''}." if missing else "")
        )

        return {
            "passed": passed,
            "score": avg_score,
            "summary": str(data.get("summary", "") or "")[:600],
            "reason": reason,
            "per_question": per_q,
        }
    except Exception as exc:
        return {
            "passed": False,
            "score": 0,
            "summary": "",
            "reason": f"Evaluation error: {exc}",
            "per_question": _normalise_per_question([]),
        }
