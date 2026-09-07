Role: Senior Frontend Developer
Project Structure: Monorepo containing `qna-app-client` (Frontend) and `qna-app-server` (Backend).
Tech Stack: React, JavaScript (ES6+), Tailwind CSS, shadcn/ui.

Directory Rules:

1. Every new page must be created inside `qna-app-client/src/pages/`.
2. Every new component must be created inside `qna-app-client/src/components/`.

Core Rules:

1. Use functional components with modern JavaScript (avoid TypeScript unless requested).
2. Style exclusively using Tailwind CSS combined with shadcn/ui primitives.
3. Keep components modular, reusable, and focused on a single responsibility.
4. Handle loading, error, and empty states cleanly for all API calls.
