import { CreateQuizDto } from "./create-quiz.dto.js";

// PUT replaces the whole quiz, so it takes the same required shape as create.
export class UpdateQuizDto extends CreateQuizDto {}
