# QnA Service Platform

An enterprise-grade assessment platform engineered to streamline exam creation, distribution, execution, and evaluation. The system reduces administrative overhead by up to 90% through question bank reusability, tokenized bulk email invitations, tamper-resistant timed exam environments, and instant automated grading.

---

## Key Features & Business Pillars

* **Question Bank Reusability:** Instructors can build new exams in minutes by drawing from categorized question repositories rather than creating assessments from scratch.
* **Bulk Email Invitations:** Automated, tokenized email outreach allowing one-click exam distribution to both registered users and guest students.
* **Frictionless & Timed Testing:** Secure student access via dashboard or direct magic links, enforced by a server-synchronized countdown timer.
* **Automated Scoring Engine:** Real-time answer evaluation upon submission with instant score logging and performance reporting.
* **Audit & Delivery Tracking:** Comprehensive delivery status logs for email invitations and student attempts.

---

## Tech Stack

### Backend

* Framework: NestJS (Node.js)
* Language: TypeScript
* Database ORM: Prisma ORM
* Database Engine: PostgreSQL
* Authentication: JWT & Tokenized Magic Links
* Validation: Class Validator & Class Transformer

### Frontend

* Framework: Next.js (React)
* Styling: Tailwind CSS
* State Management: React Hooks / Context

---

## Database Schema (ERD Overview)

```mermaid
erDiagram
    User ||--o{ Quiz : creates
    User ||--o{ Attempt : submits
    User ||--o{ QuizInvitation : receives
    Quiz ||--o{ Question : contains
    Quiz ||--o{ Attempt : tracks
    Quiz ||--o{ QuizInvitation : issues
    Question ||--o{ QuestionOption : has
    Question ||--o{ AttemptAnswer : answers
    Attempt ||--o{ AttemptAnswer : records
    QuestionOption ||--o{ AttemptAnswer : selects

```

---

## Getting Started

### Prerequisites

* Node.js (v18+ recommended)
* PostgreSQL database instance
* npm or yarn package manager

### Environment Configuration

Create a `.env` file in the server directory based on the following template:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/qna_db?schema=public"
JWT_SECRET="your_jwt_secret_key"
PORT=3000

# SMTP Email Configuration
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your_email@example.com"
SMTP_PASS="your_email_password"

```

### Installation & Migration Steps

1. Clone the repository:
```bash
git clone https://github.com/your-username/qna-service-platform.git
cd qna-service-platform

```


2. Install backend dependencies:
```bash
cd qna-app-server
npm install

```


3. Run database migrations and generate the Prisma client:
```bash
npx prisma migrate dev
npx prisma generate

```


4. Start the backend development server:
```bash
npm run start:dev

```


5. Install and run the frontend application:
```bash
cd ../qna-app-client
npm install
npm run dev
