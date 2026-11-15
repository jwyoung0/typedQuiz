// src/domain/question-types.js

export const QUESTION_TYPES = {
  TEXT_ENTRY: "text-entry",
};

export const SUPPORTED_QUESTION_TYPES = [
  QUESTION_TYPES.TEXT_ENTRY
];

export function normalizeQuestionType(type) {
  if (!type || type === "typed") {
    return QUESTION_TYPES.TEXT_ENTRY;
  }

  return type;
}

export function normalizeQuestion(question) {
  return {
    ...question,
    type: normalizeQuestionType(question.type)
  };
}