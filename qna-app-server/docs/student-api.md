# Student-Facing API Endpoints

All routes require `RequireAuth` (logged in via `token` cookie). Routes under `/attempts` additionally require `RequireRole("student")` where noted.

---

## GET /student/quizzes
**Role:** student
**Request body:** none
**Response 200:**
```json
[
  { "id": "string", "title": "string", "duration": 30, "deadline": "ISO date", "state": "not_started | in_progress | submitted" }
]
```
**Errors:** `401` not logged in

---

## GET /student/invite/:token
**Role:** any logged-in user
**Request body:** none
**Response 200:** `{ "id": "quiz_id", "title": "string" }`
**Response (error body, 200)):** `{ "error": "invalid_link" | "not_open_yet" | "closed" | "already_submitted" }`
**Errors:** `401` not logged in

---

## POST /attempts/start
**Role:** student, email must be verified
**Request body:** `{ "quiz_id": "string" }`
**Response 201:**
```json
{
  "id": "attempt_id",
  "quiz_id": "string",
  "user_id": "string",
  "started_at": "ISO date",
  "end_time": "ISO date",
  "questions": [
    { "id": "string", "type": "mcq | true_false", "text": "string", "points": 1, "options": [{ "id": "string", "text": "string" }] }
  ]
}
```
**Errors:** `400` quiz not published / outside time window, `401` not logged in, `404` quiz not found, `409` already attempted, `403` not invited

---

## POST /attempts/:id/submit
**Role:** student (attempt owner only)
**Request body:**
```json
{ "answers": [{ "question_id": "string", "selected_option_id": "string" }, { "question_id": "string", "boolean_answer": true }] }
```
**Response 200:** `{ "id", "quiz_id", "user_id", "started_at", "submitted_at", "status", "score", "percentage", "total", "max_score", "answers": [...] }`
**Errors:** `400` validation failed / expired, `401` not logged in, `403` not attempt owner, `404` not found, `409` already submitted

---

## GET /attempts/:id/result
**Role:** student (attempt owner only)
**Request body:** none
**Response 200:** same shape as submit response
**Errors:** `401`, `403`, `404`