import "dotenv/config";
import { createHash } from "node:crypto";
import * as bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import {
  AttemptStatus,
  InvitationStatus,
  QuestionType,
  QuizStatus,
  Role
} from "../src/generated/prisma/enums.js";

const SEED_VERSION = "quiz-seed-v1";
const DEFAULT_STUDENT_PASSWORD = process.env.STUDENT_PASSWORD as string;
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD as string;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before running the Prisma seed.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

// Stable IDs let each seed version update its own records without duplicates.
function stableId(kind: string, key: string) {
  const bytes = createHash("sha256")
    .update(`${SEED_VERSION}:${kind}:${key}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function tokenHash(key: string) {
  return createHash("sha256")
    .update(`${SEED_VERSION}:invitation:${key}`)
    .digest("hex");
}

function daysFromNow(days: number, hour: number) {
  const date = new Date();
  date.setUTCHours(hour, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

const adminId = stableId("user", "admin");
const studentRecords = [
  ["student-1", "Avery Morgan", "avery.morgan@example.com"],
  ["student-2", "Jordan Lee", "jordan.lee@example.com"],
  ["student-3", "Taylor Kim", "taylor.kim@example.com"],
  ["student-4", "Riley Singh", "riley.singh@example.com"],
  ["student-5", "Casey Brown", "casey.brown@example.com"]
] as const;

const quizRecords = [
  {
    key: "typescript",
    title: "TypeScript Foundations",
    description: "Types, narrowing, generics, and modern TypeScript patterns.",
    duration_minutes: 35,
    questions: [
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
        "What does `as const` commonly provide?",
        [
          "Narrow literal types",
          "Runtime freezing",
          "A constant variable",
          "Deep cloning"
        ],
        0
      ]
    ]
  },
  {
    key: "nestjs",
    title: "NestJS Backend Essentials",
    description:
      "Modules, controllers, providers, validation, and request flow.",
    duration_minutes: 40,
    questions: [
      [
        "What is a NestJS module used to group?",
        [
          "Related controllers and providers",
          "Only database rows",
          "CSS classes",
          "HTTP headers"
        ],
        0
      ],
      [
        "Which decorator defines a controller?",
        ["@Controller", "@Route", "@Handler", "@Endpoint"],
        0
      ],
      [
        "What is dependency injection used for?",
        [
          "Supplying class dependencies",
          "Parsing JSON",
          "Hashing passwords",
          "Starting a browser"
        ],
        0
      ],
      [
        "Which pipe is commonly used for DTO validation?",
        ["ValidationPipe", "DtoPipe", "SchemaPipe", "CheckPipe"],
        0
      ],
      [
        "What does a provider usually contain?",
        [
          "Reusable injectable logic",
          "Static HTML",
          "A database table",
          "A JWT token"
        ],
        0
      ],
      [
        "Which decorator handles a GET route?",
        ["@Get", "@Fetch", "@Read", "@HttpGetOnly"],
        0
      ],
      [
        "What is a guard responsible for?",
        [
          "Allowing or denying request execution",
          "Formatting responses",
          "Migrating tables",
          "Rendering JSX"
        ],
        0
      ],
      [
        "Which NestJS feature transforms incoming values?",
        ["Pipes", "Modules", "Adapters", "Schemas"],
        0
      ],
      [
        "What is an interceptor able to do?",
        [
          "Run logic before and after handlers",
          "Define SQL columns",
          "Create browser cookies only",
          "Replace TypeScript"
        ],
        0
      ],
      [
        "Which class commonly bootstraps a NestJS app?",
        ["NestFactory", "NestLoader", "AppStarter", "NestRuntime"],
        0
      ]
    ]
  },
  {
    key: "prisma",
    title: "Prisma ORM and Data Modeling",
    description:
      "Prisma schemas, relations, queries, migrations, and safe writes.",
    duration_minutes: 45,
    questions: [
      [
        "Which file commonly defines Prisma models?",
        ["schema.prisma", "models.prisma.ts", "database.schema", "prisma.json"],
        0
      ],
      [
        "What does `findUnique` require?",
        [
          "A unique selector",
          "A raw SQL string",
          "A transaction only",
          "A migration name"
        ],
        0
      ],
      [
        "What does `upsert` combine?",
        [
          "Update and create",
          "Read and delete",
          "Connect and disconnect",
          "Migrate and reset"
        ],
        0
      ],
      [
        "What does a relation field represent?",
        [
          "A link between models",
          "A computed CSS value",
          "A server port",
          "A password hash"
        ],
        0
      ],
      [
        "Which Prisma API runs several operations atomically?",
        ["$transaction", "$atomic", "$batchOnly", "$commit"],
        0
      ],
      [
        "What does `include` commonly control?",
        [
          "Related records returned with a query",
          "Database credentials",
          "Migration order",
          "Index names"
        ],
        0
      ],
      [
        "What does a composite unique constraint enforce?",
        [
          "Uniqueness across a field combination",
          "Uniqueness of all rows",
          "Foreign-key deletion",
          "Automatic hashing"
        ],
        0
      ],
      [
        "What is a Prisma migration for?",
        [
          "Tracking database schema changes",
          "Caching query results",
          "Validating DTOs",
          "Issuing JWTs"
        ],
        0
      ],
      [
        "What does `onDelete: Cascade` mean?",
        [
          "Related records are deleted with the parent",
          "Queries are retried",
          "Deletes are blocked",
          "Rows are archived"
        ],
        0
      ],
      [
        "Why use a driver adapter with Prisma 7?",
        [
          "To connect Prisma to the database driver",
          "To define React routes",
          "To generate passwords",
          "To replace the schema"
        ],
        0
      ]
    ]
  }
] as const;

async function seedUsers() {
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
  const studentPassword =
    process.env.SEED_STUDENT_PASSWORD ?? DEFAULT_STUDENT_PASSWORD;
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const studentHash = await bcrypt.hash(studentPassword, 10);

  await prisma.user.upsert({
    where: { id: adminId },
    update: {
      name: "Quiz Admin",
      email: "seed-admin@example.com",
      password_hash: adminHash,
      role: Role.admin,
      email_verified_at: new Date()
    },
    create: {
      id: adminId,
      name: "Quiz Admin",
      email: "seed-admin@example.com",
      password_hash: adminHash,
      role: Role.admin,
      email_verified_at: new Date()
    }
  });

  for (const [key, name, email] of studentRecords) {
    await prisma.user.upsert({
      where: { id: stableId("user", key) },
      update: {
        name,
        email,
        password_hash: studentHash,
        role: Role.student,
        email_verified_at: new Date()
      },
      create: {
        id: stableId("user", key),
        name,
        email,
        password_hash: studentHash,
        role: Role.student,
        email_verified_at: new Date()
      }
    });
  }

  return {
    students: studentRecords.map(([key]) => ({
      id: stableId("user", key),
      key
    })),
    studentPassword
  };
}

async function seedQuiz(
  quizRecord: (typeof quizRecords)[number],
  index: number
) {
  const quizId = stableId("quiz", quizRecord.key);
  const startsAt = daysFromNow(index + 1, 9);
  const endsAt = daysFromNow(index + 1, 12);

  await prisma.quiz.upsert({
    where: { id: quizId },
    update: {
      title: quizRecord.title,
      description: quizRecord.description,
      duration_minutes: quizRecord.duration_minutes,
      starts_at: startsAt,
      ends_at: endsAt,
      status: QuizStatus.published,
      created_by: adminId
    },
    create: {
      id: quizId,
      title: quizRecord.title,
      description: quizRecord.description,
      duration_minutes: quizRecord.duration_minutes,
      starts_at: startsAt,
      ends_at: endsAt,
      status: QuizStatus.published,
      created_by: adminId
    }
  });

  // Upsert children separately because questions and options have no natural unique key.
  const questions: Array<{
    question: { id: string };
    options: Array<{ id: string; is_correct: boolean }>;
  }> = [];
  for (
    let questionIndex = 0;
    questionIndex < quizRecord.questions.length;
    questionIndex++
  ) {
    const [text, options, correctIndex] = quizRecord.questions[questionIndex];
    const questionId = stableId(
      "question",
      `${quizRecord.key}-${questionIndex + 1}`
    );
    const question = await prisma.question.upsert({
      where: { id: questionId },
      update: { quiz_id: quizId, type: QuestionType.mcq, text, points: 1 },
      create: {
        id: questionId,
        quiz_id: quizId,
        type: QuestionType.mcq,
        text,
        points: 1
      }
    });

    const optionRecords: Array<{ id: string; is_correct: boolean }> = [];
    for (let optionIndex = 0; optionIndex < options.length; optionIndex++) {
      const optionId = stableId(
        "option",
        `${quizRecord.key}-${questionIndex + 1}-${optionIndex + 1}`
      );
      optionRecords.push(
        await prisma.questionOption.upsert({
          where: { id: optionId },
          update: {
            question_id: question.id,
            text: options[optionIndex],
            is_correct: optionIndex === correctIndex
          },
          create: {
            id: optionId,
            question_id: question.id,
            text: options[optionIndex],
            is_correct: optionIndex === correctIndex
          }
        })
      );
    }
    questions.push({ question, options: optionRecords });
  }

  return { quizId, questions };
}

async function seedInvitations(
  quizId: string,
  students: { id: string; key: string }[],
  endsAt: Date
) {
  for (const [index, student] of students.entries()) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: student.id }
    });
    const invitationKey = `${quizId}-${student.key}`;
    await prisma.quizInvitation.upsert({
      where: { quiz_id_email: { quiz_id: quizId, email: user.email } },
      update: {
        user_id: user.id,
        token_hash: tokenHash(invitationKey),
        status:
          index === students.length - 1
            ? InvitationStatus.accepted
            : InvitationStatus.sent,
        sent_at: new Date(),
        accepted_at: index === students.length - 1 ? new Date() : null,
        expires_at: endsAt
      },
      create: {
        id: stableId("invitation", invitationKey),
        quiz_id: quizId,
        email: user.email,
        user_id: user.id,
        token_hash: tokenHash(invitationKey),
        status:
          index === students.length - 1
            ? InvitationStatus.accepted
            : InvitationStatus.sent,
        sent_at: new Date(),
        accepted_at: index === students.length - 1 ? new Date() : null,
        expires_at: endsAt
      }
    });
  }
}

async function seedAttempts(
  quizId: string,
  questions: {
    question: { id: string };
    options: { id: string; is_correct: boolean }[];
  }[],
  students: { id: string; key: string }[]
) {
  const completedAttemptId = stableId(
    "attempt",
    `${quizId}-${students[0].key}`
  );
  const completedStartedAt = daysFromNow(-2, 9);
  const completedSubmittedAt = daysFromNow(-2, 9.5);
  const completed = await prisma.attempt.upsert({
    where: { id: completedAttemptId },
    update: {
      quiz_id: quizId,
      user_id: students[0].id,
      started_at: completedStartedAt,
      submitted_at: completedSubmittedAt,
      status: AttemptStatus.submitted,
      score: 8,
      percentage: 80
    },
    create: {
      id: completedAttemptId,
      quiz_id: quizId,
      user_id: students[0].id,
      started_at: completedStartedAt,
      submitted_at: completedSubmittedAt,
      status: AttemptStatus.submitted,
      score: 8,
      percentage: 80
    }
  });

  for (let index = 0; index < questions.length; index++) {
    const option = questions[index].options[index === 8 || index === 9 ? 1 : 0];
    await prisma.attemptAnswer.upsert({
      where: {
        attempt_id_question_id: {
          attempt_id: completed.id,
          question_id: questions[index].question.id
        }
      },
      update: {
        selected_option_id: option.id,
        is_correct: index < 8
      },
      create: {
        attempt_id: completed.id,
        question_id: questions[index].question.id,
        selected_option_id: option.id,
        is_correct: index < 8
      }
    });
  }

  await prisma.attempt.upsert({
    where: { id: stableId("attempt", `${quizId}-${students[1].key}`) },
    update: {
      quiz_id: quizId,
      user_id: students[1].id,
      started_at: new Date(),
      submitted_at: null,
      status: AttemptStatus.in_progress,
      score: null,
      percentage: null
    },
    create: {
      id: stableId("attempt", `${quizId}-${students[1].key}`),
      quiz_id: quizId,
      user_id: students[1].id,
      status: AttemptStatus.in_progress
    }
  });

  await prisma.attempt.upsert({
    where: { id: stableId("attempt", `${quizId}-${students[2].key}`) },
    update: {
      quiz_id: quizId,
      user_id: students[2].id,
      started_at: daysFromNow(-1, 10),
      submitted_at: daysFromNow(-1, 10.75),
      status: AttemptStatus.auto_submitted,
      score: 6,
      percentage: 60
    },
    create: {
      id: stableId("attempt", `${quizId}-${students[2].key}`),
      quiz_id: quizId,
      user_id: students[2].id,
      started_at: daysFromNow(-1, 10),
      submitted_at: daysFromNow(-1, 10.75),
      status: AttemptStatus.auto_submitted,
      score: 6,
      percentage: 60
    }
  });
}

async function main() {
  const { students } = await seedUsers();
  const seededQuizzes: string[] = [];

  for (const [index, quizRecord] of quizRecords.entries()) {
    const seededQuiz = await seedQuiz(quizRecord, index);
    const endsAt = daysFromNow(index + 1, 12);
    await seedInvitations(seededQuiz.quizId, students, endsAt);
    await seedAttempts(seededQuiz.quizId, seededQuiz.questions, students);
    seededQuizzes.push(seededQuiz.quizId);
  }
}

main()
  .catch((error) => {
    console.error("Prisma seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
