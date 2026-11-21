import { randomUUID } from "crypto";
import { HttpError } from "../errors.js";
import {
  normalizeQuestion,
  normalizeQuestionType,
  QUESTION_TYPES,
  SUPPORTED_QUESTION_TYPES
} from "../domain/question-types.js";

function normalizeSet(set) {
  return {
    ...set,
    questions: set.questions.map(normalizeQuestion)
  };
}

function validateQuestionType(type) {
  type = normalizeQuestionType(type);

  if (!SUPPORTED_QUESTION_TYPES.includes(type)) {
    throw new HttpError(400, "Invalid question type.");
  }

  return type;
}

function requiredText(value, message) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, message);
  }

  return value.trim();
}

function findSet(data, setId) {
  const set = data.quizzes.find((quiz) => quiz.id === setId);

  if (!set) {
    throw new HttpError(404, "Set not found.");
  }

  return set;
}

function findQuestion(set, questionId) {
  const question = set.questions.find((item) => item.id === questionId);

  if (!question) {
    throw new HttpError(404, "Question not found.");
  }

  return question;
}

export function createSetService(repository) {
  return {
    async list() {
      const sets = await repository.list();
      return sets.map(({ questions, ...quiz }) => ({
        ...quiz,
        questionCount: questions.length
      }));
    },

    async get(setId) {
      const set = await repository.getById(setId);

      if (!set) {
        throw new HttpError(404, "Set not found.");
      }

      return normalizeSet(set);
    },

    async create({ title, language }) {
      const set = {
        id: randomUUID(),
        title: requiredText(title, "Title and language are required."),
        language: requiredText(language, "Title and language are required."),
        questions: []
      };

      await repository.create(set);
      return set;
    },

    async update(setId, changes) {
      const existing = await repository.getById(setId);
      
      if (!existing) {
        throw new HttpError(404, "Set not found.");
      }

      const updates = {};

      if (changes.title !== undefined) {
        updates.title = requiredText(changes.title, "Title cannot be empty.");
      }

      if (changes.language !== undefined) {
        updates.language = requiredText(
          changes.language,
          "Language cannot be empty."
        );
      }

      const updated = await repository.update(setId, updates);
      return normalizeSet(updated);
    },

    async delete(setId) {
      const deleted = await repository.delete(setId);

      if (!deleted) {
        throw new HttpError(404, "Set not found.");
      }

      return normalizeSet(deleted);
    },

    async listQuestions(setId) {
      const questions = await repository.listQuestions(setId);

      if (!questions) {
        throw new HttpError(404, "Set not found.");
      }

      return questions.map(normalizeQuestion);
    },

    async createQuestion(
      setId,
      { prompt, answer, type = QUESTION_TYPES.TEXT_ENTRY }
    ) {
      const set = await repository.getById(setId);

      if (!set) {
        throw new HttpError(404, "Set not found.");
      }

      const question = {
        id: randomUUID(),
        type: validateQuestionType(type),
        prompt: requiredText(prompt, "Prompt and answer are required."),
        answer: requiredText(answer, "Prompt and answer are required.")
      };
  
      await repository.createQuestion(setId, question);
      return normalizeQuestion(question);
    },

    async updateQuestion(setId, questionId, changes) {
      const set = await repository.getById(setId);

      if (!set) {
        throw new HttpError(404, "Set not found.");
      }

      const question = set.questions.find(
        (q) => q.id === questionId
      );

      if (!question) {
        throw new HttpError(404, "Question not found.");
      }

      const updates = {};

      if (changes.prompt !== undefined) {
        updates.prompt = requiredText(
          changes.prompt,
          "Prompt cannot be empty."
        );
      }

      if (changes.answer !== undefined) {
        updates.answer = requiredText(
          changes.answer,
          "Answer cannot be empty."
        );
      }

      const updated = 
        await repository.updateQuestion(
          setId,
          questionId,
          updates
        );

      return normalizeQuestion(updated);
    },

    async deleteQuestion(setId, questionId) {
      const set = await repository.getById(setId);

      if (!set) {
        throw new HttpError(404, "Set not found.");
      }

      const deleted = await repository.deleteQuestion(
        setId,
        questionId
      );

      if (!deleted) {
        throw new HttpError(
          404,
          "Question not found."
        );
      }

      return normalizeQuestion(deleted);
    }
  };
}
