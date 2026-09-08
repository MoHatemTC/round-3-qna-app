import { Injectable } from "@nestjs/common";

@Injectable()
export class StudentService {
  getQuizzes() {
    return [
      { id: "1", title: "Math Basics", duration: 30, deadline: "2026-09-05", state: "not_started" },
      { id: "2", title: "History Quiz", duration: 20, deadline: "2026-09-06", state: "submitted" },
    ];
  }

  
  resolveInvite(token: string) {
  const fakeInvites = {
    "valid-token-123": { id: "1", title: "Math Basics", duration: 30, deadline: "2026-09-05", state: "not_started" },
    "not-open-token": { error: "not_open_yet" },
    "closed-token": { error: "closed" },
    "used-token": { error: "already_submitted" },
  };

  return fakeInvites[token] ?? { error: "invalid_link" };
}
}