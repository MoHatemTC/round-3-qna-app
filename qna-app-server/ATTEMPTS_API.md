# Quiz Attempts API

This document describes the Quiz Attempts API for the NestJS + Prisma + TypeScript backend. It covers how students start a quiz attempt, submit answers, and fetch their scored result.

## Overview

The attempts API is mounted under `/attempts` and is protected by authenticated session-based access via the `token` cookie. All endpoints require a logged-in user.

Base URL:

```text
/api
```

Example full route:

```text
POST /attempts/start
POST /attempts/{id}/submit
GET /attempts/{id}/result
```

---

## Authentication

All attempt endpoints require an authenticated user session.

- Auth mechanism: cookie-based auth (`token` cookie)
- User context: `req.user.id`
- If the user is not authenticated, the API returns `401 Unauthorized`.

---

## Common Response Shapes

### Attempt object

```json
{
  "id": "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10",
  "quiz_id": "d0c2d3a4-8a6c-4db1-a445-1e82a5af4d91",
  "user_id": "7d5c7044-3de1-4b7c-975f-18ca29d2a7fd",
  "started_at": "2026-09-10T09:00:00.000Z",
  "submitted_at": null,
  "status": "in_progress",
  "score": null,
  "percentage": null
}
```

### Attempt answer item

```json
{
  "id": "2f5d4b9d-71d2-4a53-b788-06154d18d9ab",
  "question_id": "e4108b01-2138-4d12-91a2-1b6573d4457a",
  "selected_option_id": "a6dfd040-54ef-4d42-9e28-091d90a3167c",
  "boolean_answer": null,
  "is_correct": null
}
```

Notes:

- `selected_option_id` is used for multiple-choice questions.
- `boolean_answer` is used for true/false questions.
- At least one of these must be present when submitting an answer.
- `is_correct` is currently nullable until quiz scoring is fully implemented.

---

## 4. API Endpoints & Contract

### POST /attempts/start

Starts a quiz attempt for the authenticated user.

#### Purpose

- Validates that the quiz exists
- Requires the quiz to be published
- Requires the quiz to be within its active time window
- Returns an existing in-progress attempt if one already exists
- Creates a new attempt if none exists
- Returns the server-computed deadline (`end_time`)

#### Request

```http
POST /attempts/start
Content-Type: application/json
Cookie: token=<jwt-or-session-cookie>
```

```json
{
  "quiz_id": "d0c2d3a4-8a6c-4db1-a445-1e82a5af4d91"
}
```

#### Success response

Status: `201 Created`

```json
{
  "id": "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10",
  "quiz_id": "d0c2d3a4-8a6c-4db1-a445-1e82a5af4d91",
  "user_id": "7d5c7044-3de1-4b7c-975f-18ca29d2a7fd",
  "started_at": "2026-09-10T09:00:00.000Z",
  "submitted_at": null,
  "status": "in_progress",
  "score": null,
  "percentage": null,
  "end_time": "2026-09-10T09:30:00.000Z"
}
```

#### Server-side end time behavior

The API computes the effective deadline as:

```text
min(started_at + quiz.duration_minutes, quiz.ends_at)
```

This prevents a quiz attempt from exceeding the quiz's scheduled end time.

#### Possible errors

| Status | Meaning | When it happens |
| --- | --- | --- |
| `400 Bad Request` | Invalid quiz state | Quiz is not published, has not started yet, or has already ended |
| `401 Unauthorized` | Not logged in | Missing or invalid auth cookie |
| `404 Not Found` | Quiz missing | No quiz matches the provided `quiz_id` |
| `409 Conflict` | Duplicate attempt | User already has an attempt for this quiz and it is already marked as completed |

#### Example error payloads

```json
{
  "statusCode": 400,
  "message": "Quiz is not published",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 404,
  "message": "Quiz not found",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 409,
  "message": "You have already attempted this quiz",
  "error": "Conflict"
}
```

---

### POST /attempts/{id}/submit

Submits one or more answers for an in-progress attempt.

#### Purpose

- Validates that the attempt exists and belongs to the authenticated user
- Rejects already-submitted attempts
- Validates each submitted answer object
- Stores answers using upsert semantics per `(attempt_id, question_id)`
- Marks the attempt as submitted or auto-submitted if the deadline has passed
- Returns the final result payload for the submitted attempt

#### Request

```http
POST /attempts/{id}/submit
Content-Type: application/json
Cookie: token=<jwt-or-session-cookie>
```

```json
{
  "answers": [
    {
      "question_id": "e4108b01-2138-4d12-91a2-1b6573d4457a",
      "selected_option_id": "a6dfd040-54ef-4d42-9e28-091d90a3167c"
    },
    {
      "question_id": "95fca4ff-7a63-4bfd-a3ac-bb028a7fb5ed",
      "boolean_answer": true
    }
  ]
}
```

