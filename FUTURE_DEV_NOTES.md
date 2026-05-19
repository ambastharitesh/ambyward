# Future Development Notes

A running log of gaps, improvements, and ideas to address in future iterations.
Not prioritised — just captured so nothing gets lost.

---

## 1. Per-Project Journey Configuration

**Current state**: Every project uses the exact same 2 photo steps and 9 video questions,
all hardcoded around a "Multivitamins" shopping scenario.

**What needs to change**:
- Add `photo_steps` (array) and `video_questions` (array) fields to the `Project` model in the backend.
- Store them as JSON columns on the DB record (or a related table).
- Frontend: load steps/questions from the project object rather than the static
  `src/data/campaign.ts` and `src/data/videoQuestions.ts` files.
- Each project in the seed data (`backend/app/database.py`) should carry its own
  tailored set of questions relevant to its category (beverages, skincare, snacks, etc.).

**Files to touch**:
- `backend/app/models.py` — add fields
- `backend/app/database.py` — update SEED_PROJECTS with per-project data
- `src/data/campaign.ts` — keep as fallback default only
- `src/data/videoQuestions.ts` — keep as fallback default only
- `src/router.tsx` — pass active project's steps/questions into context
- `src/views/CameraView.tsx` — consume from context instead of static import
- `src/views/VideoRecorderView.tsx` — consume from context instead of static import

---

## 2. Project Type → Journey Type Mapping

**Current state**: All projects, regardless of type (`in-store`, `online`, `at-home`, `survey`),
launch the same in-store photo + video journey.

**What needs to change**:
- `in-store` projects → photo steps + video recording (current flow)
- `online` / `survey` projects → skip photo steps, go straight to a survey form or video
- `at-home` projects → skip store entrance/aisle photos, show product-at-home photo steps
- `survey + at-home` → hybrid: product photo + survey questions, no store visit

**Files to touch**:
- `src/views/ProjectDetailView.tsx` — show journey type summary based on `project.type`
- `src/router.tsx` — `startCamera` / `startJourney` should branch based on project type
- Possibly new view: `SurveyView.tsx` for text/multiple-choice question responses

---

## 3. Real OTP / SMS Integration

**Current state**: OTP is mocked — any 6-digit code is accepted. A console hint shows "Use any 6-digit code."

**What needs to change**:
- Integrate a real SMS provider (Twilio, AWS SNS, or similar).
- Store a hashed OTP with expiry in the DB.
- Validate the code server-side and expire it after one use.

**Files to touch**:
- `backend/app/api/auth.py`
- `backend/app/services/auth_svc.py`
- `backend/.env` / `backend/.env.example` — add SMS provider keys

---

## 4. AI Verification — Real Implementation

**Current state**: The AI Verification screen (`src/views/AIVerificationView.tsx`) runs two
animated checks and calls `POST /api/verify/{id}`, but the backend's verify route
(`backend/app/api/verify.py`) likely returns a mock pass or is incomplete for most projects.

**What needs to change**:
- "Visual Integrity" check: use OpenAI Vision API to inspect uploaded photos
  (correct scene, labels visible, no blur).
- "Context Analysis" check: use OpenAI Whisper to transcribe the video, then
  GPT-4 to score the answers against the project's expected question set.
- Return a structured pass/fail + score per check.
- Surface a failure state in the UI with a retry or appeal option.

**Files to touch**:
- `backend/app/api/verify.py`
- `backend/app/services/` — add `vision_svc.py`, `transcription_svc.py`

---

## 5. Points & Rewards Persistence

**Current state**: `totalPoints` lives in React context (in-memory). On page refresh,
points reset to the seeded value from the last login response.

**What needs to change**:
- Backend should be the source of truth for `total_points`.
- After collecting a reward, the updated balance should be persisted on the `User` record.
- Login / profile API should always return the current balance.
- Consider a `PointsTransaction` table for a full audit trail.

**Files to touch**:
- `backend/app/models.py` — add `PointsTransaction` model
- `backend/app/api/projects.py` — `complete_project` should credit points and log a transaction
- `src/router.tsx` — `collectReward` should trust the API response balance

---

## 6. Notifications — Real Data

**Current state**: The notification bell in the dashboard shows 3 hardcoded sample
notifications that never change.

**What needs to change**:
- Add a `Notification` model in the backend.
- Generate notifications server-side on events: new project available, reward credited,
  project closing soon.
- Fetch unread notifications on dashboard load.
- Mark as read when the panel is opened.

---

## 7. Signup Flow

**Current state**: `SignupView.tsx` is a placeholder form with no backend wiring.

**What needs to change**:
- Wire the signup form to an API endpoint.
- Collect: name, phone (and optionally email, postal code for geo-matching projects).
- Trigger OTP verification on signup too.
- Redirect to dashboard on success, with a welcome state.

---

## 8. Profile Screen

**Current state**: Profile view exists as a stub / placeholder.

**What needs to change**:
- Show user's name, phone, join date, total points, and tier status.
- List completed projects with points earned.
- Allow editing name / notification preferences.

---

## 9. Earnings Screen

**Current state**: Earnings view is a stub in the bottom nav.

**What needs to change**:
- Show a timeline of point transactions (credits from completed projects).
- Show total earned vs redeemed.
- Future: redemption flow (gift cards, PayPal, etc.).

---

## 10. Production Hardening (when moving beyond prototype)

- Replace SQLite with PostgreSQL (update `DATABASE_URL`).
- Move JWT secret and AWS keys to AWS Secrets Manager or Parameter Store.
- Add rate limiting on `/request-otp`.
- Set up HTTPS with a real domain (remove Cloudflare Tunnel dependency).
- Add proper logging and error tracking (e.g., Sentry).
- CI/CD pipeline replacing the manual `push-deploy.sh` script.
- Serve frontend from S3 + CloudFront instead of EC2 + Nginx.

---

*Last updated: May 2026*
