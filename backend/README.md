# RewardLens Backend

FastAPI backend powering the RewardLens mobile web app.

## Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Framework    | FastAPI + Uvicorn                       |
| Database     | SQLite (dev) → PostgreSQL (prod)        |
| ORM          | SQLModel                                |
| Auth         | JWT (python-jose) + Mock SMS OTP        |
| File storage | AWS S3 (presigned PUT/GET URLs)         |
| AI – Photos  | OpenAI GPT-4o Vision                    |
| AI – Video   | OpenAI Whisper-1 (transcription) + GPT-4o (evaluation) |

---

## Quick Start

```bash
cd backend

# 1. Create virtualenv
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Fill in your keys in .env (see below)

# 4. Run
uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

## Environment Variables (`.env`)

| Variable               | Required | Description                                             |
|------------------------|----------|---------------------------------------------------------|
| `JWT_SECRET`           | yes      | Random 32+ char secret for signing tokens               |
| `AWS_ACCESS_KEY_ID`    | optional | S3 access key — skip to run in mock-upload mode         |
| `AWS_SECRET_ACCESS_KEY`| optional | S3 secret key                                           |
| `AWS_REGION`           | optional | e.g. `us-east-1`                                        |
| `S3_BUCKET`            | optional | Bucket name for photos/videos                           |
| `OPENAI_API_KEY`       | optional | Skip to run AI checks in mock-pass mode                 |

> **Demo mode**: Leave AWS and OpenAI keys empty. The backend accepts any 6-digit OTP, skips S3 uploads, and auto-passes AI verification. The frontend gracefully handles all of this.

---

## API Endpoints

### Auth
| Method | Path                    | Description                    |
|--------|-------------------------|--------------------------------|
| POST   | `/api/auth/request-otp` | Register phone, (mock) send OTP|
| POST   | `/api/auth/verify-otp`  | Verify code → return JWT token |

### Projects
| Method | Path                           | Auth | Description                      |
|--------|--------------------------------|------|----------------------------------|
| GET    | `/api/projects/`               | ✓    | List all campaigns + user status |
| GET    | `/api/projects/me`             | ✓    | Current user profile + points    |
| GET    | `/api/projects/{id}`           | ✓    | Single project detail            |
| POST   | `/api/projects/{id}/accept`    | ✓    | Accept a "New" project           |
| POST   | `/api/projects/{id}/submit`    | ✓    | Submit photo/video keys          |
| POST   | `/api/projects/{id}/complete`  | ✓    | Collect reward + credit points   |

### Uploads (Presigned S3 URLs)
| Method | Path                    | Auth | Description                  |
|--------|-------------------------|------|------------------------------|
| POST   | `/api/uploads/photo-url`| ✓    | Get presigned PUT URL for photo |
| POST   | `/api/uploads/video-url`| ✓    | Get presigned PUT URL for video |

### Verification
| Method | Path               | Auth | Description                           |
|--------|--------------------|------|---------------------------------------|
| POST   | `/api/verify/{id}` | ✓    | Run AI photo + video checks           |

---

## Journey Flow

```
Login (OTP)
    ↓
Accept Project  →  POST /api/projects/{id}/accept
    ↓
Camera Step 1   →  POST /api/uploads/photo-url  →  PUT <S3 presigned>
Camera Step 2   →  POST /api/uploads/photo-url  →  PUT <S3 presigned>
    ↓
Video Record    →  POST /api/uploads/video-url  →  PUT <S3 presigned>
    ↓
Submit          →  POST /api/projects/{id}/submit   (sends S3 keys)
    ↓
AI Verify       →  POST /api/verify/{id}
                   ├── GPT-4o Vision  (checks each photo)
                   └── Whisper + GPT-4o  (transcribes + evaluates video)
    ↓
Collect Reward  →  POST /api/projects/{id}/complete  (credits points)
```

---

## S3 Bucket Setup

1. Create a bucket (e.g. `rewardlens-uploads`).
2. Add a CORS policy:

```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["PUT", "GET"],
  "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
  "ExposeHeaders": ["ETag"]
}]
```

3. Keep the bucket **private** — all access goes through presigned URLs.

---

## Production Notes

- Swap `DATABASE_URL` to a Postgres connection string (e.g. `postgresql+psycopg2://...`).
- Add Twilio/AWS SNS for real SMS OTP delivery in `services/auth_svc.py`.
- Run behind a reverse proxy (nginx/Caddy) with TLS — `getUserMedia` requires HTTPS on real devices.
- Use gunicorn + uvicorn workers for multi-process serving: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`.
