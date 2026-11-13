import { HttpError } from "../errors.js";

export function createAttemptService(repository) {
  return {
    async create({ quizId, score, total }) {
      if (!quizId || !Number.isInteger(score) || !Number.isInteger(total)) {
        throw new HttpError(400, "Invalid attempt data.");
      }

      const data = await repository.read();
      const quiz = data.quizzes.find((item) => item.id === quizId);

      if (!quiz) {
        throw new HttpError(404, "Quiz not found.");
      }

      data.attempts ??= [];
      data.attempts.push({
        quizId,
        score,
        total,
        completedAt: new Date().toISOString()
      });

      await repository.write(data);
    }
  };
}
