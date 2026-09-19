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
import { quizRecords } from "./seeds/seedQuizData.js";

const SEED_VERSION = "quiz-seed-v1";
const requiredSeedVariables = [
  "SEED_ADMIN_PASSWORD",
  "SEED_STUDENT_PASSWORD",
  "ADMIN_PASSWORD",
  "STUDENT_PASSWORD"
] as const;

const missingSeedVariables = requiredSeedVariables.filter(
  (variable) => !process.env[variable]
);
if (missingSeedVariables.length > 0) {
  throw new Error(
    `Missing required seed environment variable(s): ${missingSeedVariables.join(", ")}. ` +
      "Set them before running the Prisma seed."
  );
}

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run the Prisma seed in production.");
}

if (process.env.SEED_ALLOW !== "true") {
  throw new Error(
    "Refusing to run the Prisma seed without SEED_ALLOW=true. " +
      "Set this explicit override only in a non-production environment."
  );
}

const DEFAULT_STUDENT_PASSWORD = process.env.STUDENT_PASSWORD!;
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

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
