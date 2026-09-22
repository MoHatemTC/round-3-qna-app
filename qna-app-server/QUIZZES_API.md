# Quizzes & Questions API

This document describes the admin quiz and question endpoints of the NestJS + Prisma + TypeScript backend. It covers creating and editing quizzes, authoring their questions, the publish gate, inviting students, and the reporting endpoints the admin CMS reads.

The student-facing attempt endpoints are documented separately in [ATTEMPTS_API.md](./ATTEMPTS_API.md).

## Overview

Two controllers are described here, plus one student-facing question route:

| Base path | Who can call it |
| --- | --- |
| `/admin/quizzes` | Authenticated users with role `admin` |
| `/admin/quizzes/{quizId}/questions` | Authenticated users with role `admin` |
| `/quizzes/{id}/questions/for-attempt` | Any authenticated user (admins preview; students need a running attempt) |

An interactive Swagger UI for the whole API is served at `/api`.

---

## Authentication and authorization

All endpoints require an authenticated session.

- Auth mechanism: the `token` cookie set by `POST /auth/login`
- User context: `req.user.id` and `req.user.role`
- `RequireAuth` runs first and answers `401` when the cookie is missing, malformed or expired
- `RequireRole("admin")` runs next on both admin controllers and answers `403` for any other role

```http
POST /auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "..." }
```

The response sets an `httpOnly` cookie; send it on every subsequent request.

| Status | Meaning |
| --- | --- |
| `401 Unauthorized` | No session — `{ "error": "Please login or register" }` or `{ "error": "Invalid or expired token" }` |
| `403 Forbidden` | Signed in, but not an admin — `{ "message": "FORBIDDEN", "error": "Forbidden", "statusCode": 403 }` |

---

## Validation and error shape

