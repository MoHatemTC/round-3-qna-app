# Student Demo Run Sheet

## Test account
- Email: `avery.morgan@example.com`
- Password: `123456789`
- Must be: email-verified, invited to the demo quiz below

## Quiz used
- Title:"TypeScript Foundations",
- Duration: 35 minutes,
- Questions: [
      [
        "Which keyword creates a type alias?",
        ["type", "alias", "typedef", "shape"],
        0
      ],
      [
        "What does a union type describe?",
        [
          "One of several allowed types",
          "Only object types",
          "A runtime class",
          "A database relation"
        ],
        0
      ],
      [
        "Which operator performs optional chaining?",
        ["?.", "??", "::", "=>"],
        0
      ],
      [
        "What does `unknown` require before most operations?",
        ["Type narrowing", "A constructor", "A decorator", "A cast to any"],
        0
      ],
      [
        "Which utility type makes every property optional?",
        ["Partial<T>", "Optional<T>", "Maybe<T>", "Loose<T>"],
        0
      ],
      [
        "What is a generic primarily used for?",
        [
          "Reusable type-safe code",
          "Encrypting values",
          "Creating database indexes",
          "Loading modules"
        ],
        0
      ],
      [
        "Which keyword marks a class property as read-only?",
        ["readonly", "constant", "fixed", "immutable"],
        0
      ],
      [
        "What does type inference do?",
        [
          "Derives types from values and usage",
          "Runs tests",
          "Validates JSON",
          "Compiles SQL"
        ],
        0
      ],
      [
        "Which type represents a function that never returns?",
        ["never", "void", "undefined", "empty"],
        0
      ],
      [
        "`strict` mode turns on `strictNullChecks`.",
        ["True", "False"],
        0,
        "true_false"
      ]
    ]
## Steps
1. Go to `/login`, sign in with the demo account.
2. Land on `/dashboard` — confirm the demo quiz card is visible with state "Not Started".
3. Click the quiz card → lands on `/quiz/:id/instructions`.
4. Confirm rules, duration, question count, attempts shown.
5. Click "Start Quiz" → lands on `/quiz/:id/solve`.
6. Confirm countdown timer is running, answered counter shows 0/N.
7. Answer 2–3 questions, leave at least 1 blank.
8. Click "Submit quiz".
9. Confirm redirect to `/quiz/:id/result` with a real score.
10. (Optional) Go back to `/dashboard`, confirm the quiz card now shows "Submitted".

## Known edge cases to show if asked
- Invalid invite link: visit `/quiz/invite/garbage-token` → shows "invalid link" message.
- No invitations: log in with `<empty account email>` → dashboard shows empty state, not blank page.
- Timer expiry: `<describe how to force/shortcut this for demo, e.g. a quiz with 1-minute duration>`.

## If something breaks live
- Refresh the page once before assuming it's broken — the app is not always instant.
- If backend is down: restart with `npm run start:dev` in the server terminal.