#### Validation rules

Each answer object must include at least one of:

- `selected_option_id`
- `boolean_answer`

If both are missing, the API rejects the request with `400 Bad Request`.

#### Success response

Status: `200 OK`

```json
{
  "id": "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10",
  "quiz_id": "d0c2d3a4-8a6c-4db1-a445-1e82a5af4d91",
  "user_id": "7d5c7044-3de1-4b7c-975f-18ca29d2a7fd",
  "started_at": "2026-09-10T09:00:00.000Z",
  "submitted_at": "2026-09-10T09:22:00.000Z",
  "status": "submitted",
  "score": 7,
  "percentage": 70,
  "answers": [
    {
      "id": "2f5d4b9d-71d2-4a53-b788-06154d18d9ab",
      "question_id": "e4108b01-2138-4d12-91a2-1b6573d4457a",
      "selected_option_id": "a6dfd040-54ef-4d42-9e28-091d90a3167c",
      "boolean_answer": null,
      "is_correct": null
    },
    {
      "id": "f3069a4f-40e1-447a-86d0-431a727928a7",
      "question_id": "95fca4ff-7a63-4bfd-a3ac-bb028a7fb5ed",
      "selected_option_id": null,
      "boolean_answer": true,
      "is_correct": null
    }
  ]
}
```

#### Possible errors

| Status | Meaning | When it happens |
| --- | --- | --- |
| `400 Bad Request` | Invalid answer payload | An answer object lacks both `selected_option_id` and `boolean_answer` |
| `401 Unauthorized` | Not logged in | Missing or invalid auth cookie |
| `403 Forbidden` | User mismatch | The attempt belongs to another user |
| `404 Not Found` | Attempt missing | No attempt matches the route `id` |
| `409 Conflict` | Already submitted | The attempt status is not `in_progress` |

#### Example error payloads

```json
{
  "statusCode": 400,
  "message": "Answer for question e4108b01-2138-4d12-91a2-1b6573d4457a needs selected_option_id or boolean_answer",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 403,
  "message": "This attempt does not belong to you",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 409,
  "message": "Attempt already submitted",
  "error": "Conflict"
}
```

---

### GET /attempts/{id}/result

Fetches the authenticated user's attempt result, including submitted answers, score, and percentage.

#### Purpose

- Returns the attempt metadata
- Returns all stored answers for that attempt
- Includes `score` and `percentage`
- Prevents access to other users' attempts

#### Request

```http
GET /attempts/{id}/result
Cookie: token=<jwt-or-session-cookie>
```

#### Success response

Status: `200 OK`

```json
{
  "id": "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10",
  "quiz_id": "d0c2d3a4-8a6c-4db1-a445-1e82a5af4d91",
  "user_id": "7d5c7044-3de1-4b7c-975f-18ca29d2a7fd",
  "started_at": "2026-09-10T09:00:00.000Z",
  "submitted_at": "2026-09-10T09:22:00.000Z",
  "status": "submitted",
  "score": 7,
  "percentage": 70,
  "answers": [
    {
      "id": "2f5d4b9d-71d2-4a53-b788-06154d18d9ab",
      "question_id": "e4108b01-2138-4d12-91a2-1b6573d4457a",
      "selected_option_id": "a6dfd040-54ef-4d42-9e28-091d90a3167c",
      "boolean_answer": null,
      "is_correct": null
    }
  ]
}
```

#### Possible errors

| Status | Meaning | When it happens |
| --- | --- | --- |
| `401 Unauthorized` | Not logged in | Missing or invalid auth cookie |
| `403 Forbidden` | User mismatch | The attempt does not belong to the current user |
| `404 Not Found` | Attempt missing | No attempt matches the route `id` |

#### Example error payload

```json
{
  "statusCode": 403,
  "message": "This attempt does not belong to you",
  "error": "Forbidden"
}
```

---

## Business Rules Summary

- A user may only have one attempt record per quiz.
- If an in-progress attempt already exists, `/attempts/start` resumes it instead of creating a duplicate.
- A quiz attempt is only valid when the quiz is published and currently active.
- `/attempts/{id}/submit` is only allowed while the attempt is still `in_progress`.
- Submitting after the effective deadline automatically marks the attempt as `auto_submitted`.
- Access to attempts is strictly scoped to the owner user.

---

## Notes for Frontend Integration

When integrating with the frontend:

1. Call `POST /attempts/start` with the quiz ID before rendering the quiz.
2. Save the returned `id` and `end_time`.
3. Submit answers using `POST /attempts/{id}/submit`.
4. Fetch the final attempt state with `GET /attempts/{id}/result`.

This contract is aligned with the current NestJS controller and Prisma-backed attempt flow in the project.
