import { ApiProperty } from "@nestjs/swagger";
import { QuizStatus, InvitationStatus } from "../../generated/prisma/enums.js";
import { StudentQuizStatus } from "../types/student-quiz-status.js";

// Every /admin/quizzes response carries these counts, and the admin CMS reads
// them to decide whether a quiz can be published or invited to.
export class QuizCountsDto {
  @ApiProperty({ example: 10, description: "Questions attached to the quiz" })
  questions!: number;

  @ApiProperty({ example: 5, description: "Invitations sent for the quiz" })
  invitations!: number;

  @ApiProperty({ example: 3, description: "Attempts started on the quiz" })
  attempts!: number;
}

// The shape every /admin/quizzes response returns. This is the published
// contract other teams build against - keep it in sync with quiz.service.ts.
export class QuizDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ example: "JavaScript Fundamentals" })
  title!: string;

  @ApiProperty({
    type: String,
    example: "Covers closures, prototypes, and async/await.",
    nullable: true
  })
  description!: string | null;

  @ApiProperty({ example: 30, description: "Duration in minutes" })
  duration_minutes!: number;

  @ApiProperty({ example: "2026-09-10T09:00:00.000Z" })
  starts_at!: string;

  @ApiProperty({ example: "2026-09-10T10:00:00.000Z" })
  ends_at!: string;

  @ApiProperty({ enum: QuizStatus, example: QuizStatus.draft })
  status!: QuizStatus;

  @ApiProperty({ description: "User id of the admin who created the quiz" })
  created_by!: string;

  @ApiProperty({ example: "2026-09-05T12:00:00.000Z" })
  created_at!: string;

  @ApiProperty({ example: "2026-09-05T12:00:00.000Z" })
  updated_at!: string;

  @ApiProperty({
    type: QuizCountsDto,
    description:
      "Question, invitation and attempt counts. Returned by every quiz endpoint on this controller."
  })
  _count!: QuizCountsDto;
}

// GET /admin/quizzes/:id/invitations
export class QuizInvitationUserDto {
  @ApiProperty({ example: "7d5c7044-3de1-4b7c-975f-18ca29d2a7fd" })
  id!: string;

  @ApiProperty({ example: "Avery Morgan" })
  name!: string;

  @ApiProperty({ example: "avery.morgan@example.com" })
  email!: string;
}

export class QuizInvitationDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  id!: string;

  @ApiProperty({ example: "avery.morgan@example.com" })
  email!: string;

  @ApiProperty({ enum: InvitationStatus, example: InvitationStatus.sent })
  status!: InvitationStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    example: "2026-09-05T12:00:00.000Z",
    description: "Null until the invitation email has actually gone out"
  })
  sent_at!: string | null;

  @ApiProperty({ type: String, nullable: true, example: null })
  accepted_at!: string | null;

  @ApiProperty({
    type: QuizInvitationUserDto,
    nullable: true,
    description: "The registered account behind this address, if there is one"
  })
  user!: QuizInvitationUserDto | null;
}

// POST /admin/quizzes/:id/invitations
export class InvitationFailureDto {
  @ApiProperty({ example: "avery.morgan@example.com" })
  email!: string;

  @ApiProperty({ example: "550 5.1.1 Recipient address rejected" })
  reason!: string;
}

export class FailedInvitationEmailDto extends InvitationFailureDto {}

export class InvitationSummaryDto {
  @ApiProperty({ example: 2, description: "Invitation emails delivered" })
  sent!: number;

  @ApiProperty({
    example: 1,
    description: "Valid addresses the mail server would not accept"
  })
  failed!: number;

  @ApiProperty({
    example: 1,
    description: "Addresses already invited, so no second email was sent"
  })
  skipped!: number;

  @ApiProperty({
    example: 1,
    description:
      "Recipients that could not be invited at all: malformed addresses plus userIds matching no user"
  })
  invalid!: number;

  @ApiProperty({ type: [String], example: ["not-an-email"] })
  invalid_emails!: string[];

  @ApiProperty({ example: 0 })
  unresolved_user_ids!: number;

  @ApiProperty({
    type: [InvitationFailureDto],
    description: "Why each delivery failed, in the mail server's own words"
  })
  failures!: InvitationFailureDto[];

  @ApiProperty({
    type: [FailedInvitationEmailDto],
    description:
      "Invalid or undeliverable addresses retained by the frontend for correction or retry"
  })
  failedEmails!: FailedInvitationEmailDto[];
}

// GET /admin/quizzes/analytics/:id
export class QuizAnalyticsDto {
  @ApiProperty({ example: "b3f1c2b0-9c3a-4b1e-8a2a-6b6f9b6b1a10" })
  quiz_id!: string;

  @ApiProperty({ example: 5 })
  invited_count!: number;

  @ApiProperty({ example: 3, description: "Attempts started, any status" })
  started_count!: number;

  @ApiProperty({
    example: 2,
    description: "Attempts with status submitted or auto_submitted"
  })
  submitted_count!: number;

  @ApiProperty({
    example: 40,
    description: "submitted_count / invited_count as a percentage; 0 when nobody is invited"
  })
  completion_rate!: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 70,
    description: "Mean percentage across submitted attempts; null when there are none"
  })
  average_score!: number | null;
}

// GET /admin/quizzes/:id/students
export class QuizStudentDto {
  @ApiProperty({
    type: String,
    nullable: true,
    example: "Avery Morgan",
    description: "Null when the invited address has no account yet"
  })
  name!: string | null;

  @ApiProperty({ example: "avery.morgan@example.com" })
  email!: string;

  @ApiProperty({ type: Number, nullable: true, example: 8 })
  score!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 80 })
  percentage!: number | null;

  @ApiProperty({
    enum: StudentQuizStatus,
    example: StudentQuizStatus.not_started,
    description: "The student's attempt status, or not_started"
  })
  status!: StudentQuizStatus;
}
