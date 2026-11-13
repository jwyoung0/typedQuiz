import { randomUUID } from "crypto";
import { HttpError } from "../errors.js";

function normalizeQuestion(question) {
  return {
    type: "typed",
    ...question
  };
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
      const data = await repository.read();
      return data.quizzes.map(({ questions, ...quiz }) => ({
        ...quiz,
        questionCount: questions.length
      }));
    },

    async get(setId) {
      const set = findSet(await repository.read(), setId);

      return {
        ...set,
        questions: set.questions.map(normalizeQuestion)
      };
    },

    async create({ title, language }) {
      const data = await repository.read();
      const set = {
        id: randomUUID(),
        title: requiredText(title, "Title and language are required."),
        language: requiredText(language, "Title and language are required."),
        questions: []
      };

      data.quizzes.push(set);
      await repository.write(data);
      return set;
    },

    async update(setId, changes) {
      const data = await repository.read();
      const set = findSet(data, setId);

      if (changes.title !== undefined) {
        set.title = requiredText(changes.title, "Title cannot be empty.");
      }

      if (changes.language !== undefined) {
        set.language = requiredText(
          changes.language,
          "Language cannot be empty."
        );
      }

      await repository.write(data);
      return set;
    },

    async delete(setId) {
      const data = await repository.read();
      const index = data.quizzes.findIndex((quiz) => quiz.id === setId);

      if (index === -1) {
        throw new HttpError(404, "Set not found.");
      }

      const [set] = data.quizzes.splice(index, 1);
      data.attempts = (data.attempts ?? []).filter(
        (attempt) => attempt.quizId !== setId
      );

      await repository.write(data);
      return set;
    },

    async listQuestions(setId) {
      return findSet(await repository.read(), setId)
      .questions
      .map(normalizeQuestion);
    },

    async createQuestion(setId, { prompt, answer }) {
      const data = await repository.read();
      const set = findSet(data, setId);
      const question = {
        id: randomUUID(),
        type: "typed",
        prompt: requiredText(prompt, "Prompt and answer are required."),
        answer: requiredText(answer, "Prompt and answer are required.")
      };

      set.questions.push(question);
      await repository.write(data);
      return question;
    },

    async updateQuestion(setId, questionId, changes) {
      const data = await repository.read();
      const set = findSet(data, setId);
      const question = findQuestion(set, questionId);

      if (changes.prompt !== undefined) {
        question.prompt = requiredText(
          changes.prompt,
          "Prompt cannot be empty."
        );
      }

      if (changes.answer !== undefined) {
        question.answer = requiredText(
          changes.answer,
          "Answer cannot be empty."
        );
      }

      await repository.write(data);
      return question;
    },

    async deleteQuestion(setId, questionId) {
      const data = await repository.read();
      const set = findSet(data, setId);
      const index = set.questions.findIndex(
        (question) => question.id === questionId
      );

      if (index === -1) {
        throw new HttpError(404, "Question not found.");
      }

      const [question] = set.questions.splice(index, 1);
      await repository.write(data);
      return question;
    }
  };
}