Every endpoint runs the global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted` and `transform` enabled. That means:

- Unknown fields are **rejected**, not ignored. Posting `created_by` or `id` returns `400`.
- Field-level failures come back as an **array** of messages.
- Rules the pipe cannot check (the schedule rules, the option rules, the publish gate) are enforced in the service and come back as a **single string** message.

```json
{
  "message": ["duration_minutes must be greater than 0"],
  "error": "Bad Request",
  "statusCode": 400
}
```

```json
{
  "message": "Add at least one question before publishing this quiz.",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## Common response shapes

### Quiz object

Returned by every endpoint on `/admin/quizzes` that answers with a quiz. `_count` is part of the contract — the admin CMS reads it to decide whether a quiz can be published or invited to.

```json
{
  "id": "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10",
  "title": "TypeScript Foundations",
  "description": "Types, narrowing, generics, and modern TypeScript patterns.",
  "duration_minutes": 35,
  "starts_at": "2026-09-22T09:00:00.000Z",
  "ends_at": "2026-09-22T12:00:00.000Z",
  "status": "draft",
  "created_by": "7d5c7044-3de1-4b7c-975f-18ca29d2a7fd",
  "created_at": "2026-09-21T12:00:00.000Z",
  "updated_at": "2026-09-21T12:00:00.000Z",
  "_count": { "questions": 10, "invitations": 5, "attempts": 3 }
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `status` | `"draft" \| "published"` | Only the publish endpoints and `PUT` can change it |
| `description` | `string \| null` | Optional |
| `duration_minutes` | `int > 0` | Per-student time budget, not the window length |
| `starts_at` / `ends_at` | ISO 8601 | The window during which students may attempt the quiz |
| `created_by` | `string` | Set from the session; a client cannot supply it |

### Question object

```json
{
  "id": "e4108b01-2138-4d12-91a2-1b6573d4457a",
  "quiz_id": "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10",
  "type": "mcq",
  "text": "Which keyword creates a type alias?",
  "points": 1,
  "created_at": "2026-09-21T12:00:00.000Z",
  "updated_at": "2026-09-21T12:00:00.000Z",
  "options": [
    {
      "id": "a6dfd040-54ef-4d42-9e28-091d90a3167c",
      "question_id": "e4108b01-2138-4d12-91a2-1b6573d4457a",
      "text": "type",
      "is_correct": true,
      "created_at": "2026-09-21T12:00:00.000Z",
      "updated_at": "2026-09-21T12:00:00.000Z"
    }
  ]
}
```

---

## Business rules

These are enforced server-side. The admin UI mirrors them so problems show up before a request is sent, but the server is the authority.

### Schedule rules

| Rule | Applies to | Message |
| --- | --- | --- |
| `ends_at` must be after `starts_at` | create, replace | `ends_at must be after starts_at` (array form) |
| `duration_minutes` must fit inside the window | create, replace | `Duration (N min) is longer than the quiz window (M min). Shorten the duration or widen the window.` |
| `ends_at` must be in the future | create | `The end time must be in the future.` |
| `ends_at` must be in the future | publish | `This quiz's end time has already passed. Set a later end time before publishing.` |

A duration exactly equal to the window is allowed. A draft may be given a past window by `PUT`; the publish gate is what refuses to make it live.

### Question rules

A question is well-formed when:

| Type | Options | Correct options |
| --- | --- | --- |
| `mcq` | at least 2 | exactly 1 |
| `true_false` | exactly 2 | exactly 1 |

The same definition (`question-rules.ts`) is used by the authoring endpoints, which reject bad input, and by the publish gate, which refuses to publish a quiz whose stored questions break it. When both rules fail, the option-count message is the one returned.

### The publish gate

`POST /admin/quizzes/{id}/publish` refuses unless **all** of the following hold:

1. The quiz has at least one question.
2. Every question is well-formed per the table above.
3. `ends_at` is still in the future.

`PUT /admin/quizzes/{id}` with `status: "published"` runs the same gate, but only when the quiz is not already published. Publishing a quiz that is already published is a no-op that returns `200`.

### Question locking

Questions are locked while a quiz is **live** — published *and* inside its window — because students may be mid-attempt and changing a question would change what they are graded on. Create, replace and delete all return `400`:

> This quiz is live right now, so its questions are locked. Unpublish it or wait until it closes to make changes.

Questions remain editable when the quiz is a draft, when it is published but has not opened yet, and after it has closed.

Separately, a published quiz cannot have its last question removed:

> A published quiz needs at least one question. Unpublish it before removing its last question.

---

## Quiz endpoints

### POST /admin/quizzes

Creates a quiz. A new quiz always starts as a `draft`, because it has no questions yet and so could not pass the publish gate.

#### Request

```http
POST /admin/quizzes
Content-Type: application/json
Cookie: token=<jwt>
```

```json
{
  "title": "TypeScript Foundations",
  "description": "Types, narrowing, generics, and modern TypeScript patterns.",
  "duration_minutes": 35,
  "starts_at": "2026-09-22T09:00:00.000Z",
  "ends_at": "2026-09-22T12:00:00.000Z"
}
```

| Field | Required | Rules |
| --- | --- | --- |
| `title` | yes | string, at least 1 character |
| `description` | no | string |
| `duration_minutes` | yes | integer greater than 0 |
| `starts_at` | yes | ISO 8601 date string |
| `ends_at` | yes | ISO 8601 date string, after `starts_at`, in the future |
| `status` | no | `"draft"`; sending `"published"` is refused |

#### Success response

Status: `201 Created`. Body: the [quiz object](#quiz-object), with `status: "draft"` and all counts at 0.

#### Possible errors

| Status | When |
| --- | --- |
| `400` | Field validation, an unknown field, a schedule rule, or `status: "published"` |
| `401` | Not logged in |
| `403` | Not an admin |

```json
{
  "message": "Add at least one question before publishing this quiz.",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### GET /admin/quizzes

Lists quizzes, newest first.

Status: `200 OK`. Body: an array of [quiz objects](#quiz-object).

> **Scope:** this returns every quiz in the system, not only those created by the calling admin.

---

### GET /admin/quizzes/{id}

Status: `200 OK`. Body: the [quiz object](#quiz-object).

| Status | When |
| --- | --- |
| `404` | `{ "message": "Quiz not found", "error": "Not Found", "statusCode": 404 }` |

---

### PUT /admin/quizzes/{id}

Replaces the whole quiz. It takes the same required shape as create — omitted fields are not preserved, they fail validation.

`status` is honoured here, so this endpoint can publish or unpublish as part of an edit. When it moves a quiz from draft to published, the publish gate runs first.

#### Request

```json
{
  "title": "TypeScript Foundations",
  "description": "Now with generics.",
  "duration_minutes": 40,
  "starts_at": "2026-09-22T09:00:00.000Z",
  "ends_at": "2026-09-22T12:00:00.000Z",
  "status": "published"
}
```

Status: `200 OK`. Body: the updated [quiz object](#quiz-object).

| Status | When |
| --- | --- |
| `400` | Field validation, an unknown field, a schedule rule, or the publish gate |
| `404` | Quiz not found |

---

### DELETE /admin/quizzes/{id}

Deletes the quiz. Its questions, options, invitations and attempts are removed with it by `onDelete: Cascade`, so **this also deletes student results**.

Status: `200 OK`

```json
{ "message": "Quiz deleted successfully" }
```

| Status | When |
| --- | --- |
| `404` | Quiz not found |

---

### POST /admin/quizzes/{id}/publish

Makes a quiz visible and attemptable by invited students, if it passes [the publish gate](#the-publish-gate).

Takes no request body.

Status: `200 OK` (not `201`). Body: the [quiz object](#quiz-object) with `status: "published"`. Calling it on an already-published quiz returns it unchanged.

#### Possible errors

| Status | Message |
| --- | --- |
| `400` | `Add at least one question before publishing this quiz.` |
| `400` | `Fix these questions before publishing: question 2 (mcq questions need exactly one correct option)` |
| `400` | `This quiz's end time has already passed. Set a later end time before publishing.` |
| `404` | Quiz not found |

The malformed-question message lists **every** offending question, numbered in creation order so the positions match the admin question list:

```json
{
  "message": "Fix these questions before publishing: question 1 (mcq questions need exactly one correct option); question 3 (true_false questions need exactly one correct value)",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### POST /admin/quizzes/{id}/unpublish

Moves a quiz back to `draft`. Use this to unlock its questions while it is live.

Takes no request body. Status: `200 OK`. Body: the [quiz object](#quiz-object) with `status: "draft"`. Calling it on a quiz that is already a draft returns it unchanged.

| Status | When |
| --- | --- |
| `404` | Quiz not found |

Unpublishing does not delete invitations or attempts; students simply can no longer start or continue the quiz.

---

## Invitation endpoints

### POST /admin/quizzes/{id}/invitations

Invites students by email address, by user id, or both. Each recipient gets a single-use link containing a token; only its SHA-256 hash is stored.

The quiz must be **published** and must not have **ended**.

#### Request

```http
POST /admin/quizzes/{id}/invitations
Content-Type: application/json
Cookie: token=<jwt>
```

```json
{
  "emails": ["avery.morgan@example.com", "jordan.lee@example.com"],
  "userIds": ["7d5c7044-3de1-4b7c-975f-18ca29d2a7fd"]
}
```

| Field | Required | Rules |
| --- | --- | --- |
| `emails` | no | array of strings, at most 100 entries |
| `userIds` | no | array of strings, at most 100 entries |

Both fields are optional; sending neither returns an all-zero summary. `userIds` are resolved to their account emails and merged with `emails`. Addresses are trimmed, lower-cased and de-duplicated, so `Avery@Example.com` and `avery@example.com` count as one recipient.

#### Success response

Status: `200 OK` (not `201`).

> **This endpoint answers `200` even when nothing was delivered.** The HTTP status only says the request was processed. Read the counts to find out whether any student was actually invited.

```json
{
  "sent": 1,
  "failed": 1,
  "skipped": 1,
  "invalid": 2,
  "invalid_emails": ["not-an-email"],
  "unresolved_user_ids": 1,
  "failures": [
    {
      "email": "jordan.lee@example.com",
      "reason": "EAUTH 535: 535 5.7.0 The email limit is reached."
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `sent` | Invitation emails the mail server accepted. Only these students were invited. |
| `failed` | Valid addresses the mail server refused. An invitation row exists with status `failed`. |
| `skipped` | Addresses that already have a live invitation, so no second email was sent. |
| `invalid` | Recipients that could not be invited at all: `invalid_emails.length + unresolved_user_ids`. No row is created for these. |
| `invalid_emails` | The malformed addresses, echoed back so the caller can correct them. |
| `unresolved_user_ids` | How many `userIds` matched no user. |
| `failures` | One entry per delivery failure, carrying the mail server's own reason. |

A malformed address is reported under `invalid`, never under `failed` — a typo is a different problem from a mail server that refused the message, and only the latter leaves a retryable row behind.

Re-inviting an address whose previous invitation is `failed` retries it. Re-inviting one that is `sent` or `accepted` is counted under `skipped`.

#### Possible errors

| Status | Message |
| --- | --- |
| `400` | `Only published quizzes can receive invitations` |
| `400` | `This quiz has already ended, so students can no longer take it. Extend its end time to invite more students.` |
| `400` | `emails must be an array` / `emails must contain no more than 100 elements` |
| `404` | Quiz not found |

---

### GET /admin/quizzes/{id}/invitations

Lists a quiz's invitations, newest first.

Status: `200 OK`

```json
[
  {
    "id": "b049f177-1674-43ad-90cd-0437c838b427",
    "email": "avery.morgan@example.com",
    "status": "sent",
    "sent_at": "2026-09-21T12:34:02.870Z",
    "accepted_at": null,
    "user": {
      "id": "7d5c7044-3de1-4b7c-975f-18ca29d2a7fd",
      "name": "Avery Morgan",
      "email": "avery.morgan@example.com"
    }
  }
]
```

| Field | Notes |
| --- | --- |
| `status` | `"sent" \| "failed" \| "accepted"` |
| `sent_at` | **`null` until the email has actually gone out.** A `failed` invitation has no send time. |
| `accepted_at` | Set when the student opens the invitation link |
| `user` | The registered account behind the address, or `null` for an address with no account yet |

The token hash is never returned.

| Status | When |
| --- | --- |
| `404` | Quiz not found |

---

## Question endpoints

All of these are nested under a quiz and answer `404` when the quiz does not exist.

### GET /admin/quizzes/{quizId}/questions

Lists the quiz's questions with their options, in creation order. `is_correct` **is** included — this is the admin view.

Status: `200 OK`. Body: an array of [question objects](#question-object).

---

### POST /admin/quizzes/{quizId}/questions

Adds a question and its options in one request.

#### Request

```json
{
  "type": "mcq",
  "text": "Which keyword creates a type alias?",
  "points": 1,
  "options": [
    { "text": "type", "is_correct": true },
    { "text": "alias", "is_correct": false },
    { "text": "typedef", "is_correct": false }
  ]
}
```

| Field | Required | Rules |
| --- | --- | --- |
| `type` | yes | `"mcq"` or `"true_false"` |
| `text` | yes | string, at least 1 character |
| `points` | yes | integer greater than 0 |
| `options` | yes | array, at least 1 entry, plus the [question rules](#question-rules) for the chosen type |
| `options[].text` | yes | string, at least 1 character |
| `options[].is_correct` | yes | boolean |

For `true_false`, send exactly two options; `"True"` and `"False"` are the conventional labels.

#### Success response

Status: `201 Created`. Body: the [question object](#question-object).

#### Possible errors

| Status | Message |
| --- | --- |
| `400` | `["type must be one of the following values: mcq, true_false"]` |
| `400` | `["points must be greater than 0"]` |
| `400` | `["text must be longer than or equal to 1 characters"]` |
| `400` | `mcq questions need at least two options` |
| `400` | `mcq questions need exactly one correct option` |
| `400` | `true_false questions need exactly two options` |
| `400` | `true_false questions need exactly one correct value` |
| `400` | The quiz is live, so its questions are locked |
| `404` | Quiz not found |

---

### PUT /admin/quizzes/{quizId}/questions/{questionId}

Replaces a question **and its options**. It takes the same required shape as create.

The old options are deleted and the new set created inside a single transaction, so the option ids change on every update and a shrinking question leaves no orphans behind.

Status: `200 OK`. Body: the updated [question object](#question-object).

| Status | When |
| --- | --- |
| `400` | Same validation and option rules as create; or the quiz is live |
| `404` | `Quiz not found`, or `Question not found` — including when the question exists but belongs to a different quiz |

---

### DELETE /admin/quizzes/{quizId}/questions/{questionId}

Status: `200 OK`

```json
{ "message": "Question deleted successfully" }
```

| Status | When |
| --- | --- |
| `400` | The quiz is live; or it is published and this is its last question |
| `404` | `Quiz not found` or `Question not found` |

Deleting a question also deletes its options and any stored answers that referenced it.

---

### GET /quizzes/{id}/questions/for-attempt

The student-facing question list, used while taking a quiz. Mounted outside `/admin`, so it needs authentication but not the `admin` role.

**There is no `is_correct` field anywhere in this response, and it is never read from the database for this shape.** Compare with the admin list above, which does include it.

Status: `200 OK`

```json
[
  {
    "id": "e4108b01-2138-4d12-91a2-1b6573d4457a",
    "type": "mcq",
    "text": "Which keyword creates a type alias?",
    "points": 1,
    "options": [
      { "id": "a6dfd040-54ef-4d42-9e28-091d90a3167c", "text": "type" },
      { "id": "c1e2f3a4-1111-4222-8333-444455556666", "text": "alias" }
    ]
  }
]
```

#### Access rules

| Caller | Result |
| --- | --- |
| `admin` | May preview any quiz, published or draft, without an attempt |
| `student`, quiz not published | `404 Quiz not found` — an unpublished quiz is not disclosed |
| `student`, no in-progress attempt | `403 Start an attempt on this quiz before loading its questions` |
| `student` with an in-progress attempt | `200` with the list above |

Start an attempt first with `POST /attempts/start` — see [ATTEMPTS_API.md](./ATTEMPTS_API.md).

---

## Reporting endpoints

### GET /admin/quizzes/analytics/{id}

> Note the path shape: the id comes **after** `analytics`, unlike every other route on this controller.

Status: `200 OK`

```json
{
  "quiz_id": "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10",
  "invited_count": 5,
  "started_count": 3,
  "submitted_count": 2,
  "completion_rate": 40,
  "average_score": 70
}
```

| Field | Meaning |
| --- | --- |
| `invited_count` | Invitation rows for the quiz, whatever their status |
| `started_count` | Attempts started, any status |
| `submitted_count` | Attempts with status `submitted` or `auto_submitted` |
| `completion_rate` | `submitted_count / invited_count * 100`; `0` when nobody is invited |
| `average_score` | Mean `percentage` across submitted attempts; `null` when there are none |

| Status | When |
| --- | --- |
| `404` | Quiz not found |

---

### GET /admin/quizzes/{id}/students

One row per invited student, with their attempt status and score. This is the per-quiz student table in the admin CMS.

#### Request

```http
GET /admin/quizzes/{id}/students?status=not_started
Cookie: token=<jwt>
```

| Query param | Required | Values |
| --- | --- | --- |
| `status` | no | `in_progress`, `submitted`, `auto_submitted`, `not_started` |

#### Success response

Status: `200 OK`

```json
[
  {
    "name": "Avery Morgan",
    "email": "avery.morgan@example.com",
    "score": 8,
    "percentage": 80,
    "status": "submitted"
  },
  {
    "name": null,
    "email": "new.student@example.com",
    "score": null,
    "percentage": null,
    "status": "not_started"
  }
]
```

| Field | Notes |
| --- | --- |
| `name` | `null` when the invited address has no account yet |
| `score` / `percentage` | `null` until an attempt is scored |
| `status` | The attempt status, or `not_started` |

Rows are built from the **invitation** list, so a student who was never invited does not appear even if they have an attempt. An invitation with no linked account is matched to an attempt by email address, which covers a student who registered after being invited.

`not_started` is computed rather than stored, so the `status` filter is applied after the rows are assembled — an unknown value is still rejected up front.

| Status | When |
| --- | --- |
| `400` | `Validation failed (enum string is expected)` for an unknown `status` |
| `404` | Quiz not found |

---

## A complete admin journey

The order the admin CMS follows, and the smallest sequence that takes a quiz from nothing to invited students.

```http
# 1. Sign in
POST /auth/login
{ "email": "admin@example.com", "password": "..." }

# 2. Create the quiz - it starts as a draft
POST /admin/quizzes
{ "title": "TypeScript Foundations", "duration_minutes": 35,
  "starts_at": "2026-09-22T09:00:00.000Z", "ends_at": "2026-09-22T12:00:00.000Z" }
# -> 201, status "draft", _count.questions 0

# 3. Publishing now is refused - there are no questions yet
POST /admin/quizzes/{id}/publish
# -> 400 "Add at least one question before publishing this quiz."

# 4. Add questions
POST /admin/quizzes/{id}/questions
{ "type": "mcq", "text": "Which keyword creates a type alias?", "points": 1,
  "options": [{ "text": "type", "is_correct": true },
              { "text": "alias", "is_correct": false }] }
# -> 201

# 5. Publish
POST /admin/quizzes/{id}/publish
# -> 200, status "published"

# 6. Invite students
POST /admin/quizzes/{id}/invitations
{ "emails": ["avery.morgan@example.com"] }
# -> 200 { "sent": 1, "failed": 0, "skipped": 0, "invalid": 0, ... }
#    check the counts - 200 alone does not mean anyone was invited

# 7. Review who was invited, and how they are doing
GET /admin/quizzes/{id}/invitations
GET /admin/quizzes/{id}/students
GET /admin/quizzes/analytics/{id}
```

To edit questions after publishing, unpublish first if the quiz is inside its window:

```http
POST /admin/quizzes/{id}/unpublish
PUT  /admin/quizzes/{id}/questions/{questionId}
POST /admin/quizzes/{id}/publish
```

---

## Demo data

`npm run db:seed` loads three published quizzes with ten questions each — *TypeScript Foundations* (35 min), *NestJS Backend Essentials* (40 min) and *Prisma ORM and Data Modeling* (45 min) — each with five invited students and a mix of submitted, auto-submitted and in-progress attempts. Every quiz includes one `true_false` question so both question types are represented.

The seed refuses to run unless `SEED_ALLOW=true`, and refuses outright when `NODE_ENV=production`. It also needs `ADMIN_PASSWORD`, `STUDENT_PASSWORD`, `SEED_ADMIN_PASSWORD` and `SEED_STUDENT_PASSWORD`. See `.env.example`.

Quiz windows are seeded relative to the day the seed runs (day+1, day+2, day+3 at 09:00–12:00 UTC), so re-running it moves them back into the future.
