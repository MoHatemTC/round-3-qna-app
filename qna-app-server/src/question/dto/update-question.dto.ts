import { CreateQuestionDto } from "./create-question.dto.js";

// PUT replaces the whole question (and its options), so it takes the same
// required shape as create.
export class UpdateQuestionDto extends CreateQuestionDto {}
