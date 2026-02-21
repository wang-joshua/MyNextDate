# MyNextDate — App Audit
_Date: 2026-02-21_

---

## PRE-EXISTING NOTES
- Fix: It should show email sent to email for authentication on frontend.

---

## CRITICAL BUGS (Fixed in this session)

### 1. `main.py:33` — `describe_collection` dict access broken → re-seeds every boot
`describe_collection()` returns a **dict**, but the code uses `getattr(stats, "vectors_count", 0)`.
`getattr` on a dict key returns 0 (no such attribute), so `count` is always 0, causing
`seed_activities` to run on every server restart (wasteful, slow boot).

**Fix:** Use `client.get_vector_count(COLLECTION_NAME)` which returns an int directly.

---

### 2. `services/text_to_vector.py:47` — Unhandled `JSONDecodeError` → 500 on bad LLM output
`json.loads(text)` is not wrapped in try/except. If Groq returns anything other than valid JSON
(e.g. an apology string, truncated response), the server throws a raw 500 with a stack trace
and no useful message to the client.

**Fix:** Wrap in try/except JSONDecodeError and re-raise as a clean ValueError.

---

### 3. `services/text_to_vector.py:41-44` — Fragile markdown code block stripping
`text.split("```")[1]` crashes with IndexError if the LLM uses single backticks or an unusual
format. Also, `text[4:]` after stripping `"json"` leaves a leading newline/space before the
array, causing json.loads to fail.

**Fix:** Use regex to robustly extract content from code fences.

---

### 4. `routes/dates.py:26-28` — No rating range validation on `POST /api/dates`
`AddDateRequest` accepts any float for rating. The `PATCH /api/dates/{id}` endpoint validates
0–5, but the POST does not — a date can be saved with rating=100 or rating=-5, corrupting
analytics calculations.

**Fix:** Add Pydantic field validator on `AddDateRequest`.

---

### 5. `middleware/auth.py:16` — New Supabase client created on every authenticated request
`create_client(...)` runs inside `get_current_user`, which fires on every API call.
Creating a full HTTP client per request adds latency and wastes connections.

**Fix:** Cache the Supabase client as a module-level singleton.

---

## SECURITY ISSUES

### 6. `mynextdate-frontend/.env:3` — `VITE_GROQ_API_KEY` compiled into JS bundle (Fixed)
Vite bakes `VITE_*` variables into the JS bundle at build time. The Groq API key is unused
by any frontend code (Groq is only called from the backend), but was still compiled into the
bundle and visible to anyone inspecting the page source.

**Fix:** Removed `VITE_GROQ_API_KEY` from `mynextdate-frontend/.env`.

### 7. `.env` files contain live credentials — manual action required
Both `.env` files contain live Supabase URLs, service-role JWT tokens, and the Groq API key.
These should never be committed to a public repository.

**Action required:**
- Ensure `.env` is in `.gitignore`
- Rotate credentials if the repo is or becomes public

---

## LOWER-PRIORITY ISSUES (Informational)

| # | File | Issue |
|---|------|-------|
| 8 | `routes/recommend.py`, `dates.py`, `analytics.py` | `get_supabase()` duplicated across all three route files — extract to shared `db.py` |
| 9 | `services/analytics_service.py:74` | Trend threshold `0.3` on a 0–5 scale is only 6% difference — consider raising to `0.5` |
| 10 | `src/lib/api.js:14,20,…` | All fetch error handlers throw generic strings, not the server's `detail` field |
| 11 | `config.py:11` | `GEMINI_API_KEY` loaded from env but never used anywhere — dead config |
| 12 | `src/lib/api.js:69-83` | `getActivities()` and `searchActivities()` call `/api/activities` which has no backend route |
| 13 | `routes/dates.py:93` | Silent "Unknown Activity" fallback when `_payload_cache` misses an id — no warning logged |
| 14 | `main.py:13-14` | `allow_methods=["*"]` and `allow_headers=["*"]` — restrict in production |

---

## Summary

| Status | Count |
|--------|-------|
| Fixed (critical bugs) | 5 |
| Fixed (security) | 1 |
| Manual action needed | 1 |
| Informational only | 7 |
