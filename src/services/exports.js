import { HttpError } from "../errors.js";

export function createExportService(repository) {
  return {
    async getSet(setId) {
      const data = await repository.read();
      const set = data.quizzes.find((quiz) => quiz.id === setId);

      if (!set) {
        throw new HttpError(404, "Set not found.");
      }

      const questions = set.questions
        .map(
          (question, index) =>
            `Question ${index + 1}:\n${question.prompt}\nAnswer:\n${question.answer}`
        )
        .join("\n\n");

      return `${set.title} (${set.language})\n\n${questions}`;
    }
  };
}
